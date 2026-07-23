export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">1,204</p>
          <p className="text-sm text-green-600 mt-2">+12% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Hot Leads</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">84</p>
          <p className="text-sm text-green-600 mt-2">+5% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Emails Sent</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">432</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Meetings Scheduled</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">Campaign "Pune IT" generated 45 leads.</p>
          <p className="text-gray-600 text-sm">Follow-up email sent to ABC Corp.</p>
        </div>
      </div>
    </div>
  );
}
