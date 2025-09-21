"use client";

import { TwoTierQuiz } from "@/components/quiz/two-tier-quiz";
import { SimpleTranslate } from "@/hooks/use-simple-translation";

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline holographic-text">
          <SimpleTranslate text="discover_your_path" />
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          <SimpleTranslate text="quiz_description" />
        </p>
      </div>
      <TwoTierQuiz />
    </div>
  );
}
