"use client";

import { useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { grammarPoints } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function GrammarLessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  
  const lesson = grammarPoints.find((p) => p.id === lessonId);

  useEffect(() => {
    if (lesson) {
      localStorage.setItem(`grammar_read_${lesson.id}`, 'true');
    }
  }, [lesson]);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <Link
        href="/grammar"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all lessons
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">{lesson.title}</CardTitle>
          <CardDescription className="pt-2 text-base">{lesson.explanation}</CardDescription>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold text-lg font-headline mt-4 mb-3">Examples:</h4>
          <ul className="space-y-4">
            {lesson.examples.map((ex, index) => (
              <li key={index} className="pl-4 border-l-4 border-primary">
                <p className="font-medium text-xl">{ex.japanese}</p>
                <p className="text-muted-foreground">{ex.english}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
