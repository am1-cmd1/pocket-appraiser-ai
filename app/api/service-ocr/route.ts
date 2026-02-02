import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
    }

    const base64Data = image.split(",")[1];
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an expert automotive document analyst. Analyze this photo of a vehicle service book (stamps and handwriting).

Extract the service records visible in the image.

For each stamp/entry, identify:
1. Date of service (Month Year)
2. Mileage
3. Service Type (Oil Service, Inspection I/II, Major, Minor, Brake Fluid, etc. - Infer from checkboxes or text)
4. Dealer/Garage Name (From the stamp logo or text)

Also provide an overall "Service Score" (0-5 based on completeness and regularity) and a "Status" (FULL SERVICE HISTORY, PART SERVICE HISTORY, or NO HISTORY).

Return ONLY valid JSON in this format:
{
  "score": "4.8/5",
  "status": "FULL SERVICE HISTORY",
  "records": [
    { "date": "Oct 2023", "miles": "12,500", "type": "Oil Service", "dealer": "Main Dealer London" },
    ...
  ]
}
If specific fields are unreadable, put "?". Sort records newest to oldest.
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
    console.log("Gemini OCR Response:", text);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("AI returned invalid JSON: " + text);
    }
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return NextResponse.json({ error: "OCR Analysis failed" }, { status: 500 });
  }
}
