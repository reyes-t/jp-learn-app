'use server';

/**
 * @fileOverview A flow to generate example sentences for given vocabulary.
 *
 * - generateExampleSentences - A function that generates example sentences for a given set of vocabulary words.
 * - GenerateExampleSentencesInput - The input type for the generateExampleSentences function.
 * - GenerateExampleSentencesOutput - The return type for the generateExampleSentences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExampleSentencesInputSchema = z.object({
  vocabulary: z.array(z.string()).describe('An array of vocabulary words in Japanese.'),
  deckName: z.string().describe('The name of the deck the vocabulary belongs to.'),
});
export type GenerateExampleSentencesInput = z.infer<
  typeof GenerateExampleSentencesInputSchema
>;

const GenerateExampleSentencesOutputSchema = z.object({
  sentences: z
    .array(z.string())
    .describe('An array of example sentences, each corresponding to a vocabulary word.'),
});
export type GenerateExampleSentencesOutput = z.infer<
  typeof GenerateExampleSentencesOutputSchema
>;

export async function generateExampleSentences(
  input: GenerateExampleSentencesInput
): Promise<GenerateExampleSentencesOutput> {
  return generateExampleSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExampleSentencesPrompt',
  input: {schema: GenerateExampleSentencesInputSchema},
  output: {schema: GenerateExampleSentencesOutputSchema},
  prompt: `You are a Japanese language teacher. You are helping a student learn vocabulary from their deck named "{{deckName}}".

  Generate one example sentence for each of the following vocabulary words. The example sentences should be natural and demonstrate the meaning of the word in context. The sentences should be in Japanese.

  Vocabulary:
  {{#each vocabulary}}- {{this}}\n{{/each}}

  Ensure that each sentence uses the corresponding vocabulary word.

  Your output should be an array of sentences, with each sentence corresponding to the vocabulary word in the input array.
  `,
});

const generateExampleSentencesFlow = ai.defineFlow(
  {
    name: 'generateExampleSentencesFlow',
    inputSchema: GenerateExampleSentencesInputSchema,
    outputSchema: GenerateExampleSentencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
