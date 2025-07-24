
"use client"
import { useState, useEffect, useMemo } from 'react';
import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, BrainCircuit, Sparkles, Trophy, Ear, Lightbulb, History, Loader2 } from "lucide-react";
import Link from "next/link";
import type { QuizMeta } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ReactNode> = {
    grammar: <BrainCircuit className="text-primary"/>,
    vocabulary: <Sparkles className="text-primary"/>,
    listening: <Ear className="text-primary"/>,
    'creative-practice': <Lightbulb className="text-primary"/>,
    'review': <History className="text-primary"/>,
}

interface QuizCardProps {
  quiz: QuizMeta;
}

const LevelQuizCard = ({ group }: { group: { title: string, type: string, quizzes: QuizMeta[] } }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="font-headline">{group.title}</CardTitle>
                </div>
                <CardDescription>Test your knowledge of {group.type} points.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
                {group.quizzes.map(quiz => <LevelQuizButton key={quiz.id} quiz={quiz} />)}
            </CardFooter>
        </Card>
    )
}

const LevelQuizButton = ({ quiz }: { quiz: QuizMeta }) => {
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    const score = localStorage.getItem(`quiz_best_score_${quiz.id}`);
    if (score) {
      setBestScore(JSON.parse(score));
    }
     const handleStorageChange = () => {
      const score = localStorage.getItem(`quiz_best_score_${quiz.id}`);
      setBestScore(score ? JSON.parse(score) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [quiz.id]);

  return (
      <Button variant="outline" className="w-full justify-between h-14" asChild>
          <Link href={`/quizzes/${quiz.id}`}>
              <div className="flex items-center gap-2">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-semibold text-base">{quiz.level}</div>
                  </div>
              </div>
               {bestScore !== null && (
                <div className="flex items-center gap-2 text-amber-500 font-medium text-xs">
                  <Trophy className="w-4 h-4" />
                  <span>Best: {bestScore}%</span>
                </div>
              )}
          </Link>
      </Button>
  )
}


const SingularQuizCard = ({ quiz }: { quiz: QuizMeta }) => {
    const [bestScore, setBestScore] = useState<number | null>(null);

    useEffect(() => {
        const score = localStorage.getItem(`quiz_best_score_${quiz.id}`);
        if (score) {
            setBestScore(JSON.parse(score));
        }
    }, [quiz.id]);

    const href = quiz.type === 'creative-practice' ? `/quizzes/creative-practice` : `/quizzes/${quiz.id}`;

    return (
    <Card className="flex flex-col">
      <CardHeader>
          <div className="flex items-start justify-between">
              <CardTitle className="font-headline">{quiz.title}</CardTitle>
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
    )
}

const ReviewQuizCard = ({ quiz }: { quiz: QuizMeta }) => {
    const [reviewCount, setReviewCount] = useState<number | null>(null);

    useEffect(() => {
        const getReviewCount = () => {
            let count = 0;
            quizzes.forEach(q => {
                if (q.type !== 'review') {
                    const weights = localStorage.getItem(`quiz_weights_${q.id}`);
                    if (weights) {
                        const parsedWeights: Record<string, number> = JSON.parse(weights);
                        count += Object.values(parsedWeights).filter(w => w > 0).length;
                    }
                }
            });
            return count;
        };
        
        setReviewCount(getReviewCount());

        const handleStorageChange = () => {
            setReviewCount(getReviewCount());
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="font-headline">{quiz.title}</CardTitle>
                </div>
                <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {reviewCount === null ? (
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        <span>Checking for items...</span>
                    </div>
                ) : reviewCount > 0 ? (
                    <div className="flex items-center gap-2 font-medium text-primary">
                        <History className="w-4 h-4"/>
                        <span>{reviewCount} items to review</span>
                    </div>
                ) : (
                    <p className="text-muted-foreground">You're all caught up!</p>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" asChild disabled={reviewCount === 0}>
                    <Link href={`/quizzes/${quiz.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Review
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function QuizzesPage() {
  
  const leveledQuizzes = useMemo(() => {
    const groups: Record<string, {title: string, type: string, quizzes: QuizMeta[]}> = {
        grammar: { title: 'Grammar Quiz', type: 'grammar', quizzes: [] },
        vocabulary: { title: 'Vocabulary Quiz', type: 'vocabulary', quizzes: [] },
        listening: { title: 'Listening Quiz', type: 'listening', quizzes: [] },
    };
    quizzes.forEach((quiz) => {
        if (quiz.level && groups[quiz.type]) {
            groups[quiz.type].quizzes.push(quiz);
        }
    });
    return Object.values(groups).filter(g => g.quizzes.length > 0);
  }, []);

  const singularQuizzes = useMemo(() => quizzes.filter(q => q.type === 'creative-practice'), []);
  const reviewQuiz = useMemo(() => quizzes.find(q => q.type === 'review'), []);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with adaptive and listening quizzes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewQuiz && <ReviewQuizCard quiz={reviewQuiz}/>}
          {leveledQuizzes.map((group) => (
             <LevelQuizCard key={group.type} group={group} />
          ))}
          {singularQuizzes.map((quiz) => (
             <SingularQuizCard key={quiz.id} quiz={quiz} />
          ))}
      </div>
    </div>
  );
}

    

