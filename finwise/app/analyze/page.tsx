"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, ArrowLeft, Link2, Upload, Loader2,
  CheckCircle, XCircle, AlertCircle, ExternalLink,
  ShoppingCart, ImageIcon, X, DollarSign
} from "lucide-react";
import { getProfile, saveProfile, addAnalysis } from "@/lib/storage";
import { UserProfile, ProductInfo, FinancialVerdict, PriceAlternative } from "@/lib/types";
import { formatCurrency, getVerdictBg, getVerdictLabel, getBudgetBarColor } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

type Tab = "url" | "image";
type Stage = "idle" | "fetching" | "extracting" | "analyzing" | "comparing" | "done" | "error";

const STAGE_MESSAGES: Record<Stage, string> = {
  idle: "",
  fetching: "Fetching product page...",
  extracting: "Extracting product details...",
  analyzing: "Analyzing your spending habits...",
  comparing: "Finding best prices across stores...",
  done: "Analysis complete!",
  error: "Something went wrong.",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");

  // Results
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [verdict, setVerdict] = useState<FinancialVerdict | null>(null);
  const [alternatives, setAlternatives] = useState<PriceAlternative[]>([]);

  // Missing info form
  const [missingPrice, setMissingPrice] = useState("");
  const [missingName, setMissingName] = useState("");
  const [showMissingForm, setShowMissingForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  async function fetchAlternatives(info: ProductInfo, v: FinancialVerdict) {
    if (v.recommendation === "dont_buy" || !info.productName) return { priceAlts: [] };

    setStage("comparing");
    const altRes = await fetch("/api/compare-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: info.productName, originalPrice: info.price || 0 }),
    });
    const altData = await altRes.json();
    const priceAlts: PriceAlternative[] = altData.alternatives || [];
    setAlternatives(priceAlts);

    return { priceAlts };
  }

  useEffect(() => {
    const p = getProfile();
    if (!p?.setupComplete) { router.replace("/"); return; }
    setProfile(p);
  }, [router]);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImageSelect(file);
  }, [handleImageSelect]);

  async function analyzeURL() {
    if (!url.trim() || !profile) return;
    setStage("fetching");
    setError("");
    setProductInfo(null);
    setVerdict(null);
    setAlternatives([]);
    setShowMissingForm(false);

    try {
      setStage("extracting");
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), profile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const info: ProductInfo = data.productInfo;
      const v: FinancialVerdict = data.verdict;

      setProductInfo(info);
      setVerdict(v);

      const needsPrice = !info.price;
      const needsName = !info.productName;
      if (needsPrice || needsName) {
        setShowMissingForm(true);
        setMissingPrice(info.price ? String(info.price) : "");
        setMissingName(info.productName || "");
      }

      const { priceAlts } = await fetchAlternatives(info, v);

      addAnalysis({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        productInfo: info,
        verdict: v,
        priceAlternatives: priceAlts,
      });

      setStage("done");
    } catch (err) {
      setError(String(err));
      setStage("error");
    }
  }

  async function analyzeImage() {
    if (!imageFile || !profile) return;
    setStage("extracting");
    setError("");
    setProductInfo(null);
    setVerdict(null);
    setAlternatives([]);
    setShowMissingForm(false);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      setStage("analyzing");
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: imageFile.type, profile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const info: ProductInfo = data.productInfo;
      const v: FinancialVerdict = data.verdict;

      setProductInfo(info);
      setVerdict(v);

      const needsPrice = !info.price;
      const needsName = !info.productName;
      if (needsPrice || needsName) {
        setShowMissingForm(true);
        setMissingPrice(info.price ? String(info.price) : "");
        setMissingName(info.productName || "");
      }

      const { priceAlts } = await fetchAlternatives(info, v);

      addAnalysis({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        productInfo: info,
        verdict: v,
        priceAlternatives: priceAlts,
      });

      setStage("done");
    } catch (err) {
      setError(String(err));
      setStage("error");
    }
  }

  async function reAnalyzeWithUpdatedInfo() {
    if (!productInfo || !profile) return;
    const updatedInfo: ProductInfo = {
      ...productInfo,
      price: parseFloat(missingPrice) || productInfo.price,
      productName: missingName || productInfo.productName,
      missingInfo: [],
    };
    setProductInfo(updatedInfo);
    setShowMissingForm(false);
    setAlternatives([]);
    setStage("analyzing");

    try {
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `data:text/plain,${encodeURIComponent(JSON.stringify(updatedInfo))}`,
          profile,
        }),
      });
      const data = await res.json();
      if (data.verdict) {
        setVerdict(data.verdict);
        await fetchAlternatives(updatedInfo, data.verdict);
      }

      setStage("done");
    } catch (err) {
      setError(String(err));
      setStage("error");
    }
  }

  const isLoading = ["fetching", "extracting", "analyzing", "comparing", "suggesting"].includes(stage);
  const cat = profile?.categories.find((c) => c.id === productInfo?.category);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] bg-grid">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">FinWise</span>
          </div>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300 font-medium">Analyze Purchase</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Should you buy it?</h1>
          <p className="text-gray-400">Paste a product link or upload an image — AI will decide.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Input panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="glass rounded-2xl p-1.5 flex gap-1">
              {[
                { id: "url" as Tab, icon: Link2, label: "Online Link" },
                { id: "image" as Tab, icon: ImageIcon, label: "Store Image" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    tab === t.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* URL Input */}
            {tab === "url" && (
              <motion.div
                key="url-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product URL</label>
                  <textarea
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.amazon.com/product/..."
                    rows={3}
                    className="w-full input-dark rounded-xl px-4 py-3 text-sm resize-none"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={analyzeURL}
                  disabled={!url.trim() || isLoading}
                  className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Analyze Purchase</>
                  )}
                </button>
              </motion.div>
            )}

            {/* Image Upload */}
            {tab === "image" && (
              <motion.div
                key="image-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5 space-y-4"
              >
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    imagePreview
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-white/10 hover:border-indigo-500/50 hover:bg-white/5"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Product" className="w-full h-40 object-contain rounded-lg mb-2" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <p className="text-xs text-gray-400">{imageFile?.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Drop image here or click to browse</p>
                      <p className="text-xs text-gray-600 mt-1">Product photos, price tags, store shelves</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                />
                <button
                  onClick={analyzeImage}
                  disabled={!imageFile || isLoading}
                  className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Analyze Purchase</>
                  )}
                </button>
              </motion.div>
            )}

            {/* Loading status */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                    <div>
                      <div className="text-sm text-white">{STAGE_MESSAGES[stage]}</div>
                      <div className="text-xs text-gray-500 mt-0.5">This takes a few seconds...</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full shimmer" style={{ width: "60%" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Missing info form */}
            <AnimatePresence>
              {showMissingForm && productInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-5 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-300">Missing information detected</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Help us give you a better analysis by filling in the missing details:
                  </p>
                  <div className="space-y-3">
                    {(!productInfo.productName || productInfo.missingInfo?.includes("productName")) && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Product name</label>
                        <input
                          type="text"
                          value={missingName}
                          onChange={(e) => setMissingName(e.target.value)}
                          className="w-full input-dark rounded-lg px-3 py-2 text-sm"
                          placeholder="e.g. Nike Air Max 270"
                        />
                      </div>
                    )}
                    {(!productInfo.price || productInfo.missingInfo?.includes("price")) && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Price ($)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                          <input
                            type="number"
                            value={missingPrice}
                            onChange={(e) => setMissingPrice(e.target.value)}
                            className="w-full input-dark rounded-lg pl-8 pr-3 py-2 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={reAnalyzeWithUpdatedInfo}
                    disabled={isLoading}
                    className="btn-primary w-full py-2.5 rounded-xl text-sm mt-4"
                  >
                    Update & Re-analyze
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="wait">
              {!productInfo && !isLoading && stage === "idle" && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-12 text-center"
                >
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No analysis yet</h3>
                  <p className="text-gray-500 text-sm">
                    Paste a product URL or upload an image to get started.
                  </p>
                </motion.div>
              )}

              {stage === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 border border-red-500/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="font-semibold text-red-300">Analysis Failed</span>
                  </div>
                  <p className="text-sm text-gray-400">{error}</p>
                  <button
                    onClick={() => setStage("idle")}
                    className="mt-4 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Try again
                  </button>
                </motion.div>
              )}

              {productInfo && verdict && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Product Card */}
                  <div className="glass rounded-2xl p-5">
                    <div className="flex gap-4">
                      {productInfo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={productInfo.imageUrl}
                          alt={productInfo.productName}
                          className="w-20 h-20 object-contain rounded-xl bg-white/5 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ShoppingCart className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg leading-tight mb-1 truncate">
                          {productInfo.productName || "Unknown Product"}
                        </h3>
                        {productInfo.brand && (
                          <div className="text-sm text-gray-400 mb-1">{productInfo.brand}</div>
                        )}
                        <div className="flex items-center gap-3">
                          {productInfo.price ? (
                            <span className="text-2xl font-bold text-white">
                              {formatCurrency(productInfo.price)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Price unknown</span>
                          )}
                          {productInfo.category && productInfo.category !== "other" && (
                            <span className="text-xs px-2 py-1 bg-white/10 rounded-lg text-gray-300">
                              {CATEGORIES.find((c) => c.id === productInfo.category)?.icon}{" "}
                              {CATEGORIES.find((c) => c.id === productInfo.category)?.label}
                            </span>
                          )}
                        </div>
                        {productInfo.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{productInfo.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className={`rounded-2xl p-5 border ${getVerdictBg(verdict.recommendation)}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {verdict.recommendation === "buy" && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                        {verdict.recommendation === "consider" && <AlertCircle className="w-6 h-6 text-yellow-400" />}
                        {verdict.recommendation === "dont_buy" && <XCircle className="w-6 h-6 text-red-400" />}
                      </div>
                      <div>
                        <div className="text-lg font-bold mb-1">{getVerdictLabel(verdict.recommendation)}</div>
                        <p className="text-sm font-medium opacity-90">{verdict.summary}</p>
                      </div>
                    </div>
                    <p className="text-sm opacity-75 leading-relaxed mb-4">{verdict.reasoning}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-black/20 rounded-xl p-3">
                        <div className="text-xs font-medium opacity-60 mb-1 uppercase tracking-wide">Budget Impact</div>
                        <div className="text-sm">{verdict.budgetImpact}</div>
                      </div>
                      <div className="bg-black/20 rounded-xl p-3">
                        <div className="text-xs font-medium opacity-60 mb-1 uppercase tracking-wide">Savings Impact</div>
                        <div className="text-sm">{verdict.savingsImpact}</div>
                      </div>
                    </div>

                    {verdict.warningFlags && verdict.warningFlags.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {verdict.warningFlags.map((flag, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs opacity-75">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category budget impact */}
                  {cat && cat.monthlyBudget > 0 && (
                    <div className="glass rounded-2xl p-4">
                      <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <span>{cat.icon}</span> {cat.label} Budget
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Current: {formatCurrency(cat.currentSpent)}</span>
                          <span>Budget: {formatCurrency(cat.monthlyBudget)}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 relative">
                          <div
                            className={`h-2 rounded-full ${getBudgetBarColor(cat.currentSpent, cat.monthlyBudget)}`}
                            style={{ width: `${Math.min(100, (cat.currentSpent / cat.monthlyBudget) * 100)}%` }}
                          />
                          {productInfo.price && (
                            <div
                              className="absolute top-0 h-2 rounded-full bg-white/40"
                              style={{
                                left: `${Math.min(100, (cat.currentSpent / cat.monthlyBudget) * 100)}%`,
                                width: `${Math.min(100 - (cat.currentSpent / cat.monthlyBudget) * 100, (productInfo.price / cat.monthlyBudget) * 100)}%`,
                              }}
                            />
                          )}
                        </div>
                        {productInfo.price && (
                          <div className="text-xs text-gray-500">
                            After purchase: {formatCurrency(cat.currentSpent + productInfo.price)} of {formatCurrency(cat.monthlyBudget)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price alternatives */}
                  {alternatives.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl p-5"
                    >
                      <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-indigo-400" />
                        Same Product, Better Price
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">Real prices from Google Shopping — click to buy</p>
                      <div className="space-y-2">
                        {alternatives.map((alt, i) => (
                          <a
                            key={i}
                            href={alt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                              i === 0
                                ? "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15"
                                : "bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            {alt.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={alt.thumbnail}
                                alt={alt.title}
                                className="w-10 h-10 object-contain rounded-lg bg-white/10 flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ShoppingCart className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-white truncate">{alt.retailer}</div>
                                {i === 0 && (
                                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    BEST
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{alt.title}</div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-sm font-bold text-white">
                                {formatCurrency(alt.price)}
                              </div>
                              {alt.savings > 0 && (
                                <div className="text-xs text-emerald-400">
                                  Save {formatCurrency(alt.savings)}
                                </div>
                              )}
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setProductInfo(null);
                        setVerdict(null);
                        setAlternatives([]);
                        setStage("idle");
                        setUrl("");
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="flex-1 glass rounded-xl py-3 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Analyze Another
                    </button>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="flex-1 btn-primary py-3 rounded-xl text-sm"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
