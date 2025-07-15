"use client"
import { useState, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { allDecks, cards as allCards } from '@/lib/data';
import { Flashcard } from '@/components/flashcard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudyPage() {
  const params = useParams();
  const deckId = params.id as string;
  
  const deck = useMemo(() => allDecks.find((d) => d.id === deckId), [deckId]);
  const cards = useMemo(() => allCards.filter((c) => c.deckId === deckId), [deckId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);

  if (!deck) {
    notFound();
  }
  
  const isFinished = currentIndex >= cards.length;
  const progress = isFinished ? 100 : (currentIndex / cards.length) * 100;
  const currentCard = cards[currentIndex];

  const handleNextCard = (knewIt: boolean) => {
    if (knewIt) {
      setCorrectAnswers(c => c + 1);
    } else {
      setIncorrectAnswers(c => c + 1);
    }
    setShowAnswer(false);
    setCurrentIndex(i => i + 1);
  };
  
  if (isFinished) {
    const total = correctAnswers + incorrectAnswers;
    const score = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;

    return (
        <div className="container mx-auto flex flex-col items-center justify-center h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Session Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">You scored {score}%</p>
                    <div className="flex justify-around mt-4">
                        <div className="text-green-500">
                            <p className="font-bold text-2xl">{correctAnswers}</p>
                            <p>Correct</p>
                        </div>
                        <div className="text-red-500">
                            <p className="font-bold text-2xl">{incorrectAnswers}</p>
                            <p>Incorrect</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button onClick={() => {
                        setCurrentIndex(0);
                        setCorrectAnswers(0);
                        setIncorrectAnswers(0);
                    }}>Study Again</Button>
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
                Card {currentIndex + 1} of {cards.length}
            </div>
        </div>
        <Progress value={progress} />
      </div>

      <Flashcard 
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
