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

export function AddCardSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-headline">Add a new card</SheetTitle>
          <SheetDescription>
            Fill in the details for the front and back of your new card.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="front">Front</Label>
            <Input id="front" placeholder="e.g. 猫" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Back</Label>
            <Input id="back" placeholder="e.g. Cat (neko)" />
          </div>
        </div>
        <SheetFooter>
            <div className="flex flex-col w-full gap-2">
                <SheetClose asChild>
                    <Button type="submit">Save card</Button>
                </SheetClose>
                 <Button variant="secondary">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
