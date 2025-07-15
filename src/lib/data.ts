import type { Deck, Card, GrammarPoint, Quiz } from './types';

export const basicDecks: Deck[] = [
  {
    id: 'hiragana',
    name: 'Hiragana Basics',
    description: 'Master the fundamental Japanese syllabary.',
    cardCount: 46,
    isCustom: false,
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'hiragana chart'
  },
  {
    id: 'katakana',
    name: 'Katakana Practice',
    description: 'Learn the script used for foreign words.',
    cardCount: 46,
    isCustom: false,
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'katakana chart'
  },
  {
    id: 'n5-vocab',
    name: 'JLPT N5 Vocabulary',
    description: 'Essential words for beginner proficiency.',
    cardCount: 100,
    isCustom: false,
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'japanese vocabulary'
  },
];

export const userDecks: Deck[] = [
  {
    id: 'travel-phrases',
    name: 'Travel Phrases',
    description: 'Useful phrases for your trip to Japan.',
    cardCount: 25,
    isCustom: true,
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'japan travel'
  },
];

export const allDecks = [...basicDecks, ...userDecks];

export const cards: Card[] = [
  // Hiragana
  { id: 'h-1', deckId: 'hiragana', front: 'あ', back: 'a' },
  { id: 'h-2', deckId: 'hiragana', front: 'い', back: 'i' },
  { id: 'h-3', deckId: 'hiragana', front: 'う', back: 'u' },
  { id: 'h-4', deckId: 'hiragana', front: 'え', back: 'e' },
  { id: 'h-5', deckId: 'hiragana', front: 'お', back: 'o' },
  // Katakana
  { id: 'k-1', deckId: 'katakana', front: 'ア', back: 'a' },
  { id: 'k-2', deckId: 'katakana', front: 'イ', back: 'i' },
  { id: 'k-3', deckId: 'katakana', front: 'ウ', back: 'u' },
  // N5 Vocab
  { id: 'v-1', deckId: 'n5-vocab', front: '学校', back: 'School (gakkou)' },
  { id: 'v-2', deckId: 'n5-vocab', front: '先生', back: 'Teacher (sensei)' },
  // Travel
  { id: 't-1', deckId: 'travel-phrases', front: 'こんにちは', back: 'Hello (konnichiwa)' },
  { id: 't-2', deckId: 'travel-phrases', front: 'ありがとうございます', back: 'Thank you (arigatou gozaimasu)' },
  { id: 't-3', deckId: 'travel-phrases', front: 'これはいくらですか？', back: 'How much is this? (kore wa ikura desu ka?)' },
];

export const grammarPoints: GrammarPoint[] = [
  {
    id: 'g-1',
    title: 'AはBです (A wa B desu)',
    explanation: 'This is the most basic sentence structure in Japanese. It is used to state that "A is B". 「は」 (wa) is a topic particle, and 「です」 (desu) is a copula, similar to "is" or "am" or "are" in English.',
    examples: [
      { japanese: 'わたしはがくせいです。', english: 'I am a student. (Watashi wa gakusei desu.)' },
      { japanese: 'これはほんです。', english: 'This is a book. (Kore wa hon desu.)' },
    ],
  },
  {
    id: 'g-2',
    title: 'Verb Conjugation (ます-form)',
    explanation: 'The ます (masu) form is the polite, non-past form of a verb. It is commonly used in daily conversation. To form it, you typically change the final "u" sound of the dictionary form verb to an "i" and add ます. For example, "kau" (to buy) becomes "kaimasu".',
    examples: [
      { japanese: 'わたしはほんをかいます。', english: 'I buy a book. (Watashi wa hon o kaimasu.)' },
      { japanese: 'かれはすしをたべます。', english: 'He eats sushi. (Kare wa sushi o tabemasu.)' },
    ],
  },
];

export const quizzes: Quiz[] = [
    { id: 'q-1', title: 'Hiragana Challenge', description: 'Test your knowledge of the basic Hiragana characters.', questionCount: 20, deckId: 'hiragana' },
    { id: 'q-2', title: 'N5 Vocabulary Quiz', description: 'How well do you know the essential N5 words?', questionCount: 25, deckId: 'n5-vocab' },
];
