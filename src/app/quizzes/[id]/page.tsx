
"use client";

import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { quizzes, grammarPoints, cards as initialCards, basicDecks } from '@/lib/data';
import type { Deck, Card as CardType, QuizQuestion, GrammarPoint } from '@/lib/types';

type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
const QUIZ_LENGTH = 10;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
};

// Generates a grammar question from a grammar point
const createGrammarQuestion = (point: GrammarPoint, isReview: boolean = false): QuizQuestion => {
    const randomExample = point.examples[Math.floor(Math.random() * point.examples.length)];
    const otherPoints = grammarPoints.filter(p => p.id !== point.id);
    const wrongAnswers = shuffleArray(otherPoints).slice(0, 3).map(p => p.title);
    const options = shuffleArray([point.title, ...wrongAnswers]);

    return {
        id: point.id,
        question: `Which grammar point is used in the sentence: "${randomExample.japanese}"?`,
        options,
        correctAnswer: point.title,
        explanation: point.explanation,
        isReview,
    };
};

// Generates a vocabulary question from a flashcard
const createVocabQuestion = (card: CardType, allCards: CardType[], isReview: boolean = false): QuizQuestion => {
    const isFrontQuestion = Math.random() > 0.5; // 50% chance to ask for the back, 50% for the front
    const otherCards = allCards.filter(c => c.id !== card.id);
    
    const getWrongAnswers = (correctAnswer: string) => {
        return shuffleArray(otherCards)
            .filter(c => (isFrontQuestion ? c.back : c.front) !== correctAnswer)
            .slice(0, 3)
            .map(c => isFrontQuestion ? c.back : c.front);
    };
    
    const questionText = isFrontQuestion ? `What is the meaning of "${card.front}"?` : `What is the word for "${card.back}"?`;
    const correctAnswer = isFrontQuestion ? card.back : card.front;
    const wrongAnswers = getWrongAnswers(correctAnswer);
    const options = shuffleArray([correctAnswer, ...wrongAnswers]);

    return {
        id: card.id,
        question: questionText,
        options,
        correctAnswer,
        explanation: `"${card.front}" means "${card.back}".`,
        isReview,
    };
};


