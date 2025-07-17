
"use server";

import { generateFlashcards as generateFlashcardsFlow } from "@/ai/flows/generate-flashcards";
import { summarizeGrammarPoints as summarizeGrammarPointsFlow } from "@/ai/flows/summarize-grammar-points";

import type { GenerateFlashcardsInput } from "@/ai/flows/generate-flashcards";
import type { SummarizeGrammarPointsInput } from "@/ai/flows/summarize-grammar-points";


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
