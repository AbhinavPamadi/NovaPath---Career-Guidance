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
  SubjectQuizQuestion,
  SubjectQuizAnswer,
  CareerRecommendation,
  type NormalizedDomain
} from "@/lib/quiz-system";
import { useSimpleTranslation } from "@/hooks/use-simple-translation";

type QuizStage = 'start' | 'general' | 'general-results' | 'personalized' | 'personalized-results' | 'subject-selection' | 'subject-quiz' | 'subject-results' | 'career-recommendations' | 'completed';

export function TwoTierQuiz() {
  const { user, loading } = useAuth();
  const { t } = useSimpleTranslation();
  
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
  
  // Subject quiz state  
  const [availableSubjects] = useState<string[]>(['Arts', 'Biology', 'Chemistry', 'CS', 'Economics', 'Physics']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectQuestions, setSubjectQuestions] = useState<SubjectQuizQuestion[]>([]);
  const [subjectCurrentIndex, setSubjectCurrentIndex] = useState(0);
  const [subjectAnswers, setSubjectAnswers] = useState<SubjectQuizAnswer[]>([]);
  const [subjectSelectedOption, setSubjectSelectedOption] = useState<number | null>(null);
  const [subjectResults, setSubjectResults] = useState<{ [subject: string]: number } | null>(null);
  
  // Personalized quiz state
  const [personalizedQuestions, setPersonalizedQuestions] = useState<PersonalizedQuizQuestion[]>([]);
  const [personalizedCurrentIndex, setPersonalizedCurrentIndex] = useState(0);
  const [personalizedAnswers, setPersonalizedAnswers] = useState<PersonalizedQuizAnswer[]>([]);
  const [personalizedSelectedOption, setPersonalizedSelectedOption] = useState<number | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  
  // Career recommendations state
  const [careerRecommendations, setCareerRecommendations] = useState<CareerRecommendation[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 recommendations per page

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
        } else if (progress.hasCompletedSubjects) {
          setCurrentStage('subject-results');
          if (progress.subjectResults) {
            setSubjectResults(progress.subjectResults.subject_scores);
            setSelectedSubjects(progress.subjectResults.selected_subjects);
          }
        } else if (progress.hasCompletedGeneral) {
          // Skip general-results and directly prepare for personalized quiz
          if (progress.generalResults) {
            setGeneralResults({
              domainScores: progress.generalResults.domain_scores,
              topDomains: progress.generalResults.top_domains
            });
            
            try {
              const domains = quizSystem.selectPersonalizedQuizDomains(
                progress.generalResults.top_domains,
                progress.generalResults.domain_scores
              );
              setSelectedDomains(domains);
              
              const questions = await quizSystem.loadPersonalizedQuizQuestions(domains);
              setPersonalizedQuestions(questions);
              setCurrentStage('personalized');
              setPersonalizedCurrentIndex(0);
              setPersonalizedAnswers([]);
              setPersonalizedSelectedOption(null);
            } catch (error) {
              console.error('Failed to load personalized quiz:', error);
              // Fallback to general-results if loading fails
              setCurrentStage('general-results');
            }
          } else {
            setCurrentStage('general-results');
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
      // Process general quiz results and directly proceed to level 2
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
        
        // Skip general-results display and directly start personalized quiz
        const domains = quizSystem.selectPersonalizedQuizDomains(
          results.topDomains,
          results.domainScores
        );
        setSelectedDomains(domains);
        
        const questions = await quizSystem.loadPersonalizedQuizQuestions(domains);
        setPersonalizedQuestions(questions);
        setCurrentStage('personalized');
        setPersonalizedCurrentIndex(0);
        setPersonalizedAnswers([]);
        setPersonalizedSelectedOption(null);
      } catch (error) {
        console.error('Failed to process general quiz results:', error);
      } finally {
        setSavingResults(false);
      }
    }
  };

  const startSubjectSelection = () => {
    setCurrentStage('subject-selection');
    setSelectedSubjects([]);
  };

  const generateFinalRecommendations = async () => {
    if (!generalResults || !subjectResults || !user) return;
    
    setSavingResults(true);
    try {
      // Generate enhanced career recommendations with all quiz data
      const userInterests = generalResults.topDomains.slice(0, 3);
      const userSkills = Object.entries(generalResults.domainScores)
        .filter(([, score]) => score > 0.3) // Filter for decent scores
        .map(([domain]) => domain);
      const userSubjects = selectedSubjects;
      
      const recommendations = await quizSystem.generateCareerRecommendations(
        userInterests,
        userSkills,
        userSubjects,
        subjectResults
      );
      
      setCareerRecommendations(recommendations);
      setCurrentPage(1); // Reset to first page when new recommendations are generated
      
      // Save enhanced career suggestions
      await quizSystem.saveCareerSuggestions(
        user.uid,
        userInterests,
        userSkills,
        recommendations,
        userSubjects
      );
      
      setCurrentStage('career-recommendations');
    } catch (error) {
      console.error('Failed to generate final recommendations:', error);
    } finally {
      setSavingResults(false);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  const startSubjectQuiz = async () => {
    if (selectedSubjects.length === 0 || !user) return;
    
    setSavingResults(true);
    try {
      const subjectQuestionMap = await quizSystem.loadSubjectQuestions(selectedSubjects);
      
      // Flatten questions from all selected subjects
      const allQuestions: SubjectQuizQuestion[] = [];
      selectedSubjects.forEach(subject => {
        const questions = subjectQuestionMap[subject] || [];
        questions.forEach(q => {
          allQuestions.push({
            ...q,
            subject: subject // Add subject info to each question
          } as SubjectQuizQuestion & { subject: string });
        });
      });
      
      // Shuffle the combined questions
      const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
      setSubjectQuestions(shuffledQuestions);
      setCurrentStage('subject-quiz');
      setSubjectCurrentIndex(0);
      setSubjectAnswers([]);
      setSubjectSelectedOption(null);
    } catch (error) {
      console.error('Failed to load subject quiz questions:', error);
    } finally {
      setSavingResults(false);
    }
  };

  const handleSubjectAnswerSelect = (optionIndex: number) => {
    setSubjectSelectedOption(optionIndex);
  };

  const handleSubjectNextQuestion = async () => {
    if (subjectSelectedOption === null) return;

    const currentQuestion = subjectQuestions[subjectCurrentIndex];
    const selectedOption = currentQuestion.options[subjectSelectedOption];
    const questionSubject = (currentQuestion as any).subject || 'unknown';
    
    const newAnswer: SubjectQuizAnswer = {
      question_id: currentQuestion.question_id,
      selected_option_index: subjectSelectedOption,
      domain_weights: selectedOption.domain_weights,
      subject: questionSubject
    };

    const updatedAnswers = [...subjectAnswers, newAnswer];
    setSubjectAnswers(updatedAnswers);

    if (subjectCurrentIndex < subjectQuestions.length - 1) {
      setSubjectCurrentIndex(subjectCurrentIndex + 1);
      setSubjectSelectedOption(null);
    } else {
      // Process subject quiz results
      setSavingResults(true);
      try {
        const results = quizSystem.processSubjectQuizResults(updatedAnswers);
        setSubjectResults(results);
        
        // Save to Firestore
        await quizSystem.saveSubjectQuizResults(
          user!.uid,
          selectedSubjects,
          updatedAnswers,
          results
        );
        
        setCurrentStage('subject-results');
      } catch (error) {
        console.error('Failed to process subject quiz results:', error);
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
        
        // Move to subject selection after personalized quiz
        setCurrentStage('personalized-results');
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
    setSelectedSubjects([]);
    setSubjectQuestions([]);
    setSubjectCurrentIndex(0);
    setSubjectAnswers([]);
    setSubjectSelectedOption(null);
    setSubjectResults(null);
    setPersonalizedQuestions([]);
    setPersonalizedCurrentIndex(0);
    setPersonalizedAnswers([]);
    setPersonalizedSelectedOption(null);
    setSelectedDomains([]);
    setCareerRecommendations([]);
    setCurrentPage(1); // Reset pagination
  };

  // Pagination helper functions
  const totalPages = Math.ceil(careerRecommendations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecommendations = careerRecommendations.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
            Enhanced Career Discovery Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-6">
            Discover your ideal career path with our comprehensive three-tier assessment system featuring 
            subject-specific testing. Sign in to unlock personalized insights and career recommendations.
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
            {t('enhanced_career_discovery')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <p className="text-lg text-muted-foreground mb-6">
              Our advanced career assessment system uses a scientific three-tier approach with subject-specific 
              testing to provide highly personalized career recommendations based on your interests, subjects, and skills.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Level 1: General Assessment</h3>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-200 mb-2">
                  25 questions across 5 domains to gauge your natural interests
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Analytical</Badge>
                  <Badge variant="secondary" className="text-xs">Spatial</Badge>
                  <Badge variant="secondary" className="text-xs">Math</Badge>
                  <Badge variant="secondary" className="text-xs">Problem Solving</Badge>
                  <Badge variant="secondary" className="text-xs">Social</Badge>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Level 2: Personalized Assessment</h3>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-200 mb-2">
                  Targeted questions based on your strengths to evaluate skills
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Arts</Badge>
                  <Badge variant="secondary" className="text-xs">Biology</Badge>
                  <Badge variant="secondary" className="text-xs">Chemistry</Badge>
                  <Badge variant="secondary" className="text-xs">CS</Badge>
                  <Badge variant="secondary" className="text-xs">Economics</Badge>
                  <Badge variant="secondary" className="text-xs">Physics</Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm">Level 3: Subject-Specific Assessment</h3>
                </div>
                <p className="text-xs text-green-700 dark:text-green-200 mb-2">
                  Choose subjects of interest and answer specific questions
                </p>
                <div className="mt-2">
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
                Get matched with courses and career paths where your interests, subjects, and skills align, 
                with priority given to subject+skill matches over skill-only matches.
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
              {t('start_assessment')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              <Clock className="inline h-3 w-3 mr-1" />
              Estimated time: 20-25 minutes
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
              <span className="text-sm font-medium text-blue-600">{t('level_1_general')}</span>
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
          {/* Display image for image-based questions in Level 1 */}
          {currentQuestion.image_path && (
            <div className="mb-6 flex justify-center">
              <img 
                src={currentQuestion.image_path} 
                alt="Question image"
                className="max-w-full h-auto max-h-96 rounded-lg border border-border shadow-sm"
                onError={(e) => {
                  console.error('Failed to load Level 1 question image:', currentQuestion.image_path);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option: any, index: number) => (
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
              ? t('next_question')
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
              Ready for Level 2? We'll now conduct a personalized assessment based on your interests.
            </p>
            <Button 
              onClick={startPersonalizedQuiz} 
              size="lg"
              disabled={savingResults}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {t('continue_to_personalized')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show subject selection
  if (currentStage === 'subject-selection') {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-500" />
            Level 3: Subject Interest Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-4">
              Select one or more subjects that interest you. We'll test your knowledge and align 
              your career recommendations accordingly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {availableSubjects.map(subject => (
              <button
                key={subject}
                onClick={() => handleSubjectToggle(subject)}
                className={cn(
                  "p-4 text-left rounded-lg border-2 transition-all duration-200 hover:border-primary/50",
                  selectedSubjects.includes(subject)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subject}</span>
                  {selectedSubjects.includes(subject) && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-4">
              Selected: {selectedSubjects.length} subject(s)
            </p>
            <Button
              onClick={startSubjectQuiz}
              disabled={selectedSubjects.length === 0 || savingResults}
              className="w-full"
              size="lg"
            >
              {savingResults ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading Questions...
                </>
              ) : (
                <>
                  {t('start_subject_quiz')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show subject quiz
  if (currentStage === 'subject-quiz') {
    const currentQuestion = subjectQuestions[subjectCurrentIndex];
    const progress = ((subjectCurrentIndex + 1) / subjectQuestions.length) * 100;

    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">{t('level_3_subject')}</span>
            </div>
            <span className="text-sm text-primary font-semibold">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              Question {subjectCurrentIndex + 1} of {subjectQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Selected subjects:</p>
            <div className="flex flex-wrap gap-1">
              {selectedSubjects.map(subject => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  {subject}
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
            {currentQuestion.options.map((option: any, index: number) => (
              <button
                key={index}
                onClick={() => handleSubjectAnswerSelect(index)}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:border-primary/50",
                  subjectSelectedOption === index
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
            onClick={handleSubjectNextQuestion}
            disabled={subjectSelectedOption === null || savingResults}
            className="w-full"
            size="lg"
          >
            {subjectCurrentIndex < subjectQuestions.length - 1
              ? t('next_question')
              : "Complete Subject Assessment"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show subject results
  if (currentStage === 'subject-results' && subjectResults) {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Subject Assessment Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-4">
              Your subject interest strengths:
            </p>
            <div className="space-y-3">
              {Object.entries(subjectResults)
                .sort(([, a], [, b]) => b - a)
                .map(([subject, score], index) => (
                <div
                  key={subject}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-background/50 to-purple-50/20 rounded-lg border"
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
                    <span className="font-medium">{subject}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {score} points
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
              Ready to see your personalized career recommendations?
            </p>
            <Button 
              onClick={generateFinalRecommendations} 
              size="lg"
              disabled={savingResults}
              className="bg-gradient-to-r from-purple-600 to-gold-600 hover:from-purple-700 hover:to-gold-700"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Generate Career Recommendations
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
              <span className="text-sm font-medium text-green-600">{t('level_2_personalized')}</span>
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
          {/* Display image for spatial reasoning questions */}
          {currentQuestion.image_path && (
            <div className="mb-6 flex justify-center">
              <img 
                src={currentQuestion.image_path} 
                alt="Spatial reasoning question"
                className="max-w-full h-auto max-h-96 rounded-lg border border-border shadow-sm"
                onError={(e) => {
                  console.error('Failed to load spatial question image:', currentQuestion.image_path);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option: any, index: number) => (
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
              ? t('next_question')
              : "Complete Level 2"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show personalized quiz results
  if (currentStage === 'personalized-results') {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Level 2 Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <p className="text-lg text-muted-foreground mb-6">
              Excellent! You've completed your personalized assessment. Now let's explore your subject-specific interests.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
              <p className="text-sm text-muted-foreground">
                In Level 3, you'll select subjects you're interested in and answer questions specific to those areas. 
                This will help us provide more targeted career recommendations.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Ready for Level 3? Choose your subject interests for detailed assessment.
            </p>
            <Button 
              onClick={startSubjectSelection} 
              size="lg"
              disabled={savingResults}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              {t('continue_to_subject')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
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
                  Found {careerRecommendations.length} career paths ranked for your profile!
                </p>
                <p className="text-sm text-muted-foreground">
                  Comprehensive ranking from strongest to weakest match • Page {currentPage} of {totalPages}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Showing positions {startIndex + 1}-{Math.min(endIndex, careerRecommendations.length)} of {careerRecommendations.length} total recommendations
                </div>
              </div>

              {/* Display user's subject scores */}
              {subjectResults && Object.keys(subjectResults).length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                  <h3 className="font-semibold text-lg mb-3 text-center">Your Subject Quiz Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(subjectResults)
                      .sort(([, a], [, b]) => b - a)
                      .map(([subject, score], index) => (
                      <div key={subject} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className={cn(
                          "text-2xl font-bold mb-1",
                          index === 0 ? "text-gold-500" :
                          index === 1 ? "text-gray-500" :
                          index === 2 ? "text-amber-600" :
                          "text-gray-400"
                        )}>
                          {score}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {subject}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 mb-8">
                {currentRecommendations.map((recommendation, index) => (
                  <div
                    key={recommendation.course.course_id}
                    className="p-6 border rounded-lg bg-gradient-to-r from-background/50 to-primary/5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
                            (recommendation.ranking_position || (startIndex + index + 1)) === 1 ? "bg-gold-500" :
                            (recommendation.ranking_position || (startIndex + index + 1)) === 2 ? "bg-gray-400" :
                            (recommendation.ranking_position || (startIndex + index + 1)) === 3 ? "bg-amber-600" :
                            "bg-gray-300"
                          )}>
                            {recommendation.ranking_position || (startIndex + index + 1)}
                          </div>
                          <h3 className="font-semibold text-lg">
                            {recommendation.course.course_name}
                          </h3>
                        </div>
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
                          {recommendation.subject_matched && recommendation.course.subject_interest && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              {recommendation.course.subject_interest}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {recommendation.user_subject_scores && Object.keys(recommendation.user_subject_scores).length > 0 && (
                        <div className="text-right ml-4">
                          <div className="text-xs text-muted-foreground mb-1">Your scores:</div>
                          <div className="space-y-1">
                            {Object.entries(recommendation.user_subject_scores)
                              .sort(([, a], [, b]) => b - a)
                              .map(([subject, score]) => (
                              <div key={subject} className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{subject}:</span>
                                <span className={cn(
                                  "text-sm font-bold",
                                  recommendation.course.subject_interest === subject ? 
                                    "text-green-600" : "text-gray-500"
                                )}>
                                  {score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Button 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {/* Show first page */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          onClick={() => goToPage(1)}
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                        >
                          1
                        </Button>
                        {currentPage > 4 && <span className="text-muted-foreground">...</span>}
                      </>
                    )}
                    
                    {/* Show pages around current page */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (page > totalPages) return null;
                      return (
                        <Button
                          key={page}
                          onClick={() => goToPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-muted-foreground">...</span>}
                        <Button
                          onClick={() => goToPage(totalPages)}
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              )}

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
