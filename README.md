# FinWise — AI-Powered Purchase Advisor

FinWise helps you make smarter buying decisions. Paste a product link or upload a photo, and it tells you whether to buy based on your budget — then finds you the same product cheaper across major retailers.

---

## Features

- **AI Purchase Analysis** — paste a product URL or upload an image to get a buy / consider / don't buy verdict
- **Personalized to You** — verdicts factor in your monthly income, savings goals, and per-category budgets
- **Price Comparison** — automatically searches Google Shopping for the same product at lower prices
- **Budget Tracking** — 10 spending categories with monthly budget limits and spend tracking
- **Analysis History** — dashboard shows all past analyses and their verdicts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| AI / LLM | Groq (`llama-3.3-70b-versatile` + `compound-beta`) |
| Price Data | SerpAPI — Google Shopping |
| Web Scraping | Jina AI Reader |
| Storage | localStorage (client-side) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)
- A [SerpAPI key](https://serpapi.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/AnkithSVaidya/Financial-Tracking-Personal-Assistant.git
cd Financial-Tracking-Personal-Assistant/finwise

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your keys to .env
```

### Environment Variables

Create a `.env` file inside the `finwise/` folder:

```env
GROQ_API_KEY=your_groq_api_key
SERP_API_KEY=your_serpapi_key
```

### Run

```bash
npm run dev       # development server → http://localhost:3000
npm run build     # production build
npm start         # serve production build
```

---

## Project Structure

```
finwise/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── setup/page.tsx            # Onboarding — create financial profile
│   ├── dashboard/page.tsx        # Budget overview + analysis history
│   ├── analyze/page.tsx          # Product analysis (URL or image)
│   └── api/
│       ├── analyze-product/      # Scrape URL + generate verdict
│       ├── analyze-image/        # Analyze product image + generate verdict
│       └── compare-prices/       # SerpAPI price comparison
├── lib/
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── storage.ts                # localStorage helpers
│   └── utils.ts                  # Formatting + color utilities
```

---

## API Routes

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/analyze-product` | POST | `{ url, profile }` | `{ productInfo, verdict }` |
| `/api/analyze-image` | POST | `{ imageBase64, mimeType, profile }` | `{ productInfo, verdict }` |
| `/api/compare-prices` | POST | `{ productName, originalPrice }` | `{ alternatives[], message }` |

---

## Deployment

Deployed on Vercel. Set `GROQ_API_KEY` and `SERP_API_KEY` in your Vercel project's Environment Variables, with root directory set to `finwise/`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AnkithSVaidya/Financial-Tracking-Personal-Assistant)
