
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { basicDecks } from "@/lib/data";
import type { Deck, Card as CardType } from "@/lib/types";


export default function AccountPage() {
  const { toast } = useToast();

  const handleResetProgress = () => {
    // Combine basic decks and user-created decks
    const userDecks: Deck[] = JSON.parse(localStorage.getItem('userDecks') || '[]');
    const allDecks: Deck[] = [...basicDecks, ...userDecks];

    allDecks.forEach(deck => {
        const cardKey = `cards_${deck.id}`;
        const storedCards = localStorage.getItem(cardKey);
        
        if (storedCards) {
            try {
                const cards: CardType[] = JSON.parse(storedCards);
                // Reset progress for each card
                const updatedCards = cards.map((card) => {
                    const { srsLevel, nextReview, ...rest } = card;
                    return { ...rest, srsLevel: 0, nextReview: new Date() };
                });
                localStorage.setItem(cardKey, JSON.stringify(updatedCards));
            } catch (error) {
                console.error(`Failed to parse or update cards for deck ${deck.id}`, error);
            }
        } else if (!deck.isCustom) {
            // For basic decks that might not have been touched yet, 
            // there won't be an entry in localStorage. We can ignore them
            // as they have no progress to reset.
        }
    });

    toast({
        title: "Progress Reset",
        description: "All your study progress has been successfully reset.",
    });

    // Optional: force a reload to reflect changes everywhere
    // window.location.reload();
  };

  return (
    <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold font-headline mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your profile and account settings.</p>

        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>This information will be displayed on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="Sakura Chan" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="sakura@example.com" />
                </div>
            </CardContent>
            <CardFooter>
                <Button>Save Changes</Button>
            </CardFooter>
        </Card>

        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                </div>
            </CardContent>
            <CardFooter>
                <Button>Change Password</Button>
            </CardFooter>
        </Card>

        <div className="mt-8">
            <h3 className="font-semibold text-lg text-destructive mb-2">Danger Zone</h3>
            <Card className="border-destructive/50">
                <CardContent className="p-4 flex items-center justify-between">
                     <div>
                        <h4 className="font-medium">Reset All Study Progress</h4>
                        <p className="text-sm text-muted-foreground">This will reset all your Spaced Repetition progress on every deck. Your decks and cards will not be deleted. This action cannot be undone.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Reset Progress
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently reset all study progress for every deck. You will start over from the beginning. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleResetProgress}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    Yes, reset all progress
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
