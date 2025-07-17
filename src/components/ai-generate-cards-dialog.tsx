
"use client"
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { generateFlashcards } from "@/app/actions";

interface AiGenerateCardsDialogProps {
    onCardsGenerated: (newCards: { front: string; back: string }[]) => void;
}

export function AiGenerateCardsDialog({ onCardsGenerated }: AiGenerateCardsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAiSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const topic = formData.get("topic") as string;
    
    toast({
      title: "Generating Cards...",
      description: `Please wait while we create flashcards about ${topic}.`,
    });
    
    const result = await generateFlashcards({ topic });
    
    if (result.success && result.data) {
      onCardsGenerated(result.data.flashcards);
      toast({
        title: "Cards Generated Successfully!",
        description: `${result.data.flashcards.length} new cards about "${topic}" have been added to your deck.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
    
    setIsSubmitting(false);
    setOpen(false);
    (event.target as HTMLFormElement).reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate cards with AI</DialogTitle>
          <DialogDescription>
            Add more cards to this deck by entering a topic.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAiSubmit}>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="topic-add" className="text-right">
                Topic
                </Label>
                <Input name="topic" id="topic-add" placeholder="e.g. Weather" className="col-span-3" required />
            </div>
            <p className="text-sm text-muted-foreground text-center col-span-4 px-4">
                Enter a topic and our AI will generate new flashcards and add them to your current deck.
            </p>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Generating...' : 'Generate Cards'}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
