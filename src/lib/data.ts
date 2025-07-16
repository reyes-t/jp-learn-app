import type { Deck, Card, GrammarPoint, Quiz } from './types';

export const basicDecks: Deck[] = [
  {
    id: 'hiragana',
    name: 'Hiragana Basics',
    description: 'Master the fundamental Japanese syllabary.',
    cardCount: 46,
    isCustom: false,
    aiHint: 'hiragana chart'
  },
  {
    id: 'katakana',
    name: 'Katakana Practice',
    description: 'Learn the script used for foreign words.',
    cardCount: 46,
    isCustom: false,
    aiHint: 'katakana chart'
  },
  {
    id: 'n5-vocab',
    name: 'JLPT N5 Vocabulary',
    description: 'Essential words for beginner proficiency.',
    cardCount: 100,
    isCustom: false,
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
  {
    id: 'g-3',
    title: 'Possessive Particle 「の」 (no)',
    explanation: 'The particle 「の」 (no) is used to show possession, similar to "apostrophe s" in English. It links two nouns, where the first noun possesses or describes the second noun.',
    examples: [
      { japanese: 'これはわたしのペンです。', english: 'This is my pen. (Kore wa watashi no pen desu.)' },
      { japanese: 'さくらさんのかばんは大きいです。', english: 'Sakura\'s bag is big. (Sakura-san no kaban wa ookii desu.)' },
    ],
  },
    {
    id: 'g-4',
    title: 'Adjectives (い-Adjectives and な-Adjectives)',
    explanation: 'Japanese has two types of adjectives. い-adjectives end with い (like "ookii" - big). な-adjectives require な (na) when they come before a noun (like "kirei na hana" - beautiful flower).',
    examples: [
      { japanese: 'このラーメンはおいしいです。', english: 'This ramen is delicious. (Kono raamen wa oishii desu.)' },
      { japanese: 'しずかなへやがすきです。', english: 'I like quiet rooms. (Shizuka na heya ga suki desu.)' },
    ],
  },
  {
    id: 'g-5',
    title: 'Question Particle 「か」 (ka)',
    explanation: 'To turn a statement into a question, you simply add the particle 「か」 (ka) to the end of the sentence. The word order does not change, and a question mark is usually not necessary in formal writing.',
    examples: [
      { japanese: 'これはペンですか。', english: 'Is this a pen? (Kore wa pen desu ka.)' },
      { japanese: 'さとうさんはせんせいですか。', english: 'Is Mr. Sato a teacher? (Satou-san wa sensei desu ka.)' },
    ],
  }
];

export const quizzes: Quiz[] = [
    {
        id: 'q-1',
        title: 'Beginner Grammar Quiz',
        description: 'Test your knowledge of basic Japanese sentence structure.',
        questions: [
            { id: 'q1-1', question: 'Which particle is used to mark the topic of a sentence?', options: ['を (o)', 'が (ga)', 'は (wa)', 'に (ni)'], correctAnswer: 'は (wa)', explanation: '「は」 (wa) is the topic marker particle, indicating what the sentence is about.' },
            { id: 'q1-2', question: 'How do you say "I am a student" in polite Japanese?', options: ['Watashi wa gakusei da', 'Watashi wa gakusei desu', 'Watashi ga gakusei desu', 'Gakusei desu watashi wa'], correctAnswer: 'Watashi wa gakusei desu', explanation: '「です」 (desu) is the polite copula used at the end of a sentence to state what something is.' },
            { id: 'q1-3', question: 'What does「これ」 (kore) mean?', options: ['That (near you)', 'That (over there)', 'This', 'Where'], correctAnswer: 'This', explanation: '「これ」 (kore) means "this," referring to something close to the speaker.' },
            { id: 'q1-4', question: 'Which of the following is an い-adjective?', options: ['きれい (kirei)', 'しずか (shizuka)', 'げんき (genki)', 'おいしい (oishii)'], correctAnswer: 'おいしい (oishii)', explanation: 'い-adjectives end with the hiragana character い, like おいしい (delicious).' },
            { id: 'q1-5', question: 'How do you turn a statement into a question?', options: ['Add 「か」 (ka) to the end', 'Add 「ね」 (ne) to the end', 'Change the verb form', 'Reverse the word order'], correctAnswer: 'Add 「か」 (ka) to the end', explanation: 'Adding the particle 「か」 (ka) to the end of a declarative sentence turns it into a question.' },
        ]
    },
    {
        id: 'q-2',
        title: 'N5 Vocabulary Quiz',
        description: 'How well do you know the essential N5 words?',
        questions: [
            { id: 'q2-1', question: 'What is the Japanese word for "teacher"?', options: ['医者 (isha)', '学生 (gakusei)', '会社員 (kaishain)', '先生 (sensei)'], correctAnswer: '先生 (sensei)', explanation: '「先生」 (sensei) is the word for teacher. It can also be used as a title of respect for doctors, lawyers, and other professionals.' },
            { id: 'q2-2', question: 'The word 「ともだち」 (tomodachi) means:', options: ['Family', 'Friend', 'Coworker', 'Sibling'], correctAnswer: 'Friend', explanation: '「ともだち」 (tomodachi) is the common word for "friend".' },
            { id: 'q2-3', question: 'Which word means "to eat"?', options: ['のむ (nomu)', 'たべる (taberu)', 'かう (kau)', 'みる (miru)'], correctAnswer: 'たべる (taberu)', explanation: '「たべる」 (taberu) is the dictionary form of the verb "to eat".' },
        ]
    },
];
