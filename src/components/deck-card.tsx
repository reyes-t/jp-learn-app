
"use client"
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Deck, Card as CardType } from '@/lib/types';
import { BookCheck, Layers, Dot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cards as initialCards } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';


type DeckCardProps = {
  deck: Deck;
};

const MASTERY_THRESHOLD = 5; // SRS level 5+ is considered "mastered"

export function DeckCard({ deck }: DeckCardProps) {
  const { user } = useAuth();
  const [learningCount, setLearningCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [cardCount, setCardCount] = useState(deck.cardCount);

  useEffect(() => {
    if (!user) return;

    let cardsRef: any;
    if (deck.isCustom) {
        cardsRef = collection(db, 'users', user.uid, 'decks', deck.id, 'cards');
    } else {
        // For basic decks, we need to check the user's progress copy of the cards
        cardsRef = collection(db, 'users', user.uid, 'decks', deck.id, 'cards');
    }

    const q = query(cardsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        let allDeckCards: CardType[] = snapshot.docs.map(doc => doc.data() as CardType);
        
        // If it's a basic deck and user has no cards yet, use initial data for display
        if (allDeckCards.length === 0 && !deck.isCustom) {
            allDeckCards = initialCards.filter(card => card.deckId === deck.id);
        }
        
        setCardCount(snapshot.size > 0 ? snapshot.size : deck.cardCount);

        if (allDeckCards.length > 0) {
            const now = new Date();
            const srsCards = allDeckCards.map(c => ({
            ...c,
            srsLevel: c.srsLevel ?? 0,
            nextReview: c.nextReview ? (c.nextReview as any).toDate() : now,
            }));

            const due = srsCards.filter(c => c.nextReview <= now).length;
            setDueCount(due);

            const learning = srsCards.filter(c => (c.srsLevel || 0) > 0 && (c.srsLevel || 0) < MASTERY_THRESHOLD).length;
            setLearningCount(learning);
            
            const mastered = srsCards.filter(c => (c.srsLevel || 0) >= MASTERY_THRESHOLD).length;
            setMasteredCount(mastered);
        } else {
            setDueCount(0);
            setLearningCount(0);
            setMasteredCount(0);
        }
    });

    return () => unsubscribe();
  }, [user, deck.id, deck.isCustom, deck.cardCount]);

  const learningPercentage = cardCount > 0 ? (learningCount / cardCount) * 100 : 0;
  const masteredPercentage = cardCount > 0 ? (masteredCount / cardCount) * 100 : 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/decks/${deck.id}`} className="flex flex-col flex-grow" aria-label={`View deck: ${deck.name}`}>
        <div className="flex flex-col flex-grow bg-card p-4 pb-2">
          <CardHeader className="p-0 pb-2">
            <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-lg mb-2">
                     {deck.name}
                </CardTitle>
                {deck.isCustom && <Badge variant="outline">Custom</Badge>}
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <p className="text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
          </CardContent>
        </div>
      </Link>
      
      <div className="bg-card px-4 pt-2">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary/50 transition-all"
            style={{ width: `${learningPercentage + masteredPercentage}%` }}
          />
          <div
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${masteredPercentage}%` }}
          />
        </div>
        <div className="mt-2 flex justify-end gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
                <Dot className="text-primary/50" />
                <span>Learning ({Math.round(learningPercentage)}%)</span>
            </div>
             <div className="flex items-center gap-1">
                <Dot className="text-primary" />
                <span>Mastered ({Math.round(masteredPercentage)}%)</span>
            </div>
        </div>
      </div>
     
      <CardFooter className="p-4 pt-2 flex justify-between items-end bg-card">
          <div className="flex flex-col items-start gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-primary font-semibold">
                  <BookCheck className="w-4 h-4"/>
                  <span>{dueCount} due</span>
              </div>
              <div className="flex items-center gap-2">
                 <Layers className="w-4 h-4"/>
                 <span>{cardCount} cards</span>
              </div>
          </div>
          <Button asChild size="sm" onClick={(e) => e.stopPropagation()} className="shrink-0">
            <Link href={`/decks/${deck.id}/study`}>Study</Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
