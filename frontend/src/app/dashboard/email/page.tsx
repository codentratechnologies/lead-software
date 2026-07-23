"use client";
import { useState } from "react";
import { Send, Bot, Copy, CheckCircle2 } from "lucide-react";

export default function EmailGeneratorPage() {
  const [selectedLead, setSelectedLead] = useState<string>("1");
  const [generating, setGenerating] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{subject: string, body: string} | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Mock AI generation
    setTimeout(() => {
      setGenerating(false);
      setEmailDraft({
        subject: "Modernizing ABC Manufacturing's Inventory Tracking",
        body: "Hi John,\n\nI noticed that ABC Manufacturing is scaling up, but you might still be relying on outdated inventory software without a proper CRM.\n\nAt Codentra Technologies, we specialize in building custom ERP Pro solutions for manufacturing companies that streamline inventory and client management in one unified dashboard.\n\nWould you be open to a quick 10-minute call next Tuesday to see if this could save your team time?\n\nBest regards,\nCodentra Sales Team"
      });
    }, 2000);
  };

  const handleCopy = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bot className="text-indigo-600" size={32} />
          AI Email Generator
        </h1>
        <p className="text-gray-600 mt-1">Generate hyper-personalized outreach emails based on AI website analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">1. Select Lead</h3>
            <select 
              className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedLead}
              onChange={(e) => setSelectedLead(e.target.value)}
            >
              <option value="1">ABC Manufacturing (John Doe)</option>
              <option value="2">City Hospital (Sarah Smith)</option>
            </select>
            
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lead Context</h4>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 space-y-2">
                <p><strong>Problems:</strong> No CRM, outdated inventory software.</p>
                <p><strong>Recommendation:</strong> Codentra ERP Pro</p>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Draft Email"}
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          {emailDraft ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <span className="font-medium text-gray-700">Generated Draft</span>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 bg-white px-3 py-1 border rounded-md shadow-sm">
                    {copied ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 border border-transparent rounded-md shadow-sm">
                    <Send size={16} />
                    Send Now
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-gray-500 text-sm font-medium w-16 inline-block">To:</span>
                  <span className="text-gray-900">john@abcmfg.com</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm font-medium w-16 inline-block">Subject:</span>
                  <span className="text-gray-900 font-medium">{emailDraft.subject}</span>
                </div>
                <hr />
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans">
                  {emailDraft.body}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-[400px]">
              <Bot size={48} className="mb-4 text-gray-300" />
              <p>Select a lead and click "Draft Email" to generate a highly personalized outreach message using AI.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
