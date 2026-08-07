"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Users,
  BarChart,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/search", label: "AI Lead Search", icon: Search },
    { href: "/dashboard/today-leads", label: "Today's Leads", icon: Users },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: BarChart },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100 p-1">
            <Image 
              src="/codentra logo without text and bg.png" 
              alt="Codentra Logo" 
              fill
              sizes="32px"
              className="object-contain drop-shadow-sm p-1"
            />
          </div>
          <div className="flex flex-col -gap-0.5">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Codentra
            </h1>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Premium Design */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white/95 md:bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-24 flex items-center px-6 border-b border-slate-100 relative overflow-hidden">
          {/* Subtle gradient background for logo area */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <Image 
                  src="/codentra logo without text and bg.png" 
                  alt="Codentra Logo" 
                  fill
                  sizes="40px"
                  className="object-contain drop-shadow-sm p-1.5"
                />
              </div>
              <div className="flex flex-col -gap-0.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                  Codentra
                </h1>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">
                  Lead Software
                </span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="relative block group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-indigo-50 rounded-xl"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                
                <div className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'text-indigo-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}>
                  <item.icon size={20} className={`transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="text-sm tracking-wide">{item.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Premium Upgrade / Status Card */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-indigo-500/30 border border-indigo-400/30">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#ffffff00_0%,#ffffff00_80%,#ffffff40_100%)] animate-radar"></div>
            </div>
            
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/20 rounded-full blur-xl animate-pulse" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200 rounded-full animate-pulse-ring"></div>
                  <Sparkles size={16} className="text-indigo-100 relative z-10" />
                </div>
                <h4 className="text-sm font-semibold tracking-wide">Pro Active</h4>
              </div>
              <p className="text-xs text-indigo-100 opacity-90 mt-1 font-medium">Your AI agent is searching 24/7.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button onClick={() => { setShowLogoutModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-slate-500 rounded-xl hover:text-red-600 hover:bg-red-50 transition-colors group">
            <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative bg-slate-50/50 pt-16 md:pt-0">
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Ready to Leave?</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  You are about to logout from your AI Lead Software dashboard.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    disabled={isLoggingOut}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {isLoggingOut ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Logout'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
