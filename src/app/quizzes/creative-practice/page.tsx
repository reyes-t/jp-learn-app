
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Lightbulb, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { PhraseValidationResult } from '@/lib/types';
import { validatePhrase } from '@/ai/flows/validate-phrase-flow';
import { cn } from '@/lib/utils';

export default function CreativePracticePage() {
  const [conditions, setConditions] = useState<string[]>(['Greetings', 'Politeness']);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PhraseValidationResult | null>(null);

  const handleConditionChange = (index: number, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };

  const handleAddCondition = () => {
    if (conditions.length < 5) {
      setConditions([...conditions, '']);
    }
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userAnswer || conditions.some(c => !c)) return;

    setIsSubmitting(true);
    setResult(null);
    try {
      const validationResult = await validatePhrase({
        conditions,
        phrase: userAnswer,
      });
      setResult(validationResult);
    } catch (error) {
      console.error('Validation failed:', error);
      setResult({
        isValid: false,
        reason: 'An error occurred while validating your answer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReset = () => {
    setConditions(['', '']);
    setUserAnswer('');
    setResult(null);
  };


  return (
    <div className="container mx-auto max-w-2xl">
      <Link href="/quizzes" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to all quizzes
      </Link>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Creative Practice</h1>
          <p className="text-muted-foreground mt-1">Write a Japanese phrase that meets the conditions.</p>
        </div>
        <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
            <RefreshCw className="mr-2 h-4 w-4"/>
            Reset
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Your Challenge</CardTitle>
            <CardDescription>Enter up to 5 conditions, then write a Japanese phrase that satisfies all of them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Conditions</Label>
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={`e.g. Greetings`}
                    value={condition}
                    onChange={(e) => handleConditionChange(index, e.target.value)}
                    required
                  />
                  {conditions.length > 1 && (
                     <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCondition(index)}>
                        <XCircle className="w-5 h-5 text-muted-foreground"/>
                    </Button>
                  )}
                </div>
              ))}
              {conditions.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>Add Condition</Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-answer">Your Japanese Answer</Label>
              <Textarea
                id="user-answer"
                placeholder="e.g. おはようございます"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                required
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isSubmitting || !userAnswer || conditions.some(c => !c)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : 'Check Answer'}
            </Button>
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

    </div>
  );
}
