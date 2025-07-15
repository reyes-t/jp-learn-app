"use client"
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

export function CreateDeckDialog() {
  return (
    <Dialog>
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" placeholder="e.g. Japanese Food" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" placeholder="What's this deck about?" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Deck</Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="ai">
             <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="topic" className="text-right">
                  Topic
                </Label>
                <Input id="topic" placeholder="e.g. Japanese Animals" className="col-span-3" />
              </div>
              <p className="text-sm text-muted-foreground text-center col-span-4 px-4">
                Enter a topic and our AI will generate a deck of flashcards for you.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
