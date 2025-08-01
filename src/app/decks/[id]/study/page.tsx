
"use client"
import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { basicDecks as initialDecks, cards as initialCards } from '@/lib/data';
import type { Card as CardType, Deck } from '@/lib/types';
import { Flashcard } from '@/components/flashcard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, X, Info } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, writeBatch } from 'firebase/firestore';


// SRS Intervals in days for each level
const srsIntervals = [1, 2, 4, 8, 16, 32, 64];

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export default function StudyPage() {
    const params = useParams();
    const deckId = params.id as string;
    const { user } = useAuth();

    const [deck, setDeck] = useState<Deck | undefined>(undefined);
    const [allCards, setAllCards] = useState<CardType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for the current session
    const [sessionQueue, setSessionQueue] = useState<CardType[]>([]);
    const [correctlyAnsweredOnce, setCorrectlyAnsweredOnce] = useState<string[]>([]);
    const [initialSessionSize, setInitialSessionSize] = useState(0);

    // Stats for the current session
    const [sessionCorrect, setSessionCorrect] = useState(0);
    const [sessionIncorrect, setSessionIncorrect] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    // Load initial data and set up the study session
    useEffect(() => {
        if (!user) return;

        const fetchDeckAndCards = async () => {
            const deckRef = doc(db, 'users', user.uid, 'decks', deckId);
            const deckSnap = await getDoc(deckRef);

            let currentDeckData: Deck | undefined;
            const isBasic = initialDecks.some(d => d.id === deckId);
            
            const basicDeckInfo = initialDecks.find(d => d.id === deckId);

            if (deckSnap.exists()) {
                currentDeckData = { ...basicDeckInfo, ...deckSnap.data() } as Deck;
            } else if (isBasic) {
                currentDeckData = basicDeckInfo;
            }
            
            if (!currentDeckData) {
                // notFound();
                return;
            }
            setDeck(currentDeckData);

            const cardsRef = collection(db, 'users', user.uid, 'decks', deckId, 'cards');
            const cardsSnap = await getDocs(cardsRef);
            let loadedCards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CardType[];

            if (cardsSnap.empty && isBasic) {
                const batch = writeBatch(db);
                const originalCards = initialCards.filter(c => c.deckId === deckId);
                
                if (originalCards.length === 0) {
                     console.warn(`No initial cards found for deck ${deckId}`);
                     setIsLoading(false);
                     return;
                }

                loadedCards = originalCards.map(card => {
                    const newCard = { ...card, srsLevel: 0, nextReview: new Date() };
                    const cardRef = doc(cardsRef, card.id);
                    batch.set(cardRef, newCard);
                    return newCard as CardType;
                });
                await batch.commit();
            }


            const now = new Date();
            const cardsWithSrs = loadedCards.map(card => ({
                ...card,
                srsLevel: card.srsLevel ?? 0,
                nextReview: card.nextReview ? (card.nextReview as any).toDate() : now,
            }));
            setAllCards(cardsWithSrs);

            const dueCards = cardsWithSrs
                .filter(card => new Date(card.nextReview) <= now)
                .sort(() => Math.random() - 0.5);

            let sessionSize = (currentDeckData as any).sessionSize;
            if (sessionSize === undefined && currentDeckData.cardCount >= 100) {
                sessionSize = 100;
            }

            const session = sessionSize && dueCards.length > sessionSize ? dueCards.slice(0, sessionSize) : dueCards;
            setSessionQueue(session);
            setInitialSessionSize(session.length);
            setIsLoading(false);
        }

        fetchDeckAndCards();

    }, [user, deckId]);

    const updateCardInStorage = async (updatedCard: CardType) => {
        if (!user) return;
        const cardRef = doc(db, 'users', user.uid, 'decks', deckId, 'cards', updatedCard.id);
        await updateDoc(cardRef, {
            srsLevel: updatedCard.srsLevel,
            nextReview: updatedCard.nextReview
        });
    };

    const handleNextCard = (knewIt: boolean) => {
        const [currentCard, ...restOfQueue] = sessionQueue;
        if (!currentCard) return;

        if (knewIt) {
            const alreadyKnewItOnce = correctlyAnsweredOnce.includes(currentCard.id);

            if (alreadyKnewItOnce) {
                setSessionCorrect(c => c + 1);
                const newSrsLevel = Math.min((currentCard.srsLevel || 0) + 1, srsIntervals.length - 1);
                const nextReviewDate = addDays(new Date(), srsIntervals[newSrsLevel]);
                const updatedCard = { ...currentCard, srsLevel: newSrsLevel, nextReview: nextReviewDate };
                updateCardInStorage(updatedCard);
                setCorrectlyAnsweredOnce(prev => prev.filter(id => id !== currentCard.id));
                setSessionQueue(restOfQueue);
            } else {
                setCorrectlyAnsweredOnce(prev => [...prev, currentCard.id]);
                setSessionQueue([...restOfQueue, currentCard]); // Put at back of queue
            }
        } else {
            setSessionIncorrect(c => c + 1);
            const newSrsLevel = 0;
            const nextReviewDate = addDays(new Date(), srsIntervals[newSrsLevel]);
            const updatedCard = { ...currentCard, srsLevel: newSrsLevel, nextReview: nextReviewDate };
            updateCardInStorage(updatedCard);
            setCorrectlyAnsweredOnce(prev => prev.filter(id => id !== currentCard.id));
            setSessionQueue([...restOfQueue, currentCard]); // Put at back of queue
        }

        setShowAnswer(false);
    };

    const totalDueCount = useMemo(() => {
        const now = new Date();
        return allCards.filter(card => new Date((card.nextReview as any)) <= now).length;
    }, [allCards]);

    const resetStudySession = () => {
        window.location.reload();
    };

    const isFinished = sessionQueue.length === 0 && initialSessionSize > 0;
    
    useEffect(() => {
        const markSessionComplete = async () => {
            if (isFinished && user && deckId) {
                 const deckRef = doc(db, 'users', user.uid, 'decks', deckId);
                 await updateDoc(deckRef, { lastSessionCompletedAt: new Date() });
            }
        }
        markSessionComplete();
    }, [isFinished, user, deckId]);


    if (isLoading) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Loading...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Setting up your study session...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    
    const cardsCompletedThisSession = sessionCorrect;
    const progress = initialSessionSize > 0 ? (cardsCompletedThisSession / initialSessionSize) * 100 : (isFinished ? 100 : 0);
    const currentCard = sessionQueue[0];

    if (deck && allCards.length === 0) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">No Cards in Deck</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This deck doesn't have any cards yet. {deck.isCustom ? "Add some cards to start studying!" : ""}</p>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button variant="outline" asChild>
                            <Link href={`/decks/${deckId}`}>Back to Deck</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (totalDueCount === 0 && initialSessionSize === 0) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">All Caught Up!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You have no cards due for review in this deck right now. Great job!</p>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button variant="outline" asChild>
                            <Link href={`/decks/${deckId}`}>Back to Deck</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (isFinished) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Session Complete!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">You reviewed {initialSessionSize} cards.</p>
                        <div className="flex justify-around mt-4">
                            <div className="text-green-500">
                                <p className="font-bold text-2xl">{sessionCorrect}</p>
                                <p>Correct</p>
                            </div>
                            <div className="text-red-500">
                                <p className="font-bold text-2xl">{sessionIncorrect}</p>
                                <p>Incorrect Attempts</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button variant="outline" asChild>
                            <Link href={`/decks/${deckId}`}>Back to Deck</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto flex flex-col items-center gap-8">
            <div className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-2">
                    <Link
                        href={`/decks/${deckId}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Exit
                    </Link>
                    <div className="text-sm font-medium text-muted-foreground">
                        {cardsCompletedThisSession}/{initialSessionSize}
                    </div>
                </div>
                <Progress value={progress} />
            </div>

            {currentCard ? (
                <>
                    <Flashcard
                        key={currentCard.id}
                        front={currentCard.front}
                        back={currentCard.back}
                        onFlip={() => setShowAnswer(true)}
                    />

                    {showAnswer && (
                        <div className="flex items-center gap-4 animate-in fade-in duration-500">
                            <Button
                                variant="destructive"
                                size="lg"
                                className="w-40"
                                onClick={() => handleNextCard(false)}
                            >
                                <X className="mr-2 h-5 w-5" />
                                Didn't Know
                            </Button>
                            <Button
                                size="lg"
                                className="w-40 bg-green-500 hover:bg-green-600"
                                onClick={() => handleNextCard(true)}
                            >
                                <Check className="mr-2 h-5 w-5" />
                                Knew It
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center text-muted-foreground">Loading study session...</div>
            )}
        </div>
    );
}
