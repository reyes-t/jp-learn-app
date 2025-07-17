import { DeckCard } from '@/components/deck-card';
import { Button } from '@/components/ui/button';
import { basicDecks, grammarPoints, quizzes } from '@/lib/data';
import { ArrowRight, BookOpen, FileQuestion, Layers3 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const featuredDecks = basicDecks.slice(0, 3);

  return (
    <div className="container mx-auto">
      <section id="decks" className="py-12">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold font-headline flex items-center gap-3"><Layers3 className="text-primary size-8" /> Flashcard Decks</h2>
                <p className="text-muted-foreground mt-2">Reinforce your vocabulary with our collection of flashcard decks.</p>
            </div>
            <Button variant="outline" asChild>
                <Link href="/decks">
                    View All Decks <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>

      <section id="grammar" className="py-12">
        <div className="flex items-center justify-between mb-8">
             <div>
                <h2 className="text-3xl font-bold font-headline flex items-center gap-3"><BookOpen className="text-primary size-8" /> Grammar Lessons</h2>
                <p className="text-muted-foreground mt-2">Understand the building blocks of Japanese with clear explanations.</p>
            </div>
            <Button variant="outline" asChild>
                <Link href="/grammar">
                    View All Lessons <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {grammarPoints.slice(0, 2).map(point => (
                <Link key={point.id} href={`/grammar/${point.id}`} className="no-underline group">
                    <div className="p-6 border rounded-lg bg-card h-full transition-colors hover:bg-muted/50">
                        <h3 className="font-headline text-xl font-semibold mb-2 group-hover:text-primary">{point.title}</h3>
                        <p className="text-muted-foreground line-clamp-3">{point.explanation}</p>
                    </div>
                </Link>
            ))}
        </div>
      </section>

      <section id="quizzes" className="py-12">
         <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold font-headline flex items-center gap-3"><FileQuestion className="text-primary size-8" /> Quizzes</h2>
                <p className="text-muted-foreground mt-2">Test your knowledge and track your progress.</p>
            </div>
            <Button variant="outline" asChild>
                <Link href="/quizzes">
                    View All Quizzes <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.slice(0, 2).map(quiz => (
                 <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="no-underline group">
                    <div className="p-6 border rounded-lg bg-card h-full transition-colors hover:bg-muted/50">
                        <h3 className="font-headline text-xl font-semibold mb-2 group-hover:text-primary">{quiz.title}</h3>
                        <p className="text-muted-foreground">{quiz.description}</p>
                    </div>
                </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
