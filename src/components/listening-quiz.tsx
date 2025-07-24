
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Volume2, XCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ListeningQuizQuestion, QuizMeta } from '@/lib/types';
import { Input } from '@/components/ui/input';


type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

interface ListeningQuizProps {
    quizMeta: QuizMeta;
    questions: (ListeningQuizQuestion & { weight: number, isReview: boolean })[];
}

export function ListeningQuiz({ quizMeta, questions: sessionQuestions }: ListeningQuizProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [sessionQuestionUpdates, setSessionQuestionUpdates] = useState<Record<string, number>>({});

    // Clean up any lingering speech synthesis on component unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const isQuizFinished = currentQuestionIndex >= sessionQuestions.length;
    
    useEffect(() => {
        if (isQuizFinished && sessionQuestions.length > 0) {
            const score = Math.round((correctAnswersCount / sessionQuestions.length) * 100);
            const bestScoreKey = `quiz_best_score_${quizMeta.id}`;
            const bestScore = JSON.parse(localStorage.getItem(bestScoreKey) || '0');
            if (score > bestScore) {
                localStorage.setItem(bestScoreKey, JSON.stringify(score));
            }

            // Save weights
            const weightsStorageKey = `quiz_weights_${quizMeta.id}`;
            const allWeights: Record<string, number> = JSON.parse(localStorage.getItem(weightsStorageKey) || '{}');
            Object.entries(sessionQuestionUpdates).forEach(([id, change]) => {
                const currentWeight = allWeights[id] || 0;
                const newWeight = Math.max(0, currentWeight + change);
                allWeights[id] = newWeight;
            });
            localStorage.setItem(weightsStorageKey, JSON.stringify(allWeights));
        }
    }, [isQuizFinished, correctAnswersCount, sessionQuestions, quizMeta.id, sessionQuestionUpdates]);


    const currentQuestion = sessionQuestions[currentQuestionIndex];
    
    const playAudio = () => {
        if (!currentQuestion || typeof window === 'undefined' || !window.speechSynthesis || isSpeaking) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(currentQuestion.kana);
        utterance.lang = 'ja-JP'; // Specify the language
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.cancel(); // Cancel previous speech
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (currentQuestion) {
            // Use a short timeout to ensure the UI has updated before speaking
            const timer = setTimeout(() => {
                playAudio();
            }, 100); 
            return () => clearTimeout(timer);
        }
    }, [currentQuestion]);


    const handleCheckAnswer = () => {
        if (answerStatus !== 'unanswered' || !currentQuestion) return;
        
        // Normalize by trimming, lowercasing, and removing periods, commas, and dashes.
        const normalize = (str: string) => str.trim().toLowerCase().replace(/[.,-]/g, '');

        const formattedUserAnswer = normalize(userAnswer);
        const isCorrect = 
            formattedUserAnswer === normalize(currentQuestion.kana) || 
            formattedUserAnswer === normalize(currentQuestion.romaji);
        
        if (isCorrect) {
            setAnswerStatus('correct');
            setCorrectAnswersCount(prev => prev + 1);
            setSessionQuestionUpdates(prev => ({
                ...prev,
                [currentQuestion.id]: (prev[currentQuestion.id] || 0) - 1,
            }));
        } else {
            setAnswerStatus('incorrect');
            setSessionQuestionUpdates(prev => ({
                ...prev,
                [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1,
            }));
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
    
    if (sessionQuestions.length === 0) {
        return (
             <div className="container mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle>Loading Quiz</CardTitle></CardHeader>
                    <CardContent>
                        <p>There are no listening questions for this level yet.</p>
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

    const progress = (currentQuestionIndex / sessionQuestions.length) * 100;

    if (isQuizFinished) {
        const score = Math.round((correctAnswersCount / sessionQuestions.length) * 100);
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
                                <p className="font-bold text-2xl">{sessionQuestions.length - correctAnswersCount}</p>
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
                    <h1 className="text-2xl font-bold font-headline">{quizMeta.title}</h1>
                    <div className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {sessionQuestions.length}
                    </div>
                </div>
                <Progress value={progress} />
            </div>

            <Card>
                <CardContent className="p-6">
                    <p className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {currentQuestion.isReview && <History className="w-5 h-5 text-primary" title="You've missed this before"/>}
                        Listen to the audio and type what you hear.
                    </p>
                    <div className="flex flex-col items-center gap-6">
                        <Button onClick={playAudio} size="lg" variant="outline" disabled={isSpeaking}>
                            <Volume2 className="mr-2 h-6 w-6" />
                            {isSpeaking ? 'Speaking...' : 'Play Audio'}
                        </Button>
                        <Input
                            type="text"
                            placeholder="Type in Kana or Romaji..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && answerStatus === 'unanswered' && userAnswer) {
                                    handleCheckAnswer();
                                }
                            }}
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
                        {currentQuestionIndex === sessionQuestions.length - 1 ? 'Finish' : 'Next Question'}
                    </Button>
                )}
            </div>
        </div>
    );
}
