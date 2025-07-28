
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DeckCard } from '@/components/deck-card';
import { CreateDeckDialog } from '@/components/create-deck-dialog';
import { basicDecks as initialBasicDecks } from '@/lib/data';
import { BookHeart } from 'lucide-react';
import type { Deck } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function DecksPage() {
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUserDecks([]);
      return;
    };

    const decksRef = collection(db, 'users', user.uid, 'decks');
    const q = query(decksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const decks: Deck[] = [];
        snapshot.forEach((doc) => {
            decks.push({ id: doc.id, ...doc.data() } as Deck);
        });
        setUserDecks(decks);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeckCreated = useCallback(async (deckData: { name: string; description: string; }) => {
    if (!user) return;
    
    const newDeck: Omit<Deck, 'id'> = {
        ...deckData,
        cardCount: 0,
        isCustom: true,
        // @ts-ignore
        createdAt: new Date(),
    };
    
    await addDoc(collection(db, 'users', user.uid, 'decks'), newDeck);
  }, [user]);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Your Decks</h1>
          <p className="text-muted-foreground">Manage your flashcard decks.</p>
        </div>
        <CreateDeckDialog onDeckCreated={handleDeckCreated} />
      </div>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2">
            <BookHeart className="text-primary"/>
            Your Custom Decks
        </h2>
        {userDecks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">You haven't created any decks yet.</p>
            <CreateDeckDialog onDeckCreated={handleDeckCreated} />
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold font-headline mb-4">Browse Basic Decks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialBasicDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>
    </div>
  );
}
