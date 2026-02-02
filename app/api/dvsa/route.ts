import { NextRequest, NextResponse } from "next/server";
import { fetchDvsaData } from "@/lib/dvsa";

export async function GET(req: NextRequest) {
  const vrm = req.nextUrl.searchParams.get("vrm")?.toUpperCase().replace(/\s+/g, '');
  if (!vrm) return NextResponse.json({ error: "Missing VRM" }, { status: 400 });

  const data = await fetchDvsaData(vrm);
  
  if (!data) {
    return NextResponse.json({ error: "Vehicle not found or API key missing" }, { status: 404 });
  }

  return NextResponse.json(data);
}
