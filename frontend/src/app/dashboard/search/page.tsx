"use client";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    // Mock API call to backend
    setTimeout(() => {
      setLoading(false);
      setResult("Campaign started successfully! AI is discovering and analyzing leads in the background.");
    }, 1500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex justify-center items-center gap-3">
          <Sparkles className="text-indigo-600" size={32} />
          AI Command Center
        </h1>
        <p className="text-gray-600">Give natural language commands to find leads automatically.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What kind of leads are you looking for?
        </label>
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-lg"
            placeholder='e.g. "Find 50 software agencies in Bangalore without an ERP system"'
          />
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Press Enter ↵ to submit
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Initializing AI..." : "Start Lead Generation"}
            {!loading && <Search size={18} />}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-8 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200">
          <p className="font-medium">{result}</p>
          <p className="text-sm mt-1">Check the Leads CRM to see results as they come in.</p>
        </div>
      )}
    </div>
  );
}