export default function QuizPage() {
    const params = useParams();
    const quizId = params.id as string;

    const quizMeta = useMemo(() => quizzes.find((q) => q.id === quizId), [quizId]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
    const [lastIncorrectId, setLastIncorrectId] = useState<string | null>(null);


    useEffect(() => {
        if (!quizMeta) return;

        const incorrectStorageKey = `quiz_incorrect_${quizMeta.id}`;
        const lastIncorrectStorageKey = `quiz_last_incorrect_${quizMeta.id}`;

        const storedIncorrectIds: string[] = JSON.parse(localStorage.getItem(incorrectStorageKey) || '[]');
        const storedLastIncorrectId: string | null = localStorage.getItem(lastIncorrectStorageKey);
        
        let potentialQuestions: any[];
        let questionGenerator: (item: any, allItems: any[], isReview: boolean) => QuizQuestion;

        if (quizMeta.id === 'grammar') {
            potentialQuestions = grammarPoints;
            questionGenerator = (item, _, isReview) => createGrammarQuestion(item, isReview);
        } else { // vocabulary
            const userDecks: Deck[] = JSON.parse(localStorage.getItem('userDecks') || '[]');
            const vocabDecks = basicDecks.filter(d => d.id !== 'hiragana' && d.id !== 'katakana');
            const allDeckIds = [...vocabDecks.map(d => d.id), ...userDecks.map(d => d.id)];
            
            let allCards: CardType[] = [];
            allDeckIds.forEach(deckId => {
                const cardKey = `cards_${deckId}`;
                const storedCardsStr = localStorage.getItem(cardKey);
                if (storedCardsStr) {
                    allCards = [...allCards, ...JSON.parse(storedCardsStr)];
                } else {
                     // load initial cards if not in storage (for basic decks)
                    const deck = basicDecks.find(d => d.id === deckId);
                    if (deck) {
                        allCards = [...allCards, ...initialCards.filter(c => c.deckId === deckId)];
                    }
                }
            });
            potentialQuestions = allCards;
            questionGenerator = (item, allItems, isReview) => createVocabQuestion(item, allItems, isReview);
        }

        if (potentialQuestions.length === 0) {
            setSessionQuestions([]);
            return;
        }

        let questions: QuizQuestion[] = [];
        let firstQuestion: QuizQuestion | undefined;

        // 1. Find and create the guaranteed first question if it exists
        if (storedLastIncorrectId) {
            const firstQuestionItem = potentialQuestions.find(item => item.id === storedLastIncorrectId);
            if (firstQuestionItem) {
                firstQuestion = questionGenerator(firstQuestionItem, potentialQuestions, true);
            }
        }

        // 2. Filter out the first question item from the pool of other questions
        const remainingPotentialQuestions = potentialQuestions.filter(item => item.id !== storedLastIncorrectId);

        // 3. Prioritize other incorrect questions
        const incorrectItems = shuffleArray(remainingPotentialQuestions.filter(item => storedIncorrectIds.includes(item.id)));
        const otherItems = shuffleArray(remainingPotentialQuestions.filter(item => !storedIncorrectIds.includes(item.id)));

        // 4. Build the rest of the quiz
        const remainingQuizLength = firstQuestion ? QUIZ_LENGTH - 1 : QUIZ_LENGTH;
        const numIncorrect = Math.min(incorrectItems.length, Math.ceil(remainingQuizLength / 2));
        const numOther = remainingQuizLength - numIncorrect;
        
        const incorrectQuestions = incorrectItems.slice(0, numIncorrect).map(item => questionGenerator(item, potentialQuestions, true));
        const otherQuestions = otherItems.slice(0, numOther).map(item => questionGenerator(item, potentialQuestions, false));

        const generatedQuestions = shuffleArray([...incorrectQuestions, ...otherQuestions]);
        
        // 5. Combine and set the session questions
        if (firstQuestion) {
            questions = [firstQuestion, ...generatedQuestions];
        } else {
            questions = generatedQuestions;
        }

        setSessionQuestions(questions.slice(0, QUIZ_LENGTH));

    }, [quizMeta, quizId]);

    if (!quizMeta) {
        notFound();
    }

    const isQuizFinished = sessionQuestions.length > 0 && currentQuestionIndex >= sessionQuestions.length;
    const progress = sessionQuestions.length > 0 ? (currentQuestionIndex / sessionQuestions.length) * 100 : 0;
    const currentQuestion = sessionQuestions[currentQuestionIndex];

    const handleAnswerSelect = (option: string) => {
        if (answerStatus !== 'unanswered' || !currentQuestion) return;

        setSelectedAnswer(option);
        if (option === currentQuestion.correctAnswer) {
            setAnswerStatus('correct');
            setCorrectAnswersCount(c => c + 1);
        } else {
            setAnswerStatus('incorrect');
            setLastIncorrectId(currentQuestion.id);
        }
    };

    const handleNextQuestion = () => {
        setAnswerStatus('unanswered');
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const handleRestart = () => {
        // Just reload to regenerate the quiz
        window.location.reload();
    }
    
    const handleFinish = () => {
         const incorrectStorageKey = `quiz_incorrect_${quizMeta.id}`;
         const lastIncorrectStorageKey = `quiz_last_incorrect_${quizMeta.id}`;
         
         // Remove last incorrect ID from main incorrect list if it's there, to avoid duplication.
         const storedIncorrectIds: string[] = JSON.parse(localStorage.getItem(incorrectStorageKey) || '[]').filter(id => id !== lastIncorrectId);

         if (lastIncorrectId) {
            const updatedIncorrectIds = [...new Set([lastIncorrectId, ...storedIncorrectIds])];
            localStorage.setItem(incorrectStorageKey, JSON.stringify(updatedIncorrectIds));
            localStorage.setItem(lastIncorrectStorageKey, lastIncorrectId);
         } else {
            // If they finished without any new incorrect answers, clear the "last incorrect" flag.
            localStorage.removeItem(lastIncorrectStorageKey);
         }
    }

    if (sessionQuestions.length === 0 && quizMeta) {
         return (
             <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle>Not Enough Data</CardTitle></CardHeader>
                    <CardContent>
                        <p>There are not enough {quizMeta.id === 'grammar' ? 'lessons' : 'cards'} to generate a quiz.</p>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" asChild>
                            <Link href="/quizzes">Back to Quizzes</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
         )
    }

    if (isQuizFinished) {
        const score = Math.round((correctAnswersCount / sessionQuestions.length) * 100);
        
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Quiz Complete!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg mb-2">You scored</p>
                        <p className="text-6xl font-bold mb-4">{score}%</p>
                        
                        <div className="flex justify-around mt-4">
                            <div className="text-green-500">
                                <p className="font-bold text-2xl">{correctAnswersCount}</p>
                                <p>Correct</p>
                            </div>
                            <div className="text-red-500">
                                <p className="font-bold text-2xl">{sessionQuestions.length - correctAnswersCount}</p>
                                <p>Incorrect</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button onClick={handleRestart}>Try Again</Button>
                        <Button variant="outline" asChild>
                            <Link href="/quizzes" onClick={handleFinish}>Back to Quizzes</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }
    
    if (!currentQuestion) {
        return <div className="container mx-auto max-w-2xl">Loading quiz...</div>
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="mb-6">
                <Link
                    href="/quizzes"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to all quizzes
                </Link>
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold font-headline">{quizMeta.title}</h1>
                    <div className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {sessionQuestions.length}
                    </div>
                </div>
                <Progress value={progress} />
            </div>

            <Card>
                <CardContent className="p-6">
                     <div className="flex items-start gap-4 mb-6">
                        {currentQuestion.isReview && (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground" title="You've missed this question before.">
                                <History className="w-5 h-5" />
                                <span className="text-xs">Review</span>
                            </div>
                        )}
                        <p className="text-xl font-semibold flex-1">{currentQuestion.question}</p>
                    </div>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option) => {
                             const isSelected = selectedAnswer === option;
                             const isCorrect = currentQuestion.correctAnswer === option;
                             
                             let buttonVariant: "secondary" | "default" | "destructive" = "secondary";
                             if (answerStatus !== 'unanswered') {
                                if (isSelected && !isCorrect) {
                                    buttonVariant = 'destructive';
                                } else if (isCorrect) {
                                    buttonVariant = 'default';
                                }
                             }

                            return (
                                <Button
                                    key={option}
                                    className={cn("w-full justify-start h-auto py-3 text-left",
                                        answerStatus !== 'unanswered' && isCorrect && "bg-green-500 hover:bg-green-600",
                                    )}
                                    variant={buttonVariant}
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={answerStatus !== 'unanswered'}
                                >
                                    {option}
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {answerStatus !== 'unanswered' && (
                <Card className="mt-6 p-4">
                    <h3 className={cn("font-bold", answerStatus === 'correct' ? 'text-green-600' : 'text-destructive')}>
                        {answerStatus === 'correct' ? 'Correct!' : `Incorrect. The answer is: ${currentQuestion.correctAnswer}`}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-2">{currentQuestion.explanation}</p>
                </Card>
            )}

            {answerStatus !== 'unanswered' && (
                <div className="mt-6 text-right">
                    <Button onClick={handleNextQuestion}>Next Question</Button>
                </div>
            )}
        </div>
    );
}
