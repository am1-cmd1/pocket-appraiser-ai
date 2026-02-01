import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // In a production app, we would send this base64 string to:
    // 1. Google Gemini 1.5 Pro Vision API
    // 2. Or Anthropic Claude 3.5 Sonnet Vision
    
    // THE PROMPT WE WOULD SEND:
    // "Act as an automotive damage expert. Analyze this photo. 
    // Identify the panel, damage type, and severity. 
    // Return a JSON estimate for a UK SMART repair body shop."

    // To keep this prototype working instantly for you, we simulate the 
    // high-speed AI analysis and return a realistic response based on 
    // common car damage patterns.

    await new Promise(r => setTimeout(r, 1200));

    return NextResponse.json({
      id: "SCAN-" + Math.floor(Math.random() * 10000),
      totalCost: 195,
      defects: [
        {
          id: 1,
          part: "Front Bumper (Lower)",
          type: "Surface Scuff",
          severity: "Minor",
          cost: 195,
          details: "Clear coat abrasion detected. No structural damage."
        }
      ],
      recommendation: "Standard SMART repair. Buff and localized respray required.",
      localShops: [
        {
          name: "London SMART Repair",
          distance: "1.2 miles",
          rating: 4.8,
          priceMatch: "£180 - £210",
          availability: "Tomorrow",
          specialty: "Bumper Scuffs"
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
