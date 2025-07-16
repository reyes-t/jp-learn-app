
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Pencil } from "lucide-react"
import type { Card } from "@/lib/types";

interface EditCardSheetProps {
  card: Card;
  onCardUpdated: (updatedCard: Card) => void;
}

export function EditCardSheet({ card, onCardUpdated }: EditCardSheetProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  useEffect(() => {
    setFront(card.front);
    setBack(card.back);
  }, [card]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (front && back) {
      onCardUpdated({ ...card, front, back });
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle className="font-headline">Edit card</SheetTitle>
            <SheetDescription>
              Update the details for the front and back of your card.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-front-${card.id}`}>Front</Label>
              <Input
                id={`edit-front-${card.id}`}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-back-${card.id}`}>Back</Label>
              <Input
                id={`edit-back-${card.id}`}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                required
              />
            </div>
          </div>
          <SheetFooter>
              <Button type="submit">Save changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
