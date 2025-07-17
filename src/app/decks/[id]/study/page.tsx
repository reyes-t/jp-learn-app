
"use client"
import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { allDecks as initialDecks, cards as initialCards } from '@/lib/data';
import type { Card as CardType, Deck } from '@/lib/types';
import { Flashcard } from '@/components/flashcard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, X, Info } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  
  const [deck, setDeck] = useState<Deck | undefined>(undefined);
  const [allCards, setAllCards] = useState<CardType[]>([]);
  
  // State for the current session
  const [sessionQueue, setSessionQueue] = useState<CardType[]>([]);
  const [correctlyAnsweredOnce, setCorrectlyAnsweredOnce] = useState<CardType[]>([]);
  const [initialSessionSize, setInitialSessionSize] = useState(0);

  // Stats for the current session
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Load initial data and set up the study session
  useEffect(() => {
    // Load all decks from localStorage or fall back to initial data
    const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const allDecks = [...initialDecks, ...storedDecks];
    const currentDeck = allDecks.find((d) => d.id === deckId);
    setDeck(currentDeck);

    if (currentDeck) {
        let loadedCards: CardType[];
        if (currentDeck.isCustom) {
            loadedCards = JSON.parse(localStorage.getItem(`cards_${deckId}`) || '[]');
        } else {
            const storedPregen = localStorage.getItem(`cards_${deckId}`);
            loadedCards = storedPregen ? JSON.parse(storedPregen) : initialCards.filter(card => card.deckId === deckId);
        }
        
        const now = new Date();
        const cardsWithSrs = loadedCards.map(card => ({
            ...card,
            srsLevel: card.srsLevel ?? 0,
            nextReview: card.nextReview ? new Date(card.nextReview) : now,
        }));
        setAllCards(cardsWithSrs);

        const dueCards = cardsWithSrs
            .filter(card => new Date(card.nextReview) <= now)
            .sort(() => Math.random() - 0.5);
        
        const storedSettings = JSON.parse(localStorage.getItem(`deckSettings_${deckId}`) || '{}');
        const sessionSize = storedSettings.sessionSize;

        const session = sessionSize && dueCards.length > sessionSize ? dueCards.slice(0, sessionSize) : dueCards;
        setSessionQueue(session);
        setInitialSessionSize(session.length);
    }
  }, [deckId]);
  
  const updateCardInStorage = (updatedCard: CardType) => {
    const cardIndex = allCards.findIndex(c => c.id === updatedCard.id);
    if (cardIndex > -1) {
        const updatedAllCards = [...allCards];
        updatedAllCards[cardIndex] = updatedCard;
        setAllCards(updatedAllCards); // Update the master list of cards
        localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedAllCards));
    }
  };

  const handleNextCard = (knewIt: boolean) => {
    const [currentCard, ...restOfQueue] = sessionQueue;
    if (!currentCard) return;

    if (knewIt) {
        // Card answered correctly. Move it to the `correctlyAnsweredOnce` pile.
        // If it's already there, it means it was answered correctly twice.
        const alreadyKnewItOnce = correctlyAnsweredOnce.find(c => c.id === currentCard.id);

        if (alreadyKnewItOnce) {
            // This is the second time they got it right.
            // Update SRS level and permanently remove from this session.
            setSessionCorrect(c => c + 1);
            const newSrsLevel = Math.min((currentCard.srsLevel || 0) + 1, srsIntervals.length - 1);
            const nextReviewDate = addDays(new Date(), srsIntervals[newSrsLevel]);
            const updatedCard = { ...currentCard, srsLevel: newSrsLevel, nextReview: nextReviewDate };
            updateCardInStorage(updatedCard);
            // Remove from the `correctlyAnsweredOnce` list
            setCorrectlyAnsweredOnce(prev => prev.filter(c => c.id !== currentCard.id));
        } else {
            // First time they got it right. Add to the list.
            setCorrectlyAnsweredOnce(prev => [...prev, currentCard]);
        }
    } else {
        // Card answered incorrectly. Reset SRS and put at the back of the queue.
        setSessionIncorrect(c => c + 1);
        const newSrsLevel = 0;
        const nextReviewDate = addDays(new Date(), srsIntervals[newSrsLevel]);
        const updatedCard = { ...currentCard, srsLevel: newSrsLevel, nextReview: nextReviewDate };
        updateCardInStorage(updatedCard);
        
        // Put the card back at the end of the session queue to be repeated.
        restOfQueue.push(currentCard);
    }

    // If the main queue is empty, start reviewing the cards they got right once.
    if (restOfQueue.length === 0 && correctlyAnsweredOnce.length > 0) {
        // Only re-queue cards that haven't been completed yet.
        const cardsToRequeue = correctlyAnsweredOnce.filter(c => 
            !sessionQueue.find(sc => sc.id === c.id) // check if it was already re-queued
        );
        setSessionQueue(cardsToRequeue);
    } else {
        setSessionQueue(restOfQueue);
    }
    
    setShowAnswer(false);
  };
  
  const totalDueCount = useMemo(() => {
    const now = new Date();
    return allCards.filter(card => new Date(card.nextReview) <= now).length;
  }, [allCards]);

  const resetStudySession = () => {
    window.location.reload();
  };

  if (!deck) {
    return null; // Loading state
  }

  const isFinished = sessionQueue.length === 0 && correctlyAnsweredOnce.length === 0 && initialSessionSize > 0;
  const cardsCompletedThisSession = initialSessionSize - sessionQueue.length - correctlyAnsweredOnce.length;
  const progress = initialSessionSize > 0 ? (cardsCompletedThisSession / initialSessionSize) * 100 : (isFinished ? 100 : 0);
  const currentCard = sessionQueue[0];

  if (allCards.length === 0) {
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
                        <Link href={`/decks/${deck.id}`}>Back to Deck</Link>
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
                        <Link href={`/decks/${deck.id}`}>Back to Deck</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  if (isFinished) {
    const remainingDue = totalDueCount;
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
                    {remainingDue > 0 && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            You have {remainingDue} more cards due for review in this deck.
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    {remainingDue > 0 && (
                        <Button onClick={resetStudySession}>Start Next Session</Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link href={`/decks/${deck.id}`}>Back to Deck</Link>
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
                href={`/decks/${deck.id}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" />
                Exit
            </Link>
            <div className="text-sm text-muted-foreground">
                {cardsCompletedThisSession} / {initialSessionSize} cards completed
            </div>
        </div>
        <Progress value={progress} />
      </div>

       <Alert className="max-w-lg">
        <Info className="h-4 w-4" />
        <AlertDescription>
          There are <strong>{totalDueCount}</strong> total cards due. This session contains <strong>{initialSessionSize}</strong> cards.
        </AlertDescription>
      </Alert>

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
