'use server';

/**
 * @fileOverview A flow to validate and standardize crew addresses using AI.
 *
 * - validateCrewAddress - A function that validates and standardizes a crew member's address.
 * - ValidateCrewAddressInput - The input type for the validateCrewAddress function.
 * - ValidateCrewAddressOutput - The return type for the validateCrewAddress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateCrewAddressInputSchema = z.object({
  address: z.string().describe('The address to validate and standardize.'),
});
export type ValidateCrewAddressInput = z.infer<typeof ValidateCrewAddressInputSchema>;

const ValidateCrewAddressOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the address is a valid address.'),
  standardizedAddress: z
    .string()
    .describe('The standardized version of the address.'),
});
export type ValidateCrewAddressOutput = z.infer<typeof ValidateCrewAddressOutputSchema>;

export async function validateCrewAddress(input: ValidateCrewAddressInput): Promise<ValidateCrewAddressOutput> {
  return validateCrewAddressFlow(input);
}

const validateCrewAddressPrompt = ai.definePrompt({
  name: 'validateCrewAddressPrompt',
  input: {schema: ValidateCrewAddressInputSchema},
  output: {schema: ValidateCrewAddressOutputSchema},
  prompt: `You are an address validation expert.  You will determine if the provided address is valid, and return a standardized version of it.

Address: {{{address}}} `,
});

const validateCrewAddressFlow = ai.defineFlow(
  {
    name: 'validateCrewAddressFlow',
    inputSchema: ValidateCrewAddressInputSchema,
    outputSchema: ValidateCrewAddressOutputSchema,
  },
  async input => {
    const {output} = await validateCrewAddressPrompt(input);
    return output!;
  }
);
