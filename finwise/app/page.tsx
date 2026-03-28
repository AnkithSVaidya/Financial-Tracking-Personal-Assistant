"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getProfile } from "@/lib/storage";
import {
  TrendingUp, ShoppingBag, Shield, Zap, ChevronRight,
  DollarSign, BarChart3, Brain
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const profile = getProfile();
    if (profile?.setupComplete) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      desc: "Groq AI analyzes every purchase against your real spending habits",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: BarChart3,
      title: "Smart Budget Tracking",
      desc: "Track spending across 10 categories with beautiful visualizations",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      icon: ShoppingBag,
      title: "Price Comparison",
      desc: "Automatically finds the same product cheaper at Amazon, Walmart, Wayfair & more",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Shield,
      title: "Impulse Control",
      desc: "Get flagged before you overspend — personalized to your savings goals",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] bg-grid overflow-hidden">
      {/* Glow orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">FinWise</span>
        </div>
        <button
          onClick={() => router.push("/setup")}
          className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          Get Started <ChevronRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-sm text-indigo-300 mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Groq AI — decisions in seconds
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Stop second-guessing
            <br />
            <span className="gradient-text">every purchase</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            FinWise analyzes your spending habits, checks your budget, and tells you
            whether to buy — then finds you a better price if you should.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={() => router.push("/setup")}
              className="btn-primary px-8 py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <DollarSign className="w-5 h-5" />
              Set Up My Profile — Free
            </motion.button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 text-left glass-hover">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Demo mockup */}
        <motion.div
          className="mt-16 glass rounded-3xl p-6 text-left max-w-lg mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500 ml-2">Purchase Analysis</span>
          </div>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-3 text-sm">
              <div className="text-gray-400 text-xs mb-1">Product</div>
              <div className="text-white">Nike Air Max 270 — $130</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm">
              <div className="text-red-400 font-semibold mb-1">✗ Don&apos;t Buy Right Now</div>
              <div className="text-gray-400 text-xs">You&apos;ve spent $280 of your $300 clothing budget this month. This would exceed your limit by $110 and cut into your $500 savings goal.</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
