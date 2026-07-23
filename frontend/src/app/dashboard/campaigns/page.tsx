"use client";
import { useState, useEffect } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";

type Campaign = {
  id: number;
  name: string;
  search_query: string;
  status: string;
  leads_count: number;
  created_at: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // For MVP, dummy data
    setCampaigns([
      {
        id: 1,
        name: "Pune IT Companies",
        search_query: "Find software companies in Pune",
        status: "Completed",
        leads_count: 45,
        created_at: "2023-10-15T10:00:00Z"
      },
      {
        id: 2,
        name: "Mumbai Hospitals",
        search_query: "Find hospitals in Mumbai without online booking",
        status: "Running",
        leads_count: 12,
        created_at: "2023-10-25T14:30:00Z"
      }
    ]);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your active AI lead generation campaigns</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-4 font-medium">Campaign Name</th>
              <th className="p-4 font-medium">Search Query</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Leads Generated</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((camp) => (
              <tr key={camp.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{camp.name}</td>
                <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{camp.search_query}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center w-max gap-1 ${
                    camp.status === 'Running' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {camp.status === 'Running' ? <Play size={12} /> : <AlertCircle size={12} />}
                    {camp.status}
                  </span>
                </td>
                <td className="p-4 text-sm font-semibold">{camp.leads_count}</td>
                <td className="p-4">
                  <button className="text-red-600 text-sm font-medium hover:underline flex items-center gap-1">
                    <Pause size={14} /> Stop
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
