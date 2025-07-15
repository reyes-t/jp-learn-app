import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { grammarPoints } from "@/lib/data"
import { Sparkles } from "lucide-react"

export default function GrammarPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Grammar Lessons</h1>
            <p className="text-muted-foreground">Key Japanese grammar points, simplified.</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {grammarPoints.map(point => (
            <AccordionItem value={point.id} key={point.id}>
                <AccordionTrigger className="font-headline text-lg hover:no-underline">
                    {point.title}
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                    <p className="mb-4 text-base">{point.explanation}</p>
                    <h4 className="font-semibold mb-2">Examples:</h4>
                    <ul className="space-y-2">
                        {point.examples.map((ex, index) => (
                            <li key={index} className="pl-4 border-l-2 border-primary/50">
                                <p className="font-medium">{ex.japanese}</p>
                                <p className="text-sm text-muted-foreground">{ex.english}</p>
                            </li>
                        ))}
                    </ul>
                    <Button variant="outline" size="sm" className="mt-4">
                        <Sparkles className="mr-2 h-4 w-4"/>
                        Get AI Summary
                    </Button>
                </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
