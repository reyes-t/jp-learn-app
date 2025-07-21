
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Volume2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listeningSentences } from '@/lib/data';
import type { ListeningQuizQuestion } from '@/lib/types';
import { generateSpeech } from '@/ai/flows/text-to-speech';
import { Input } from '@/components/ui/input';

const QUIZ_LENGTH = 5;

type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

export default function ListeningQuizPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<ListeningQuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);
            const shuffled = [...listeningSentences].sort(() => 0.5 - Math.random());
            const selectedSentences = shuffled.slice(0, QUIZ_LENGTH);
            const generatedQuestions: ListeningQuizQuestion[] = [];
            for (const sentence of selectedSentences) {
                try {
                    const audioDataUri = await generateSpeech(sentence.kana);
                    generatedQuestions.push({ ...sentence, audioDataUri });
                } catch (error) {
                    console.error("Failed to generate speech for:", sentence.kana, error);
                }
            }
            setQuestions(generatedQuestions);
            setIsLoading(false);
        };
        loadQuestions();
    }, []);

    const playAudio = () => {
        const audio = new Audio(questions[currentQuestionIndex].audioDataUri);
        audio.play();
    };

    const handleCheckAnswer = () => {
        if (answerStatus !== 'unanswered') return;

        const currentQuestion = questions[currentQuestionIndex];
        const formattedUserAnswer = userAnswer.trim().toLowerCase();
        const isCorrect = 
            formattedUserAnswer === currentQuestion.kana || 
            formattedUserAnswer === currentQuestion.romaji.toLowerCase();
        
        if (isCorrect) {
            setAnswerStatus('correct');
            setCorrectAnswersCount(prev => prev + 1);
        } else {
            setAnswerStatus('incorrect');
        }
    };

    const handleNextQuestion = () => {
        setAnswerStatus('unanswered');
        setUserAnswer('');
        setCurrentQuestionIndex(prev => prev + 1);
    };

    const handleRestart = () => {
        window.location.reload();
    };

    const isQuizFinished = currentQuestionIndex >= questions.length;
    const progress = (currentQuestionIndex / questions.length) * 100;
    const currentQuestion = questions[currentQuestionIndex];

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-2xl flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Preparing Your Quiz...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Generating audio, please wait a moment.</p>
                        <Progress value={undefined} className="mt-4 animate-pulse" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (questions.length === 0 && !isLoading) {
        return (
             <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle>Error</CardTitle></CardHeader>
                    <CardContent>
                        <p>Could not load the listening quiz questions. Please try again later.</p>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" asChild>
                            <Link href="/quizzes">Back to Quizzes</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
         )
    }

    if (isQuizFinished) {
        const score = Math.round((correctAnswersCount / questions.length) * 100);
        return (
            <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Quiz Complete!</CardTitle>
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
                                <p className="font-bold text-2xl">{questions.length - correctAnswersCount}</p>
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
                    <h1 className="text-2xl font-bold font-headline">Listening Comprehension</h1>
                    <div className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                </div>
                <Progress value={progress} />
            </div>

            <Card>
                <CardContent className="p-6">
                    <p className="text-lg font-semibold mb-4">Listen to the audio and type what you hear.</p>
                    <div className="flex flex-col items-center gap-6">
                        <Button onClick={playAudio} size="lg" variant="outline">
                            <Volume2 className="mr-2 h-6 w-6" />
                            Play Audio
                        </Button>
                        <Input
                            type="text"
                            placeholder="Type in Kana or Romaji..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                        />
                    </div>
                </CardContent>
            </Card>
            
            {answerStatus !== 'unanswered' && (
                <Card className={cn("mt-6 p-4", {
                    'bg-green-100 dark:bg-green-900/20 border-green-500/50': answerStatus === 'correct',
                    'bg-red-100 dark:bg-red-900/20 border-red-500/50': answerStatus === 'incorrect'
                })}>
                    <div className="flex items-start gap-4">
                        {answerStatus === 'correct' ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                        <div>
                            <h3 className={cn("font-bold text-lg", {
                                'text-green-700 dark:text-green-400': answerStatus === 'correct',
                                'text-red-700 dark:text-red-400': answerStatus === 'incorrect'
                            })}>
                                {answerStatus === 'correct' ? 'Correct!' : 'Incorrect'}
                            </h3>
                            <p className="font-semibold text-xl mt-2">{currentQuestion.kana}</p>
                            <p className="text-muted-foreground">{currentQuestion.romaji}</p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="mt-6 flex justify-end">
                {answerStatus === 'unanswered' ? (
                    <Button onClick={handleCheckAnswer} disabled={!userAnswer}>Check Answer</Button>
                ) : (
                    <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                    </Button>
                )}
            </div>
        </div>
    );
}
