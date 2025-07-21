
"use client"
import { useState, useEffect } from 'react';
import { quizzes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, PlayCircle, BrainCircuit, Sparkles, Trophy, Ear, Wand2, Loader2, Mic, Speaker } from "lucide-react";
import Link from "next/link";
import type { QuizMeta, GeneratedPhrase } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { generatePhrase } from '@/ai/flows/generate-phrase-flow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ICONS: Record<QuizMeta['id'], React.ReactNode> = {
    grammar: <BrainCircuit className="text-primary"/>,
    vocabulary: <Sparkles className="text-primary"/>,
    listening: <Ear className="text-primary"/>,
}

interface QuizCardProps {
  quiz: QuizMeta;
}

const QuizCard = ({ quiz }: QuizCardProps) => {
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    if (quiz.id === 'listening') return; 
    const score = localStorage.getItem(`quiz_best_score_${quiz.id}`);
    if (score) {
      setBestScore(JSON.parse(score));
    }
  }, [quiz.id]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
          <div className="flex items-start justify-between">
              <CardTitle className="font-headline">{quiz.title}</CardTitle>
              {ICONS[quiz.id]}
          </div>
          <CardDescription>{quiz.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
           {bestScore !== null && (
            <div className="flex items-center gap-2 text-amber-500 font-medium">
              <Trophy className="w-4 h-4" />
              <span>Best Score: {bestScore}%</span>
            </div>
          )}
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
  );
};

export default function QuizzesPage() {
  const [isGeneratingPhrase, setIsGeneratingPhrase] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState<GeneratedPhrase | null>(null);
  const [isPhraseDialogOpen, setIsPhraseDialogOpen] = useState(false);
  
  const [isTtsDialogOpen, setIsTtsDialogOpen] = useState(false);
  const [ttsText, setTtsText] = useState("こんにちは、世界！");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();


  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const japaneseVoices = availableVoices.filter(voice => voice.lang.startsWith('ja'));
      setVoices(japaneseVoices);
      if (japaneseVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(japaneseVoices[0].voiceURI);
      }
    };
    
    // Voices load asynchronously.
    handleVoicesChanged(); // Initial check
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceURI]);


  const handleGeneratePhraseClick = async () => {
    setIsPhraseDialogOpen(true);
    setGeneratedPhrase(null);
    setIsGeneratingPhrase(true);
    try {
      const phrase = await generatePhrase();
      setGeneratedPhrase(phrase);
    } catch (error) {
      console.error("Failed to generate phrase:", error);
    } finally {
      setIsGeneratingPhrase(false);
    }
  };

  const handleSpeak = () => {
    if (!ttsText || typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel(); // Cancel any previous speech

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else if (voices.length > 0) {
        utterance.voice = voices[0]; // Fallback to the first available Japanese voice
    }
    
    window.speechSynthesis.speak(utterance);
  };


  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with adaptive and listening quizzes.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleGeneratePhraseClick} disabled={isGeneratingPhrase}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate a Phrase
            </Button>
            <Button variant="outline" onClick={() => setIsTtsDialogOpen(true)}>
                <Speaker className="mr-2 h-4 w-4" />
                Practice Speaking
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      <Dialog open={isPhraseDialogOpen} onOpenChange={setIsPhraseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Generated Phrase</DialogTitle>
            <DialogDescription>
              Here's a new phrase to practice, generated just for you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isGeneratingPhrase ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </div>
            ) : generatedPhrase ? (
              <div className="space-y-4">
                 <div className="pl-4 border-l-4 border-primary">
                    <p className="font-medium text-2xl">{generatedPhrase.japanese}</p>
                    <p className="text-muted-foreground">{generatedPhrase.romaji}</p>
                  </div>
                  <p><span className="font-semibold">Meaning:</span> {generatedPhrase.english}</p>
              </div>
            ) : (
              <p>Could not generate a phrase. Please try again.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTtsDialogOpen} onOpenChange={setIsTtsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Practice Speaking</DialogTitle>
            <DialogDescription>
              Type some Japanese text and hear it spoken aloud using your browser's speech synthesis.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tts-input">Japanese Text</Label>
              <Textarea 
                id="tts-input"
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="e.g. こんにちは"
                rows={4}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="voice-select">Voice</Label>
                <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
                    <SelectTrigger id="voice-select" className="w-full">
                        <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                        {voices.length > 0 ? voices.map(voice => (
                            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang})
                            </SelectItem>
                        )) : <SelectItem value="no-voice" disabled>No Japanese voices found</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
          </div>
           <DialogFooter>
            <Button onClick={handleSpeak} disabled={!ttsText || voices.length === 0}>
                <Speaker className="mr-2 h-4 w-4" />
                Speak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
