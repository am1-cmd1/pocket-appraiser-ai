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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an expert automotive damage appraiser for a UK body shop. Analyze this photo with precision.

## PANEL IDENTIFICATION (CRITICAL - BE ACCURATE)
First, determine WHICH PANEL of the car is shown. Use these visual clues:

**Front Bumper**: Plastic, often has grille/fog lights, number plate area, curved at corners
**Rear Bumper**: Plastic, has exhaust cutouts or reflectors, often has parking sensors
**Front Wing/Fender** (Left or Right): Metal panel between front wheel arch and door, contains indicator
**Rear Quarter Panel** (Left or Right): Metal panel behind rear doors, curves into wheel arch
**Door** (Front/Rear, Left/Right): Has handles, window frames, mirrors (front doors)
**Bonnet/Hood**: Large flat panel at front, has hinges at back, may have vents
**Boot/Trunk Lid**: Rear opening panel, has hinges, may have spoiler
**Roof**: Top horizontal panel
**Sill/Rocker Panel**: Lower panel below doors
**A/B/C Pillar**: Vertical structural posts between windows
**Wheel/Alloy**: If focusing on wheel, rim, or tire

Use EXACTLY one of these panel names: "Front Bumper", "Rear Bumper", "Front Left Wing", "Front Right Wing", "Rear Left Quarter", "Rear Right Quarter", "Front Left Door", "Front Right Door", "Rear Left Door", "Rear Right Door", "Bonnet", "Boot Lid", "Roof", "Left Sill", "Right Sill", "Left Mirror", "Right Mirror", "Front Left Wheel", "Front Right Wheel", "Rear Left Wheel", "Rear Right Wheel"

## DAMAGE ASSESSMENT
Identify damage type: Scratch, Dent, Scuff, Stone Chips, Crack, Corrosion, Paint Fade, Curbed Alloy
Severity: Minor (£50-150), Moderate (£150-400), Severe (£400+)

## STRUCTURAL CHECKS
- Panel gaps: OK or IRREGULAR (misaligned gaps suggest prior accident)
- Paint match: MATCH or MISMATCH (orange peel, overspray, color difference)
- Prior repair evidence: NONE or DETECTED

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "id": "SCAN-[random6chars]",
  "totalCost": [number in GBP],
  "defects": [
    {
      "id": 1,
      "part": "[EXACT panel name from list above]",
      "type": "[damage type]",
      "severity": "[Minor/Moderate/Severe]",
      "cost": [repair cost in GBP],
      "details": "[brief description of specific damage observed]"
    }
  ],
  "structural": {
    "gaps": "OK",
    "paint": "MATCH",
    "priorRepair": "NONE",
    "tireDepth": null,
    "warning": null
  },
  "recommendation": "[professional trade-in advice]",
  "localShops": [
    { "name": "SMART Repair London", "distance": "1.2 miles", "rating": 4.8, "priceMatch": "£[min]-£[max]", "availability": "Tomorrow", "specialty": "[relevant specialty]" }
  ]
}
`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    console.log("Gemini Raw Response:", text);
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("AI returned invalid JSON: " + text);
    }
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "AI Analysis failed" }, { status: 500 });
  }
}
