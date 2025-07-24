
"use client";

import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { quizzes, grammarPoints, cards as initialCards, basicDecks, listeningSentences, creativeChallenges } from '@/lib/data';
import type { Deck, Card as CardType, QuizQuestion, GrammarPoint, ListeningQuizQuestion, GrammarPointExample, QuizMeta } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ListeningQuiz } from '@/components/listening-quiz';


type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
const GRAMMAR_QUIZ_LENGTH = 10;
const VOCAB_QUIZ_LENGTH = 10;
const LISTENING_QUIZ_LENGTH = 10;
const REVIEW_QUIZ_LENGTH = 10;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

// Generates a grammar question from a grammar point
const createGrammarQuestion = (point: GrammarPoint, allPoints: GrammarPoint[], isReview: boolean): QuizQuestion => {
    const randomExample = point.examples[Math.floor(Math.random() * point.examples.length)];
    
    // Get wrong options from other grammar points, ensuring they are unique and not the correct answer
    const otherOptions = allPoints
        .filter(p => p.id !== point.id)
        .flatMap(p => p.examples.map(ex => ex.answer))
        .filter(opt => opt !== randomExample.answer);

    const wrongAnswers = shuffleArray([...new Set(otherOptions)]).slice(0, 3);
    const options = shuffleArray([randomExample.answer, ...wrongAnswers]);
    const explanation = `${point.title}: ${point.explanation}\nExample: ${randomExample.sentence} (${randomExample.translation})`;


    return {
        id: point.id, // Use the grammar point ID for consistent weighting
        question: `Fill in the blank: ${randomExample.question}`,
        options,
        correctAnswer: randomExample.answer,
        explanation,
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
        explanation: `The correct answer is "${correctAnswer}". "${card.front}" means "${card.back}".`,
        isReview,
    };
};


