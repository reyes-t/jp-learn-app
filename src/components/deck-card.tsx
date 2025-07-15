import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Deck } from '@/lib/types';
import { Layers } from 'lucide-react';

type DeckCardProps = {
  deck: Deck;
};

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <Link href={`/dashboard/decks/${deck.id}`} className="block">
          <div className="relative aspect-video">
            <Image
              src={deck.imageUrl || 'https://placehold.co/600x400.png'}
              alt={deck.name}
              fill
              className="object-cover"
              data-ai-hint={deck.aiHint}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg mb-2">
                <Link href={`/dashboard/decks/${deck.id}`} className="hover:text-primary transition-colors">
                    {deck.name}
                </Link>
            </CardTitle>
            {deck.isCustom && <Badge variant="outline">Custom</Badge>}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="w-4 h-4"/>
            <span>{deck.cardCount} cards</span>
        </div>
        <Button asChild size="sm">
          <Link href={`/dashboard/decks/${deck.id}/study`}>Study</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
