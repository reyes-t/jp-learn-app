
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
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, writeBatch, where } from 'firebase/firestore';


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
    const { user } = useAuth();

    const quizMeta = useMemo(() => quizzes.find((q) => q.id === quizId), [quizId]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState<(QuizQuestion & { weight: number, originalQuizId?: string })[]>([]);
    const [listeningSessionQuestions, setListeningSessionQuestions] = useState<(ListeningQuizQuestion & { weight: number, isReview: boolean })[]>([]);
    const [sessionQuestionUpdates, setSessionQuestionUpdates] = useState<Record<string, { change: number, originalQuizId?: string }>>({});


    useEffect(() => {
        if (!quizMeta || !user) return;

        const generateQuiz = async () => {

            if (quizMeta.type === 'review') {
                const potentialReviewItems: {
                    item: any;
                    weight: number;
                    type: string;
                    originalQuizId: string;
                }[] = [];

                const quizDataCol = collection(db, "users", user.uid, "quizData");
                const quizDataSnap = await getDocs(quizDataCol);

                for (const doc of quizDataSnap.docs) {
                    const data = doc.data();
                    const originalQuizId = doc.id;
                    const originalQuizMeta = quizzes.find(q => q.id === originalQuizId);
                    if (!originalQuizMeta || !data.weights) continue;
                    
                    const incorrectEntries = Object.entries(data.weights).filter(([, w]) => (w as number) > 0);
                    
                    let sourceItems: any[] = [];
                    let itemFinder: (id: string) => any = () => null;
                    let allSourceItemsForSimilar: any[] = [];

                    if (originalQuizMeta.type === 'grammar') {
                        sourceItems = grammarPoints;
                        allSourceItemsForSimilar = grammarPoints;
                        itemFinder = (id) => sourceItems.find(p => p.id === id);
                    } else if (originalQuizMeta.type === 'vocabulary') {
                        const vocabDeckId = originalQuizId === 'vocabulary-n5' ? 'n5-vocab' : 'n4-vocab';
                        const cardsColRef = collection(db, "users", user.uid, "decks", vocabDeckId, "cards");
                        const cardsSnap = await getDocs(cardsColRef);
                        sourceItems = cardsSnap.docs.map(d => ({id: d.id, ...d.data()}));
                        allSourceItemsForSimilar = sourceItems;
                        itemFinder = (id) => sourceItems.find((c: CardType) => c.id === id);
                    }
                    
                    for (const [id, weight] of incorrectEntries) {
                        const item = itemFinder(id);
                        if (item) {
                            potentialReviewItems.push({ item, weight: weight as number, type: originalQuizMeta.type, originalQuizId });
                             const similarItems = shuffleArray(allSourceItemsForSimilar.filter(i => i.id !== item.id)).slice(0, 2);
                             similarItems.forEach(similarItem => {
                                potentialReviewItems.push({
                                    item: similarItem,
                                    weight: 1, // Give it a base weight
                                    type: originalQuizMeta.type,
                                    originalQuizId: originalQuizId,
                                });
                            });
                        }
                    }
                }

                const sortedItems = potentialReviewItems.sort((a, b) => b.weight - a.weight);
                const potentialQuestions = await Promise.all(sortedItems.map(async ({ item, weight, type, originalQuizId }) => {
                    let question: QuizQuestion;
                     if (type === 'grammar') {
                        question = createGrammarQuestion(item, grammarPoints, true);
                    } else { // vocabulary
                        const vocabDeckId = originalQuizId === 'vocabulary-n5' ? 'n5-vocab' : 'n4-vocab';
                        const cardsColRef = collection(db, "users", user.uid, "decks", vocabDeckId, "cards");
                        const cardsSnap = await getDocs(cardsColRef);
                        const allCards = cardsSnap.docs.map(d => ({id: d.id, ...d.data() as any}));
                        question = createVocabQuestion(item, allCards, true);
                    }
                    return { ...question, weight, originalQuizId };
                }));

                const uniqueQuestions = Array.from(new Map(potentialQuestions.map(q => [q.question, q])).values());
                const reviewQuestions = uniqueQuestions.slice(0, REVIEW_QUIZ_LENGTH);
                setSessionQuestions(reviewQuestions);
                setIsLoading(false);
                return;
            }

            const quizDataRef = doc(db, 'users', user.uid, 'quizData', quizMeta.id);
            const quizDataSnap = await getDoc(quizDataRef);
            const questionWeights = quizDataSnap.exists() ? quizDataSnap.data().weights || {} : {};
            
            let potentialQuestionItems: any[] = [];
            let questionGenerator: (item: any, allItems: any[], isReview: boolean) => QuizQuestion;
            let quizLength: number;
            let allItemsForGenerator: any[] = [];

            if (quizMeta.type === 'grammar') {
                potentialQuestionItems = grammarPoints.filter(p => p.level === quizMeta.level);
                allItemsForGenerator = grammarPoints;
                questionGenerator = (item, allItems, isReview) => createGrammarQuestion(item, allItems, isReview);
                quizLength = GRAMMAR_QUIZ_LENGTH;
            } else if (quizMeta.type === 'vocabulary') { 
                const vocabDeckId = quizMeta.level === 'N5' ? 'n5-vocab' : 'n4-vocab';
                const cardsColRef = collection(db, "users", user.uid, "decks", vocabDeckId, "cards");
                const cardsSnap = await getDocs(cardsColRef);
                
                if (cardsSnap.empty) {
                  const basicCards = initialCards.filter(c => c.deckId === vocabDeckId);
                  potentialQuestionItems = basicCards;
                } else {
                  potentialQuestionItems = cardsSnap.docs.map(d => ({id: d.id, ...d.data()}));
                }

                allItemsForGenerator = potentialQuestionItems;
                questionGenerator = (item, allItems, isReview) => createVocabQuestion(item, allItems, isReview);
                quizLength = VOCAB_QUIZ_LENGTH;
            } else if (quizMeta.type === 'listening') {
                potentialQuestionItems = listeningSentences.filter(s => s.level === quizMeta.level);
                quizLength = LISTENING_QUIZ_LENGTH;
                
                const weightedQuestions = potentialQuestionItems.map(item => ({ item, weight: questionWeights[item.id] || 0 }));
                weightedQuestions.sort((a, b) => b.weight - a.weight || Math.random() - 0.5);
                
                const generatedListeningQuestions = weightedQuestions.slice(0, quizLength).map(wq => ({ ...wq.item, weight: wq.weight, isReview: wq.weight > 0 }));
                setListeningSessionQuestions(generatedListeningQuestions);
                setIsLoading(false);
                return;
            } else {
                setSessionQuestions([]);
                setIsLoading(false);
                return;
            }

            if (potentialQuestionItems.length === 0) {
                setSessionQuestions([]);
                setIsLoading(false);
                return;
            }

            const weightedQuestions = potentialQuestionItems.map(item => ({ item, id: item.id, weight: questionWeights[item.id] || 0 }));
            weightedQuestions.sort((a, b) => b.weight - a.weight || Math.random() - 0.5);
            
            const generatedQuestions = weightedQuestions.slice(0, quizLength).map(wq => ({ ...questionGenerator(wq.item, allItemsForGenerator, wq.weight > 0), weight: wq.weight }));
            setSessionQuestions(generatedQuestions);
            setIsLoading(false);
        }

        generateQuiz();

    }, [quizMeta, quizId, user]);

    const isQuizFinished = (sessionQuestions.length > 0 && currentQuestionIndex >= sessionQuestions.length);
    const progress = sessionQuestions.length > 0 ? (currentQuestionIndex / sessionQuestions.length) * 100 : 0;
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    
    useEffect(() => {
        if (isQuizFinished && quizMeta && quizMeta.type !== 'review' && user) {
            const score = Math.round((correctAnswersCount / sessionQuestions.length) * 100);
            const quizDataRef = doc(db, "users", user.uid, "quizData", quizMeta.id);
            getDoc(quizDataRef).then(docSnap => {
                const bestScore = docSnap.exists() ? docSnap.data().bestScore || 0 : 0;
                if (score > bestScore) {
                    setDoc(quizDataRef, { bestScore: score }, { merge: true });
                }
            })
        }
    }, [isQuizFinished, quizMeta, correctAnswersCount, sessionQuestions.length, user]);


    const handleAnswerSelect = (option: string) => {
        if (answerStatus !== 'unanswered' || !currentQuestion) return;

        setSelectedAnswer(option);
        const currentWeight = currentQuestion.weight || 0;

        if (option === currentQuestion.correctAnswer) {
            setAnswerStatus('correct');
            setCorrectAnswersCount(c => c + 1);
            if (currentWeight > 0) {
                setSessionQuestionUpdates(prev => ({ ...prev, [currentQuestion.id]: { change: -1, originalQuizId: currentQuestion.originalQuizId } }));
            }
        } else {
            setAnswerStatus('incorrect');
            setSessionQuestionUpdates(prev => ({ ...prev, [currentQuestion.id]: { change: 1, originalQuizId: currentQuestion.originalQuizId } }));
        }
    };

    const handleNextQuestion = () => {
        setAnswerStatus('unanswered');
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const handleRestart = () => {
        window.location.reload();
    }
    
    const handleFinish = async () => {
        if (!user) return;
        
        const batch = writeBatch(db);
        const updates: Record<string, any> = {};

        // Aggregate all weight changes first
        for (const id in sessionQuestionUpdates) {
            const { change, originalQuizId } = sessionQuestionUpdates[id];
            const quizIdToUpdate = originalQuizId || quizMeta?.id;

            if (quizIdToUpdate) {
                if (!updates[quizIdToUpdate]) {
                    const quizDataRef = doc(db, "users", user.uid, "quizData", quizIdToUpdate);
                    const docSnap = await getDoc(quizDataRef);
                    updates[quizIdToUpdate] = {
                        ref: quizDataRef,
                        weights: docSnap.exists() ? docSnap.data().weights || {} : {}
                    };
                }

                const currentWeight = updates[quizIdToUpdate].weights[id] || 0;
                updates[quizIdToUpdate].weights[id] = Math.max(0, currentWeight + change);
            }
        }

        // Apply all updates in a batch
        for (const qid in updates) {
            batch.set(updates[qid].ref, { weights: updates[qid].weights }, { merge: true });
        }

        await batch.commit();
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
                                       <span className="font-bold">W: {currentQuestion.weight + (sessionQuestionUpdates[q.id]?.change || 0)} ({q.id})</span> - {q.question}
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