export default function QuizPage() {
    const params = useParams();
    const quizId = params.id as string;

    const quizMeta = useMemo(() => quizzes.find((q) => q.id === quizId), [quizId]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState<(QuizQuestion & { weight: number })[]>([]);
    const [listeningSessionQuestions, setListeningSessionQuestions] = useState<(ListeningQuizQuestion & { weight: number, isReview: boolean })[]>([]);
    const [sessionQuestionUpdates, setSessionQuestionUpdates] = useState<Record<string, number>>({});


    useEffect(() => {
        if (!quizMeta) return;

        if (quizMeta.type === 'review') {
            const potentialReviewItems: {
                item: any;
                weight: number;
                type: string;
                originalQuizId: string;
            }[] = [];

            const allWeightsKeys = quizzes
                .filter(q => q.type !== 'review')
                .map(q => ({ storageKey: `quiz_weights_${q.id}`, type: q.type, quizId: q.id }));

            for (const { storageKey, type, quizId } of allWeightsKeys) {
                const weights: Record<string, number> = JSON.parse(localStorage.getItem(storageKey) || '{}');
                const incorrectEntries = Object.entries(weights).filter(([, w]) => w > 0);

                let sourceItems: any[] = [];
                let itemFinder: (id: string) => any = () => null;

                if (type === 'grammar') {
                    sourceItems = grammarPoints;
                    itemFinder = (id) => sourceItems.find(p => p.id === id);
                } else if (type === 'vocabulary') {
                    const vocabDeckId = quizId === 'vocabulary-n5' ? 'n5-vocab' : 'n4-vocab';
                    const targetDeck = basicDecks.find(d => d.id === vocabDeckId);
                     if (targetDeck) {
                        const cardKey = `cards_${targetDeck.id}`;
                        const storedCardsStr = localStorage.getItem(cardKey);
                        sourceItems = storedCardsStr ? JSON.parse(storedCardsStr) : initialCards.filter(c => c.deckId === targetDeck.id);
                        itemFinder = (id) => sourceItems.find((c: CardType) => c.id === id);
                    }
                }
                // Note: Listening and Creative are not included in this logic as they are handled separately
                // or might not have a "similar question" concept that fits this model.

                incorrectEntries.forEach(([id, weight]) => {
                    const item = itemFinder(id);
                    if (item) {
                        // Add the original incorrect item
                        potentialReviewItems.push({ item, weight, type, originalQuizId: quizId });
                        // Add a "similar" item. For grammar and vocab, re-adding the source item
                        // allows the generator function to create a different question from it.
                        potentialReviewItems.push({ item, weight, type, originalQuizId: quizId });
                    }
                });
            }

            // Shuffle the potential items before slicing to get variation
            const shuffledItems = shuffleArray(potentialReviewItems);

            const reviewQuestions = shuffledItems
                .slice(0, REVIEW_QUIZ_LENGTH)
                .map(({ item, weight, type, originalQuizId }) => {
                    let question: QuizQuestion;
                    if (type === 'grammar') {
                        question = createGrammarQuestion(item, grammarPoints, true);
                    } else { // vocabulary
                        const cardKey = `cards_${item.deckId}`;
                        const allCards = JSON.parse(localStorage.getItem(cardKey) || '[]');
                        question = createVocabQuestion(item, allCards, true);
                    }
                    return {
                        ...question,
                        weight,
                        quizType: type as QuizMeta['type'],
                        originalQuizId,
                    };
                });

            setSessionQuestions(reviewQuestions);
            setIsLoading(false);
            return;
        }

        const weightsStorageKey = `quiz_weights_${quizMeta.id}`;
        const questionWeights: Record<string, number> = JSON.parse(localStorage.getItem(weightsStorageKey) || '{}');
        
        let potentialQuestionItems: any[];
        let questionGenerator: (item: any, allItems: any[], isReview: boolean) => QuizQuestion;
        let quizLength: number;
        let allItemsForGenerator: any[] = [];

        if (quizMeta.type === 'grammar') {
            potentialQuestionItems = grammarPoints.filter(p => p.level === quizMeta.level);
            allItemsForGenerator = grammarPoints;
            questionGenerator = (item, allItems, isReview) => createGrammarQuestion(item, allItems, isReview);
            quizLength = GRAMMAR_QUIZ_LENGTH;
        } else if (quizMeta.type === 'vocabulary') { 
            const userDecks: Deck[] = JSON.parse(localStorage.getItem('userDecks') || '[]');
            const vocabDeckId = quizMeta.level === 'N5' ? 'n5-vocab' : 'n4-vocab';
            
            const targetDeck = [...basicDecks, ...userDecks].find(d => d.id === vocabDeckId);
            
            let allCards: CardType[] = [];
            if (targetDeck) {
                const cardKey = `cards_${targetDeck.id}`;
                const storedCardsStr = localStorage.getItem(cardKey);
                if (storedCardsStr) {
                    allCards = JSON.parse(storedCardsStr);
                } else {
                    allCards = initialCards.filter(c => c.deckId === targetDeck.id);
                }
            }
            
            potentialQuestionItems = allCards;
            allItemsForGenerator = allCards;
            questionGenerator = (item, allItems, isReview) => createVocabQuestion(item, allItems, isReview);
            quizLength = VOCAB_QUIZ_LENGTH;
        } else if (quizMeta.type === 'listening') {
            potentialQuestionItems = listeningSentences.filter(s => s.level === quizMeta.level);
            quizLength = LISTENING_QUIZ_LENGTH;
            
            const weightedQuestions = potentialQuestionItems.map(item => ({
                item,
                weight: questionWeights[item.id] || 0
            }));

            weightedQuestions.sort((a, b) => {
                if (b.weight !== a.weight) return b.weight - a.weight;
                return Math.random() - 0.5;
            });
            
            const generatedListeningQuestions = weightedQuestions
                .slice(0, quizLength)
                .map(wq => ({
                    ...wq.item,
                    weight: wq.weight,
                    isReview: wq.weight > 0
                }));
            setListeningSessionQuestions(generatedListeningQuestions);
            setIsLoading(false);
            return;
        }
        else {
            // Should not happen for this page, but as a fallback
            setSessionQuestions([]);
            setIsLoading(false);
            return;
        }

        if (potentialQuestionItems.length === 0) {
            setSessionQuestions([]);
            setIsLoading(false);
            return;
        }

        const weightedQuestions = potentialQuestionItems.map(item => ({
            item,
            id: item.id,
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
                ...questionGenerator(wq.item, allItemsForGenerator, wq.weight > 0),
                weight: wq.weight,
            }));
        
        setSessionQuestions(generatedQuestions);
        setIsLoading(false);

    }, [quizMeta, quizId]);

    const isQuizFinished = sessionQuestions.length > 0 && currentQuestionIndex >= sessionQuestions.length;
    const progress = sessionQuestions.length > 0 ? (currentQuestionIndex / sessionQuestions.length) * 100 : 0;
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    
    useEffect(() => {
        if (isQuizFinished && quizMeta && quizMeta.type !== 'review') {
            const score = Math.round((correctAnswersCount / sessionQuestions.length) * 100);
            const bestScoreKey = `quiz_best_score_${quizMeta.id}`;
            const bestScore = JSON.parse(localStorage.getItem(bestScoreKey) || '0');
            if (score > bestScore) {
                localStorage.setItem(bestScoreKey, JSON.stringify(score));
            }
        }
    }, [isQuizFinished, quizMeta, correctAnswersCount, sessionQuestions.length]);


    const handleAnswerSelect = (option: string) => {
        if (answerStatus !== 'unanswered' || !currentQuestion) return;

        setSelectedAnswer(option);
        if (option === currentQuestion.correctAnswer) {
            setAnswerStatus('correct');
            setCorrectAnswersCount(c => c + 1);
            // Decrement weight for correct answer
            setSessionQuestionUpdates(prev => ({
                ...prev,
                [currentQuestion.id]: (prev[currentQuestion.id] ?? currentQuestion.weight) - 1,
            }));
        } else {
            setAnswerStatus('incorrect');
            // Increment weight for incorrect answer
            setSessionQuestionUpdates(prev => ({
                ...prev,
                [currentQuestion.id]: (prev[currentQuestion.id] ?? currentQuestion.weight) + 1,
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
        if (!quizMeta) return;

        if (quizMeta.type === 'review') {
             // Update weights across all original quizzes
            const allWeightsUpdates: Record<string, Record<string, number>> = {};
            
            sessionQuestions.forEach(q => {
                if (q.originalQuizId) {
                    if (!allWeightsUpdates[q.originalQuizId]) {
                        allWeightsUpdates[q.originalQuizId] = {};
                    }
                    // This calculates the final weight after the session's answers
                    const finalWeightInSession = sessionQuestionUpdates[q.id] ?? q.weight;
                    // The change is the difference from the original weight
                    const change = finalWeightInSession - q.weight;
                    allWeightsUpdates[q.originalQuizId][q.id] = (allWeightsUpdates[q.originalQuizId][q.id] || 0) + change;
                }
            });

            Object.entries(allWeightsUpdates).forEach(([originalQuizId, updates]) => {
                const storageKey = `quiz_weights_${originalQuizId}`;
                const allWeights: Record<string, number> = JSON.parse(localStorage.getItem(storageKey) || '{}');
                Object.entries(updates).forEach(([id, change]) => {
                    const currentWeight = allWeights[id] || 0;
                    const newWeight = Math.max(0, currentWeight + change);
                    allWeights[id] = newWeight;
                });
                localStorage.setItem(storageKey, JSON.stringify(allWeights));
            });
        } else {
            const weightsStorageKey = `quiz_weights_${quizMeta.id}`;
            const allWeights: Record<string, number> = JSON.parse(localStorage.getItem(weightsStorageKey) || '{}');
            
            Object.entries(sessionQuestionUpdates).forEach(([id, newWeight]) => {
                allWeights[id] = Math.max(0, newWeight);
            });
    
            localStorage.setItem(weightsStorageKey, JSON.stringify(allWeights));
        }
        
        setCurrentQuestionIndex(prev => prev + 1); // Move to finished screen
    }

    if (isLoading) {
        return <div className="container mx-auto max-w-2xl text-center p-8">Loading quiz...</div>;
    }

    if (!quizMeta) {
        return <div className="container mx-auto max-w-2xl">Something went wrong.</div>; 
    }

    if (quizMeta.type === 'listening') {
        return <ListeningQuiz quizMeta={quizMeta} questions={listeningSessionQuestions} />;
    }

    if (sessionQuestions.length === 0) {
         return (
             <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle>{quizMeta.type === 'review' ? "All Caught Up!" : "Not Enough Data"}</CardTitle></CardHeader>
                    <CardContent>
                        <p>{
                            quizMeta.type === 'review' 
                                ? "You have no incorrect questions to review. Great job!" 
                                : `There are not enough ${quizMeta.type === 'grammar' ? 'lessons' : 'cards'} to generate a quiz.`
                        }</p>
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
                    <h1 className="text-2xl font-bold font-headline">{quizMeta.title} {quizMeta.level}</h1>
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
                    <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap">{currentQuestion.explanation}</p>
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
                                    <li key={q.id + index} className={cn("p-2 rounded", index === currentQuestionIndex && "bg-muted")}>
                                       <span className="font-bold">W: {sessionQuestionUpdates[q.id] ?? q.weight} ({q.id})</span> - {q.question}
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

    