
"use client"
import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, PlayCircle, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";

export default function QuizzesPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Adaptive Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with quizzes that adapt to you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="font-headline">{quiz.title}</CardTitle>
                    {quiz.id === 'grammar' ? <BrainCircuit className="text-primary"/> : <Sparkles className="text-primary"/>}
                </div>
                <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="text-sm text-muted-foreground">
                    This quiz pulls questions from all available {quiz.id === 'grammar' ? 'lessons' : 'flashcards'} and adapts to your performance.
                 </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" asChild>
                    <Link href={`/quizzes/${quiz.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Quiz
                    </Link>
                </Button>
            </CardFooter>
        </Card>
        ))}
      </div>
    </div>
  );
}
