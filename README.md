# FinWise

> FinWise essentially acts as a real-time financial advisor in your pocket — combining AI reasoning, live price comparison, and personal budget awareness to eliminate purchase guilt and impulsive overspending.

---

## What it does

Paste a product link or upload a photo and FinWise tells you whether you should buy it — based on your actual financial situation, not a generic rule. It then searches live prices across major retailers to find you the same product cheaper.

## Features

- **AI Purchase Verdicts** — get a buy / consider / don't buy decision backed by reasoning, not just a number
- **Personalized Analysis** — verdicts factor in your income, savings goals, and per-category monthly budgets
- **Live Price Comparison** — searches Google Shopping in real time to find the same product at lower prices
- **Budget Tracking** — 10 spending categories with monthly limits and running spend totals
- **Image Support** — snap a photo of a price tag or product shelf, FinWise extracts and analyzes it
- **Analysis History** — every past decision saved to your dashboard

## Tech Stack

- **Next.js 14** — full-stack React framework
- **Groq** — fast LLM inference for product extraction and financial verdicts
- **SerpAPI** — Google Shopping for real-time price comparison
- **Jina AI** — web scraping for product pages
- **Tailwind CSS + Framer Motion** — UI and animations
- **localStorage** — lightweight client-side profile persistence
