
"use client"
import { useState, useEffect } from 'react';
import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, PlayCircle, BrainCircuit, Sparkles, Trophy, Ear } from "lucide-react";
import Link from "next/link";
import type { QuizMeta } from '@/lib/types';

const ICONS = {
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
           <div className="text-sm text-muted-foreground">
              {quiz.id !== 'listening' 
                ? `This quiz pulls questions from all available ${quiz.id === 'grammar' ? 'lessons' : 'flashcards'} and adapts to your performance.`
                : 'Listen to sentences and write what you hear.'
              }
           </div>
           {bestScore !== null && (
            <div className="mt-4 flex items-center gap-2 text-amber-500 font-medium">
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
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with adaptive and listening quizzes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}
