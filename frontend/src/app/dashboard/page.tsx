"use client";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Users, Flame, LayoutDashboard, Activity } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

type Lead = {
  id: string | number;
  campaign_id?: string | number;
  lead_score: number;
  created_at: string;
  source?: string;
  company: { name: string; }
};

type Campaign = {
  id: string | number;
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
    const leadsRef = ref(database, 'leads');
    const campaignsRef = ref(database, 'campaigns');

    let leadsLoaded = false;
    let campaignsLoaded = false;

    const checkLoading = () => {
      if (leadsLoaded && campaignsLoaded) {
        setLoading(false);
      }
    };

    const unsubscribeLeads = onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array if Firebase stored it as an object
        const leadsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setLeads(leadsArray);
      } else {
        setLeads([]);
      }
      leadsLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Failed to fetch leads", error);
      leadsLoaded = true;
      checkLoading();
    });

    const unsubscribeCampaigns = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const campaignsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCampaigns(campaignsArray);
      } else {
        setCampaigns([]);
      }
      campaignsLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Failed to fetch campaigns", error);
      campaignsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubscribeLeads();
      unsubscribeCampaigns();
    };
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
    ...campaigns.map(c => {
      const liveLeadsCount = leads.filter(l => l.campaign_id === c.id).length;
      return {
        time: new Date(c.created_at),
        title: `Campaign '${c.name}'`,
        desc: c.status === "Running" ? "Started and actively searching." : `Finished. Generated ${liveLeadsCount} leads.`,
        color: c.status === "Running" ? "bg-emerald-500" : "bg-indigo-500"
      };
    }),
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

  // Chart Data Processing
  const sourceData = [
    { name: 'Gemini AI', value: leads.filter(l => l.source === 'ai' || !l.source).length, color: '#6366f1' },
    { name: 'LinkedIn', value: leads.filter(l => l.source === 'linkedin').length, color: '#3b82f6' },
    { name: 'Google Maps', value: leads.filter(l => l.source === 'maps' || l.source === 'openstreetmap').length, color: '#ef4444' },
    { name: 'Instagram', value: leads.filter(l => l.source === 'instagram').length, color: '#ec4899' },
    { name: 'Apollo', value: leads.filter(l => l.source === 'apollo').length, color: '#f59e0b' },
    { name: 'GitHub', value: leads.filter(l => l.source === 'github').length, color: '#10b981' },
    { name: 'Apify Social', value: leads.filter(l => l.source === 'apify-social').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d.toDateString()
    };
  });
  
  const timeData = last7Days.map(day => {
    const count = leads.filter(l => {
        const d = typeof l.created_at === 'number' ? new Date(l.created_at) : new Date(l.created_at);
        return d.toDateString() === day.fullDate;
    }).length;
    return { name: day.date, leads: count };
  });

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
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative group bg-white/70 backdrop-blur-xl border border-slate-200/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-indigo-100 transition-all duration-300 overflow-hidden cursor-default"
              >
                {/* Subtle gradient hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:to-violet-50/50 transition-colors duration-500 z-0" />
                
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg} shadow-inner bg-opacity-50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon size={22} className={stat.color} />
                  </div>
                </div>
                <div className="relative z-10 mt-5 flex items-center text-sm">
                  <span className="text-slate-500 font-medium bg-slate-100/50 px-2 py-1 rounded-md">{stat.change}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Charts Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
          >
            {/* Line Chart */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Leads Generated Over Time (Last 7 Days)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: 'white' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Leads by Source</h3>
              <div className="h-72">
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available</div>
                )}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
            </div>
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <Activity className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No recent activity found. Start a new AI search!</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                {recentActivities.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    key={idx} 
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-4 border-white ${item.color} shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ring-4 ring-slate-50 group-hover:scale-125 transition-transform duration-300`} />
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 group-hover:-translate-y-1">
                      <div className="flex items-center justify-between space-x-2 mb-2">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <time className="font-mono text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{timeAgo(item.time)}</time>
                      </div>
                      <div className="text-slate-500 text-sm">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
