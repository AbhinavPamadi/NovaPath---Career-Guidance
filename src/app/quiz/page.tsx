"use client";

import { TwoTierQuiz } from "@/components/quiz/two-tier-quiz";

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline holographic-text">
          Discover Your Path
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          Take our advanced two-tier career assessment to get personalized recommendations 
          based on both your interests and demonstrated skills.
        </p>
      </div>
      <TwoTierQuiz />
    </div>
  );
}
