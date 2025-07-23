
"use client"
import { useState, useEffect, useMemo } from 'react';
import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, BrainCircuit, Sparkles, Trophy, Ear, Lightbulb } from "lucide-react";
import Link from "next/link";
import type { QuizMeta } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const ICONS: Record<string, React.ReactNode> = {
    grammar: <BrainCircuit className="text-primary"/>,
    vocabulary: <Sparkles className="text-primary"/>,
    listening: <Ear className="text-primary"/>,
    'creative-practice': <Lightbulb className="text-primary"/>,
}

interface QuizCardProps {
  quiz: QuizMeta;
}

const QuizCard = ({ quiz }: QuizCardProps) => {
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    const score = localStorage.getItem(`quiz_best_score_${quiz.id}`);
    if (score) {
      setBestScore(JSON.parse(score));
    }
  }, [quiz.id]);

  const href = quiz.type === 'creative-practice'
      ? `/quizzes/${quiz.type}`
      : `/quizzes/${quiz.id}`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
          <div className="flex items-start justify-between">
              <CardTitle className="font-headline">{quiz.title}</CardTitle>
              {quiz.level && <Badge variant="secondary">{quiz.level}</Badge>}
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
              <Link href={href}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Quiz
              </Link>
          </Button>
      </CardFooter>
    </Card>
  );
};

export default function QuizzesPage() {
  
  const quizGroups = useMemo(() => {
    return quizzes.reduce((acc, quiz) => {
        const type = quiz.type;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(quiz);
        return acc;
    }, {} as Record<string, QuizMeta[]>);
  }, []);

  const groupTitles = {
      grammar: "Grammar Quizzes",
      vocabulary: "Vocabulary Quizzes",
      listening: "Listening Quizzes",
      'creative-practice': "Creative Practice"
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with adaptive and listening quizzes.</p>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(quizGroups).map(([type, quizzesInGroup]) => (
            <section key={type}>
                <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-3">
                    {ICONS[type]}
                    {groupTitles[type as keyof typeof groupTitles]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzesInGroup.map((quiz) => (
                      <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            </section>
        ))}
      </div>
    </div>
  );
}
