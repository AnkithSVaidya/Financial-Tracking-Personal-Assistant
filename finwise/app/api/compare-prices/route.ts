import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";
import { PriceAlternative } from "@/lib/types";

interface SerpShoppingResult {
  title: string;
  price?: string;
  extracted_price?: number;
  link?: string;
  product_link?: string;
  source?: string;
  thumbnail?: string;
  multiple_sources?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { productName, originalPrice }: { productName: string; originalPrice: number } =
      await req.json();

    if (!productName || !originalPrice) return NextResponse.json({ alternatives: [] });

    const data = await getJson({
      engine: "google_shopping",
      q: productName,
      api_key: process.env.SERP_API_KEY!,
      num: 20,
    });

    const shoppingResults: SerpShoppingResult[] = data.shopping_results ?? [];
    console.log("[compare-prices] query:", productName, "| raw keys:", Object.keys(data));
    console.log("[compare-prices] shopping_results count:", shoppingResults.length);
    if (shoppingResults.length > 0) {
      console.log("[compare-prices] first result:", JSON.stringify(shoppingResults[0]));
    }
    if (data.error) console.log("[compare-prices] serpapi error:", data.error);
    const priceRange = shoppingResults.map(r => r.extracted_price).filter(Boolean);
    console.log("[compare-prices] originalPrice:", originalPrice, "| price range in results:", Math.min(...priceRange as number[]), "-", Math.max(...priceRange as number[]));

    if (!shoppingResults.length) {
      return NextResponse.json({ alternatives: [], message: "This is already the best price we found" });
    }

    const alternatives: PriceAlternative[] = shoppingResults
      // Must have a real numeric price strictly cheaper than original
      .filter(
        (r) =>
          typeof r.extracted_price === "number" &&
          r.extracted_price > 0 &&
          r.extracted_price < originalPrice &&
          r.source &&
          // Must have some URL (direct link or Google product page)
          (r.link || r.product_link)
      )
      .slice(0, 12)
      // Deduplicate by source (keep cheapest per retailer)
      .reduce<SerpShoppingResult[]>((acc, item) => {
        const existing = acc.find((a) => a.source === item.source);
        if (!existing) {
          acc.push(item);
        } else if ((item.extracted_price ?? Infinity) < (existing.extracted_price ?? Infinity)) {
          acc[acc.indexOf(existing)] = item;
        }
        return acc;
      }, [])
      .sort((a, b) => (a.extracted_price ?? 0) - (b.extracted_price ?? 0))
      .slice(0, 4)
      .map((r) => ({
        retailer: r.source!,
        price: r.extracted_price!,
        // Prefer direct retailer link; fall back to Google product page
        url: r.link ?? r.product_link!,
        title: r.title,
        savings: Math.round((originalPrice - r.extracted_price!) * 100) / 100,
        thumbnail: r.thumbnail,
      }));

    const message =
      alternatives.length === 0
        ? "This is already the best price we found"
        : `Found ${alternatives.length} retailer${alternatives.length > 1 ? "s" : ""} with a lower price`;

    return NextResponse.json({ alternatives, message });
  } catch (err) {
    console.error("[compare-prices]", err);
    return NextResponse.json({ alternatives: [], error: "Price search failed" });
  }
}
