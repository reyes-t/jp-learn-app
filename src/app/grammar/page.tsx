
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { grammarPoints } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import type { GrammarPoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const lessonsByLevel = useMemo(() => {
    const levels: ('N5' | 'N4' | 'N3' | 'N2' | 'N1')[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
    return levels.map(level => ({
      level,
      points: grammarPoints.filter(p => p.level === level)
    }));
  }, []);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Grammar Lessons</h1>
          <p className="text-muted-foreground">Key Japanese grammar points, simplified.</p>
        </div>
      </div>
      
      <Tabs defaultValue="n5" className="w-full">
        <TabsList className="mb-4">
            {lessonsByLevel.map(group => 
                group.points.length > 0 && <TabsTrigger key={group.level} value={group.level.toLowerCase()}>{group.level}</TabsTrigger>
            )}
        </TabsList>
        {lessonsByLevel.map(group => (
            group.points.length > 0 && (
                <TabsContent key={group.level} value={group.level.toLowerCase()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.points.map(point => (
                        <GrammarLessonCard key={point.id} point={point} isRead={readLessons.has(point.id)} />
                    ))}
                    </div>
                </TabsContent>
            )
        ))}
      </Tabs>

    </div>
  )
}
