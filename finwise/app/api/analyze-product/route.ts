import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { UserProfile, ProductInfo, FinancialVerdict } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchWithJina(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: "text/plain", "X-Return-Format": "text" },
  });
  if (!res.ok) throw new Error("Failed to fetch page content");
  const text = await res.text();
  return text.slice(0, 6000);
}

async function extractProductInfo(content: string): Promise<ProductInfo> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Extract product information from this webpage content. Return ONLY valid JSON.

{
  "productName": "full product name",
  "price": number or null,
  "currency": "USD",
  "description": "1-2 sentence description",
  "category": one of: food_dining|groceries|clothing|travel|experiences|electronics|home_furniture|health_wellness|gifts|subscriptions|other,
  "imageUrl": "direct image URL if found or null",
  "brand": "brand name or null",
  "missingInfo": ["list of fields that are null/missing"]
}

Webpage content:
${content}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });
  return JSON.parse(res.choices[0].message.content!) as ProductInfo;
}

async function analyzeFinancially(
  product: ProductInfo,
  profile: UserProfile
): Promise<FinancialVerdict> {
  const cat = profile.categories.find((c) => c.id === product.category);
  const totalSpent = profile.categories.reduce((s, c) => s + c.currentSpent, 0);
  const remainingForSavings = profile.monthlySalary - totalSpent - profile.monthlySavingsGoal;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `You are a personal financial advisor. Analyze this purchase decision and return ONLY valid JSON.

USER FINANCIAL PROFILE:
- Monthly Income: $${profile.monthlySalary}
- Monthly Savings Goal: $${profile.monthlySavingsGoal}
- Total Spent This Month: $${totalSpent}
- Available After Savings: $${remainingForSavings}

CATEGORY: "${cat?.label || product.category}"
- Monthly Budget: $${cat?.monthlyBudget || 0}
- Already Spent: $${cat?.currentSpent || 0}
- Remaining: $${(cat?.monthlyBudget || 0) - (cat?.currentSpent || 0)}

PURCHASE:
- Product: ${product.productName}
- Price: $${product.price}
- Description: ${product.description}

USER PREFERENCES:
- Priority Category: ${profile.preferences.priorityCategory}
- Spending Style: ${profile.preferences.spendingStyle}
- Max Single Unplanned Purchase: $${profile.preferences.maxSinglePurchase}
- Financial Goal: ${profile.preferences.financialGoal}

Return JSON:
{
  "recommendation": "buy" or "consider" or "dont_buy",
  "confidence": 1-10,
  "summary": "one punchy sentence verdict",
  "reasoning": "2-3 sentences with specific numbers explaining why",
  "budgetImpact": "short statement about category budget impact",
  "savingsImpact": "short statement about savings goal impact",
  "warningFlags": ["any concern flags, can be empty array"]
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  return JSON.parse(res.choices[0].message.content!) as FinancialVerdict;
}

export async function POST(req: NextRequest) {
  try {
    const { url, profile }: { url: string; profile: UserProfile } = await req.json();

    const content = await fetchWithJina(url);
    const productInfo = await extractProductInfo(content);
    const verdict = await analyzeFinancially(productInfo, profile);

    return NextResponse.json({ productInfo, verdict });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
