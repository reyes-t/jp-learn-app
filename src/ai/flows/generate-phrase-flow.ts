
'use server';
/**
 * @fileOverview An AI flow to generate a simple Japanese phrase.
 *
 * - generatePhrase - A function that returns a Japanese phrase for study.
 * - GeneratedPhrase - The return type for the generatePhrase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratedPhraseSchema = z.object({
  japanese: z.string().describe('A simple, beginner-friendly sentence in Japanese (using Kanji and Kana).'),
  romaji: z.string().describe('The romaji pronunciation of the Japanese sentence.'),
  english: z.string().describe('The English translation of the sentence.'),
});
export type GeneratedPhrase = z.infer<typeof GeneratedPhraseSchema>;

const generatePhrasePrompt = ai.definePrompt({
  name: 'generatePhrasePrompt',
  output: {schema: GeneratedPhraseSchema},
  prompt: `
    You are an AI assistant for a Japanese language learning app.
    Generate a single, simple, beginner-friendly Japanese sentence.
    The sentence should be something a tourist or a new learner (JLPT N5 level) would find useful.
    Provide the Japanese sentence, its romaji pronunciation, and the English translation.
    Do not use overly complex grammar or vocabulary.
  `,
});

const generatePhraseFlow = ai.defineFlow(
  {
    name: 'generatePhraseFlow',
    inputSchema: z.void(),
    outputSchema: GeneratedPhraseSchema,
  },
  async () => {
    const {output} = await generatePhrasePrompt();
    if (!output) {
      throw new Error('Failed to generate a phrase from the AI model.');
    }
    return output;
  }
);

export async function generatePhrase(): Promise<GeneratedPhrase> {
  return generatePhraseFlow();
}
