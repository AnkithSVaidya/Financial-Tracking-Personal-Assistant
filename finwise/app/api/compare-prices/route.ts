import { NextRequest, NextResponse } from "next/server";
import { PriceAlternative } from "@/lib/types";
import { isApprovedRetailer } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { productName, originalPrice }: { productName: string; originalPrice: number } =
      await req.json();

    const res = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: productName, gl: "us", hl: "en", num: 20 }),
    });

    if (!res.ok) {
      return NextResponse.json({ alternatives: [] });
    }

    const data = await res.json();
    const items: PriceAlternative[] = [];

    if (data.shopping) {
      for (const item of data.shopping) {
        const source: string = item.source || "";
        if (!isApprovedRetailer(source)) continue;

        const priceStr: string = item.price || "";
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        if (isNaN(price) || price <= 0) continue;

        const savings = originalPrice > 0 ? originalPrice - price : 0;

        items.push({
          retailer: source,
          price,
          url: item.link || "#",
          title: item.title || productName,
          savings: Math.round(savings * 100) / 100,
        });

        if (items.length >= 5) break;
      }
    }

    items.sort((a, b) => a.price - b.price);

    return NextResponse.json({ alternatives: items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ alternatives: [] });
  }
}
