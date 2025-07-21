
'use server';
/**
 * @fileOverview An AI flow to validate a user-provided Japanese phrase against a set of conditions.
 *
 * - validatePhrase - A function that validates the phrase.
 */

import {ai} from '@/ai/genkit';
import {
  ValidatePhraseInputSchema,
  PhraseValidationResultSchema,
  type ValidatePhraseInput,
  type PhraseValidationResult,
} from '@/lib/types';


const validatePhrasePrompt = ai.definePrompt({
  name: 'validatePhrasePrompt',
  input: {schema: ValidatePhraseInputSchema},
  output: {schema: PhraseValidationResultSchema},
  prompt: `
    You are a Japanese language teacher evaluating a student's answer in a creative quiz.
    The student was given a set of conditions and submitted a Japanese phrase.
    Your task is to determine if the phrase is a valid answer.

    A phrase is considered valid if:
    1. It is grammatically correct Japanese.
    2. It logically and contextually satisfies ALL of the given conditions.

    Conditions:
    {{#each conditions}}
    - {{{this}}}
    {{/each}}

    Student's Answer: "{{{phrase}}}"

    Analyze the student's answer and determine if it meets the criteria.
    Provide your response in the requested JSON format.
    - If the answer is valid, set 'isValid' to true and provide a brief, encouraging reason.
    - If the answer is invalid (either grammatically incorrect or doesn't fit the conditions), set 'isValid' to false and provide a clear, helpful explanation for the student to learn from. Be specific about what is wrong.
  `,
});


const validatePhraseFlow = ai.defineFlow(
  {
    name: 'validatePhraseFlow',
    inputSchema: ValidatePhraseInputSchema,
    outputSchema: PhraseValidationResultSchema,
  },
  async (input) => {
    const {output} = await validatePhrasePrompt(input);
    if (!output) {
      throw new Error('Failed to get a validation result from the AI model.');
    }
    return output;
  }
);


export async function validatePhrase(input: ValidatePhraseInput): Promise<PhraseValidationResult> {
  return validatePhraseFlow(input);
}
