"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { grammarPoints } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Grammar Lessons</h1>
          <p className="text-muted-foreground">Key Japanese grammar points, simplified.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {grammarPoints.map(point => (
          <Link href={`/grammar/${point.id}`} key={point.id} className="no-underline">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="font-headline text-lg">{point.title}</CardTitle>
                {readLessons.has(point.id) && (
                   <div className="flex items-center gap-2 text-sm text-green-600">
                     <CheckCircle2 className="w-5 h-5" />
                     <span className="hidden md:inline">Read</span>
                   </div>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
