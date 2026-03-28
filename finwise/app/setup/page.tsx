"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ChevronRight, ChevronLeft, Check, DollarSign } from "lucide-react";
import { saveProfile, createDefaultProfile } from "@/lib/storage";
import { CATEGORIES, CategoryId, UserProfile } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const TOTAL_STEPS = 4;

const SPENDING_STYLES = [
  { id: "disciplined", label: "Disciplined", desc: "I track every dollar and stick to budgets" },
  { id: "moderate", label: "Moderate", desc: "I'm mindful but allow myself occasional splurges" },
  { id: "spontaneous", label: "Spontaneous", desc: "I buy what feels right in the moment" },
] as const;

const FINANCIAL_GOALS = [
  { id: "saving", label: "Building Savings", icon: "🏦" },
  { id: "expenses", label: "Managing Expenses", icon: "📊" },
  { id: "debt", label: "Paying Off Debt", icon: "💳" },
  { id: "big_purchase", label: "Saving for Big Purchase", icon: "🏠" },
] as const;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [savings, setSavings] = useState("");

  // Step 2 - category budgets
  const [budgets, setBudgets] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, ""]))
  );

  // Step 3 - preferences
  const [priorityCategory, setPriorityCategory] = useState<CategoryId>("experiences");
  const [spendingStyle, setSpendingStyle] = useState<"disciplined" | "moderate" | "spontaneous">("moderate");
  const [maxSinglePurchase, setMaxSinglePurchase] = useState("200");
  const [financialGoal, setFinancialGoal] = useState<"saving" | "expenses" | "debt" | "big_purchase">("saving");

  const canProceedStep1 = name.trim() && parseFloat(salary) > 0 && parseFloat(savings) > 0;
  const canProceedStep2 = CATEGORIES.some((c) => parseFloat(budgets[c.id] || "0") > 0);

  function buildProfile(): UserProfile {
    const base = createDefaultProfile(
      name.trim(),
      parseFloat(salary),
      parseFloat(savings)
    );
    base.categories = base.categories.map((c) => ({
      ...c,
      monthlyBudget: parseFloat(budgets[c.id] || "0"),
      currentSpent: 0,
    }));
    base.preferences = {
      priorityCategory,
      spendingStyle,
      maxSinglePurchase: parseFloat(maxSinglePurchase) || 200,
      financialGoal,
    };
    base.setupComplete = true;
    return base;
  }

  function handleFinish() {
    const profile = buildProfile();
    saveProfile(profile);
    router.push("/dashboard");
  }

  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] bg-grid flex flex-col">
      <div className="fixed top-0 left-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold gradient-text">FinWise</span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? "bg-indigo-500 w-8" : i === step - 1 ? "bg-indigo-500 w-8" : "bg-white/10 w-4"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="glass rounded-3xl p-8">
                  <div className="mb-8">
                    <div className="text-sm text-indigo-400 font-medium mb-2">Step 1 of 4</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Your financial picture</h2>
                    <p className="text-gray-400">We&apos;ll use this to make smarter decisions for you.</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Your name</label>
                      <input
                        type="text"
                        placeholder="Alex Johnson"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full input-dark rounded-xl px-4 py-3 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Monthly take-home salary</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          placeholder="5000"
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Monthly savings goal</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          placeholder="500"
                          value={savings}
                          onChange={(e) => setSavings(e.target.value)}
                          className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-base"
                        />
                      </div>
                      {salary && savings && parseFloat(salary) > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          That&apos;s {Math.round((parseFloat(savings) / parseFloat(salary)) * 100)}% of your income —{" "}
                          {parseFloat(savings) / parseFloat(salary) >= 0.2
                            ? "great savings rate! 🎉"
                            : "consider increasing to 20% over time."}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="btn-primary w-full mt-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base"
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="glass rounded-3xl p-8">
                  <div className="mb-6">
                    <div className="text-sm text-indigo-400 font-medium mb-2">Step 2 of 4</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Monthly spending</h2>
                    <p className="text-gray-400">How much do you typically spend in each category? Skip categories you don&apos;t use.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={budgets[cat.id]}
                            onChange={(e) => setBudgets((b) => ({ ...b, [cat.id]: e.target.value }))}
                            className="w-full input-dark rounded-lg pl-7 pr-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {salary && (
                    <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-sm text-indigo-300">
                      Total budgeted:{" "}
                      <span className="font-semibold">
                        {formatCurrency(CATEGORIES.reduce((s, c) => s + parseFloat(budgets[c.id] || "0"), 0))}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold">{formatCurrency(parseFloat(salary) - parseFloat(savings || "0"))}</span> available
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 glass rounded-2xl py-3 flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="btn-primary flex-[2] py-3 rounded-2xl flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="glass rounded-3xl p-8">
                  <div className="mb-6">
                    <div className="text-sm text-indigo-400 font-medium mb-2">Step 3 of 4</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Your preferences</h2>
                    <p className="text-gray-400">This helps personalize your purchase advice.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Financial goal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Primary financial goal
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {FINANCIAL_GOALS.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => setFinancialGoal(g.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              financialGoal === g.id
                                ? "border-indigo-500 bg-indigo-500/20 text-white"
                                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                            }`}
                          >
                            <div className="text-lg mb-1">{g.icon}</div>
                            <div className="text-sm font-medium">{g.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spending style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Your spending style
                      </label>
                      <div className="space-y-2">
                        {SPENDING_STYLES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSpendingStyle(s.id)}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${
                              spendingStyle === s.id
                                ? "border-indigo-500 bg-indigo-500/20"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="text-sm font-medium text-white">{s.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        What matters most to you?
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {CATEGORIES.slice(0, 5).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setPriorityCategory(c.id)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              priorityCategory === c.id
                                ? "border-indigo-500 bg-indigo-500/20"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="text-xl mb-1">{c.icon}</div>
                            <div className="text-xs text-gray-400 leading-tight">{c.label.split(" ")[0]}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max single purchase */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max single unplanned purchase
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          placeholder="200"
                          value={maxSinglePurchase}
                          onChange={(e) => setMaxSinglePurchase(e.target.value)}
                          className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-base"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Purchases above this will be flagged as potentially impulsive
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 glass rounded-2xl py-3 flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="btn-primary flex-[2] py-3 rounded-2xl flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <motion.div key="step4" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="glass rounded-3xl p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white mb-3">You&apos;re all set, {name}! 🎉</h2>
                  <p className="text-gray-400 mb-8">
                    FinWise is ready to help you make smarter purchase decisions.
                  </p>

                  {/* Summary */}
                  <div className="glass rounded-2xl p-5 text-left space-y-3 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Monthly Income</span>
                      <span className="text-white font-semibold">{formatCurrency(parseFloat(salary))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Savings Goal</span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(parseFloat(savings))}/mo</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Categories Tracked</span>
                      <span className="text-white font-semibold">
                        {CATEGORIES.filter((c) => parseFloat(budgets[c.id] || "0") > 0).length} of 10
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Spending Style</span>
                      <span className="text-indigo-400 font-semibold capitalize">{spendingStyle}</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleFinish}
                    className="btn-primary w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to Dashboard <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
