'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating flashcards from a given topic.
 *
 * The flow takes a topic as input and returns a list of flashcards related to that topic.
 * It uses a prompt to instruct the LLM to generate flashcards in a specific format.
 *
 * @interface GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * @interface GenerateFlashcardsOutput - The output type for the generateFlashcards function.
 * @function generateFlashcards - The main function to generate flashcards from a topic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate flashcards.'),
  numberOfFlashcards: z.number().default(5).describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().describe('The front side of the flashcard.'),
      back: z.string().describe('The back side of the flashcard.'),
    })
  ).describe('A list of flashcards generated for the given topic.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const generateFlashcardsPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are a flashcard generator. Generate {{numberOfFlashcards}} flashcards for the topic "{{topic}}".

  Each flashcard should have a "front" and a "back". The "front" should contain a question or a term, and the "back" should contain the answer or definition.

  The output should be a JSON object with a single field called "flashcards", which is an array of flashcard objects.
  Each flashcard object should have a "front" and "back" field.

  Example:
  {
    "flashcards": [
      {
        "front": "What is the capital of Japan?",
        "back": "Tokyo"
      },
      {
        "front": "What is the highest mountain in Japan?",
        "back": "Mount Fuji"
      }
    ]
  }`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await generateFlashcardsPrompt(input);
    return output!;
  }
);
