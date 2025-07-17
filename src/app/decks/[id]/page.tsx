

"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Sparkles, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddCardSheet } from '@/components/add-card-sheet';
import type { Deck, Card as CardType } from '@/lib/types';
import { allDecks as initialDecks, cards as initialCards } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { EditCardSheet } from '@/components/edit-card-sheet';
import { AiGenerateCardsDialog } from '@/components/ai-generate-cards-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
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

    if (currentDeck) {
      if (currentDeck.isCustom) {
        // Load cards from localStorage for custom decks
        const storedCards = JSON.parse(localStorage.getItem(`cards_${deckId}`) || '[]');
        setCards(storedCards);
      } else {
        // Load cards from initial data for pre-generated decks
        const pregenCards = initialCards.filter(card => card.deckId === deckId);
        setCards(pregenCards);
      }
    }
  }, [deckId]);

  const updateCardCountInStorage = (deckId: string, newCount: number) => {
      const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
      const updatedDecks = storedDecks.map((d: Deck) =>
        d.id === deckId ? { ...d, cardCount: newCount } : d
      );
      localStorage.setItem('userDecks', JSON.stringify(updatedDecks));
      setDeck(prevDeck => prevDeck ? {...prevDeck, cardCount: newCount} : undefined);
  };


  const handleCardAdded = (newCard: { front: string; back: string }) => {
    const newCardWithId: CardType = {
      id: `card-${Date.now()}`,
      deckId: deckId,
      ...newCard,
    };
    
    const updatedCards = [...cards, newCardWithId];
    setCards(updatedCards);
    localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedCards));
    updateCardCountInStorage(deckId, updatedCards.length);

    toast({
        title: "Card Added!",
        description: "Your new card has been saved to the deck.",
    });
  };

  const handleCardsGenerated = (newCards: { front: string; back: string }[]) => {
    const newCardsWithIds = newCards.map((card, index) => ({
      id: `card-${Date.now()}-${index}`,
      deckId,
      ...card,
    }));

    const updatedCards = [...cards, ...newCardsWithIds];
    setCards(updatedCards);
    localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedCards));
    updateCardCountInStorage(deckId, updatedCards.length);
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
  
  const handleCardDeleted = (cardId: string) => {
    const updatedCards = cards.filter(card => card.id !== cardId);
    setCards(updatedCards);
    localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedCards));
    updateCardCountInStorage(deckId, updatedCards.length);
    toast({
        title: 'Card Deleted',
        description: 'The card has been removed from your deck.',
    });
  };

  const handleDeleteDeck = () => {
    const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const updatedDecks = storedDecks.filter((d: Deck) => d.id !== deckId);
    localStorage.setItem('userDecks', JSON.stringify(updatedDecks));
    localStorage.removeItem(`cards_${deckId}`);
    localStorage.removeItem(`studyProgress_${deckId}`);
    
    toast({
        title: 'Deck Deleted',
        description: `The deck "${deck?.name}" has been deleted.`,
    });

    router.push('/decks');
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
          {deck.isCustom && <AddCardSheet onCardAdded={handleCardAdded} />}
        </div>
      </div>
      
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="mb-4">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            {deck.isCustom && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="cards">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Cards in this Deck</CardTitle>
                            <CardDescription>
                                This deck has {cards.length} card{cards.length === 1 ? '' : 's'}.
                            </CardDescription>
                        </div>
                        {deck.isCustom && (
                        <AiGenerateCardsDialog onCardsGenerated={handleCardsGenerated} />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Front</TableHead>
                                <TableHead>Back</TableHead>
                                {deck.isCustom && <TableHead className="text-right w-[180px]">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cards.length > 0 ? (
                                cards.map((card) => (
                                    <TableRow key={card.id}>
                                        <TableCell className="font-medium">{card.front}</TableCell>
                                        <TableCell>{card.back}</TableCell>
                                        {deck.isCustom && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <EditCardSheet card={card} onCardUpdated={handleCardUpdated} />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete this card.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleCardDeleted(card.id)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={deck.isCustom ? 3 : 2} className="h-24 text-center">
                                        No cards yet. {deck.isCustom ? "Add one to get started!" : ""}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        {deck.isCustom && (
            <TabsContent value="settings">
                 <Card>
                    <CardHeader>
                        <CardTitle>Deck Settings</CardTitle>
                        <CardDescription>Manage your custom deck.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
                         <div className="mt-2 p-4 border border-destructive/50 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Delete this deck</h4>
                                <p className="text-sm text-muted-foreground">Once you delete this deck, all of its cards and study progress will be lost. This action cannot be undone.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Deck
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the <strong>{deck.name}</strong> deck and all of its cards. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteDeck}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            Yes, delete deck
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         </div>
                    </CardContent>
                </Card>
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
