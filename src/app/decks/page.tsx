
"use client";

import React, { useState } from 'react';
import { DeckCard } from '@/components/deck-card';
import { CreateDeckDialog } from '@/components/create-deck-dialog';
import { basicDecks as initialBasicDecks, userDecks as initialUserDecks } from '@/lib/data';
import { BookHeart } from 'lucide-react';
import type { Deck } from '@/lib/types';

export default function DecksPage() {
  const [userDecks, setUserDecks] = useState<Deck[]>(initialUserDecks);

  const handleDeckCreated = (newDeck: Deck) => {
    setUserDecks((prevDecks) => [newDeck, ...prevDecks]);
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {initialBasicDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>
    </div>
  );
}
