"use server";
/**
 * @fileOverview A flow to generate a textual sales recap from JSON data.
 *
 * - generateRecap - A function that handles the recap generation.
 * - GenerateRecapInput - The input type for the generateRecap function.
 * - GenerateRecapOutput - The return type for the generateRecap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateRecapInputSchema = z.object({
  data: z.string().describe("A JSON string representing an array of sales data objects."),
});
export type GenerateRecapInput = z.infer<typeof GenerateRecapInputSchema>;

export type GenerateRecapOutput = string;

export async function generateRecap(input: GenerateRecapInput): Promise<GenerateRecapOutput> {
  return generateRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecapPrompt',
  input: { schema: GenerateRecapInputSchema },
  prompt: `
    You are an expert financial analyst. Based on the following JSON data, create a concise and professional written report in Indonesian.

    The report should summarize key performance indicators. Highlight the store with the highest gross revenue ('Omset Kotor') and the one with the highest net profit ('Total Bersih').
    Also, provide a brief comparison between online and offline sales channels. Conclude with a short, actionable insight.

    Do not output JSON, only the text report. Keep it formal and structured.

    JSON Data:
    {{{data}}}
  `,
});

const generateRecapFlow = ai.defineFlow(
  {
    name: 'generateRecapFlow',
    inputSchema: GenerateRecapInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || "Gagal menghasilkan laporan.";
  }
);
