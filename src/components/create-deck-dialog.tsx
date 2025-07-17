
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
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Sparkles, Wand2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useToast } from "@/hooks/use-toast";
import { generateFlashcards } from "@/app/actions";
import type { Deck, Card } from "@/lib/types";

interface CreateDeckDialogProps {
    onDeckCreated: (newDeck: Deck) => void;
}

export function CreateDeckDialog({ onDeckCreated }: CreateDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    const newDeck: Deck = {
        id: `custom-${Date.now()}`,
        name,
        description,
        cardCount: 0,
        isCustom: true,
    };

    onDeckCreated(newDeck);
    
    toast({
      title: "Deck Created!",
      description: `The deck "${name}" has been created.`,
    });
    
    setIsSubmitting(false);
    setOpen(false);
    (event.target as HTMLFormElement).reset();
  };
  
  const handleAiSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const topic = formData.get("topic") as string;
    
    toast({
      title: "Generating Deck...",
      description: `Please wait while we create flashcards about ${topic}.`,
    });
    
    const result = await generateFlashcards({ topic });
    
    if (result.success && result.data) {
      const newDeckId = `ai-${Date.now()}`;
      const newDeck: Deck = {
        id: newDeckId,
        name: topic,
        description: `An AI-generated deck about ${topic}.`,
        cardCount: result.data.flashcards.length,
        isCustom: true,
      };
      
      const newCards: Card[] = result.data.flashcards.map((fc, index) => ({
        id: `card-${newDeckId}-${index}`,
        deckId: newDeckId,
        front: fc.front,
        back: fc.back,
      }));

      // Save the generated cards to localStorage
      localStorage.setItem(`cards_${newDeckId}`, JSON.stringify(newCards));

      onDeckCreated(newDeck);
      
      toast({
        title: "Deck Generated Successfully!",
        description: `Your new deck on "${topic}" is ready.`,
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new deck</DialogTitle>
          <DialogDescription>
            Build a new deck of flashcards from scratch or let our AI help you.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual"><Wand2 className="mr-2 h-4 w-4"/>Manual</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="mr-2 h-4 w-4"/>AI Generate</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input name="name" id="name" placeholder="e.g. Japanese Food" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea name="description" id="description" placeholder="What's this deck about?" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Deck'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="ai">
            <form onSubmit={handleAiSubmit}>
               <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="topic" className="text-right">
                    Topic
                  </Label>
                  <Input name="topic" id="topic" placeholder="e.g. Japanese Animals" className="col-span-3" required />
                </div>
                <p className="text-sm text-muted-foreground text-center col-span-4 px-4">
                  Enter a topic and our AI will generate a deck of flashcards for you.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Generating...' : 'Generate'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
