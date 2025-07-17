
"use client"
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  onFlip?: () => void;
}

export function Flashcard({ front, back, onFlip }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    // Only call onFlip the first time the card is flipped
    if (!isFlipped) {
      onFlip?.();
    }
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="w-full max-w-lg h-80 perspective-1000"
      onClick={handleFlip}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-700 transform-style-preserve-3d",
          { 'rotate-y-180': isFlipped }
        )}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className="w-full h-full flex flex-col justify-center items-center text-center p-6 cursor-pointer">
            <CardContent className="flex-grow flex flex-col justify-center items-center gap-4">
                <div className="text-5xl md:text-7xl font-bold font-headline">{front}</div>
            </CardContent>
            <div className="text-sm text-muted-foreground">Click to flip</div>
          </Card>
        </div>

        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <Card className="w-full h-full flex flex-col justify-center items-center text-center p-6 cursor-pointer">
            <CardContent className="flex-grow flex flex-col justify-center items-center gap-4">
                <div className="text-3xl md:text-4xl font-semibold font-headline">{back}</div>
            </CardContent>
             <div className="text-sm text-muted-foreground">Click to flip</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
