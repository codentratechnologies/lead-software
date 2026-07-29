"use client";
import { useState, useEffect } from "react";
import { Play, Pause, ListFilter, Trash2, Eye, Plus, X, MapPin, Briefcase, Camera, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ref, onValue, push, remove, update, serverTimestamp } from "firebase/database";
import { database } from "@/lib/firebase";

type Campaign = {
  id: string;
  name: string;
  search_query: string;
  status: string;
  leads_generated: number;
  created_at: string | number;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leadsCount, setLeadsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Filtering state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [dateFilter, setDateFilter] = useState("All"); // All, Today, Yesterday, Custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // New Campaign Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", search_query: "" });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const campaignsRef = ref(database, 'campaigns');
    const unsubscribeCampaigns = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const campaignsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by newest first
        campaignsArray.sort((a, b) => {
          const aTime = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at).getTime();
          const bTime = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at).getTime();
          return bTime - aTime;
        });
        setCampaigns(campaignsArray);
      } else {
        setCampaigns([]);
      }
      setLoading(false);
    });

    const leadsRef = ref(database, 'leads');
    const unsubscribeLeads = onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const counts: Record<string, number> = {};
        Object.values(data).forEach((lead: any) => {
          const campId = lead.campaign_id;
          if (campId) {
            counts[campId] = (counts[campId] || 0) + 1;
          }
        });
        setLeadsCount(counts);
      } else {
        setLeadsCount({});
      }
    });

    return () => {
      unsubscribeCampaigns();
      unsubscribeLeads();
    };
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const campaignsRef = ref(database, 'campaigns');
      await push(campaignsRef, {
        name: newCampaign.name,
        search_query: newCampaign.search_query,
        status: "Running",
        leads_generated: 0,
        created_at: serverTimestamp()
      });
      setShowNewModal(false);
      setNewCampaign({ name: "", search_query: "" });
    } catch (error) {
      console.error("Failed to create campaign:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStopCampaign = async (id: string) => {
    try {
      const campaignRef = ref(database, `campaigns/${id}`);
      await update(campaignRef, { status: "Stopped" });
    } catch (error) {
      console.error("Failed to stop campaign:", error);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? All associated leads will also be deleted.")) return;
    try {
      const campaignRef = ref(database, `campaigns/${id}`);
      await remove(campaignRef);
      // NOTE: Associated leads should ideally be deleted via cloud functions, 
      // but for client-side we'll just remove the campaign node.
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "Running":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running</span>;
      case "Completed":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Completed</span>;
      case "Stopped":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">Stopped</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  // Filter logic
  const filteredCampaigns = campaigns.filter(camp => {
    if (dateFilter === "All") return true;

    const campDate = new Date(camp.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "Today") {
      return campDate >= today;
    }

    if (dateFilter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return campDate >= yesterday && campDate < today;
    }

    if (dateFilter === "Custom") {
      if (!customStart && !customEnd) return true;
      let valid = true;
      if (customStart) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        if (campDate < start) valid = false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (campDate > end) valid = false;
      }
      return valid;
    }

    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 relative">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Campaigns</h1>
          <p className="text-slate-500 mt-1">Track the progress of your AI background workers.</p>
        </motion.div>

        <div className="flex items-center gap-3 relative">
          <motion.button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border transition-colors shadow-sm ${showFilterMenu || dateFilter !== 'All' ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200'}`}
          >
            <ListFilter size={16} className={dateFilter !== 'All' ? 'text-indigo-600' : ''} />
            {dateFilter === 'All' ? 'Filter' : `Filtered: ${dateFilter}`}
          </motion.button>

          <motion.button
            onClick={() => setShowNewModal(true)}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            New Campaign
          </motion.button>

          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Filter by Date</h3>
              <div className="space-y-2">
                {['All', 'Today', 'Yesterday', 'Custom'].map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFilter"
                      value={option}
                      checked={dateFilter === option}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    {option}
                  </label>
                ))}
              </div>

              {dateFilter === 'Custom' && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="w-full rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Campaign Name</th>
                <th className="px-6 py-4 font-semibold">Target Query</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Leads Generated</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading campaigns...</td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No campaigns match your filters.</td>
                </tr>
              ) : (
                filteredCampaigns.map((camp, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={camp.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        {camp.name}
                      </div>
                      <div className="text-xs text-slate-500">{new Date(camp.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="text-sm text-slate-600 line-clamp-2 max-w-md" title={camp.search_query}>
                        {camp.search_query}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {getStatusPill(camp.status)}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded bg-slate-50 text-slate-700 font-mono text-sm border border-slate-200 shadow-sm" title="Stored count">
                          {camp.leads_generated || 0}
                        </span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] uppercase font-semibold border border-indigo-200 tracking-wider" title="Live count from leads database">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mr-1.5"></span>
                          Live: {leadsCount[camp.id] || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/dashboard/leads?campaign_id=${camp.id}`}
                          title="View Leads"
                          className="inline-flex items-center justify-center text-slate-500 bg-white hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                        >
                          <Eye size={16} />
                        </Link>
                        {camp.status !== 'Stopped' && camp.status !== 'Completed' && (
                          <button
                            onClick={() => handleStopCampaign(camp.id)}
                            title="Stop Campaign"
                            className="inline-flex items-center justify-center text-slate-500 bg-white hover:bg-orange-50 hover:text-orange-600 p-2 rounded-lg transition-all border border-transparent hover:border-orange-100"
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(camp.id)}
                          title="Delete Campaign"
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

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-900">Create New Campaign</h2>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. NYC Plumbers Outreach"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                  {/* Source selection removed for unified multi-source processing */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Query Prompt</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Find 20 plumbing companies in New York City"
                      value={newCampaign.search_query}
                      onChange={(e) => setNewCampaign({ ...newCampaign, search_query: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 resize-none"
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-sm flex items-center justify-center min-w-[120px]"
                  >
                    {isCreating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Start Campaign"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
