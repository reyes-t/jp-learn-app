
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PlusCircle, Sparkles } from "lucide-react"

interface AddCardSheetProps {
  onCardAdded: (card: { front: string; back: string }) => void;
}

export function AddCardSheet({ onCardAdded }: AddCardSheetProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (front && back) {
      onCardAdded({ front, back });
      setFront("");
      setBack("");
      setOpen(false); // Close the sheet after adding
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle className="font-headline">Add a new card</SheetTitle>
            <SheetDescription>
              Fill in the details for the front and back of your new card.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front</Label>
              <Input
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="e.g. 猫"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Back</Label>
              <Input
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="e.g. Cat (neko)"
                required
              />
            </div>
          </div>
          <SheetFooter>
              <div className="flex flex-col w-full gap-2">
                  <Button type="submit">Save card</Button>
                   <Button variant="secondary" type="button">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                  </Button>
              </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
