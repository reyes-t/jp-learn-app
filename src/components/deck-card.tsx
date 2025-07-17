
"use client"
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Deck } from '@/lib/types';
import { Layers } from 'lucide-react';
import { Progress } from './ui/progress';
import { useState, useEffect } from 'react';

type DeckCardProps = {
  deck: Deck;
};

export function DeckCard({ deck }: DeckCardProps) {
  const [progress, setProgress] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    const progressData = localStorage.getItem(`studyProgress_${deck.id}`);
    if (progressData) {
      const { correct, total } = JSON.parse(progressData);
      if (deck.cardCount > 0) { // check against current card count
        // Use `correct` for progress calculation, but cap at deck.cardCount
        const currentProgress = Math.min(correct, deck.cardCount);
        setProgress(Math.round((currentProgress / deck.cardCount) * 100));
        setStudiedCount(currentProgress);
      }
    }
  }, [deck.id, deck.cardCount]);

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg mb-2">
                <Link href={`/decks/${deck.id}`} className="hover:text-primary transition-colors">
                    {deck.name}
                </Link>
            </CardTitle>
            {deck.isCustom && <Badge variant="outline">Custom</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
        {progress > 0 && (
          <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                  <span className="text-xs font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2"/>
              <p className="text-xs text-muted-foreground mt-1">{studiedCount} of {deck.cardCount} cards mastered.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="w-4 h-4"/>
            <span>{deck.cardCount} cards</span>
        </div>
        <Button asChild size="sm">
          <Link href={`/decks/${deck.id}/study`}>Study</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
