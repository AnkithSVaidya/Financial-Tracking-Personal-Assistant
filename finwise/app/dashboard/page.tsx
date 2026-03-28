"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Plus, LogOut, Clock,
  CheckCircle, XCircle, AlertCircle, BarChart3, Target,
  PenLine, X, FileUp, Minus
} from "lucide-react";
import { getProfile, saveProfile, clearProfile } from "@/lib/storage";
import { CategoryBudget, UserProfile, ProductAnalysis } from "@/lib/types";
import { formatCurrency, getBudgetBarColor, getBudgetColor } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Spending modal state
  const [modalCat, setModalCat] = useState<CategoryBudget | null>(null);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendNote, setSpendNote] = useState("");
  const [spendMode, setSpendMode] = useState<"add" | "subtract">("add");
  const [spendSuccess, setSpendSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p?.setupComplete) { router.replace("/"); return; }
    setProfile(p);
  }, [router]);

  useEffect(() => {
    if (modalCat) {
      setSpendAmount("");
      setSpendNote("");
      setSpendMode("add");
      setSpendSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modalCat]);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setModalCat(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  function handleReset() { clearProfile(); router.push("/"); }

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

  function handleLogSpending() {
    if (!profile || !modalCat) return;
    const amount = parseFloat(spendAmount);
    if (isNaN(amount) || amount <= 0) return;

    const delta = spendMode === "add" ? amount : -amount;
    const updated: UserProfile = {
      ...profile,
      categories: profile.categories.map((c) =>
        c.id === modalCat.id
          ? { ...c, currentSpent: Math.max(0, c.currentSpent + delta) }
          : c
      ),
    };
    saveProfile(updated);
    setProfile(updated);
    setSpendSuccess(true);
    // Update modalCat to reflect new value for the success message
    const newCat = updated.categories.find((c) => c.id === modalCat.id)!;
    setModalCat(newCat);
    setTimeout(() => setModalCat(null), 1200);
  }

  const presets = ["10", "25", "50", "100", "200"];

  return (
    <div className="min-h-screen bg-[#0a0f1e] bg-grid">
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Spending Modal ── */}
      <AnimatePresence>
        {modalCat && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalCat(null)}
            />

            <motion.div
              className="relative z-10 w-full max-w-sm glass rounded-3xl p-6 shadow-2xl"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{modalCat.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{modalCat.label}</div>
                    <div className="text-xs text-gray-400">
                      {formatCurrency(modalCat.currentSpent)} of {formatCurrency(modalCat.monthlyBudget)} used
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModalCat(null)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Budget bar */}
              <div className="mb-5">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getBudgetBarColor(modalCat.currentSpent, modalCat.monthlyBudget)} transition-all duration-500`}
                    style={{ width: `${Math.min(100, (modalCat.currentSpent / modalCat.monthlyBudget) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatCurrency(modalCat.monthlyBudget - modalCat.currentSpent)} remaining</span>
                  <span>{Math.round((modalCat.currentSpent / modalCat.monthlyBudget) * 100)}%</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {spendSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center"
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <div className="text-white font-semibold">Spending logged!</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Now at {formatCurrency(modalCat.currentSpent)} / {formatCurrency(modalCat.monthlyBudget)}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Add / Subtract toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setSpendMode("add")}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                          spendMode === "add"
                            ? "bg-indigo-600 text-white"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Spending
                      </button>
                      <button
                        onClick={() => setSpendMode("subtract")}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                          spendMode === "subtract"
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    {/* Preset amounts */}
                    <div className="flex gap-2 mb-3">
                      {presets.map((p) => (
                        <button
                          key={p}
                          onClick={() => setSpendAmount(p)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            spendAmount === p
                              ? "bg-indigo-500/30 border border-indigo-500/60 text-indigo-300"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          ${p}
                        </button>
                      ))}
                    </div>

                    {/* Amount input */}
                    <div className="relative mb-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        ref={inputRef}
                        type="number"
                        placeholder="Enter amount"
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogSpending()}
                        className="w-full input-dark rounded-xl pl-8 pr-4 py-3 text-lg font-semibold"
                      />
                    </div>

                    {/* Optional note */}
                    <input
                      type="text"
                      placeholder="Note (optional) — e.g. dinner with friends"
                      value={spendNote}
                      onChange={(e) => setSpendNote(e.target.value)}
                      className="w-full input-dark rounded-xl px-4 py-2.5 text-sm mb-4"
                    />

                    <button
                      onClick={handleLogSpending}
                      disabled={!spendAmount || parseFloat(spendAmount) <= 0}
                      className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <PenLine className="w-4 h-4" />
                      {spendMode === "add" ? "Log Spending" : "Remove Spending"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {profile.name}! 👋</h1>
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
            <div className="text-2xl font-bold text-white mb-1">{Math.round(savingsProgress)}%</div>
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
            <div className="text-2xl font-bold text-white mb-1">{formatCurrency(totalSpent)}</div>
            <div className="text-xs text-gray-500">of {formatCurrency(totalBudget)} budgeted</div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Analyses</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{profile.analyses.length}</div>
            <div className="text-xs text-gray-500">purchases reviewed</div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Monthly Income</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{formatCurrency(profile.monthlySalary)}</div>
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
            <div>
              <h2 className="text-xl font-bold text-white">Category Budgets</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click any category to log spending</p>
            </div>
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
                  <motion.button
                    key={cat.id}
                    onClick={() => setModalCat(cat)}
                    className="glass-hover rounded-2xl p-4 text-left group w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${textColor}`}>{Math.round(pct)}%</span>
                        <PenLine className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
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
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Upload Statement placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass rounded-2xl p-5 border border-dashed border-white/10 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <FileUp className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="font-medium text-white text-sm">Upload Bank / Credit Card Statement</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Auto-categorize all transactions from a CSV export — coming soon
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex-shrink-0">
            Coming Soon
          </span>
        </motion.div>

        {/* Recent Analyses */}
        {profile.analyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">Recent Analyses</h2>
            <div className="space-y-3">
              {profile.analyses.slice(0, 5).map((analysis: ProductAnalysis) => (
                <div key={analysis.id} className="glass-hover rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">{getVerdictIcon(analysis.verdict.recommendation)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{analysis.productInfo.productName}</div>
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
