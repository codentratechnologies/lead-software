import Link from 'next/link';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  BarChart, 
  Settings, 
  Mail 
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-indigo-600">Codentra AI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/dashboard/search" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Search size={20} />
            <span>AI Lead Search</span>
          </Link>
          <Link href="/dashboard/leads" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Users size={20} />
            <span>Leads CRM</span>
          </Link>
          <Link href="/dashboard/campaigns" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <BarChart size={20} />
            <span>Campaigns</span>
          </Link>
          <Link href="/dashboard/email" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Mail size={20} />
            <span>Email Generator</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/dashboard/settings" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
