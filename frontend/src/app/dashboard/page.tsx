"use client";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Users, Flame, LayoutDashboard, Activity } from "lucide-react";
import { api } from "@/lib/api";

type Lead = {
  id: number;
  lead_score: number;
  created_at: string;
  company: { name: string; }
};

type Campaign = {
  id: number;
  name: string;
  status: string;
  created_at: string;
  leads_count: number;
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, campaignsRes] = await Promise.all([
          api.get("/leads"),
          api.get("/campaigns")
        ]);
        setLeads(leadsRes.data);
        setCampaigns(campaignsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.lead_score >= 80).length;
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === "Running").length;

  const stats = [
    { label: "Total Leads", value: totalLeads, change: "All time", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Hot Leads (>80)", value: hotLeads, change: "High intent", icon: Flame, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Total Campaigns", value: totalCampaigns, change: "All time", icon: LayoutDashboard, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Active Campaigns", value: activeCampaigns, change: "Currently running", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  // Combine and sort recent activity
  const recentActivities = [
    ...campaigns.map(c => ({
      time: new Date(c.created_at),
      title: `Campaign '${c.name}'`,
      desc: c.status === "Running" ? "Started and actively searching." : `Finished. Generated ${c.leads_count} leads.`,
      color: c.status === "Running" ? "bg-emerald-500" : "bg-indigo-500"
    })),
    ...leads.map(l => ({
      time: new Date(l.created_at),
      title: `New Lead: ${l.company.name}`,
      desc: `Score: ${l.lead_score}. Found by AI agent.`,
      color: "bg-purple-500"
    }))
  ]
  .sort((a, b) => b.time.getTime() - a.time.getTime())
  .slice(0, 5); // Take top 5 recent activities

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)}h ago`;
    return `${Math.floor(seconds/86400)}d ago`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-2">Welcome back! Here's what's happening with your AI campaigns today.</p>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-slate-500 font-medium">{stat.change}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h2>
            {recentActivities.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recent activity found. Start a new AI search!</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-slate-200">
                {recentActivities.map((item, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-4 border-white ${item.color} shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`} />
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <time className="font-mono text-xs text-slate-500">{timeAgo(item.time)}</time>
                      </div>
                      <div className="text-slate-600 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
