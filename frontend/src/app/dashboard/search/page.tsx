"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsGenerating(true);
    try {
      await api.post("/campaigns", {
        name: query.slice(0, 30) + (query.length > 30 ? "..." : ""),
        search_query: query,
        description: "AI Generated Campaign"
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/campaigns");
      }, 1500);
    } catch (error) {
      console.error("Failed to start campaign:", error);
      alert("Failed to start lead generation.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center relative">
      <AnimatePresence mode="wait">
        {!isGenerating && !success ? (
          <motion.div
            key="search-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-6 shadow-sm border border-indigo-100"
              >
                <Sparkles className="text-indigo-600 w-8 h-8" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Who do you want to find?
              </h1>
              <p className="text-slate-600 text-lg">
                Describe your ideal customer in plain English. Our AI will find them, scrape their websites, and score them instantly.
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
              <div className="relative bg-white ring-1 ring-slate-200 rounded-3xl p-2 flex items-center shadow-xl">
                <Search className="w-6 h-6 text-slate-400 ml-4 hidden sm:block" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Find me 50 healthcare startups in Mumbai without a CRM..."
                  className="w-full bg-transparent border-none text-slate-900 text-lg placeholder:text-slate-400 px-6 py-4 focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-2xl font-semibold transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="hidden sm:block">Generate</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
            
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {["10 manufacturing companies in Gujarat", "E-commerce brands in Bangalore", "B2B SaaS companies in Pune using old tech"].map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              {success ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200 shadow-md"
                >
                  <Sparkles className="w-10 h-10 text-emerald-600" />
                </motion.div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-indigo-200 rounded-full blur-[40px] opacity-60 animate-pulse" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-t-2 border-r-2 border-indigo-600 relative z-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                </>
              )}
            </div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-slate-900"
            >
              {success ? "Campaign Launched!" : "AI is spinning up..."}
            </motion.h2>
            <p className="text-slate-500 max-w-md">
              {success 
                ? "Taking you to the campaigns page to watch the results roll in."
                : "The agent is breaking down your intent and searching the web. This will run in the background."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
