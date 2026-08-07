"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Webhook, CheckCircle2, AlertCircle } from "lucide-react";
import { ref, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch current webhook URL from Firebase
    const settingsRef = ref(database, 'settings/webhook_url');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setWebhookUrl(data);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const settingsRef = ref(database, 'settings/webhook_url');
      await set(settingsRef, webhookUrl.trim());
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save webhook:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your automation integrations and software preferences.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Webhook size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Real-Time Webhooks</h2>
              <p className="text-sm text-slate-500">Automatically push "Hot Leads" (Score &gt; 80) to Zapier, Make.com, or your CRM.</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveWebhook} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Webhook URL</label>
                <div className="flex rounded-xl shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                    POST
                  </span>
                  <input
                    type="url"
                    disabled={isLoading}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-4 py-2.5 rounded-none rounded-r-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-slate-50 outline-none transition-shadow"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  When the AI finds a lead with a score &gt; 80, it will instantly POST the lead data to this URL. Leave blank to disable.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                {saveStatus === "success" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-emerald-600 text-sm font-medium gap-1.5">
                    <CheckCircle2 size={16} /> Saved successfully
                  </motion.div>
                )}
                {saveStatus === "error" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-red-600 text-sm font-medium gap-1.5">
                    <AlertCircle size={16} /> Failed to save
                  </motion.div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
