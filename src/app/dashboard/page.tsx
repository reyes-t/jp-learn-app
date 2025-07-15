import { DeckCard } from '@/components/deck-card';
import { Button } from '@/components/ui/button';
import { basicDecks, userDecks } from '@/lib/data';
import { PlusCircle, BookHeart } from 'lucide-react';
import { CreateDeckDialog } from '@/components/create-deck-dialog';

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome back!</h1>
          <p className="text-muted-foreground">Continue your Japanese learning journey.</p>
        </div>
        <CreateDeckDialog />
      </div>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2">
            <BookHeart className="text-primary"/>
            Your Decks
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
            <CreateDeckDialog />
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold font-headline mb-4">Browse Basic Decks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {basicDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>
    </div>
  );
}
