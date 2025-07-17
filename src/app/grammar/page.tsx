"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { grammarPoints } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, BookCopy } from 'lucide-react';
import type { GrammarPoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface GrammarLessonCardProps {
  point: GrammarPoint;
  isRead: boolean;
}

const GrammarLessonCard = ({ point, isRead }: GrammarLessonCardProps) => (
  <Link href={`/grammar/${point.id}`} className="no-underline group">
    <Card className="hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-start justify-between p-4 space-x-4">
        <div>
          <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{point.title}</CardTitle>
          <CardDescription className="mt-2 text-sm line-clamp-2">{point.explanation}</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2">
            <Badge variant="outline">{point.level}</Badge>
            {isRead && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Read</span>
                </div>
            )}
        </div>
      </CardHeader>
    </Card>
  </Link>
);


export default function GrammarPage() {
  const [readLessons, setReadLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    const read = new Set<string>();
    grammarPoints.forEach(point => {
      if (localStorage.getItem(`grammar_read_${point.id}`)) {
        read.add(point.id);
      }
    });
    setReadLessons(read);
  }, []);

  const n5Lessons = useMemo(() => grammarPoints.filter(p => p.level === 'N5'), []);
  const n4Lessons = useMemo(() => grammarPoints.filter(p => p.level === 'N4'), []);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Grammar Lessons</h1>
          <p className="text-muted-foreground">Key Japanese grammar points, simplified.</p>
        </div>
      </div>
      
      <section id="n5">
        <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2">
            <BookCopy className="text-primary"/>
            N5 Grammar (Beginner)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {n5Lessons.map(point => (
            <GrammarLessonCard key={point.id} point={point} isRead={readLessons.has(point.id)} />
          ))}
        </div>
      </section>

      <section id="n4" className="mt-12">
        <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2">
            <BookCopy className="text-primary"/>
            N4 Grammar (Lower Intermediate)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {n4Lessons.map(point => (
            <GrammarLessonCard key={point.id} point={point} isRead={readLessons.has(point.id)} />
          ))}
        </div>
      </section>

    </div>
  )
}
