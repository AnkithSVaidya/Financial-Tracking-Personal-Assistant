"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Plus, LogOut, Clock,
  CheckCircle, XCircle, AlertCircle, BarChart3, Target
} from "lucide-react";
import { getProfile, saveProfile, clearProfile } from "@/lib/storage";
import { UserProfile, ProductAnalysis } from "@/lib/types";
import { formatCurrency, getBudgetBarColor, getBudgetColor } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p?.setupComplete) {
      router.replace("/");
      return;
    }
    setProfile(p);
  }, [router]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalBudget = profile.categories.reduce((s, c) => s + c.monthlyBudget, 0);
  const totalSpent = profile.categories.reduce((s, c) => s + c.currentSpent, 0);
  const savedThisMonth = Math.max(0, profile.monthlySalary - totalSpent);
  const savingsProgress = Math.min(100, (savedThisMonth / profile.monthlySavingsGoal) * 100);
  const activeCategories = profile.categories.filter((c) => c.monthlyBudget > 0);

  function handleReset() {
    clearProfile();
    router.push("/");
  }

  function getVerdictIcon(rec: string) {
    if (rec === "buy") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (rec === "consider") return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  }

  function resetSpending() {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      categories: profile.categories.map((c) => ({ ...c, currentSpent: 0 })),
    };
    saveProfile(updated);
    setProfile(updated);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] bg-grid">
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">FinWise</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push("/analyze")}
              className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" /> Analyze Purchase
            </motion.button>
            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              title="Reset profile"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {profile.name}! 👋
          </h1>
          <p className="text-gray-400">Here&apos;s your financial snapshot for this month.</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Savings Progress</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(savingsProgress)}%
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${savingsProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">{formatCurrency(savedThisMonth)} of {formatCurrency(profile.monthlySavingsGoal)} goal</div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Total Spent</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(totalSpent)}
            </div>
            <div className="text-xs text-gray-500">of {formatCurrency(totalBudget)} budgeted</div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Analyses</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {profile.analyses.length}
            </div>
            <div className="text-xs text-gray-500">purchases reviewed</div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Monthly Income</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(profile.monthlySalary)}
            </div>
            <div className="text-xs text-gray-500">take-home</div>
          </div>
        </motion.div>

        {/* Category Budgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Category Budgets</h2>
            <button
              onClick={resetSpending}
              className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 glass rounded-lg"
            >
              Reset Month
            </button>
          </div>

          {activeCategories.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-gray-400">
              No budgets set. Go to <span className="text-indigo-400">setup</span> to add category budgets.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeCategories.map((cat, i) => {
                const pct = cat.monthlyBudget > 0 ? Math.min(100, (cat.currentSpent / cat.monthlyBudget) * 100) : 0;
                const barColor = getBudgetBarColor(cat.currentSpent, cat.monthlyBudget);
                const textColor = getBudgetColor(cat.currentSpent, cat.monthlyBudget);
                return (
                  <motion.div
                    key={cat.id}
                    className="glass-hover rounded-2xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${textColor}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full ${barColor} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatCurrency(cat.currentSpent)} spent</span>
                      <span>{formatCurrency(cat.monthlyBudget - cat.currentSpent)} left</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Analyses */}
        {profile.analyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">Recent Analyses</h2>
            <div className="space-y-3">
              {profile.analyses.slice(0, 5).map((analysis: ProductAnalysis) => (
                <div key={analysis.id} className="glass-hover rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getVerdictIcon(analysis.verdict.recommendation)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {analysis.productInfo.productName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{analysis.verdict.summary}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-white">
                      {analysis.productInfo.price ? formatCurrency(analysis.productInfo.price) : "—"}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          className="glass rounded-3xl p-8 text-center border border-indigo-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <ShoppingBag className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Ready to analyze a purchase?</h3>
          <p className="text-gray-400 mb-6">Paste a product link or upload an image — get an instant AI verdict.</p>
          <motion.button
            onClick={() => router.push("/analyze")}
            className="btn-primary px-8 py-3 rounded-2xl text-base flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" /> Analyze a Purchase
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
