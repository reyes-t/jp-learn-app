
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, BrainCircuit, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { basicDecks, quizzes } from "@/lib/data";
import type { Deck, Card as CardType } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, writeBatch, query, where, getDoc } from "firebase/firestore";

export default function AccountPage() {
  const { toast } = useToast();
  const { user, updateUserProfile, changePassword } = useAuth();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
        setName(user.displayName || '');
    }
  }, [user]);

  const handleResetProgress = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Reset progress for basic decks
      for (const deck of basicDecks) {
        const cardsRef = collection(db, "users", user.uid, "decks", deck.id, "cards");
        const cardsSnapshot = await getDocs(cardsRef);
        cardsSnapshot.forEach(cardDoc => {
          batch.update(cardDoc.ref, { srsLevel: 0, nextReview: new Date() });
        });
      }

      // Reset progress for custom decks
      const customDecksRef = collection(db, "users", user.uid, "decks");
      const customDecksQuery = query(customDecksRef, where("isCustom", "==", true));
      const customDecksSnapshot = await getDocs(customDecksQuery);

      for (const deckDoc of customDecksSnapshot.docs) {
          const cardsRef = collection(deckDoc.ref, "cards");
          const cardsSnapshot = await getDocs(cardsRef);
          cardsSnapshot.forEach(cardDoc => {
              batch.update(cardDoc.ref, { srsLevel: 0, nextReview: new Date() });
          });
      }

      await batch.commit();

      toast({
          title: "Progress Reset",
          description: "All your study progress has been successfully reset.",
      });
    } catch (error) {
       console.error("Error resetting progress: ", error);
       toast({
          title: "Error",
          description: "Could not reset your progress. Please try again.",
          variant: "destructive"
       });
    }
  };

  const handleResetQuizHistory = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      for (const quiz of quizzes) {
        const quizDataRef = doc(db, "users", user.uid, "quizData", quiz.id);
        batch.delete(quizDataRef);
      }
      await batch.commit();
      
      toast({
          title: "Quiz History Reset",
          description: "Your adaptive quiz data has been cleared.",
      });
    } catch (error) {
       console.error("Error resetting quiz history: ", error);
       toast({
          title: "Error",
          description: "Could not reset quiz history. Please try again.",
          variant: "destructive"
       });
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
        await updateUserProfile(name);
        toast({
            title: "Profile Updated",
            description: "Your name has been successfully updated.",
        });
    } catch (error: any) {
        toast({
            title: "Update Failed",
            description: error.message || "Could not update your profile.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }
    if (!currentPassword || !newPassword) {
        toast({
            title: "Missing fields",
            description: "Please fill out all password fields.",
            variant: "destructive"
        });
        return;
    }

    setIsChangingPassword(true);
    try {
        await changePassword(currentPassword, newPassword);
        toast({
            title: "Password Changed",
            description: "Your password has been successfully updated.",
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        toast({
            title: "Password Change Failed",
            description: error.message || "An error occurred. Your current password may be incorrect.",
            variant: "destructive",
        });
    } finally {
        setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold font-headline mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your profile and account settings.</p>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your display name here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={user?.email || ''} disabled />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleProfileSave} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Change your password here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Quiz Settings</CardTitle>
                    <CardDescription>Manage your adaptive quiz settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-lg flex items-center justify-between">
                         <div>
                            <h4 className="font-medium">Reset Quiz Data</h4>
                            <p className="text-sm text-muted-foreground">This clears your quiz performance history. Quizzes will no longer adapt to your previous answers.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline">
                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                    Reset Quiz Data
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently clear your quiz performance history. The quizzes will no longer adapt to your incorrect answers until you take them again. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleResetQuizHistory}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Yes, reset quiz history
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h3 className="font-semibold text-lg text-destructive mb-2">Danger Zone</h3>
                <Card className="border-destructive/50">
                    <CardContent className="p-4 flex items-center justify-between">
                         <div>
                            <h4 className="font-medium">Reset All Study Progress</h4>
                            <p className="text-sm text-muted-foreground">This will reset all Spaced Repetition progress on every deck. Your decks and cards will not be deleted. This action cannot be undone.</p>
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
    </div>
  );
}
