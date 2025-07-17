"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { grammarPoints } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { summarizeGrammarPoints } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function GrammarLessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  
  const lesson = grammarPoints.find((p) => p.id === lessonId);
  const { toast } = useToast();

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  useEffect(() => {
    if (lesson) {
      localStorage.setItem(`grammar_read_${lesson.id}`, 'true');
    }
  }, [lesson]);

  if (!lesson) {
    notFound();
  }

  const handleGetSummary = async () => {
    setIsSummarizing(true);
    toast({
        title: "Generating Summary...",
        description: "Please wait while our AI summarizes this grammar point.",
    });

    const result = await summarizeGrammarPoints({ grammarPoint: lesson.title });

    if (result.success && result.data) {
        setSummary(result.data.summary);
        setShowSummaryDialog(true);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
        });
    }

    setIsSummarizing(false);
  };


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
           <Button variant="outline" size="sm" className="mt-6" onClick={handleGetSummary} disabled={isSummarizing}>
              <Sparkles className="mr-2 h-4 w-4"/>
              {isSummarizing ? "Generating..." : "Get AI Summary"}
          </Button>
        </CardContent>
      </Card>
      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>AI Summary of {lesson.title}</AlertDialogTitle>
                <AlertDialogDescription>
                    {summary}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => setShowSummaryDialog(false)}>
                Got it!
            </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
