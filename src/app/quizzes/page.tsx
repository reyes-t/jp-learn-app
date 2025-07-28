
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
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';


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
    const sortedQuizzes = group.quizzes.sort((a, b) => {
        const levelOrder = { 'N5': 1, 'N4': 2, 'N3': 3, 'N2': 4, 'N1': 5 };
        return levelOrder[a.level!] - levelOrder[b.level!];
    });

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
            <CardFooter className="flex-wrap gap-2">
                {sortedQuizzes.map(quiz => <LevelQuizButton key={quiz.id} quiz={quiz} />)}
            </CardFooter>
        </Card>
    )
}

const LevelQuizButton = ({ quiz }: { quiz: QuizMeta }) => {
  const { user } = useAuth();
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const quizDataRef = doc(db, 'users', user.uid, 'quizData', quiz.id);
    const unsubscribe = onSnapshot(quizDataRef, (doc) => {
        if (doc.exists()) {
            setBestScore(doc.data().bestScore || null);
        } else {
            setBestScore(null);
        }
    });
    return () => unsubscribe();
  }, [quiz.id, user]);

  return (
      <Button variant="outline" size="sm" className="relative" asChild>
          <Link href={`/quizzes/${quiz.id}`}>
              {quiz.level}
              {bestScore !== null && bestScore === 100 && (
                <Trophy className="absolute -top-2 -right-2 w-4 h-4 text-amber-400" />
              )}
          </Link>
      </Button>
  )
}


const SingularQuizCard = ({ quiz }: { quiz: QuizMeta }) => {
    const { user } = useAuth();
    const [bestScore, setBestScore] = useState<number | null>(null);

    useEffect(() => {
        if (!user) return;
        const quizDataRef = doc(db, 'users', user.uid, 'quizData', quiz.id);
        const unsubscribe = onSnapshot(quizDataRef, (doc) => {
            if (doc.exists()) {
                setBestScore(doc.data().bestScore || null);
            }
        });
        return () => unsubscribe();
    }, [quiz.id, user]);

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
    const { user } = useAuth();
    const [reviewCount, setReviewCount] = useState<number | null>(null);

    useEffect(() => {
        if (!user) {
            setReviewCount(0);
            return;
        }

        const quizDataColRef = collection(db, 'users', user.uid, 'quizData');
        const unsubscribe = onSnapshot(quizDataColRef, (snapshot) => {
            let count = 0;
            snapshot.forEach((doc) => {
                const weights = doc.data().weights;
                if (weights) {
                    count += Object.values(weights).filter(w => (w as number) > 0).length;
                }
            });
            setReviewCount(count);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="font-headline">{quiz.title}</CardTitle>
                </div>
                <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
               
            </CardContent>
            <CardFooter>
                <Button className="w-full" asChild disabled={reviewCount === 0}>
                    <Link href={`/quizzes/${quiz.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Review ({reviewCount ?? 0})
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

  const orderedQuizzes = [...leveledQuizzes];
  const singularAndReview = [...singularQuizzes, ...(reviewQuiz ? [reviewQuiz] : [])];


  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with adaptive and listening quizzes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leveledQuizzes.map((group) => (
             <LevelQuizCard key={group.type} group={group} />
          ))}
          {singularQuizzes.map((quiz) => (
             <SingularQuizCard key={quiz.id} quiz={quiz} />
          ))}
          {reviewQuiz && <ReviewQuizCard quiz={reviewQuiz}/>}
      </div>
    </div>
  );
}
