import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-primary/10 bg-background/50 backdrop-blur-lg mt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-headline font-bold text-2xl holographic-text mb-4">NovaPath</h3>
            <p className="text-muted-foreground">
              Illuminating your career and educational journey with the power of AI.
            </p>
          </div>
          <div>
            <h4 className="font-headline font-semibold text-lg text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/quiz" className="text-muted-foreground hover:text-primary transition-colors">Quiz</Link></li>
              <li><Link href="/timeline" className="text-muted-foreground hover:text-primary transition-colors">Timeline</Link></li>
              <li><Link href="/career-path" className="text-muted-foreground hover:text-primary transition-colors">Career Path</Link></li>
              <li><Link href="/feedback-forum" className="text-muted-foreground hover:text-primary transition-colors">Feedback</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline font-semibold text-lg text-foreground mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="#" aria-label="Github"><Github className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="#" aria-label="Twitter"><Twitter className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="#" aria-label="LinkedIn"><Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-primary/10 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} NovaPath. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
