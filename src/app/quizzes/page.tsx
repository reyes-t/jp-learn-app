
"use client"
import { useState, useEffect } from 'react';
import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, PlayCircle, BrainCircuit, Sparkles, Trophy, Ear, Wand2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { QuizMeta, GeneratedPhrase } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generatePhrase } from '@/ai/flows/generate-phrase-flow';

const ICONS: Record<QuizMeta['id'], React.ReactNode> = {
    grammar: <BrainCircuit className="text-primary"/>,
    vocabulary: <Sparkles className="text-primary"/>,
    listening: <Ear className="text-primary"/>,
}

interface QuizCardProps {
  quiz: QuizMeta;
}

const QuizCard = ({ quiz }: QuizCardProps) => {
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    if (quiz.id === 'listening') return; // No score for listening quiz yet
    const score = localStorage.getItem(`quiz_best_score_${quiz.id}`);
    if (score) {
      setBestScore(JSON.parse(score));
    }
  }, [quiz.id]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
          <div className="flex items-start justify-between">
              <CardTitle className="font-headline">{quiz.title}</CardTitle>
              {ICONS[quiz.id]}
          </div>
          <CardDescription>{quiz.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
           {bestScore !== null && (
            <div className="flex items-center gap-2 text-amber-500 font-medium">
              <Trophy className="w-4 h-4" />
              <span>Best Score: {bestScore}%</span>
            </div>
          )}
      </CardContent>
      <CardFooter>
          <Button className="w-full" asChild>
              <Link href={`/quizzes/${quiz.id}`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Quiz
              </Link>
          </Button>
      </CardFooter>
    </Card>
  );
};

export default function QuizzesPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState<GeneratedPhrase | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleGenerateClick = async () => {
    setIsDialogOpen(true);
    setIsGenerating(true);
    try {
      const phrase = await generatePhrase();
      setGeneratedPhrase(phrase);
    } catch (error) {
      console.error("Failed to generate phrase:", error);
      // Optionally, show a toast notification for the error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with adaptive and listening quizzes.</p>
        </div>
        <Button variant="outline" onClick={handleGenerateClick} disabled={isGenerating}>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate a Phrase
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Generated Phrase</DialogTitle>
            <DialogDescription>
              Here's a new phrase to practice, generated just for you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </div>
            ) : generatedPhrase ? (
              <div className="space-y-4">
                 <div className="pl-4 border-l-4 border-primary">
                    <p className="font-medium text-2xl">{generatedPhrase.japanese}</p>
                    <p className="text-muted-foreground">{generatedPhrase.romaji}</p>
                  </div>
                  <p><span className="font-semibold">Meaning:</span> {generatedPhrase.english}</p>
              </div>
            ) : (
              <p>Could not generate a phrase. Please try again.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
