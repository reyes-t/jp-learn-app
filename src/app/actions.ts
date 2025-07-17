"use server";

import { generateFlashcards as generateFlashcardsFlow } from "@/ai/flows/generate-flashcards";
import { summarizeGrammarPoints as summarizeGrammarPointsFlow } from "@/ai/flows/summarize-grammar-points";
import { generateExampleSentences as generateExampleSentencesFlow } from "@/ai/flows/generate-example-sentences";
import { generateSpeech as generateSpeechFlow } from "@/ai/flows/text-to-speech";

import type { GenerateFlashcardsInput } from "@/ai/flows/generate-flashcards";
import type { SummarizeGrammarPointsInput } from "@/ai/flows/summarize-grammar-points";
import type { GenerateExampleSentencesInput } from "@/ai/flows/generate-example-sentences";
import type { GenerateSpeechInput } from "@/ai/flows/text-to-speech";


export async function generateFlashcards(input: GenerateFlashcardsInput) {
    try {
        const result = await generateFlashcardsFlow(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error generating flashcards:", error);
        return { success: false, error: "Failed to generate flashcards." };
    }
}

export async function summarizeGrammarPoints(input: SummarizeGrammarPointsInput) {
    try {
        const result = await summarizeGrammarPointsFlow(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error summarizing grammar:", error);
        return { success: false, error: "Failed to summarize grammar point." };
    }
}

export async function generateExampleSentences(input: GenerateExampleSentencesInput) {
    try {
        const result = await generateExampleSentencesFlow(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error generating example sentences:", error);
        return { success: false, error: "Failed to generate examples." };
    }
}

export async function generateSpeech(input: GenerateSpeechInput) {
    try {
        const result = await generateSpeechFlow(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error generating speech:", error);
        return { success: false, error: "Failed to generate speech." };
    }
}
