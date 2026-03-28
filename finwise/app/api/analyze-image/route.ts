import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { UserProfile, ProductInfo, FinancialVerdict } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractFromImage(imageBase64: string, mimeType: string): Promise<ProductInfo> {
  const res = await groq.chat.completions.create({
    model: "llama-3.2-11b-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: "text",
            text: `Analyze this image carefully. It may be a product photo, price tag, or store shelf item.
Extract all visible information. Return ONLY valid JSON:

{
  "productName": "product name if visible, or best description",
  "price": number or null,
  "currency": "USD",
  "description": "what you see - product type, color, size, etc.",
  "category": one of: food_dining|groceries|clothing|travel|experiences|electronics|home_furniture|health_wellness|gifts|subscriptions|other,
  "brand": "brand/store name if visible or null",
  "imageUrl": null,
  "missingInfo": ["list what you couldn't determine"]
}`,
          },
        ],
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

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `You are a personal financial advisor. Analyze this purchase and return ONLY valid JSON.

USER: Monthly Income $${profile.monthlySalary}, Savings Goal $${profile.monthlySavingsGoal}/month, Spent This Month $${totalSpent}

CATEGORY "${cat?.label || product.category}": Budget $${cat?.monthlyBudget || 0}, Spent $${cat?.currentSpent || 0}

PURCHASE: ${product.productName} — $${product.price ?? "unknown"} — ${product.description}

STYLE: ${profile.preferences.spendingStyle}, Max unplanned purchase: $${profile.preferences.maxSinglePurchase}

Return JSON:
{
  "recommendation": "buy" or "consider" or "dont_buy",
  "confidence": 1-10,
  "summary": "one punchy sentence",
  "reasoning": "2-3 sentences with specific numbers",
  "budgetImpact": "category budget impact",
  "savingsImpact": "savings goal impact",
  "warningFlags": []
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
    const { imageBase64, mimeType, profile }: {
      imageBase64: string;
      mimeType: string;
      profile: UserProfile;
    } = await req.json();

    const productInfo = await extractFromImage(imageBase64, mimeType);
    const verdict = await analyzeFinancially(productInfo, profile);

    return NextResponse.json({ productInfo, verdict });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
