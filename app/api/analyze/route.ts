import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ 
            error: "Gemini API Key missing. Please add GEMINI_API_KEY to your Vercel environment variables." 
        }, { status: 500 });
    }

    // Convert base64 to parts for Gemini
    const base64Data = image.split(",")[1];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Act as a professional automotive damage appraiser for a high-end UK body shop specializing in SMART repairs.
      Analyze this photo of car damage with extreme precision. 
      
      Look for these specific "Pro" indicators of hidden damage:
      1. Panel Gap Irregularities: Are gaps between 3mm-5mm? Is there tapering (widening/narrowing) or asymmetry between sides?
      2. Paint Surface Anomalies: Look for orange peel texture mismatch, overspray on rubber seals/trim, sanding marks under the clear coat, or hard tape lines in jambs.
      3. Structural Red Flags: Check for bolt head scoring (paint chips on wing/hood bolts), inner wing ripples, or non-factory welds (MIG beads vs circular spot welds).

      Identify:
      1. The specific car panel. Use standard terms: Front, Rear, Left Side, Right Side, Front Left, Front Right, Rear Left, Rear Right.
      2. The type of damage (Scratch, Dent, Scuff, Chip).
      3. The severity (Minor, Moderate, Severe).
      4. Structural Integrity Check:
         - Panel Gap Alignment: (OK | IRREGULAR)
         - Paint Depth Match: (MATCH | MISMATCH)
         - Prior Repair: (NONE | DETECTED)
      5. Provide a realistic estimate for the repair cost in GBP (British Pounds) based on UK labor rates.
      
      IMPORTANT: You must return ONLY a JSON object with this exact structure:
      {
        "id": "SCAN-unique_id",
        "totalCost": number,
        "defects": [
          {
            "id": 1,
            "part": "string",
            "type": "string",
            "severity": "string",
            "cost": number,
            "details": "string"
          }
        ],
        "structural": {
           "gaps": "OK | IRREGULAR",
           "paint": "MATCH | MISMATCH",
           "priorRepair": "NONE | DETECTED",
           "warning": "string (A detailed pro-level warning if issues detected, mentioning specific red flags like 'tapering gaps' or 'overspray detected on trim')"
        },
        "recommendation": "string",
        "localShops": [
           { "name": "London SMART Repair", "distance": "1.2 miles", "rating": 4.8, "priceMatch": "£X - £Y", "availability": "Tomorrow", "specialty": "Bumper Scuffs" }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "AI Analysis failed" }, { status: 500 });
  }
}
