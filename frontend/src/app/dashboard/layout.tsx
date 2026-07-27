"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Users,
  BarChart,
  Settings,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/search", label: "AI Lead Search", icon: Search },
    { href: "/dashboard/today-leads", label: "Today's Leads", icon: Users },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: BarChart },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside
        className="w-56 bg-white border-r border-slate-200 flex flex-col relative z-20"
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image 
                src="/codentra logo without text and bg.png" 
                alt="Codentra Logo" 
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col -gap-1">
              <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight leading-none">
                Codentra
              </h1>
              <span className="text-[10px] font-semibold text-cyan-600 uppercase tracking-widest mt-0.5">
                Lead Software
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-indigo-50 border border-indigo-100 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                <div className={`relative flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${isActive ? 'text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}>
                  <item.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/60">
          <Link href="/dashboard/settings" className="flex items-center space-x-3 px-3 py-2.5 text-slate-600 rounded-lg hover:text-slate-900 hover:bg-slate-100/50 transition-colors">
            <Settings size={18} className="text-slate-500" />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative bg-slate-50">
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
