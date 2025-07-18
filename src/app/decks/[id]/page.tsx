

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Trash2, Settings, Save, RefreshCw, BookCheck, Layers, Dot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddCardSheet } from '@/components/add-card-sheet';
import type { Deck, Card as CardType } from '@/lib/types';
import { basicDecks as initialDecks, cards as initialCards } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { EditCardSheet } from '@/components/edit-card-sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const MASTERY_THRESHOLD = 5; // SRS level 5+ is considered "mastered"

function ProgressCard({ cards: deckCards, cardCount }: { cards: CardType[], cardCount: number }) {
  const [learningCount, setLearningCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (deckCards.length > 0) {
      const now = new Date();
      const srsCards = deckCards.map(c => ({
        ...c,
        srsLevel: c.srsLevel ?? 0,
        nextReview: c.nextReview ? new Date(c.nextReview) : now,
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
  }, [deckCards]);

  const learningPercentage = cardCount > 0 ? (learningCount / cardCount) * 100 : 0;
  const masteredPercentage = cardCount > 0 ? (masteredCount / cardCount) * 100 : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Deck Progress</CardTitle>
      </CardHeader>
      <CardContent>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute h-full bg-primary/50 transition-all"
              style={{ width: `${learningPercentage + masteredPercentage}%` }}
            />
            <div
              className="absolute h-full bg-primary transition-all"
              style={{ width: `${masteredPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
              <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                      <Dot className="text-primary/50" />
                      <span>Learning ({Math.round(learningPercentage)}%)</span>
                  </div>
                   <div className="flex items-center gap-2">
                      <Dot className="text-primary" />
                      <span>Mastered ({Math.round(masteredPercentage)}%)</span>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold">
                  <BookCheck className="w-4 h-4"/>
                  <span>{dueCount} due</span>
              </div>
          </div>
      </CardContent>
    </Card>
  )
}

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const [deck, setDeck] = useState<Deck | undefined>(undefined);
  const [cards, setCards] = useState<CardType[]>([]);
  
  // State for editable deck details
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [sessionSize, setSessionSize] = useState<number | string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!deckId) return;

    // Load all decks from localStorage or fall back to initial data
    const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const allDecks = [...initialDecks, ...storedDecks];
    const currentDeck = allDecks.find((d) => d.id === deckId);
    setDeck(currentDeck);

    if (currentDeck) {
      setDeckName(currentDeck.name);
      setDeckDescription(currentDeck.description);
    }

    // Load session size setting
    const storedSettings = JSON.parse(localStorage.getItem(`deckSettings_${deckId}`) || '{}');
    setSessionSize(storedSettings.sessionSize || '');

    if (currentDeck) {
      if (currentDeck.isCustom) {
        // Load cards from localStorage for custom decks
        const storedCards = JSON.parse(localStorage.getItem(`cards_${deckId}`) || '[]');
        setCards(storedCards);
      } else {
        // Load cards from initial data for pre-generated decks, but check for stored progress
        const storedPregenCards = localStorage.getItem(`cards_${deckId}`);
        const pregenCards = storedPregenCards 
          ? JSON.parse(storedPregenCards)
          : initialCards.filter(card => card.deckId === deckId);
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
      srsLevel: 0,
      nextReview: new Date(),
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
    localStorage.removeItem(`deckSettings_${deckId}`);
    
    toast({
        title: 'Deck Deleted',
        description: `The deck "${deck?.name}" has been deleted.`,
    });

    router.push('/decks');
  };
  
  const handleSaveDeckDetails = () => {
    if (!deck?.isCustom) return;
    
    const storedDecks: Deck[] = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const updatedDecks = storedDecks.map(d => {
      if (d.id === deckId) {
        return { ...d, name: deckName, description: deckDescription };
      }
      return d;
    });
    localStorage.setItem('userDecks', JSON.stringify(updatedDecks));
    setDeck(prevDeck => prevDeck ? {...prevDeck, name: deckName, description: deckDescription} : undefined);
    
    toast({
        title: "Deck Updated",
        description: "Your deck details have been saved.",
    });
  };


  const handleSaveSettings = () => {
    const newSettings = {
        sessionSize: sessionSize === '' ? undefined : Number(sessionSize)
    };
    localStorage.setItem(`deckSettings_${deckId}`, JSON.stringify(newSettings));
    toast({
        title: "Settings Saved",
        description: "Your study settings have been updated.",
    });
  };

  const handleResetDeckProgress = () => {
    if (!deck) return;

    let deckCards: CardType[];
    if (deck.isCustom) {
        deckCards = JSON.parse(localStorage.getItem(`cards_${deckId}`) || '[]');
    } else {
        const storedCards = localStorage.getItem(`cards_${deckId}`);
        deckCards = storedCards ? JSON.parse(storedCards) : initialCards.filter(c => c.deckId === deckId);
    }
    
    const updatedCards = deckCards.map(card => {
        const { srsLevel, nextReview, ...rest } = card;
        return { ...rest, srsLevel: 0, nextReview: new Date() };
    });

    localStorage.setItem(`cards_${deckId}`, JSON.stringify(updatedCards));
    setCards(updatedCards); // Refresh the state on the page if needed

    toast({
        title: "Progress Reset",
        description: `Study progress for "${deck.name}" has been reset.`,
    });
    // Force reload of other components that rely on this data, like DeckCard on other pages.
    // A more sophisticated state management solution would be better, but for now this is simple.
    window.dispatchEvent(new Event('storage'));
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

      <ProgressCard cards={cards} cardCount={deck.cardCount} />
      
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="mb-4">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
        <TabsContent value="settings">
             <Card>
                <CardHeader>
                    <CardTitle>Deck Settings</CardTitle>
                    <CardDescription>Manage your study sessions and deck options.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {deck.isCustom && (
                        <div>
                            <h3 className="font-semibold text-lg">Deck Details</h3>
                            <div className="mt-2 p-4 border rounded-lg space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deck-name">Deck Name</Label>
                                    <Input 
                                        id="deck-name" 
                                        value={deckName}
                                        onChange={(e) => setDeckName(e.target.value)}
                                        placeholder="e.g. Japanese Food"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deck-description">Description</Label>
                                    <Textarea
                                        id="deck-description"
                                        value={deckDescription}
                                        onChange={(e) => setDeckDescription(e.target.value)}
                                        placeholder="What's this deck about?"
                                    />
                                </div>
                                <Button onClick={handleSaveDeckDetails}>
                                    <Save className="mr-2 h-4 w-4"/>
                                    Save Deck Details
                                </Button>
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-lg">Study Settings</h3>
                        <div className="mt-2 p-4 border rounded-lg">
                           <div className="max-w-sm space-y-2">
                             <Label htmlFor="session-size">Max cards per study session</Label>
                             <Input 
                                id="session-size" 
                                type="number" 
                                placeholder="All due cards"
                                value={sessionSize}
                                onChange={(e) => setSessionSize(e.target.value)}
                                min="1"
                                max={deck.cardCount > 0 ? deck.cardCount : undefined}
                             />
                             <p className="text-xs text-muted-foreground">Leave blank to review all due cards in one session.</p>
                           </div>
                           <Button className="mt-4" onClick={handleSaveSettings}>
                             <Save className="mr-2 h-4 w-4"/>
                             Save Settings
                           </Button>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
                         <div className="mt-2 p-4 border border-destructive/50 rounded-lg flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">Reset Study Progress</h4>
                                    <p className="text-sm text-muted-foreground">This will reset all SRS progress for this deck. This action cannot be undone.</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reset Progress
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently reset study progress for the <strong>{deck.name}</strong> deck.
                                                Your cards will not be deleted, but you will start over from the beginning. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleResetDeckProgress}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Yes, reset progress
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>

                            {deck.isCustom && (
                                <>
                                <hr className="border-destructive/20"/>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Delete this deck</h4>
                                        <p className="text-sm text-muted-foreground">This will permanently delete the deck and all of its cards. This action cannot be undone.</p>
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
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
