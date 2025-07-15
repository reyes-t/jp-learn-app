import Link from "next/link";
import { Languages } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t">
      <div className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
        <div className="flex items-center gap-2">
            <Languages className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold font-headline">SakuraLearn</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SakuraLearn. All rights reserved.</p>
        <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm hover:underline underline-offset-4">
                Terms of Service
            </Link>
            <Link href="#" className="text-sm hover:underline underline-offset-4">
                Privacy
            </Link>
        </nav>
      </div>
    </footer>
  );
}
