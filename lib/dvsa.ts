// DVSA MOT History API - OAuth 2.0 Client Credentials Flow

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.token;
  }

  const clientId = process.env.DVSA_CLIENT_ID;
  const clientSecret = process.env.DVSA_CLIENT_SECRET;
  const scope = process.env.DVSA_SCOPE;
  const tokenUrl = process.env.DVSA_TOKEN_URL;

  if (!clientId || !clientSecret || !scope || !tokenUrl) {
    console.error("DVSA OAuth credentials not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("DVSA Token Error:", res.status, errorText);
      return null;
    }

    const data = await res.json();
    
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return tokenCache.token;
  } catch (error) {
    console.error("DVSA Token Fetch Error:", error);
    return null;
  }
}

export async function fetchDvsaData(vrm: string) {
  const apiKey = process.env.DVSA_API_KEY;
  const accessToken = await getAccessToken();

  if (!accessToken || !apiKey) {
    console.error("DVSA API: Missing access token or API key");
    return null;
  }

  try {
    // New API endpoint
    const res = await fetch(
      `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(vrm)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("DVSA API Error:", res.status, errorText);
      return null;
    }

    const vehicle = await res.json();

    if (!vehicle) return null;

    const history: any[] = [];
    let mileageAnomaly = "NONE";
    let previousMileage = 0;

    if (vehicle.motTests) {
      const sortedTests = [...vehicle.motTests].sort(
        (a: any, b: any) =>
          new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime()
      );

      sortedTests.forEach((test: any) => {
        if (test.testResult === "PASSED") {
          const miles = parseInt(test.odometerValue);
          if (!isNaN(miles)) {
            if (previousMileage > 0 && miles < previousMileage) {
              mileageAnomaly = "DETECTED";
            }
            previousMileage = miles;
            history.push({
              date: test.completedDate.substring(0, 10),
              mileage: miles,
              result: test.testResult,
            });
          }
        }
      });
    }

    return {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.firstUsedDate
        ? parseInt(vehicle.firstUsedDate.substring(0, 4))
        : 2020,
      color: vehicle.primaryColour,
      fuel: vehicle.fuelType,
      motExpiry: vehicle.motTestExpiryDate,
      mileageHistory: history.reverse(),
      mileageAnomaly,
      source: "DVSA MOT History API",
    };
  } catch (error) {
    console.error("DVSA Fetch Error:", error);
    return null;
  }
}
