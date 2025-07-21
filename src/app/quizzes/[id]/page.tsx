
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';


type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
const GRAMMAR_QUIZ_LENGTH = 5;
const VOCAB_QUIZ_LENGTH = 10;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
};

// Generates a grammar question from a grammar point
const createGrammarQuestion = (point: GrammarPoint, isReview: boolean): QuizQuestion => {
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
const createVocabQuestion = (card: CardType, allCards: CardType[], isReview: boolean): QuizQuestion => {
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
    const [sessionQuestions, setSessionQuestions] = useState<(QuizQuestion & { weight: number })[]>([]);
    const [sessionQuestionUpdates, setSessionQuestionUpdates] = useState<Record<string, number>>({});


    useEffect(() => {
        if (!quizMeta) return;

        const weightsStorageKey = `quiz_weights_${quizMeta.id}`;
        const questionWeights: Record<string, number> = JSON.parse(localStorage.getItem(weightsStorageKey) || '{}');
        
        let potentialQuestionItems: any[];
        let questionGenerator: (item: any, allItems: any[], isReview: boolean) => QuizQuestion;
        const quizLength = quizMeta.id === 'grammar' ? GRAMMAR_QUIZ_LENGTH : VOCAB_QUIZ_LENGTH;

        if (quizMeta.id === 'grammar') {
            potentialQuestionItems = grammarPoints;
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
            potentialQuestionItems = allCards;
            questionGenerator = (item, allItems, isReview) => createVocabQuestion(item, allItems, isReview);
        }

        if (potentialQuestionItems.length === 0) {
            setSessionQuestions([]);
            return;
        }

        const weightedQuestions = potentialQuestionItems.map(item => ({
            item,
            weight: questionWeights[item.id] || 0
        }));

        // Sort by weight descending, then shuffle items with the same weight to add variety
        weightedQuestions.sort((a, b) => {
            if (b.weight !== a.weight) {
                return b.weight - a.weight;
            }
            return Math.random() - 0.5;
        });
        
        const generatedQuestions = weightedQuestions
            .slice(0, quizLength)
            .map(wq => ({
                ...questionGenerator(wq.item, potentialQuestionItems, wq.weight > 0),
                weight: wq.weight,
            }));
        
        setSessionQuestions(generatedQuestions);

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
            // Decrement weight for correct answer
            setSessionQuestionUpdates(prev => ({
                ...prev,
                [currentQuestion.id]: (prev[currentQuestion.id] || 0) - 1,
            }));
        } else {
            setAnswerStatus('incorrect');
            // Increment weight for incorrect answer
            setSessionQuestionUpdates(prev => ({
                ...prev,
                [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1,
            }));
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
         const weightsStorageKey = `quiz_weights_${quizMeta.id}`;
         const allWeights: Record<string, number> = JSON.parse(localStorage.getItem(weightsStorageKey) || '{}');
        
        Object.entries(sessionQuestionUpdates).forEach(([id, change]) => {
            const currentWeight = allWeights[id] || 0;
            const newWeight = Math.max(0, currentWeight + change); // Ensure weight doesn't go below 0
            allWeights[id] = newWeight;
        });

        localStorage.setItem(weightsStorageKey, JSON.stringify(allWeights));
        setCurrentQuestionIndex(prev => prev + 1); // Move to finished screen
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
        
        useEffect(() => {
            if (isQuizFinished && quizMeta) {
                const bestScoreKey = `quiz_best_score_${quizMeta.id}`;
                const bestScore = JSON.parse(localStorage.getItem(bestScoreKey) || '0');
                if (score > bestScore) {
                    localStorage.setItem(bestScoreKey, JSON.stringify(score));
                }
            }
        }, [isQuizFinished, score, quizMeta]);

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
                            <Link href="/quizzes">Back to Quizzes</Link>
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
                    <p className="text-xl font-semibold mb-2 flex items-center gap-2">
                        {currentQuestion.isReview && <History className="w-5 h-5 text-primary" title="You've missed this before"/>}
                        {currentQuestion.question}
                    </p>
                     <p className="text-xs text-muted-foreground font-mono mb-6">
                        Weight: {currentQuestion.weight}
                    </p>
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

            <div className="mt-6">
                {answerStatus !== 'unanswered' && (
                     <div className="text-right">
                         <Button onClick={currentQuestionIndex === sessionQuestions.length - 1 ? handleFinish : handleNextQuestion}>
                           {currentQuestionIndex === sessionQuestions.length - 1 ? 'Finish' : 'Next Question'}
                         </Button>
                     </div>
                )}
            </div>
             <Collapsible className="mt-8 border-t pt-4">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground group">
                    Debug Info
                    <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Card className="mt-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Session Question Weights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm font-mono space-y-2">
                                {sessionQuestions.map((q, index) => (
                                    <li key={q.id} className={cn("p-2 rounded", index === currentQuestionIndex && "bg-muted")}>
                                       <span className="font-bold">W: {q.weight}</span> - {q.question}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
