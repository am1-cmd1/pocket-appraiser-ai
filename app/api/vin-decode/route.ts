import { NextRequest, NextResponse } from "next/server";

interface VinResult {
  Variable: string;
  Value: string | null;
}

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get("vin")?.toUpperCase().replace(/\s+/g, '');
  
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "Invalid VIN - must be 17 characters" }, { status: 400 });
  }

  try {
    // Use free NHTSA VIN decoder API
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "VIN decode failed" }, { status: 500 });
    }

    const data = await res.json();
    const result = data.Results?.[0];

    if (!result || result.ErrorCode !== "0") {
      return NextResponse.json({ error: "VIN not found or invalid" }, { status: 404 });
    }

    // Extract the useful fields
    const decoded = {
      vin: vin,
      make: result.Make || null,
      model: result.Model || null,
      year: result.ModelYear || null,
      trim: result.Trim || null,
      bodyClass: result.BodyClass || null,
      vehicleType: result.VehicleType || null,
      driveType: result.DriveType || null,
      
      // Engine specs
      engine: {
        displacement: result.DisplacementL ? `${result.DisplacementL}L` : null,
        cylinders: result.EngineCylinders || null,
        configuration: result.EngineConfiguration || null,
        fuelType: result.FuelTypePrimary || null,
        horsepower: result.EngineHP || null,
        turbo: result.Turbo || null,
      },

      // Transmission
      transmission: {
        type: result.TransmissionStyle || null,
        speeds: result.TransmissionSpeeds || null,
      },

      // Dimensions
      dimensions: {
        doors: result.Doors || null,
        seats: result.Seats || null,
        gvwr: result.GVWR || null,
        wheelbase: result.WheelBaseShort || result.WheelBaseLong || null,
      },

      // Safety
      safety: {
        abs: result.ABS || null,
        airbags: result.AirBagLocFront || null,
        esc: result.ESC || null,
        tpms: result.TPMS || null,
        blindSpot: result.BlindSpotMon || null,
        laneDeparture: result.LaneDepartureWarning || null,
        forwardCollision: result.ForwardCollisionWarning || null,
        rearCamera: result.RearVisibilitySystem || null,
      },

      // Manufacturing
      manufacturing: {
        manufacturer: result.Manufacturer || null,
        plantCountry: result.PlantCountry || null,
        plantCity: result.PlantCity || null,
      },

      // EV specific
      electric: result.ElectrificationLevel !== "Not Applicable" ? {
        type: result.ElectrificationLevel || null,
        batteryKwh: result.BatteryKWh || null,
        chargerLevel: result.ChargerLevel || null,
        range: result.EVDriveUnit || null,
      } : null,

      source: "NHTSA vPIC API",
    };

    return NextResponse.json(decoded);
  } catch (error) {
    console.error("VIN Decode Error:", error);
    return NextResponse.json({ error: "VIN decode service unavailable" }, { status: 500 });
  }
}
