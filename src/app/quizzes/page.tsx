import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function QuizzesPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Tests & Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge and track your progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileQuestion className="mr-2 h-4 w-4" />
                <span>{quiz.questions.length} questions</span>
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
