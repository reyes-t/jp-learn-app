
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { PhraseValidationResult, CreativeChallenge } from '@/lib/types';
import { validatePhrase } from '@/ai/flows/validate-phrase-flow';
import { cn } from '@/lib/utils';
import { creativeChallenges } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

export default function CreativePracticePage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PhraseValidationResult | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');

  const challenges = creativeChallenges;
  const currentChallenge = challenges[currentQuestionIndex];
  const isQuizFinished = currentQuestionIndex >= challenges.length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userAnswer || !currentChallenge) return;

    setIsSubmitting(true);
    setResult(null);
    try {
      const validationResult = await validatePhrase({
        conditions: currentChallenge.conditions,
        phrase: userAnswer,
      });
      setResult(validationResult);
      if (validationResult.isValid) {
        setCorrectAnswersCount(prev => prev + 1);
        setAnswerStatus('correct');
      } else {
        setAnswerStatus('incorrect');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setResult({
        isValid: false,
        reason: 'An error occurred while validating your answer. Please try again.',
      });
      setAnswerStatus('incorrect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setUserAnswer('');
    setResult(null);
    setAnswerStatus('unanswered');
  };
  
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setResult(null);
    setAnswerStatus('unanswered');
    setCorrectAnswersCount(0);
  };

  if (isQuizFinished) {
    const score = Math.round((correctAnswersCount / challenges.length) * 100);
    return (
        <div className="container mx-auto flex flex-col items-center justify-center h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Creative Quiz Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg mb-2">You scored</p>
                    <p className="text-6xl font-bold mb-4">{score}%</p>
                    <div className="flex justify-around mt-4">
                        <div className="text-green-500">
                            <p className="font-bold text-2xl">{correctAnswersCount}</p>
                            <p>Correct</p>
                        </div>
                        <div className="text-red-500">
                            <p className="font-bold text-2xl">{challenges.length - correctAnswersCount}</p>
                            <p>Incorrect</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button onClick={handleRestart}>Try Again</Button>
                    <Button variant="outline" asChild>
                        <Link href="/quizzes">Back to Quizzes</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  const progress = (currentQuestionIndex / challenges.length) * 100;

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-6">
          <Link href="/quizzes" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to all quizzes
          </Link>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold font-headline">Creative Practice</h1>
            <div className="text-sm text-muted-foreground">
                Challenge {currentQuestionIndex + 1} of {challenges.length}
            </div>
          </div>
          <Progress value={progress} />
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Your Challenge</CardTitle>
            <CardDescription>Write a Japanese phrase that satisfies all of the following conditions.</CardDescription>
            <div className="flex flex-wrap gap-2 pt-4">
                {currentChallenge.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-base">{condition}</Badge>
                ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Textarea
                id="user-answer"
                placeholder="e.g. おはようございます"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                required
                rows={3}
                disabled={answerStatus !== 'unanswered'}
              />
            </div>

            {answerStatus === 'unanswered' && (
                <Button type="submit" disabled={isSubmitting || !userAnswer}>
                {isSubmitting ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                    </>
                ) : 'Check Answer'}
                </Button>
            )}
          </CardContent>
        </form>
      </Card>
      
      {result && (
        <Card className={cn("mt-6", {
          'bg-green-100 dark:bg-green-900/20 border-green-500/50': result.isValid,
          'bg-red-100 dark:bg-red-900/20 border-red-500/50': !result.isValid,
        })}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.isValid ? <CheckCircle2 className="w-8 h-8 text-green-600"/> : <XCircle className="w-8 h-8 text-red-600"/>}
              <CardTitle className={cn({
                'text-green-800 dark:text-green-300': result.isValid,
                'text-red-800 dark:text-red-300': !result.isValid,
              })}>
                {result.isValid ? 'Correct!' : 'Not quite...'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{result.reason}</p>
          </CardContent>
        </Card>
      )}

      {answerStatus !== 'unanswered' && (
          <div className="mt-6 flex justify-end">
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex === challenges.length - 1 ? 'Finish Quiz' : 'Next Challenge'}
              </Button>
          </div>
      )}

    </div>
  );
}
