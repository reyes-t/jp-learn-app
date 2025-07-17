
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
  const [studyQueue, setStudyQueue] = useState<CardType[]>([]);
  const [totalDueCount, setTotalDueCount] = useState(0);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);

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
            // For pre-made decks, check if they've been studied before.
            // If so, load from localStorage, otherwise use initial data.
            const storedPregen = localStorage.getItem(`cards_${deckId}`);
            if (storedPregen) {
                loadedCards = JSON.parse(storedPregen);
            } else {
                loadedCards = initialCards.filter(card => card.deckId === deckId);
            }
        }
        
        // Initialize SRS data for cards that don't have it
        const now = new Date();
        const cardsWithSrs = loadedCards.map(card => ({
            ...card,
            srsLevel: card.srsLevel ?? 0,
            nextReview: card.nextReview ? new Date(card.nextReview) : now,
        }));

        setAllCards(cardsWithSrs);

        const dueCards = cardsWithSrs
            .filter(card => card.nextReview <= now)
            .sort(() => Math.random() - 0.5); // Shuffle due cards
        
        setTotalDueCount(dueCards.length);

        const storedSettings = JSON.parse(localStorage.getItem(`deckSettings_${deckId}`) || '{}');
        const sessionSize = storedSettings.sessionSize;

        if (sessionSize && dueCards.length > sessionSize) {
            setStudyQueue(dueCards.slice(0, sessionSize));
        } else {
            setStudyQueue(dueCards);
        }
    }
  }, [deckId]);

  const updateCardInStorage = (updatedCard: CardType) => {
    const cardIndex = allCards.findIndex(c => c.id === updatedCard.id);
    if (cardIndex > -1) {
        const updatedAllCards = [...allCards];
        updatedAllCards[cardIndex] = updatedCard;
        setAllCards(updatedAllCards);
        localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedAllCards));
    }
  };

  if (!deck) {
    // Still loading or not found
    return null; 
  }
  
  const isFinished = currentIndex >= studyQueue.length;
  const progress = studyQueue.length > 0 ? (isFinished ? 100 : (currentIndex / studyQueue.length) * 100) : 100;
  const currentCard = studyQueue[currentIndex];

  const handleNextCard = (knewIt: boolean) => {
    if (!currentCard) return;

    let updatedCard: CardType;
    const now = new Date();

    if (knewIt) {
      setSessionCorrect(c => c + 1);
      const newSrsLevel = Math.min((currentCard.srsLevel || 0) + 1, srsIntervals.length - 1);
      const nextReviewDate = addDays(now, srsIntervals[newSrsLevel]);
      updatedCard = { ...currentCard, srsLevel: newSrsLevel, nextReview: nextReviewDate };
    } else {
      setSessionIncorrect(c => c + 1);
      const newSrsLevel = 0;
      const nextReviewDate = addDays(now, srsIntervals[newSrsLevel]); // Review again tomorrow
      updatedCard = { ...currentCard, srsLevel: newSrsLevel, nextReview: nextReviewDate };
    }
    
    updateCardInStorage(updatedCard);
    
    setShowAnswer(false);
    setCurrentIndex(i => i + 1);
  };

  const resetStudySession = () => {
    // Re-calculates due cards for a new session
    const now = new Date();
    const dueCards = allCards
        .filter(card => card.nextReview <= now)
        .sort(() => Math.random() - 0.5);
    
    setTotalDueCount(dueCards.length);

    const storedSettings = JSON.parse(localStorage.getItem(`deckSettings_${deckId}`) || '{}');
    const sessionSize = storedSettings.sessionSize;

    if (sessionSize && dueCards.length > sessionSize) {
        setStudyQueue(dueCards.slice(0, sessionSize));
    } else {
        setStudyQueue(dueCards);
    }

    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setShowAnswer(false);
  };
  
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
  
  if (totalDueCount === 0) {
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
    const remainingDue = totalDueCount - studyQueue.length;
    return (
        <div className="container mx-auto flex flex-col items-center justify-center h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Session Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">You reviewed {sessionCorrect + sessionIncorrect} cards.</p>
                    <div className="flex justify-around mt-4">
                        <div className="text-green-500">
                            <p className="font-bold text-2xl">{sessionCorrect}</p>
                            <p>Correct</p>
                        </div>
                        <div className="text-red-500">
                            <p className="font-bold text-2xl">{sessionIncorrect}</p>
                            <p>Incorrect</p>
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
                Card {currentIndex + 1} of {studyQueue.length}
            </div>
        </div>
        <Progress value={progress} />
      </div>

       <Alert className="max-w-lg">
        <Info className="h-4 w-4" />
        <AlertDescription>
          There are <strong>{totalDueCount}</strong> cards due for review in this deck. This session contains {studyQueue.length}.
        </AlertDescription>
      </Alert>

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
    </div>
  );
}
