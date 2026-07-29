"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth", { email, password });
      if (response.data.success) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft abstract blobs for light theme */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-200/50 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-violet-200/50 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-multiply"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] p-6 relative z-10"
      >
        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/80 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative">
          
          {/* Subtle top reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="inline-flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 mb-6 shadow-sm relative group"
            >
              <div className="absolute inset-0 bg-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Image
                src="/codentra logo without text and bg.png"
                alt="Codentra Logo"
                width={56}
                height={56}
                className="relative z-10 drop-shadow-sm transition-transform duration-500 group-hover:scale-105"
              />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Sign in to manage your AI campaigns.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                <span>Password</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] disabled:opacity-70 disabled:pointer-events-none mt-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </motion.button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Admin Portal</span>
          </div>
        </div>
        
        {/* Subtle footer */}
        <div className="text-center mt-6 text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Codentra Technologies. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
