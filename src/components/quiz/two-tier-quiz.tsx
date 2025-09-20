"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowRight, 
  Lock, 
  CheckCircle, 
  RotateCcw, 
  Brain, 
  Target, 
  Sparkles,
  BookOpen,
  Trophy,
  Clock
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  quizSystem,
  GeneralQuizQuestion,
  GeneralQuizAnswer,
  PersonalizedQuizQuestion,
  PersonalizedQuizAnswer,
  CareerRecommendation,
  type NormalizedDomain
} from "@/lib/quiz-system";

type QuizStage = 'start' | 'general' | 'general-results' | 'personalized' | 'personalized-results' | 'career-recommendations' | 'completed';

export function TwoTierQuiz() {
  const { user, loading } = useAuth();
  
  // Quiz state
  const [currentStage, setCurrentStage] = useState<QuizStage>('start');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  
  // General quiz state
  const [generalQuestions, setGeneralQuestions] = useState<GeneralQuizQuestion[]>([]);
  const [generalCurrentIndex, setGeneralCurrentIndex] = useState(0);
  const [generalAnswers, setGeneralAnswers] = useState<GeneralQuizAnswer[]>([]);
  const [generalSelectedOption, setGeneralSelectedOption] = useState<number | null>(null);
  const [generalResults, setGeneralResults] = useState<{
    domainScores: { [key: string]: number };
    topDomains: string[];
  } | null>(null);
  
  // Personalized quiz state
  const [personalizedQuestions, setPersonalizedQuestions] = useState<PersonalizedQuizQuestion[]>([]);
  const [personalizedCurrentIndex, setPersonalizedCurrentIndex] = useState(0);
  const [personalizedAnswers, setPersonalizedAnswers] = useState<PersonalizedQuizAnswer[]>([]);
  const [personalizedSelectedOption, setPersonalizedSelectedOption] = useState<number | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  
  // Career recommendations state
  const [careerRecommendations, setCareerRecommendations] = useState<CareerRecommendation[]>([]);

  // Check user's quiz progress on load
  useEffect(() => {
    const checkProgress = async () => {
      if (!user) return;
      
      try {
        const progress = await quizSystem.getUserQuizProgress(user.uid);
        
        if (progress.hasCareerSuggestions) {
          setCurrentStage('completed');
          if (progress.careerSuggestions) {
            setCareerRecommendations(progress.careerSuggestions.recommendations);
          }
        } else if (progress.hasCompletedPersonalized) {
          setCurrentStage('career-recommendations');
        } else if (progress.hasCompletedGeneral) {
          setCurrentStage('general-results');
          if (progress.generalResults) {
            setGeneralResults({
              domainScores: progress.generalResults.domain_scores,
              topDomains: progress.generalResults.top_domains
            });
          }
        }
      } catch (error) {
        console.error('Failed to check quiz progress:', error);
      }
    };

    checkProgress();
  }, [user]);

  const startGeneralQuiz = async () => {
    if (!user) return;
    
    setLoadingQuestions(true);
    try {
      const questions = await quizSystem.loadGeneralQuizQuestions();
      setGeneralQuestions(questions);
      setCurrentStage('general');
      setGeneralCurrentIndex(0);
      setGeneralAnswers([]);
      setGeneralSelectedOption(null);
    } catch (error) {
      console.error('Failed to load general quiz questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleGeneralAnswerSelect = (optionIndex: number) => {
    setGeneralSelectedOption(optionIndex);
  };

  const handleGeneralNextQuestion = async () => {
    if (generalSelectedOption === null) return;

    const currentQuestion = generalQuestions[generalCurrentIndex];
    const selectedOption = currentQuestion.options[generalSelectedOption];
    
    const newAnswer: GeneralQuizAnswer = {
      question_id: currentQuestion.question_id,
      selected_option_index: generalSelectedOption,
      domain_weights: selectedOption.domain_weights
    };

    const updatedAnswers = [...generalAnswers, newAnswer];
    setGeneralAnswers(updatedAnswers);

    if (generalCurrentIndex < generalQuestions.length - 1) {
      setGeneralCurrentIndex(generalCurrentIndex + 1);
      setGeneralSelectedOption(null);
    } else {
      // Process general quiz results
      setSavingResults(true);
      try {
        const results = quizSystem.processGeneralQuizResults(updatedAnswers);
        setGeneralResults(results);
        
        // Save to Firestore
        await quizSystem.saveGeneralQuizResults(
          user!.uid,
          updatedAnswers,
          results.domainScores,
          results.topDomains
        );
        
        setCurrentStage('general-results');
      } catch (error) {
        console.error('Failed to process general quiz results:', error);
      } finally {
        setSavingResults(false);
      }
    }
  };

  const startPersonalizedQuiz = async () => {
    if (!generalResults || !user) return;
    
    setSavingResults(true);
    try {
      const domains = quizSystem.selectPersonalizedQuizDomains(
        generalResults.topDomains,
        generalResults.domainScores
      );
      setSelectedDomains(domains);
      
      const questions = await quizSystem.loadPersonalizedQuizQuestions(domains);
      setPersonalizedQuestions(questions);
      setCurrentStage('personalized');
      setPersonalizedCurrentIndex(0);
      setPersonalizedAnswers([]);
      setPersonalizedSelectedOption(null);
    } catch (error) {
      console.error('Failed to start personalized quiz:', error);
    } finally {
      setSavingResults(false);
    }
  };

  const handlePersonalizedAnswerSelect = (optionIndex: number) => {
    setPersonalizedSelectedOption(optionIndex);
  };

  const handlePersonalizedNextQuestion = async () => {
    if (personalizedSelectedOption === null) return;

    const currentQuestion = personalizedQuestions[personalizedCurrentIndex];
    const selectedOption = currentQuestion.options[personalizedSelectedOption];
    
    const newAnswer: PersonalizedQuizAnswer = {
      question_index: personalizedCurrentIndex,
      selected_option_index: personalizedSelectedOption,
      domain_weights: selectedOption.domain_weights
    };

    const updatedAnswers = [...personalizedAnswers, newAnswer];
    setPersonalizedAnswers(updatedAnswers);

    if (personalizedCurrentIndex < personalizedQuestions.length - 1) {
      setPersonalizedCurrentIndex(personalizedCurrentIndex + 1);
      setPersonalizedSelectedOption(null);
    } else {
      // Process personalized quiz results and generate career recommendations
      setSavingResults(true);
      try {
        const results = quizSystem.processPersonalizedQuizResults(updatedAnswers);
        
        // Save personalized quiz results
        await quizSystem.savePersonalizedQuizResults(
          user!.uid,
          selectedDomains,
          updatedAnswers,
          results.domainScores,
          results.skillCompetency
        );
        
        // Generate career recommendations
        const userInterests = generalResults!.topDomains.slice(0, 3);
        const userSkills = Object.entries(results.skillCompetency)
          .filter(([, competency]) => competency > 0.3) // Filter for decent competency
          .map(([domain]) => domain);
        
        const recommendations = await quizSystem.generateCareerRecommendations(
          userInterests,
          userSkills
        );
        
        setCareerRecommendations(recommendations);
        
        // Save career suggestions
        await quizSystem.saveCareerSuggestions(
          user!.uid,
          userInterests,
          userSkills,
          recommendations
        );
        
        setCurrentStage('career-recommendations');
      } catch (error) {
        console.error('Failed to process personalized quiz results:', error);
      } finally {
        setSavingResults(false);
      }
    }
  };

  const restartQuiz = () => {
    setCurrentStage('start');
    setGeneralQuestions([]);
    setGeneralCurrentIndex(0);
    setGeneralAnswers([]);
    setGeneralSelectedOption(null);
    setGeneralResults(null);
    setPersonalizedQuestions([]);
    setPersonalizedCurrentIndex(0);
    setPersonalizedAnswers([]);
    setPersonalizedSelectedOption(null);
    setSelectedDomains([]);
    setCareerRecommendations([]);
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
            Two-Tier Career Discovery Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-6">
            Discover your ideal career path with our comprehensive two-tier assessment system. 
            Sign in to unlock personalized insights and career recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Sign In to Start Quiz</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz start screen
  if (currentStage === 'start') {
    return (
      <Card className="glass-card max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-headline flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Two-Tier Career Discovery Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <p className="text-lg text-muted-foreground mb-6">
              Our advanced career assessment system uses a scientific two-tier approach to provide 
              highly personalized career recommendations based on your interests and skills.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Level 1: Interest Assessment</h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  25 questions across 5 domains to gauge your natural interests and preferences
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Analytical Reasoning</Badge>
                  <Badge variant="secondary" className="text-xs">Spatial Design</Badge>
                  <Badge variant="secondary" className="text-xs">Math/Quant</Badge>
                  <Badge variant="secondary" className="text-xs">Problem Solving</Badge>
                  <Badge variant="secondary" className="text-xs">Social Skills</Badge>
                </div>
              </div>
              
              <div className="p-6 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Level 2: Skill Assessment</h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Focused questions on your top 2-3 domains to evaluate actual skill competency
                </p>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">Personalized to your interests</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Career Recommendations</h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-200">
                Get matched with courses and career paths where your interests and skills align, 
                complete with entry requirements and job role examples.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={startGeneralQuiz} 
              size="lg" 
              className="animate-pulse-glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Brain className="mr-2 h-5 w-5" />
              Start Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              <Clock className="inline h-3 w-3 mr-1" />
              Estimated time: 15-20 minutes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show general quiz
  if (currentStage === 'general') {
    const currentQuestion = generalQuestions[generalCurrentIndex];
    const progress = ((generalCurrentIndex + 1) / generalQuestions.length) * 100;

    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Level 1: Interest Assessment</span>
            </div>
            <span className="text-sm text-primary font-semibold">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              Question {generalCurrentIndex + 1} of {generalQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-xl font-headline">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleGeneralAnswerSelect(index)}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:border-primary/50",
                  generalSelectedOption === index
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-semibold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>
          <Button
            onClick={handleGeneralNextQuestion}
            disabled={generalSelectedOption === null || savingResults}
            className="w-full"
            size="lg"
          >
            {generalCurrentIndex < generalQuestions.length - 1
              ? "Next Question"
              : "Complete Level 1"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show general quiz results
  if (currentStage === 'general-results' && generalResults) {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Level 1 Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-4">
              Based on your responses, here are your top interest areas:
            </p>
            <div className="space-y-3">
              {generalResults.topDomains.slice(0, 5).map((domain, index) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-background/50 to-primary/5 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-gold-500 text-white" :
                      index === 1 ? "bg-gray-400 text-white" :
                      index === 2 ? "bg-amber-600 text-white" :
                      "bg-gray-200 text-gray-700"
                    )}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{domain}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {generalResults.domainScores[domain]} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {savingResults && (
            <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Processing your results...
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Ready for Level 2? We'll focus on your strongest domains to assess your actual skills.
            </p>
            <Button 
              onClick={startPersonalizedQuiz} 
              size="lg"
              disabled={savingResults}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Level 2 Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show personalized quiz
  if (currentStage === 'personalized') {
    const currentQuestion = personalizedQuestions[personalizedCurrentIndex];
    const progress = ((personalizedCurrentIndex + 1) / personalizedQuestions.length) * 100;

    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Level 2: Skill Assessment</span>
            </div>
            <span className="text-sm text-primary font-semibold">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              Question {personalizedCurrentIndex + 1} of {personalizedQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Focusing on your top domains:</p>
            <div className="flex flex-wrap gap-1">
              {selectedDomains.map(domain => (
                <Badge key={domain} variant="secondary" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>
          </div>
          <CardTitle className="text-xl font-headline">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handlePersonalizedAnswerSelect(index)}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:border-primary/50",
                  personalizedSelectedOption === index
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-semibold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>
          <Button
            onClick={handlePersonalizedNextQuestion}
            disabled={personalizedSelectedOption === null || savingResults}
            className="w-full"
            size="lg"
          >
            {personalizedCurrentIndex < personalizedQuestions.length - 1
              ? "Next Question"
              : "Generate Career Recommendations"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show career recommendations
  if (currentStage === 'career-recommendations' || currentStage === 'completed') {
    return (
      <Card className="glass-card max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-gold-500" />
            Your Career Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {savingResults && (
            <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Generating your personalized career recommendations...
              </p>
            </div>
          )}

          {careerRecommendations.length > 0 ? (
            <>
              <div className="text-center mb-6">
                <p className="text-lg text-muted-foreground mb-2">
                  Found {careerRecommendations.length} career paths that match your profile!
                </p>
                <p className="text-sm text-muted-foreground">
                  These recommendations are based on your interests and demonstrated skills.
                </p>
              </div>

              <div className="grid gap-4 mb-8">
                {careerRecommendations.slice(0, 10).map((recommendation, index) => (
                  <div
                    key={recommendation.course.course_id}
                    className="p-6 border rounded-lg bg-gradient-to-r from-background/50 to-primary/5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {recommendation.course.course_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Badge variant="outline" className="text-xs">
                            {recommendation.course.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {recommendation.course.duration} years
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {recommendation.course.stream}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(recommendation.match_score * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">match</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-2">Matching skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.matching_skills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-2">Example career roles:</p>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.course.example_job_roles.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {recommendation.course.available_in_jk && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
                        ✅ Available in Jammu & Kashmir
                        {recommendation.course.jk_notes && (
                          <div className="mt-1 text-green-600 dark:text-green-400">
                            {recommendation.course.jk_notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={restartQuiz} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Assessment
                  </Button>
                  <Button asChild>
                    <Link href="/profile">
                      View Updated Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No career recommendations found. This might be due to incomplete assessment data.
              </p>
              <Button onClick={restartQuiz} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
