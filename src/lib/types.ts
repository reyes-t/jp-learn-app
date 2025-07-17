export type Deck = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isCustom: boolean;
  imageUrl?: string;
  aiHint?: string;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
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
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
};
