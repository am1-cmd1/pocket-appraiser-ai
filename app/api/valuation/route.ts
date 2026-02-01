import { NextRequest, NextResponse } from "next/server";

const VALUATIONS: Record<string, number> = {
  "GJ21XOW": 12450,
  "MW71CVV": 28900,
  "FE22KLO": 19200,
  "LB73JKK": 54500
};

export async function GET(req: NextRequest) {
  const vrm = req.nextUrl.searchParams.get("vrm")?.toUpperCase().replace(/\s+/g, '');
  if (!vrm) return NextResponse.json({ error: "Missing VRM" }, { status: 400 });

  // Simulate valuation API delay
  await new Promise(r => setTimeout(r, 600));

  const retailValue = VALUATIONS[vrm] || 15000 + Math.floor(Math.random() * 10000);
  
  return NextResponse.json({
    retailValue,
    tradeValue: Math.floor(retailValue * 0.82),
    auctionValue: Math.floor(retailValue * 0.75),
    source: "AutoTrader Live Data (Simulated)"
  });
}
