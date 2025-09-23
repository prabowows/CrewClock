"use server";

import { validateCrewAddress, ValidateCrewAddressInput, ValidateCrewAddressOutput } from "@/ai/flows/validate-crew-address";

export async function validateAddressAction(input: ValidateCrewAddressInput): Promise<ValidateCrewAddressOutput> {
  try {
    const result = await validateCrewAddress(input);
    return result;
  } catch (error) {
    console.error("Error validating address:", error);
    return {
      isValid: false,
      standardizedAddress: "Error validating address. Please try again.",
    };
  }
}
