
"use client"
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Deck, Card as CardType } from '@/lib/types';
import { BookCheck, Layers } from 'lucide-react';
import { Progress } from './ui/progress';
import { useState, useEffect } from 'react';
import { cards as initialCards } from '@/lib/data';

type DeckCardProps = {
  deck: Deck;
};

export function DeckCard({ deck }: DeckCardProps) {
  const [progress, setProgress] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    let allDeckCards: CardType[];
    if (deck.isCustom) {
      allDeckCards = JSON.parse(localStorage.getItem(`cards_${deck.id}`) || '[]');
    } else {
      const storedPregen = localStorage.getItem(`cards_${deck.id}`);
      if (storedPregen) {
          allDeckCards = JSON.parse(storedPregen);
      } else {
          allDeckCards = initialCards.filter(card => card.deckId === deck.id);
      }
    }
    
    if (allDeckCards.length > 0) {
      const now = new Date();
      const srsCards = allDeckCards.map(c => ({
        ...c,
        nextReview: c.nextReview ? new Date(c.nextReview) : now,
      }));

      const due = srsCards.filter(c => c.nextReview <= now).length;
      setDueCount(due);

      const mastered = srsCards.filter(c => (c.srsLevel || 0) > 0).length;
      setStudiedCount(mastered);
      
      if (deck.cardCount > 0) {
        setProgress(Math.round((mastered / deck.cardCount) * 100));
      }
    }
  }, [deck.id, deck.cardCount, deck.isCustom]);

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/decks/${deck.id}`} className="flex flex-col flex-grow" aria-label={`View deck: ${deck.name}`}>
        <div className="flex flex-col flex-grow bg-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-lg mb-2">
                     {deck.name}
                </CardTitle>
                {deck.isCustom && <Badge variant="outline">Custom</Badge>}
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-4 pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
          </CardContent>
        </div>
      </Link>
      {progress > 0 && (
        <div className="px-4 pb-2 bg-card">
          <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-muted-foreground">Mastery</span>
              <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2"/>
        </div>
      )}
      <CardFooter className="p-4 pt-2 flex justify-between items-end bg-card">
          <div className="flex flex-col items-start gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-primary font-semibold">
                  <BookCheck className="w-4 h-4"/>
                  <span>{dueCount} due</span>
              </div>
              <div className="flex items-center gap-2">
                 <Layers className="w-4 h-4"/>
                 <span>{deck.cardCount} cards</span>
              </div>
          </div>
          <Button asChild size="sm" onClick={(e) => e.stopPropagation()} className="shrink-0">
            <Link href={`/decks/${deck.id}/study`}>Study</Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
