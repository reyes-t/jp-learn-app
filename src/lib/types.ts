
import { z } from 'zod';

export type Deck = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isCustom: boolean;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  srsLevel?: number;
  nextReview?: Date;
};

export type GrammarPoint = {
  id:string;
  title: string;
  level: 'N5' | 'N4';
  explanation: string;
  examples: {
    japanese: string;
    english: string;
  }[];
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  isReview?: boolean;
};

// This is for the metadata of the quiz, not the full quiz itself
export type QuizMeta = {
  id: 'grammar' | 'vocabulary' | 'listening' | 'creative-practice';
  title: string;
  description: string;
};

export type ListeningQuizQuestion = {
  id: string;
  kana: string;
  romaji: string;
  audioDataUri?: string;
};

export type GeneratedPhrase = {
  japanese: string;
  romaji: string;
  english: string;
};


// Types for Creative Practice Quiz (validatePhraseFlow)
export const ValidatePhraseInputSchema = z.object({
  conditions: z.array(z.string()).describe('A list of conditions or topics the phrase must satisfy (e.g., "Greetings", "Politeness", "Asking for directions").'),
  phrase: z.string().describe('The Japanese phrase submitted by the user.'),
});
export type ValidatePhraseInput = z.infer<typeof ValidatePhraseInputSchema>;

export const PhraseValidationResultSchema = z.object({
  isValid: z.boolean().describe('Whether the phrase is a correct and valid answer for the given conditions.'),
  reason: z.string().describe('A brief explanation of why the phrase is valid or invalid. Provide constructive feedback if invalid.'),
});
export type PhraseValidationResult = z.infer<typeof PhraseValidationResultSchema>;

export type CreativeChallenge = {
    id: string;
    conditions: string[];
};
