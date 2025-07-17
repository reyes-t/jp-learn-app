
"use client"
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Volume2, Sparkles, Loader } from 'lucide-react';
import { generateSpeech } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  onFlip?: () => void;
}

export function Flashcard({ front, back, onFlip }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleFlip = () => {
    // Only call onFlip the first time the card is flipped
    if (!isFlipped) {
      onFlip?.();
    }
    setIsFlipped(!isFlipped);
  };

  const handlePronunciation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof front !== 'string') return;
    
    setIsGeneratingSpeech(true);
    try {
      const result = await generateSpeech(front);
      if (result.success && result.data) {
        if (audioRef.current) {
          audioRef.current.src = result.data.audioDataUri;
          audioRef.current.play();
        }
      } 
      else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate speech.",
        });
    } finally {
      setIsGeneratingSpeech(false);
    }
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
                <div className="flex gap-4 mt-4">
                    <Button variant="outline" size="icon" onClick={handlePronunciation} disabled={isGeneratingSpeech}>
                        {isGeneratingSpeech ? <Loader className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                        <span className="sr-only">Pronunciation</span>
                    </Button>
                     <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Example Sentence
                    </Button>
                </div>
            </CardContent>
             <div className="text-sm text-muted-foreground">Click to flip</div>
          </Card>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
