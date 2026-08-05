"use client";
import { useState, useEffect } from "react";
import { Search as SearchIcon, ExternalLink, Trash2, Eye, LayoutList, KanbanSquare, Phone, Mail, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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
    case "openstreetmap": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">OSM</span>;
    case "linkedin": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">LinkedIn</span>;
    case "instagram": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-pink-50 text-pink-700 border border-pink-200 uppercase tracking-wider">Instagram</span>;
    case "apollo": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">Apollo</span>;
    case "github": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">GitHub</span>;
    case "apify-social": return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wider">Apify Social</span>;
    default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">Gemini AI</span>;
  }
};

const COLUMNS = ["New", "Contacted", "Meeting Booked", "Closed"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignIdFilter, setCampaignIdFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  
  // To avoid Next.js hydration mismatch with drag-and-drop
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setCampaignIdFilter(urlParams.get('campaign_id'));
    }
    
    const leadsRef = ref(database, 'leads');
    const unsubscribe = onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const leadsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
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

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === draggableId ? { ...lead, status: newStatus } : lead
      )
    );

    // Update Firebase
    try {
      const leadRef = ref(database, `leads/${draggableId}`);
      await update(leadRef, { status: newStatus });
    } catch (error) {
      console.error("Failed to update lead status:", error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (campaignIdFilter && String(lead.campaign_id) !== campaignIdFilter) return false;
    return lead.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (lead.company.industry?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
      {campaignIdFilter && (
        <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          &larr; Back to Campaigns
        </Link>
      )}
      <div className="flex justify-between items-center mb-8 relative">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {campaignIdFilter ? `Leads for Campaign #${campaignIdFilter}` : "Pipeline"}
          </h1>
          <p className="text-slate-500 mt-1">
            {campaignIdFilter ? "Viewing specific leads generated by this background worker." : "Manage, analyze, and convert your leads."}
          </p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutList size={16} /> List
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <KanbanSquare size={16} /> Board
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 relative w-80">
        <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by company or industry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : viewMode === "list" ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1">
          <div className="w-full rounded-lg border border-slate-200 overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 font-semibold">Company</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold">Source</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No leads found.</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, idx) => (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} key={lead.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-5 align-top">
                        <div className="font-semibold text-slate-900 mb-1">{lead.company.name}</div>
                        <a href={lead.company.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline flex items-center gap-1.5 transition-colors max-w-[250px] mb-2" title={lead.company.website}>
                          <span className="truncate">{lead.company.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-semibold border border-slate-200">{lead.company.industry || "Unknown"}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${lead.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : lead.status === 'Meeting Booked' ? 'bg-blue-50 text-blue-700 border-blue-200' : lead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {lead.status || "New"}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-1 text-sm text-slate-600">
                          {lead.contact_person && <span className="font-medium text-slate-900">{lead.contact_person}</span>}
                          {lead.email && <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 truncate max-w-[150px]">{lead.email}</a>}
                          {lead.phone && <a href={`tel:${lead.phone}`} className="hover:text-indigo-600">{lead.phone}</a>}
                          {!lead.contact_person && !lead.email && !lead.phone && <span className="text-slate-400 italic">No contact info</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">{getSourceLabel(lead.source)}</td>
                      <td className="px-6 py-5 align-top">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium ${lead.lead_score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : lead.lead_score >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {lead.lead_score}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/dashboard/leads/${lead.id}`} title="View Details" className="inline-flex items-center justify-center text-slate-500 bg-white hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded-lg transition-all border border-transparent hover:border-indigo-100">
                            <Eye size={16} />
                          </Link>
                          <button onClick={() => handleDeleteLead(lead.id)} title="Delete Lead" className="inline-flex items-center justify-center text-slate-500 bg-white hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-all border border-transparent hover:border-red-100">
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
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex overflow-x-auto pb-4 gap-6">
          {isBrowser && (
            <DragDropContext onDragEnd={onDragEnd}>
              {COLUMNS.map((colName) => {
                const columnLeads = filteredLeads.filter(l => (l.status || "New") === colName);
                return (
                  <div key={colName} className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 min-w-[320px] max-w-[320px]">
                    <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white/50 rounded-t-xl">
                      <h3 className="font-semibold text-slate-800">{colName}</h3>
                      <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                    </div>
                    
                    <Droppable droppableId={colName}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-3 flex flex-col gap-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/30' : ''}`}
                        >
                          {columnLeads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-4 rounded-lg border shadow-sm group ${snapshot.isDragging ? 'shadow-lg border-indigo-300 rotate-2' : 'border-slate-200 hover:border-indigo-200'} transition-all`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-900 truncate pr-2">{lead.company.name}</h4>
                                    <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${lead.lead_score >= 80 ? 'bg-emerald-50 text-emerald-700' : lead.lead_score >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                                      {lead.lead_score}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mb-3 truncate">{lead.company.industry || "Unknown Industry"}</div>
                                  
                                  <div className="space-y-1.5 mb-4">
                                    {lead.contact_person && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                                        <User size={12} className="text-slate-400" />
                                        <span className="truncate">{lead.contact_person}</span>
                                      </div>
                                    )}
                                    {lead.email && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                                        <Mail size={12} className="text-slate-400" />
                                        <span className="truncate">{lead.email}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                                    {getSourceLabel(lead.source)}
                                    <Link href={`/dashboard/leads/${lead.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded">
                                      View Details
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </DragDropContext>
          )}
        </motion.div>
      )}
    </div>
  );
}
