
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
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, query, orderBy, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';


const MASTERY_THRESHOLD = 5; // SRS level 5+ is considered "mastered"

function ProgressCard({ cards: deckCards, cardCount, sessionSize, lastSessionCompletedAt, dueCount }: { cards: CardType[], cardCount: number, sessionSize?: number | null, lastSessionCompletedAt?: Date | null, dueCount: number }) {
  const [learningCount, setLearningCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    if (deckCards.length > 0) {
      const srsCards = deckCards.map(c => ({
        ...c,
        srsLevel: c.srsLevel ?? 0,
      }));

      const learning = srsCards.filter(c => (c.srsLevel || 0) > 0 && (c.srsLevel || 0) < MASTERY_THRESHOLD).length;
      setLearningCount(learning);

      const mastered = srsCards.filter(c => (c.srsLevel || 0) >= MASTERY_THRESHOLD).length;
      setMasteredCount(mastered);

    } else {
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
            <BookCheck className="w-4 h-4" />
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
  const { user } = useAuth();

  const [deck, setDeck] = useState<Deck | undefined>(undefined);
  const [cards, setCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);
  const { toast } = useToast();

  const isBasicDeck = useMemo(() => initialDecks.some(d => d.id === deckId), [deckId]);

  const deckRef = useMemo(() => {
    if (!user || !deckId) return null;
    return doc(db, 'users', user.uid, 'decks', deckId);
  }, [user, deckId]);

  const cardsRef = useMemo(() => {
    if (!deckRef) return null;
    return collection(deckRef, 'cards');
  }, [deckRef]);


  // Effect for deck details and settings
  useEffect(() => {
    if (!user || !deckId) return;

    let unsub: () => void;
    if (isBasicDeck) {
      const basicDeckData = initialDecks.find(d => d.id === deckId)!;
      // Fetch or create deck document in Firestore for basic decks to store settings
      const deckDocRef = doc(db, "users", user.uid, "decks", deckId);

      const getOrCreateDeck = async () => {
        const docSnap = await getDoc(deckDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const lastSessionCompletedAt = data.lastSessionCompletedAt ? data.lastSessionCompletedAt.toDate() : null;
          setDeck({ ...basicDeckData, ...data, lastSessionCompletedAt });
        } else {
          // If it doesn't exist, create it with default data
          await setDoc(deckDocRef, { ...basicDeckData, id: deckId }, { merge: true });
          setDeck(basicDeckData);
        }
      }
      getOrCreateDeck();
      unsub = onSnapshot(deckDocRef, (doc) => {
        const data = doc.data();
        const lastSessionCompletedAt = data?.lastSessionCompletedAt ? data.lastSessionCompletedAt.toDate() : null;
        setDeck({ ...basicDeckData, ...data, lastSessionCompletedAt });
      });

    } else {
      // For custom decks
      if (!deckRef) return;
      unsub = onSnapshot(deckRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const lastSessionCompletedAt = data.lastSessionCompletedAt ? data.lastSessionCompletedAt.toDate() : null;
          setDeck({ id: doc.id, ...data, lastSessionCompletedAt } as Deck);
        } else {
          // Handle case where custom deck is not found
        }
      });
    }

    return () => unsub && unsub();
  }, [user, deckId, isBasicDeck, deckRef]);

  // Effect for fetching cards and calculating due count
  useEffect(() => {
    if (!user || !deckId) return;
    setIsLoading(true);
    let unsubCards: () => void;
    const cardsColRef = collection(db, 'users', user.uid, 'decks', deckId, 'cards');

    const getCards = async () => {
      const snapshot = await getDocs(cardsColRef);
      if (snapshot.empty && isBasicDeck) {
        // Cards for this basic deck not yet in Firestore, let's add them
        const batch = writeBatch(db);
        const originalCards = initialCards.filter(c => c.deckId === deckId);

        if (originalCards.length === 0) {
          console.warn(`No initial cards found for deck ${deckId}`);
          return;
        }

        originalCards.forEach(card => {
          const cardRef = doc(cardsColRef, card.id);
          batch.set(cardRef, {
            ...card,
            srsLevel: 0,
            nextReview: new Date()
          });
        });
        await batch.commit();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const q = query(cardsColRef, orderBy('front'));
      unsubCards = onSnapshot(q, (snapshot) => {
        const fetchedCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardType));
        setCards(fetchedCards);

        const now = new Date();
        const srsCards = fetchedCards.map(c => ({
            ...c,
            nextReview: c.nextReview ? (c.nextReview as any).toDate() : now,
        }));

        const actualDue = srsCards.filter(c => c.nextReview <= now).length;
        
        const lastSessionCompletedAt = (deck as any)?.lastSessionCompletedAt;
        let sessionSize = (deck as any)?.sessionSize;

        if (lastSessionCompletedAt && isToday(lastSessionCompletedAt) && actualDue > 0) {
            setDueCount(0);
        } else if (sessionSize && actualDue > sessionSize) {
            setDueCount(sessionSize);
        } else {
            setDueCount(actualDue);
        }

        setIsLoading(false);
      });
    }

    getCards();

    return () => unsubCards && unsubCards();
  }, [user, deckId, isBasicDeck, deck]);


  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [sessionSize, setSessionSize] = useState<number | string>('');

  useEffect(() => {
    if (deck) {
      setDeckName(deck.name);
      setDeckDescription(deck.description);
      setSessionSize((deck as any).sessionSize ?? '');
    }
  }, [deck]);


  const handleCardAdded = async (newCard: { front: string; back: string }) => {
    if (!cardsRef || !deckRef) return;

    const cardWithData: Omit<CardType, 'id' | 'deckId'> = {
      ...newCard,
      srsLevel: 0,
      nextReview: new Date(),
    };

    await addDoc(cardsRef, cardWithData);
    await updateDoc(deckRef, { cardCount: cards.length + 1 });

    toast({
      title: "Card Added!",
      description: "Your new card has been saved to the deck.",
    });
  };

  const handleCardUpdated = async (updatedCard: CardType) => {
    if (!cardsRef) return;
    const cardDocRef = doc(cardsRef, updatedCard.id);
    await updateDoc(cardDocRef, {
      front: updatedCard.front,
      back: updatedCard.back
    });

    toast({
      title: 'Card Updated!',
      description: 'Your changes have been saved.',
    });
  };

  const handleCardDeleted = async (cardId: string) => {
    if (!cardsRef || !deckRef) return;
    await deleteDoc(doc(cardsRef, cardId));
    await updateDoc(deckRef, { cardCount: cards.length - 1 });
    toast({
      title: 'Card Deleted',
      description: 'The card has been removed from your deck.',
    });
  };

  const handleDeleteDeck = async () => {
    if (!deckRef) return;
    // Note: This requires a cloud function for full recursive delete.
    // For now, we just delete the deck doc. Cards become orphaned.
    await deleteDoc(deckRef);
    toast({
      title: 'Deck Deleted',
      description: `The deck "${deck?.name}" has been deleted.`,
    });
    router.push('/decks');
  };

  const handleSaveDeckDetails = async () => {
    if (!deck?.isCustom || !deckRef) return;
    await updateDoc(deckRef, {
      name: deckName,
      description: deckDescription,
    });
    toast({
      title: "Deck Updated",
      description: "Your deck details have been saved.",
    });
  };


  const handleSaveSettings = async () => {
    if (!deckRef) return;
    const size = sessionSize === '' ? null : Number(sessionSize);
    await setDoc(deckRef, { sessionSize: size }, { merge: true });
    toast({
      title: "Settings Saved",
      description: "Your study settings have been updated.",
    });
  };

  const handleResetDeckProgress = async () => {
    if (!cardsRef || !deckRef) return;
    const batch = writeBatch(db);
    const cardsSnapshot = await getDocs(cardsRef);
    cardsSnapshot.forEach((doc) => {
      batch.update(doc.ref, { srsLevel: 0, nextReview: new Date() });
    });
    await batch.commit();

    await updateDoc(deckRef, { lastSessionCompletedAt: null });

    toast({
      title: "Progress Reset",
      description: `Study progress for "${deck?.name}" has been reset.`,
    });
  };


  if (!deck) {
    return (
      <div className="container mx-auto">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-10 w-96 mb-2" />
        <Skeleton className="h-6 w-full max-w-lg mb-6" />
        <Skeleton className="h-40 w-full mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
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
          <Button asChild disabled={dueCount === 0}>
            <Link href={`/decks/${deck.id}/study`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Study Deck
            </Link>
          </Button>
          {deck.isCustom && <AddCardSheet onCardAdded={handleCardAdded} />}
        </div>
      </div>

      <ProgressCard 
        cards={cards} 
        cardCount={deck.cardCount} 
        sessionSize={(deck as any).sessionSize}
        lastSessionCompletedAt={(deck as any).lastSessionCompletedAt}
        dueCount={dueCount}
      />

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
                    This deck has {isLoading ? '...' : `${cards.length} card${cards.length === 1 ? '' : 's'}`}.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
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
              )}
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
                      <Save className="mr-2 h-4 w-4" />
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
                    <Save className="mr-2 h-4 w-4" />
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
                      <hr className="border-destructive/20" />
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
