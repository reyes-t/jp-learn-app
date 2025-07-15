import { allDecks, cards as allCards } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, PlusCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddCardSheet } from '@/components/add-card-sheet';

export default function DeckDetailPage({ params }: { params: { id: string } }) {
  const deck = allDecks.find((d) => d.id === params.id);
  const cards = allCards.filter((c) => c.deckId === params.id);

  if (!deck) {
    notFound();
  }

  return (
    <div className="container mx-auto">
       <Link
          href="/dashboard"
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
            <Link href={`/dashboard/decks/${deck.id}/study`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Study Deck
            </Link>
          </Button>
          <AddCardSheet />
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
                                    <Button variant="ghost" size="sm">Edit</Button>
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
