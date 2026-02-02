export async function fetchDvsaData(vrm: string) {
  const apiKey = process.env.DVSA_API_KEY;

  if (!apiKey || apiKey === "replace_with_real_key") {
    return null;
  }

  try {
    const res = await fetch(`https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests?registration=${vrm}`, {
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!res.ok) return null;

    const data = await res.json();
    const vehicle = data[0];

    if (!vehicle) return null;

    const history: any[] = [];
    let mileageAnomaly = "NONE";
    let previousMileage = 0;

    if (vehicle.motTests) {
      const sortedTests = [...vehicle.motTests].sort((a: any, b: any) => 
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
              result: test.testResult
            });
          }
        }
      });
    }

    return {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.firstUsedDate ? parseInt(vehicle.firstUsedDate.substring(0, 4)) : 2020,
      color: vehicle.primaryColour,
      fuel: vehicle.fuelType,
      motExpiry: vehicle.motTestExpiryDate,
      mileageHistory: history.reverse(),
      mileageAnomaly,
      source: "DVSA Real-Time API"
    };

  } catch (error) {
    console.error("DVSA Fetch Error:", error);
    return null;
  }
}
