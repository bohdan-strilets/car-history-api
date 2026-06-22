import { VehicleSpecsPromptParams } from '@modules/vehicles';

export const buildVehicleSpecsPrompt = (params: VehicleSpecsPromptParams): string => {
  return `You are an automotive database expert with access to official manufacturer specifications.

IMPORTANT RULES:
- Return ONLY data from official manufacturer specifications for this EXACT model, year and generation
- If you are not 100% certain about a value, OMIT that field entirely
- Do NOT guess or estimate values
- Do NOT include fields you are uncertain about
- Return ONLY valid JSON, no explanation, no markdown, no comments

Vehicle:
- Brand: ${params.brand}
- Model: ${params.model}
- Year: ${params.year}
${params.generation ? `- Generation/Trim: ${params.generation}` : ''}
- Engine displacement: ${params.engineDisplacementCc}cc
- Fuel type: ${params.fuelType.join(', ')}

Return a JSON object with ONLY the fields you are certain about from this list:
{
  "engineCode": string,
  "enginePowerHp": number,
  "enginePowerKw": number,
  "torqueNm": number,
  "cylindersCount": number,
  "engineLayout": string (e.g. "INLINE", "V", "BOXER"),
  "turbo": boolean,
  "gearsCount": number,
  "fuelTankCapacity": number (liters),
  "cityConsumption": number (l/100km),
  "highwayConsumption": number (l/100km),
  "combinedConsumption": number (l/100km),
  "batteryCapacityKwh": number (only for hybrid/electric),
  "electricRangeKm": number (only for hybrid/electric),
  "accelerationSec": number (0-100 km/h),
  "topSpeedKmh": number,
  "lengthMm": number,
  "widthMm": number,
  "heightMm": number,
  "weightKg": number (curb weight),
  "wheelbaseMm": number,
  "groundClearanceMm": number,
  "trunkVolumeLiters": number,
  "numberOfDoors": number,
  "numberOfSeats": number,
  "airbagsCount": number,
  "euroStandard": string (e.g. "EURO 5", "EURO 6"),
  "ncapRating": number (1-5),
  "co2EmissionGKm": number,
  "tireSizeFront": string (e.g. "215/55R17"),
  "tireSizeRear": string
}`;
};
