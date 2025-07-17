import { config } from 'dotenv';
config();

import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/generate-example-sentences.ts';
import '@/ai/flows/summarize-grammar-points.ts';
import '@/ai/flows/text-to-speech.ts';
