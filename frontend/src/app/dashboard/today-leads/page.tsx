"use client";
import { useState, useEffect } from "react";
import { Download, Search as SearchIcon, ExternalLink, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ref, onValue, remove } from "firebase/database";
import { database } from "@/lib/firebase";

type Lead = {
  id: string;
  company_id: string;
  campaign_id: string;
  contact_person: string;
  email: string;
  phone: string;
  problems_identified: string;
  recommended_solution: string;
  lead_score: number;
  status: string;
  source: string;
  created_at: string | number;
  company: {
    name: string;
    industry: string;
    website: string;
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case "maps": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">Google Maps</span>;
    case "linkedin": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">LinkedIn</span>;
    case "instagram": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-pink-50 text-pink-700 border border-pink-200 uppercase tracking-wider">Instagram</span>;
    case "web": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">Web Search</span>;
    case "apollo": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">Apollo</span>;
    default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">Gemini AI</span>;
  }
};

export default function TodayLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const leadsRef = ref(database, 'leads');
    const unsubscribe = onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const leadsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by newest first
        leadsArray.sort((a, b) => {
          const aTime = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at).getTime();
          const bTime = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at).getTime();
          return bTime - aTime;
        });
        setLeads(leadsArray);
      } else {
        setLeads([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const leadRef = ref(database, `leads/${id}`);
      await remove(leadRef);
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Search Term Filter
    const matchesSearch = lead.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company.industry?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter ONLY today's leads
    if (!lead.created_at) return false;
    
    let leadDate: Date;
    if (typeof lead.created_at === 'number') {
      leadDate = new Date(lead.created_at);
    } else {
      const dateStr = lead.created_at;
      const isUTC = dateStr.includes('Z') || dateStr.includes('+');
      leadDate = new Date(isUTC ? dateStr : dateStr + 'Z');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return leadDate >= today;
  });

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;

    // Define CSV headers
    const headers = [
      "Company Name",
      "Industry",
      "Website",
      "Contact Person",
      "Email",
      "Phone",
      "Problems Identified",
      "Recommended Solution",
      "Lead Score",
      "Created At"
    ];

    // Create CSV rows
    const csvRows = filteredLeads.map(lead => [
      `"${lead.company.name.replace(/"/g, '""')}"`,
      `"${(lead.company.industry || "").replace(/"/g, '""')}"`,
      `"${lead.company.website || ""}"`,
      `"${(lead.contact_person || "").replace(/"/g, '""')}"`,
      `"${lead.email || ""}"`,
      `"${lead.phone || ""}"`,
      `"${(lead.problems_identified || "").replace(/"/g, '""')}"`,
      `"${(lead.recommended_solution || "").replace(/"/g, '""')}"`,
      lead.lead_score,
      `"${new Date(lead.created_at).toLocaleString()}"`
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `today_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8 relative">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Today&apos;s Leads</h1>
          <p className="text-slate-500 mt-1">Review all leads generated by AI agents today.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 relative"
        >
          <button 
            onClick={exportToCSV}
            disabled={filteredLeads.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-md transition-all ${
              filteredLeads.length === 0 
                ? "bg-slate-400 shadow-none cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
            }`}
          >
            <Download size={16} />
            Export CSV
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-80">
            <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search today's leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>
        
        <div className="w-full rounded-lg border border-slate-200 overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Problem Identified</th>
                <th className="px-6 py-4 font-semibold">Score</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading today&apos;s leads...</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No leads generated today yet.</td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={lead.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="font-semibold text-slate-900 mb-1">{lead.company.name}</div>
                      <a href={lead.company.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline flex items-center gap-1.5 transition-colors w-fit mb-2">
                        {lead.company.website.replace(/^https?:\/\/(www\.)?/, '')}
                        <ExternalLink size={12} />
                      </a>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-semibold border border-slate-200">
                        {lead.company.industry || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        {lead.contact_person && <span className="font-medium text-slate-900">{lead.contact_person}</span>}
                        {lead.email && <a href={`mailto:${lead.email}`} className="hover:text-indigo-600">{lead.email}</a>}
                        {lead.phone && <a href={`tel:${lead.phone}`} className="hover:text-indigo-600">{lead.phone}</a>}
                        {!lead.contact_person && !lead.email && !lead.phone && <span className="text-slate-400 italic">No contact info found</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {getSourceLabel(lead.source)}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="text-sm text-slate-600 line-clamp-3 leading-relaxed max-w-lg" title={lead.problems_identified}>
                        {lead.problems_identified || "None identified"}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium ${lead.lead_score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : lead.lead_score >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {lead.lead_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          title="View Details"
                          className="inline-flex items-center justify-center text-slate-500 bg-white hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          title="Delete Lead"
                          className="inline-flex items-center justify-center text-slate-500 bg-white hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
