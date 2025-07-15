import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, BookOpen, FileQuestion, Sparkles, Cherry, Feather, Palette } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="absolute inset-0 -z-10">
              <Image
                src="https://placehold.co/1920x1080.png"
                alt="Cherry blossoms"
                layout="fill"
                objectFit="cover"
                className="opacity-20"
                data-ai-hint="cherry blossoms"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Master Japanese, One Card at a Time.
            </h1>
            <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Your personalized journey to fluency. AI-powered flashcards, grammar lessons, and quizzes designed for you.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg" className="font-headline">
                <Link href="/dashboard">Get Started for Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-headline">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="w-full bg-card py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="font-headline text-center text-3xl font-bold tracking-tighter sm:text-4xl">
              A Smarter Way to Learn
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Our app combines proven learning techniques with cutting-edge AI to create a learning experience that's both effective and delightful.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Sparkles className="h-10 w-10 text-primary" />}
                title="AI-Powered Learning"
                description="Generate custom flashcards and example sentences. Our AI adapts to your weak spots, making sure you're always learning what you need most."
              />
              <FeatureCard
                icon={<LayersIcon className="h-10 w-10 text-primary" />}
                title="Spaced Repetition"
                description="Efficiently memorize vocabulary and kanji with our intelligent flashcard system that knows when you need to review."
              />
              <FeatureCard
                icon={<BookOpen className="h-10 w-10 text-primary" />}
                title="Comprehensive Grammar"
                description="Go beyond vocabulary with easy-to-understand grammar lessons, complete with clear explanations and practical examples."
              />
              <FeatureCard
                icon={<FileQuestion className="h-10 w-10 text-primary" />}
                title="Track Your Progress"
                description="Solidify your knowledge with interactive quizzes and tests. See how far you've come and what to focus on next."
              />
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Designed for a Zen-like Experience</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Inspired by Japanese aesthetics of simplicity and grace.</p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Cherry className="h-10 w-10 text-primary" />}
                title="Cultural Touch"
                description="A cherry blossom pink primary color evokes a sense of Japanese culture and approachability."
              />
              <FeatureCard
                icon={<Palette className="h-10 w-10 text-primary" />}
                title="Clean & Calming"
                description="A pale, off-white background provides a clean and calming backdrop, ensuring readability and focus."
              />
              <FeatureCard
                icon={<Feather className="h-10 w-10 text-primary" />}
                title="Fluid Animations"
                description="Subtle, fluid animations reflect principles of simplicity and grace, creating a tranquil learning environment."
              />
            </div>
          </div>
        </section>

        <section className="w-full bg-card py-12 md:py-24">
          <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 text-center md:px-6">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
              Start Your Journey to Fluency Today
            </h2>
            <p className="max-w-lg text-muted-foreground">
              Sign up now and discover a more effective and enjoyable way to learn Japanese.
            </p>
            <Button asChild size="lg" className="mt-4 font-headline">
              <Link href="/dashboard">Sign Up Now</Link>
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) {
  return (
    <Card className="h-full text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// A custom Layers icon that looks more like flashcards
function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
