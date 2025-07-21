import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';


export const ai = genkit({
  plugins: [googleAI(),],
  // By setting a default model, we don't have to specify it on every call.
  model: 'googleai/gemini-2.0-flash',
});
