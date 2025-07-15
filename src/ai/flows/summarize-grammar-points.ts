// Summarize Grammar Points Flow
'use server';

/**
 * @fileOverview Summarizes Japanese grammar points for quick understanding.
 *
 * - summarizeGrammarPoints - A function that summarizes a given grammar point.
 * - SummarizeGrammarPointsInput - The input type for the summarizeGrammarPoints function.
 * - SummarizeGrammarPointsOutput - The return type for the summarizeGrammarPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeGrammarPointsInputSchema = z.object({
  grammarPoint: z.string().describe('The Japanese grammar point to summarize.'),
});
export type SummarizeGrammarPointsInput = z.infer<typeof SummarizeGrammarPointsInputSchema>;

const SummarizeGrammarPointsOutputSchema = z.object({
  summary: z.string().describe('A simplified summary of the grammar point.'),
});
export type SummarizeGrammarPointsOutput = z.infer<typeof SummarizeGrammarPointsOutputSchema>;

export async function summarizeGrammarPoints(input: SummarizeGrammarPointsInput): Promise<SummarizeGrammarPointsOutput> {
  return summarizeGrammarPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeGrammarPointsPrompt',
  input: {schema: SummarizeGrammarPointsInputSchema},
  output: {schema: SummarizeGrammarPointsOutputSchema},
  prompt: `You are an expert Japanese language teacher. Please provide a simplified summary of the following grammar point:

  {{grammarPoint}}
  `,
});

const summarizeGrammarPointsFlow = ai.defineFlow(
  {
    name: 'summarizeGrammarPointsFlow',
    inputSchema: SummarizeGrammarPointsInputSchema,
    outputSchema: SummarizeGrammarPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
