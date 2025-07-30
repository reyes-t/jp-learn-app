
"use client"
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Deck, Card as CardType } from '@/lib/types';
import { BookCheck, Layers, Dot, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cards as initialCards } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc } from 'firebase/firestore';


type DeckCardProps = {
  deck: Deck;
};

const MASTERY_THRESHOLD = 5; // SRS level 5+ is considered "mastered"

export function DeckCard({ deck: initialDeck }: DeckCardProps) {
  const { user } = useAuth();
  const [deck, setDeck] = useState(initialDeck);
  const [learningCount, setLearningCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [cardCount, setCardCount] = useState(deck.cardCount);

  useEffect(() => {
    if (!user) return;
    
    const deckRef = doc(db, 'users', user.uid, 'decks', initialDeck.id);
    const unsubDeck = onSnapshot(deckRef, (doc) => {
      if (doc.exists()) {
        setDeck({ ...initialDeck, ...doc.data() });
      } else {
        setDeck(initialDeck);
      }
    });

    const cardsRef = collection(db, 'users', user.uid, 'decks', initialDeck.id, 'cards');
    
    const setupListeners = async () => {
        const snapshot = await getDocs(cardsRef);
        let allDeckCards: CardType[] = snapshot.docs.map(doc => doc.data() as CardType);

        if (allDeckCards.length === 0 && !initialDeck.isCustom) {
            allDeckCards = initialCards.filter(card => card.deckId === initialDeck.id).map(c => ({
            ...c,
            srsLevel: 0,
            nextReview: new Date()
            }));
        }

        if (initialDeck.isCustom) {
            setCardCount(snapshot.size);
        } else {
            setCardCount(initialDeck.cardCount);
        }

        const updateCounts = (cards: CardType[]) => {
            if (cards.length > 0) {
                const now = new Date();
                const srsCards = cards.map(c => ({
                ...c,
                srsLevel: c.srsLevel ?? 0,
                nextReview: c.nextReview && typeof (c.nextReview as any).toDate === 'function' 
                                ? (c.nextReview as any).toDate() 
                                : new Date(c.nextReview || 0),
                }));
        
                const actualDue = srsCards.filter(c => c.nextReview <= now).length;
                
                let sessionSize = (deck as any).sessionSize;
                if (sessionSize === undefined && cardCount >= 100) {
                    sessionSize = 100;
                }
                
                if (sessionSize && actualDue > sessionSize) {
                    setDueCount(sessionSize);
                } else {
                    setDueCount(actualDue);
                }
        
                const learning = srsCards.filter(c => (c.srsLevel || 0) > 0 && (c.srsLevel || 0) < MASTERY_THRESHOLD).length;
                setLearningCount(learning);
        
                const mastered = srsCards.filter(c => (c.srsLevel || 0) >= MASTERY_THRESHOLD).length;
                setMasteredCount(mastered);
            } else {
                setDueCount(0);
                setLearningCount(0);
                setMasteredCount(0);
            }
        }

        updateCounts(allDeckCards); // Initial update

        const unsubscribeCards = onSnapshot(query(cardsRef), (snapshot) => {
            const updatedCards = snapshot.docs.map(doc => doc.data() as CardType);
            updateCounts(updatedCards);
             if (initialDeck.isCustom) {
                setCardCount(snapshot.size);
            }
        });

        return unsubscribeCards;
    };

    const unsubscribePromise = setupListeners();

    return () => {
      unsubDeck();
      unsubscribePromise.then(unsub => unsub && unsub());
    }
  }, [user, initialDeck, deck, cardCount]);

  const learningPercentage = cardCount > 0 ? (learningCount / cardCount) * 100 : 0;
  const masteredPercentage = cardCount > 0 ? (masteredCount / cardCount) * 100 : 0;

  return (
    <Card className="group flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 relative">
      <Link href={`/decks/${deck.id}`} className="absolute top-2 right-2 z-10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border hover:border-border" aria-label={`Edit deck: ${deck.name}`}>
          <Edit className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>
      <Link href={`/decks/${deck.id}`} className="flex flex-col flex-grow" aria-label={`View deck: ${deck.name}`}>
        <div className="flex flex-col flex-grow bg-card p-4 pb-2">
          <CardHeader className="p-0 pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="font-headline text-lg mb-2">
                {deck.name}
              </CardTitle>
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
            <BookCheck className="w-4 h-4" />
            <span>{dueCount} due</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
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
