"use client";
import { useState, useEffect } from "react";
import { Download, Filter, Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api";

type Lead = {
  id: number;
  company_id: number;
  contact_person: string;
  email: string;
  phone: string;
  problems_identified: string;
  recommended_solution: string;
  lead_score: number;
  status: string;
  company: {
    name: string;
    industry: string;
    website: string;
  }
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // For MVP, using dummy data if backend is not running
    setLeads([
      {
        id: 1,
        company_id: 1,
        contact_person: "John Doe",
        email: "john@abcmfg.com",
        phone: "+91 9876543210",
        problems_identified: "No CRM, outdated inventory software",
        recommended_solution: "Codentra ERP Pro",
        lead_score: 92,
        status: "New",
        company: {
          name: "ABC Manufacturing",
          industry: "Manufacturing",
          website: "abcmfg.com",
        }
      },
      {
        id: 2,
        company_id: 2,
        contact_person: "Sarah Smith",
        email: "sarah@cityhospital.in",
        phone: "+91 8765432109",
        problems_identified: "No online booking",
        recommended_solution: "Codentra HMS + App",
        lead_score: 85,
        status: "Contacted",
        company: {
          name: "City Hospital",
          industry: "Healthcare",
          website: "cityhospital.in",
        }
      }
    ]);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads CRM</h1>
          <p className="text-gray-600 mt-1">Manage and track your generated leads</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium">Industry</th>
              <th className="p-4 font-medium">Problem Identified</th>
              <th className="p-4 font-medium">Score</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium text-gray-900">{lead.company.name}</div>
                  <div className="text-xs text-indigo-600">{lead.company.website}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">{lead.company.industry}</td>
                <td className="p-4 text-sm text-gray-600 truncate max-w-xs">{lead.problems_identified}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.lead_score >= 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lead.lead_score}/100
                  </span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {lead.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-indigo-600 text-sm font-medium hover:underline">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
