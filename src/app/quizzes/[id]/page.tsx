"use client";

import { useState, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { quizzes } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

export default function QuizPage() {
    const params = useParams();
    const quizId = params.id as string;

    const quiz = useMemo(() => quizzes.find((q) => q.id === quizId), [quizId]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [correctAnswers, setCorrectAnswers] = useState(0);

    if (!quiz) {
        notFound();
    }

    const isQuizFinished = currentQuestionIndex >= quiz.questions.length;
    const progress = isQuizFinished ? 100 : (currentQuestionIndex / quiz.questions.length) * 100;
    const currentQuestion = quiz.questions[currentQuestionIndex];

    const handleAnswerSelect = (option: string) => {
        if (answerStatus !== 'unanswered') return;

        setSelectedAnswer(option);
        if (option === currentQuestion.correctAnswer) {
            setAnswerStatus('correct');
            setCorrectAnswers(c => c + 1);
        } else {
            setAnswerStatus('incorrect');
        }
    };

    const handleNextQuestion = () => {
        setAnswerStatus('unanswered');
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setCorrectAnswers(0);
        setSelectedAnswer(null);
        setAnswerStatus('unanswered');
    }

    if (isQuizFinished) {
        const score = Math.round((correctAnswers / quiz.questions.length) * 100);
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Quiz Complete!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">You scored {score}%</p>
                        <div className="flex justify-around mt-4">
                            <div className="text-green-500">
                                <p className="font-bold text-2xl">{correctAnswers}</p>
                                <p>Correct</p>
                            </div>
                            <div className="text-red-500">
                                <p className="font-bold text-2xl">{quiz.questions.length - correctAnswers}</p>
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
        )
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="mb-6">
                <Link
                    href="/quizzes"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to all quizzes
                </Link>
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold font-headline">{quiz.title}</h1>
                    <div className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </div>
                </div>
                <Progress value={progress} />
            </div>

            <Card>
                <CardContent className="p-6">
                    <p className="text-xl font-semibold mb-6">{currentQuestion.question}</p>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option) => {
                             const isSelected = selectedAnswer === option;
                             const isCorrect = currentQuestion.correctAnswer === option;
                             
                             let buttonVariant: "secondary" | "default" | "destructive" = "secondary";
                             if (answerStatus !== 'unanswered') {
                                if (isSelected && !isCorrect) {
                                    buttonVariant = 'destructive';
                                } else if (isCorrect) {
                                    buttonVariant = 'default';
                                }
                             }

                            return (
                                <Button
                                    key={option}
                                    className={cn("w-full justify-start h-auto py-3 text-left",
                                        answerStatus !== 'unanswered' && isCorrect && "bg-green-500 hover:bg-green-600",
                                    )}
                                    variant={buttonVariant}
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={answerStatus !== 'unanswered'}
                                >
                                    {option}
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {answerStatus === 'correct' && (
                <Alert className="mt-6 border-green-500 text-green-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-600 font-bold">Correct!</AlertTitle>
                    <AlertDescription>
                        {currentQuestion.explanation}
                    </AlertDescription>
                </Alert>
            )}
            {answerStatus === 'incorrect' && (
                <Alert variant="destructive" className="mt-6">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Incorrect</AlertTitle>
                    <AlertDescription>
                        The correct answer is: <strong>{currentQuestion.correctAnswer}</strong>.
                        <br />
                        {currentQuestion.explanation}
                    </AlertDescription>
                </Alert>
            )}

            {answerStatus !== 'unanswered' && (
                <div className="mt-6 text-right">
                    <Button onClick={handleNextQuestion}>Next Question</Button>
                </div>
            )}
        </div>
    );
}
