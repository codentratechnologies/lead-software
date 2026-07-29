"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, Send, Copy, CheckCircle2, Building2, Briefcase, AlertTriangle, Lightbulb, User, Mail, Phone } from "lucide-react";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{subject: string, body: string} | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const leadRef = ref(database, `leads/${leadId}`);
        const snapshot = await get(leadRef);
        if (snapshot.exists()) {
          setLead({ id: snapshot.key, ...snapshot.val() });
        } else {
          setLead(null);
        }
      } catch (error) {
        console.error("Failed to fetch lead details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

  const handleGenerateEmail = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.company.name,
          industry: lead.company.industry,
          contactPerson: lead.contact_person,
          problems: lead.problems_identified,
          solution: lead.recommended_solution
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate email");
      }
      
      setEmailDraft({
        subject: data.subject,
        body: data.body
      });
    } catch (error: any) {
      console.error("Failed to generate email:", error);
      alert(error.message || "Failed to generate email. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "maps": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">Google Maps</span>;
      case "linkedin": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">LinkedIn</span>;
      case "instagram": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200 uppercase tracking-wider">Instagram</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">Gemini AI</span>;
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!lead) return (
    <div className="p-8 text-center text-slate-500">Lead not found.</div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button 
        onClick={() => router.push("/dashboard/leads")}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> 
        Back to Leads
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
              <Building2 className="text-slate-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                {lead.company.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <a href={lead.company.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium">
                  {lead.company.website}
                </a>
                <span className="text-slate-300">•</span>
                {getSourceLabel(lead.source)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Lead Score</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold font-mono tracking-tighter ${
                lead.lead_score >= 80 ? 'text-emerald-600' : lead.lead_score >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
              {lead.lead_score}
            </span>
            <span className="text-slate-400 text-lg">/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Lead Context */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="text-slate-400 w-5 h-5" /> 
              Company Context
            </h3>
            
            <div className="space-y-5">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Industry</span>
                <span className="bg-slate-50 px-3 py-1.5 rounded text-slate-700 text-sm font-medium border border-slate-200 inline-block">
                  {lead.company.industry || "Unknown"}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Info</span>
                <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <User size={14} className="text-slate-400" />
                    <span className="text-slate-700 font-medium">{lead.contact_person || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail size={14} className="text-slate-400" />
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">{lead.email}</a>
                    ) : (
                      <span className="text-slate-400 italic">No email</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone size={14} className="text-slate-400" />
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-indigo-600 hover:underline">{lead.phone}</a>
                    ) : (
                      <span className="text-slate-400 italic">No phone</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Problems Identified
                </span>
                <div className="text-sm text-slate-700 leading-relaxed bg-red-50/50 p-3 rounded border border-red-100">
                  {lead.problems_identified}
                </div>
              </div>
              
              <div>
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                  <Lightbulb className="w-4 h-4 text-emerald-500" /> Recommended Solution
                </span>
                <div className="text-sm text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded border border-emerald-100">
                  {lead.recommended_solution}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateEmail}
              disabled={generating}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bot size={18} />
              {generating ? "AI is typing..." : "Draft AI Email"}
            </button>
          </div>
        </div>

        {/* Right Column: Email Draft */}
        <div className="lg:col-span-2">
          {emailDraft ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Bot size={16} className="text-indigo-600" /> AI Generated Draft
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 border border-slate-200 rounded shadow-sm transition-colors"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded shadow-sm transition-colors">
                    <Send size={14} />
                    Send Now
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-5 flex-1">
                <div className="flex items-center gap-4 text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-medium w-16 text-right">To:</span>
                  <span className="text-slate-900 font-medium">{lead.email || "founder@" + lead.company.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-medium w-16 text-right">Subject:</span>
                  <span className="text-slate-900 font-medium">{emailDraft.subject}</span>
                </div>
                <hr className="border-slate-100 my-6" />
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-[15px]">
                  {emailDraft.body}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[500px] bg-slate-50">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                <Bot size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No email drafted yet</h3>
              <p className="max-w-sm leading-relaxed text-slate-500 text-sm">
                Click the <strong>Draft AI Email</strong> button on the left to instantly generate a highly personalized outreach message using AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
