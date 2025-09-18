"use client";

import { QuizWidget } from "@/components/quiz/quiz-widget";

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline holographic-text">
          Discover Your Path
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Take our comprehensive career discovery quiz to uncover your ideal career direction based on your interests and preferences.
        </p>
      </div>
      <QuizWidget />
    </div>
  );
}
