"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { ArrowRight, Lock, CheckCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
  };
  inference: {
    a: string[];
    b: string[];
    c: string[];
  };
}

interface QuizAnswer {
  questionIndex: number;
  selectedOption: 'a' | 'b' | 'c';
  inference: string[];
}

export function QuizWidget() {
  const { user, loading } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<'a' | 'b' | 'c' | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Load questions from test.json
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const response = await fetch('/Questions/test.json');
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error('Failed to load quiz questions:', error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  const startQuiz = () => {
    if (!user) return;
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (option: 'a' | 'b' | 'c') => {
    setSelectedOption(option);
  };

  const handleNextQuestion = () => {
    if (!selectedOption) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswer: QuizAnswer = {
      questionIndex: currentQuestionIndex,
      selectedOption,
      inference: currentQuestion.inference[selectedOption]
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
  };

  const getTopInferences = () => {
    const inferenceCount: { [key: string]: number } = {};
    
    answers.forEach(answer => {
      answer.inference.forEach(inf => {
        inferenceCount[inf] = (inferenceCount[inf] || 0) + 1;
      });
    });

    return Object.entries(inferenceCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([inference, count]) => ({ inference, count }));
  };

  // Show loading state
  if (loading || loadingQuestions) {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    );
  }

  // Show login required message
  if (!user) {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            Career Discovery Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-6">
            Discover your ideal career path with our AI-powered quiz. Sign in to unlock personalized insights and recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/login">
                Sign In to Start Quiz
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">
                Create Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz completion
  if (quizCompleted) {
    const topInferences = getTopInferences();
    
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-4">
              Based on your answers, here are your top career interest areas:
            </p>
            <div className="space-y-2">
              {topInferences.map(({ inference, count }, index) => (
                <div key={inference} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="font-medium capitalize">{inference.replace(/-/g, ' ')}</span>
                  <span className="text-sm text-primary font-semibold">{count} matches</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={restartQuiz} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            <Button asChild>
              <Link href="/career-path">
                Explore Career Paths
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz start screen
  if (!quizStarted) {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">
            Career Discovery Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-6">
            Discover your ideal career path with {questions.length} carefully crafted questions. 
            This quiz analyzes your interests and preferences to suggest relevant career domains.
          </p>
          <Button onClick={startQuiz} size="lg" className="animate-pulse-glow">
            Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show current question
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card className="glass-card max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-primary font-semibold">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle className="text-xl font-headline">
          {currentQuestion.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-4 mb-8">
          {Object.entries(currentQuestion.options).map(([key, text]) => (
            <button
              key={key}
              onClick={() => handleAnswerSelect(key as 'a' | 'b' | 'c')}
              className={cn(
                "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:border-primary/50",
                selectedOption === key
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background/50"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-semibold uppercase">
                  {key}
                </span>
                <span className="flex-1">{text}</span>
              </div>
            </button>
          ))}
        </div>
        <Button 
          onClick={handleNextQuestion} 
          disabled={!selectedOption}
          className="w-full"
          size="lg"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
