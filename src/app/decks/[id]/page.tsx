
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddCardSheet } from '@/components/add-card-sheet';
import type { Deck, Card as CardType } from '@/lib/types';
import { allDecks as initialDecks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { EditCardSheet } from '@/components/edit-card-sheet';

export default function DeckDetailPage() {
  const params = useParams();
  const deckId = params.id as string;
  const [deck, setDeck] = useState<Deck | undefined>(undefined);
  const [cards, setCards] = useState<CardType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!deckId) return;

    // Load all decks from localStorage or fall back to initial data
    const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const allDecks = [...initialDecks, ...storedDecks];
    const currentDeck = allDecks.find((d) => d.id === deckId);
    setDeck(currentDeck);

    // Load cards from localStorage or fall back to empty array
    const storedCards = JSON.parse(localStorage.getItem(`cards_${deckId}`) || '[]');
    setCards(storedCards);
  }, [deckId]);

  const handleCardAdded = (newCard: { front: string; back: string }) => {
    const newCardWithId: CardType = {
      id: `card-${Date.now()}`,
      deckId: deckId,
      ...newCard,
    };
    
    const updatedCards = [...cards, newCardWithId];
    setCards(updatedCards);
    localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedCards));

    // Also update the card count in the deck list
    const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const updatedDecks = storedDecks.map((d: Deck) => 
      d.id === deckId ? { ...d, cardCount: updatedCards.length } : d
    );
    localStorage.setItem('userDecks', JSON.stringify(updatedDecks));


    toast({
        title: "Card Added!",
        description: "Your new card has been saved to the deck.",
    });
  };

  const handleCardUpdated = (updatedCard: CardType) => {
    const updatedCards = cards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    );
    setCards(updatedCards);
    localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedCards));
    toast({
      title: 'Card Updated!',
      description: 'Your changes have been saved.',
    });
  };

  if (!deck) {
    // Still loading or not found
    return null; 
  }

  return (
    <div className="container mx-auto">
       <Link
          href="/decks"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all decks
        </Link>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{deck.name}</h1>
          <p className="text-muted-foreground mt-1">{deck.description}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/decks/${deck.id}/study`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Study Deck
            </Link>
          </Button>
          <AddCardSheet onCardAdded={handleCardAdded} />
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Cards in this Deck</CardTitle>
                    <CardDescription>
                        This deck has {cards.length} card{cards.length === 1 ? '' : 's'}.
                    </CardDescription>
                </div>
                <Button variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Front</TableHead>
                        <TableHead>Back</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cards.length > 0 ? (
                        cards.map((card) => (
                            <TableRow key={card.id}>
                                <TableCell className="font-medium">{card.front}</TableCell>
                                <TableCell>{card.back}</TableCell>
                                <TableCell className="text-right">
                                    <EditCardSheet card={card} onCardUpdated={handleCardUpdated} />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No cards yet. Add one to get started!
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
