import { NextRequest, NextResponse } from "next/server";

// Simulating the "Brain" of the Appraiser
export async function GET(req: NextRequest) {
  // In a real app, this would receive the image buffer and run it through Gemini Vision
  // For the prototype, we are "piping" the analysis I just performed.
  
  await new Promise(r => setTimeout(r, 1500)); // Simulate AI processing time

  const analysis = {
    id: "REPORT-8821",
    vehicle: "Blue Hatchback (Partial)",
    totalCost: 285,
    defects: [
      {
        id: 1,
        part: "Front Bumper (Lower)",
        type: "Deep Scuff / Paint Loss",
        severity: "Moderate",
        cost: 285,
        details: "Gouging detected on plastic substrate. Requires sanding, primer, and localized color match respray."
      }
    ],
    recommendation: "SMART Repair recommended. Damage is cosmetic only. No structural compromise to bumper mounting points detected.",
    localShops: [
      {
        name: "London SMART Repair",
        distance: "1.2 miles",
        rating: 4.8,
        priceMatch: "£250 - £290",
        availability: "Tomorrow",
        specialty: "Bumper Scuffs"
      },
      {
        name: "Fresh Mobile SMART Repairs",
        distance: "Mobile (Comes to you)",
        rating: 4.9,
        priceMatch: "£285 Fixed",
        availability: "Wed, 4 Feb",
        specialty: "Paint Match"
      },
      {
        name: "Axioma London",
        distance: "2.5 miles",
        rating: 4.7,
        priceMatch: "£270 Est.",
        availability: "Next Week",
        specialty: "Advanced Scuffs"
      }
    ]
  };

  return NextResponse.json(analysis);
}
