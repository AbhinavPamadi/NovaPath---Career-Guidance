import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Domain mappings for consistent naming
export const DOMAIN_MAPPING = {
  'analytical': 'Analytical/logical reasoning',
  'visualization': 'Visualization/Spatial design', 
  'spatial': 'Visualization/Spatial design',
  'math': 'Math/quant',
  'problem_solving': 'Problem-solving/Creative thinking',
  'creative_thinking': 'Problem-solving/Creative thinking',
  'social': 'Social/intrapersonal skills'
} as const;

export const NORMALIZED_DOMAINS = [
  'Analytical/logical reasoning',
  'Visualization/Spatial design',
  'Math/quant', 
  'Problem-solving/Creative thinking',
  'Social/intrapersonal skills'
] as const;

export type NormalizedDomain = typeof NORMALIZED_DOMAINS[number];

// General Quiz interfaces
export interface GeneralQuizOption {
  option_text: string;
  domain_weights: { [key: string]: number };
}

export interface GeneralQuizQuestion {
  question_id: string;
  question_text: string;
  options: GeneralQuizOption[];
}

export interface GeneralQuizData {
  [key: string]: GeneralQuizQuestion[];
}

export interface GeneralQuizAnswer {
  question_id: string;
  selected_option_index: number;
  domain_weights: { [key: string]: number };
}

export interface GeneralQuizResults {
  [domain: string]: number;
}

// Personalized Quiz interfaces
export interface PersonalizedQuizOption {
  option_text: string;
  domain_weights: { [key: string]: number };
}

export interface PersonalizedQuizQuestion {
  question_type?: string;
  question_text: string;
  options: PersonalizedQuizOption[];
}

export interface PersonalizedQuizData {
  [key: string]: PersonalizedQuizQuestion[];
}

export interface PersonalizedQuizAnswer {
  question_index: number;
  selected_option_index: number;
  domain_weights: { [key: string]: number };
  question_domain?: string;
  is_correct?: boolean;
  timestamp?: Date;
}

// Adaptive Quiz State Management
export interface AdaptiveQuizState {
  current_question_index: number;
  domain_accuracy: { [domain: string]: number };
  questions_attempted: { [domain: string]: number };
  questions_correct: { [domain: string]: number };
  domain_question_pool: { [domain: string]: PersonalizedQuizQuestion[] };
  asked_questions: Set<string>;
  should_continue: { [domain: string]: boolean };
}

export interface PersonalizedQuizResults {
  [domain: string]: number;
}

// Career interfaces
export interface Course {
  course_id: string;
  course_name: string;
  stream: string;
  course_family: string;
  level: string;
  duration: number;
  typical_entry_paths: string[];
  available_in_jk: boolean;
  jk_notes?: string;
  skill_labels: string[];
  example_job_roles: string[];
  confidence_level: string;
}

export interface CareerRecommendation {
  course: Course;
  match_score: number;
  matching_skills: string[];
}

// Firestore storage interfaces
export interface GeneralQuizInferences {
  quiz_type: 'general';
  completed_at: Date;
  domain_scores: GeneralQuizResults;
  top_domains: string[];
  answers: GeneralQuizAnswer[];
}

export interface PersonalizedQuizInferences {
  quiz_type: 'personalized';
  completed_at: Date;
  selected_domains: string[];
  domain_scores: PersonalizedQuizResults;
  domain_accuracy: { [domain: string]: number };
  questions_attempted: { [domain: string]: number };
  skill_competency: { [domain: string]: number };
  answers: PersonalizedQuizAnswer[];
}

export interface CareerSuggestions {
  generated_at: Date;
  user_interests: string[];
  user_skills: string[];
  recommendations: CareerRecommendation[];
  total_matches: number;
}

// Adaptive Quiz System Class
export class AdaptiveThreeTierQuizSystem {
  
  /**
   * Step 1: Load and prepare general quiz questions
   */
  async loadGeneralQuizQuestions(): Promise<GeneralQuizQuestion[]> {
    const selectedQuestions: GeneralQuizQuestion[] = [];
    
    const generalQuestionFiles = [
      'analytical.json',
      'spatial.json', 
      'math.json',
      'Problem.json',
      'social.json'
    ];

    for (const file of generalQuestionFiles) {
      try {
        const response = await fetch(`/Questions/generalQuestions/${file}`);
        const data: GeneralQuizData = await response.json();
        
        // Get the first key (domain name) from the JSON
        const domainKey = Object.keys(data)[0];
        const questions = data[domainKey];
        
        if (questions && questions.length > 0) {
          // Select 5 non-repeating questions
          const shuffled = [...questions].sort(() => Math.random() - 0.5);
          selectedQuestions.push(...shuffled.slice(0, 5));
        }
      } catch (error) {
        console.error(`Failed to load ${file}:`, error);
      }
    }

    return selectedQuestions;
  }

  /**
   * Step 1: Process general quiz results and determine top domains
   */
  processGeneralQuizResults(answers: GeneralQuizAnswer[]): {
    domainScores: GeneralQuizResults;
    topDomains: string[];
  } {
    const domainScores: GeneralQuizResults = {};

    // Aggregate domain weights
    answers.forEach(answer => {
      Object.entries(answer.domain_weights).forEach(([domain, weight]) => {
        const normalizedDomain = this.normalizeDomainName(domain);
        domainScores[normalizedDomain] = (domainScores[normalizedDomain] || 0) + weight;
      });
    });

    // Sort domains by score and get top domains
    const sortedDomains = Object.entries(domainScores)
      .sort(([, a], [, b]) => b - a)
      .map(([domain]) => domain);

    return {
      domainScores,
      topDomains: sortedDomains
    };
  }

  /**
   * Step 2: Determine which domains to include in personalized quiz
   */
  selectPersonalizedQuizDomains(topDomains: string[], domainScores: GeneralQuizResults): string[] {
    if (topDomains.length < 2) {
      throw new Error('Need at least 2 domains from general quiz');
    }

    const selectedDomains = [topDomains[0], topDomains[1]]; // Always include top 2

    // Include 3rd domain if (score_2 - score_3) ≈ (score_1 - score_2)
    if (topDomains.length >= 3) {
      const score1 = domainScores[topDomains[0]] || 0;
      const score2 = domainScores[topDomains[1]] || 0;
      const score3 = domainScores[topDomains[2]] || 0;

      const diff1_2 = score1 - score2;
      const diff2_3 = score2 - score3;

      // Consider "approximately equal" if difference is within 20% of each other
      if (Math.abs(diff1_2 - diff2_3) <= Math.max(diff1_2, diff2_3) * 0.2) {
        selectedDomains.push(topDomains[2]);
      }
    }

    return selectedDomains;
  }

  /**
   * Step 2: Initialize adaptive quiz state with question pools for selected domains
   */
  async initializeAdaptiveQuiz(selectedDomains: string[]): Promise<AdaptiveQuizState> {
    const domainQuestionPool: { [domain: string]: PersonalizedQuizQuestion[] } = {};
    
    const domainFileMapping: { [key: string]: string } = {
      'Analytical/logical reasoning': 'Analytical-logical reasoning.json',
      'Math/quant': 'MathQues.json',
      'Problem-solving/Creative thinking': 'problem_solving_creative_thinking_questions.json',
      'Social/intrapersonal skills': 'intrapersonal skills.json',
      'Visualization/Spatial design': 'VisualizationSpatialQues.json'
    };

    // Load all questions for selected domains
    for (const domain of selectedDomains) {
      const filename = domainFileMapping[domain];
      if (!filename) {
        console.warn(`No question file found for domain: ${domain}`);
        continue;
      }

      try {
        const response = await fetch(`/Questions/${filename}`);
        const data = await response.json();
        
        let domainQuestions: PersonalizedQuizQuestion[] = [];
        
        // Handle different file structures
        if (Array.isArray(data)) {
          domainQuestions = data.map(item => ({
            question_text: item.question_text,
            options: item.options,
            question_type: item.question_type || domain
          }));
        } else {
          const dataKey = Object.keys(data)[0];
          const rawQuestions = data[dataKey];
          if (rawQuestions && Array.isArray(rawQuestions)) {
            domainQuestions = rawQuestions.map(item => ({
              question_text: item.question_text,
              options: item.options,
              question_type: item.question_type || domain
            }));
          }
        }
        
        if (domainQuestions.length > 0) {
          // Shuffle questions to ensure random selection
          domainQuestionPool[domain] = [...domainQuestions].sort(() => Math.random() - 0.5);
        }
      } catch (error) {
        console.error(`Failed to load adaptive questions for ${domain}:`, error);
      }
    }

    // Initialize adaptive state
    const adaptiveState: AdaptiveQuizState = {
      current_question_index: 0,
      domain_accuracy: {},
      questions_attempted: {},
      questions_correct: {},
      domain_question_pool: domainQuestionPool,
      asked_questions: new Set<string>(),
      should_continue: {}
    };

    // Initialize counters for all domains
    selectedDomains.forEach(domain => {
      adaptiveState.domain_accuracy[domain] = 0;
      adaptiveState.questions_attempted[domain] = 0;
      adaptiveState.questions_correct[domain] = 0;
      adaptiveState.should_continue[domain] = true;
    });

    return adaptiveState;
  }

  /**
   * Step 2: Load personalized quiz questions for selected domains (Legacy method - kept for compatibility)
   */
  async loadPersonalizedQuizQuestions(selectedDomains: string[]): Promise<PersonalizedQuizQuestion[]> {
    const questions: PersonalizedQuizQuestion[] = [];

    const domainFileMapping: { [key: string]: string } = {
      'Analytical/logical reasoning': 'Analytical-logical reasoning.json',
      'Math/quant': 'MathQues.json',
      'Problem-solving/Creative thinking': 'problem_solving_creative_thinking_questions.json',
      'Social/intrapersonal skills': 'intrapersonal skills.json',
      'Visualization/Spatial design': 'VisualizationSpatialQues.json'
    };

    for (const domain of selectedDomains) {
      const filename = domainFileMapping[domain];
      if (!filename) {
        console.warn(`No question file found for domain: ${domain}`);
        continue;
      }

      try {
        const response = await fetch(`/Questions/${filename}`);
        const data = await response.json();
        
        let domainQuestions: PersonalizedQuizQuestion[] = [];
        
        // Handle different file structures
        if (Array.isArray(data)) {
          // Direct array format (like intrapersonal skills.json)
          domainQuestions = data.map(item => ({
            question_text: item.question_text,
            options: item.options,
            question_type: item.question_type || domain
          }));
        } else {
          // Object format with domain key
          const dataKey = Object.keys(data)[0];
          const rawQuestions = data[dataKey];
          if (rawQuestions && Array.isArray(rawQuestions)) {
            domainQuestions = rawQuestions.map(item => ({
              question_text: item.question_text,
              options: item.options,
              question_type: item.question_type || domain
            }));
          }
        }
        
        if (domainQuestions.length > 0) {
          // Select 5-8 random questions per domain
          const shuffled = [...domainQuestions].sort(() => Math.random() - 0.5);
          questions.push(...shuffled.slice(0, 6));
        }
      } catch (error) {
        console.error(`Failed to load personalized questions for ${domain}:`, error);
      }
    }

    return questions;
  }

  /**
   * Step 2: Get next adaptive question based on current state and 75% accuracy threshold
   */
  getNextAdaptiveQuestion(
    state: AdaptiveQuizState, 
    selectedDomains: string[]
  ): { question: PersonalizedQuizQuestion; domain: string; questionId: string } | null {
    
    // Check if we should stop (all domains completed or max questions reached)
    const shouldStop = selectedDomains.every(domain => 
      !state.should_continue[domain] || 
      state.questions_attempted[domain] >= 15
    );
    
    if (shouldStop) {
      return null;
    }

    // Strategy: Prioritize domains that need more questions
    let targetDomain = null;
    
    // 1. First, check domains that are still eligible and below 75% accuracy
    for (const domain of selectedDomains) {
      if (!state.should_continue[domain] || state.questions_attempted[domain] >= 15) continue;
      
      const accuracy = state.questions_attempted[domain] > 0 
        ? state.questions_correct[domain] / state.questions_attempted[domain] 
        : 0;
      
      // If accuracy < 75% and we have questions, prioritize this domain
      if (accuracy < 0.75 && state.domain_question_pool[domain]?.length > 0) {
        targetDomain = domain;
        break;
      }
    }
    
    // 2. If no low-accuracy domains, check domains with high accuracy that still need exploration
    if (!targetDomain) {
      for (const domain of selectedDomains) {
        if (!state.should_continue[domain] || state.questions_attempted[domain] >= 15) continue;
        
        const accuracy = state.questions_attempted[domain] > 0 
          ? state.questions_correct[domain] / state.questions_attempted[domain] 
          : 0;
        
        // If accuracy >= 75% but we haven't asked many questions yet, continue occasionally
        if (accuracy >= 0.75 && state.questions_attempted[domain] < 8 && 
            state.domain_question_pool[domain]?.length > 0) {
          targetDomain = domain;
          break;
        }
      }
    }
    
    // 3. Always explore at least 1-2 questions from outside top domains occasionally
    if (!targetDomain) {
      // Find a domain we haven't explored much
      for (const domain of selectedDomains) {
        if (state.questions_attempted[domain] < 2 && 
            state.domain_question_pool[domain]?.length > 0) {
          targetDomain = domain;
          break;
        }
      }
    }
    
    // 4. Default: pick first available domain
    if (!targetDomain) {
      targetDomain = selectedDomains.find(domain => 
        state.should_continue[domain] && 
        state.questions_attempted[domain] < 15 &&
        state.domain_question_pool[domain]?.length > 0
      );
    }
    
    if (!targetDomain || !state.domain_question_pool[targetDomain]?.length) {
      return null;
    }
    
    // Get next available question from the target domain
    const domainQuestions = state.domain_question_pool[targetDomain];
    let questionIndex = 0;
    let questionId = `${targetDomain}_${questionIndex}`;
    
    // Find a question we haven't asked yet
    while (questionIndex < domainQuestions.length && 
           state.asked_questions.has(questionId)) {
      questionIndex++;
      questionId = `${targetDomain}_${questionIndex}`;
    }
    
    if (questionIndex >= domainQuestions.length) {
      // No more questions in this domain
      state.should_continue[targetDomain] = false;
      return this.getNextAdaptiveQuestion(state, selectedDomains);
    }
    
    return {
      question: domainQuestions[questionIndex],
      domain: targetDomain,
      questionId
    };
  }

  /**
   * Step 2: Process adaptive question answer and update state
   */
  processAdaptiveAnswer(
    state: AdaptiveQuizState,
    answer: PersonalizedQuizAnswer,
    questionDomain: string,
    questionId: string
  ): void {
    // Mark question as asked
    state.asked_questions.add(questionId);
    
    // Update question attempts for the domain
    state.questions_attempted[questionDomain] = (state.questions_attempted[questionDomain] || 0) + 1;
    
    // Determine if answer is "correct" based on domain weights
    // A question is considered "correct" if the selected option has the highest weight for the target domain
    const selectedOption = answer.domain_weights;
    const targetDomainWeight = selectedOption[this.getDomainKey(questionDomain)] || 0;
    
    // Check if this is the highest weight among all domains for this option
    const maxWeight = Math.max(...Object.values(selectedOption));
    const isCorrect = targetDomainWeight === maxWeight && targetDomainWeight > 0;
    
    if (isCorrect) {
      state.questions_correct[questionDomain] = (state.questions_correct[questionDomain] || 0) + 1;
    }
    
    // Update accuracy
    state.domain_accuracy[questionDomain] = state.questions_attempted[questionDomain] > 0
      ? state.questions_correct[questionDomain] / state.questions_attempted[questionDomain]
      : 0;
    
    // Update continuation decision based on 75% threshold
    const accuracy = state.domain_accuracy[questionDomain];
    const attempts = state.questions_attempted[questionDomain];
    
    // Stop asking questions from this domain if:
    // 1. We've asked 15 questions, OR
    // 2. We have high confidence (accuracy >= 75% with at least 4 questions)
    if (attempts >= 15 || (accuracy >= 0.75 && attempts >= 4)) {
      state.should_continue[questionDomain] = false;
    }
    
    // Update answer with correctness info
    answer.is_correct = isCorrect;
    answer.question_domain = questionDomain;
    answer.timestamp = new Date();
  }

  /**
   * Helper method to get domain key for weight lookup
   */
  private getDomainKey(normalizedDomain: string): string {
    const reverseMapping: { [key: string]: string } = {};
    Object.entries(DOMAIN_MAPPING).forEach(([key, value]) => {
      reverseMapping[value] = key;
    });
    
    return reverseMapping[normalizedDomain] || normalizedDomain.toLowerCase().replace(/[^a-z]/g, '_');
  }

  /**
   * Step 2: Process adaptive quiz results with enhanced metrics
   */
  processAdaptiveQuizResults(
    answers: PersonalizedQuizAnswer[], 
    state: AdaptiveQuizState
  ): {
    domainScores: PersonalizedQuizResults;
    domainAccuracy: { [domain: string]: number };
    questionsAttempted: { [domain: string]: number };
    skillCompetency: { [domain: string]: number };
  } {
    const domainScores: PersonalizedQuizResults = {};
    
    // Aggregate domain weights
    answers.forEach(answer => {
      Object.entries(answer.domain_weights).forEach(([domain, weight]) => {
        const normalizedDomain = this.normalizeDomainName(domain);
        domainScores[normalizedDomain] = (domainScores[normalizedDomain] || 0) + weight;
      });
    });

    // Calculate enhanced skill competency: accuracy × attempts × normalized_score
    const skillCompetency: { [domain: string]: number } = {};
    
    Object.keys(state.domain_accuracy).forEach(domain => {
      const accuracy = state.domain_accuracy[domain];
      const attempts = state.questions_attempted[domain];
      const rawScore = domainScores[domain] || 0;
      
      // Enhanced competency calculation
      // Factor in accuracy (how well they answered), attempts (confidence), and raw score
      const attemptFactor = Math.min(attempts / 10, 1.0); // Normalize attempts to 0-1
      const accuracyFactor = accuracy;
      const scoreFactor = Math.min(rawScore / (attempts * 3), 1.0); // Normalize score
      
      skillCompetency[domain] = (accuracyFactor * 0.5 + scoreFactor * 0.3 + attemptFactor * 0.2);
    });

    return {
      domainScores,
      domainAccuracy: { ...state.domain_accuracy },
      questionsAttempted: { ...state.questions_attempted },
      skillCompetency
    };
  }

  /**
   * Step 2: Process personalized quiz results (Legacy method - enhanced for adaptive system)
   */
  processPersonalizedQuizResults(answers: PersonalizedQuizAnswer[]): {
    domainScores: PersonalizedQuizResults;
    skillCompetency: { [domain: string]: number };
  } {
    const domainScores: PersonalizedQuizResults = {};
    
    // Aggregate domain weights
    answers.forEach(answer => {
      Object.entries(answer.domain_weights).forEach(([domain, weight]) => {
        const normalizedDomain = this.normalizeDomainName(domain);
        domainScores[normalizedDomain] = (domainScores[normalizedDomain] || 0) + weight;
      });
    });

    // Calculate basic skill competency (normalized scores)
    const skillCompetency: { [domain: string]: number } = {};
    const maxQuestions = answers.length;
    
    Object.entries(domainScores).forEach(([domain, score]) => {
      // Normalize to 0-1 scale based on maximum possible score
      const maxPossibleScore = maxQuestions * 3; // Assuming max weight is 3
      skillCompetency[domain] = Math.min(score / maxPossibleScore, 1.0);
    });

    return {
      domainScores,
      skillCompetency
    };
  }

  /**
   * Step 3: Generate career recommendations
   */
  async generateCareerRecommendations(
    userInterests: string[],
    userSkills: string[]
  ): Promise<CareerRecommendation[]> {
    try {
      const response = await fetch('/courses1.json');
      const data = await response.json();
      const courses: Course[] = data.courses;

      const recommendations: CareerRecommendation[] = [];

      courses.forEach(course => {
        const matchingSkills = course.skill_labels.filter(skill => 
          userInterests.includes(skill) || userSkills.includes(skill)
        );

        // Recommend if at least 2 skills match
        if (matchingSkills.length >= 2) {
          const matchScore = matchingSkills.length / course.skill_labels.length;
          
          recommendations.push({
            course,
            match_score: matchScore,
            matching_skills: matchingSkills
          });
        }
      });

      // Sort by match score (descending)
      return recommendations.sort((a, b) => b.match_score - a.match_score);
    } catch (error) {
      console.error('Failed to load courses or generate recommendations:', error);
      return [];
    }
  }

  /**
   * Step 4: Save general quiz results to Firestore
   */
  async saveGeneralQuizResults(
    uid: string,
    answers: GeneralQuizAnswer[],
    domainScores: GeneralQuizResults,
    topDomains: string[]
  ): Promise<boolean> {
    try {
      const generalQuizInferences: GeneralQuizInferences = {
        quiz_type: 'general',
        completed_at: new Date(),
        domain_scores: domainScores,
        top_domains: topDomains,
        answers
      };

      await setDoc(doc(db, "users", uid), {
        general_quiz_inferences: generalQuizInferences,
        lastLogin: new Date()
      }, { merge: true });

      console.log('General quiz results saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save general quiz results:', error);
      return false;
    }
  }

  /**
   * Step 4: Save adaptive personalized quiz results to Firestore
   */
  async saveAdaptivePersonalizedQuizResults(
    uid: string,
    selectedDomains: string[],
    answers: PersonalizedQuizAnswer[],
    domainScores: PersonalizedQuizResults,
    domainAccuracy: { [domain: string]: number },
    questionsAttempted: { [domain: string]: number },
    skillCompetency: { [domain: string]: number }
  ): Promise<boolean> {
    try {
      const personalizedQuizInferences: PersonalizedQuizInferences = {
        quiz_type: 'personalized',
        completed_at: new Date(),
        selected_domains: selectedDomains,
        domain_scores: domainScores,
        domain_accuracy: domainAccuracy,
        questions_attempted: questionsAttempted,
        skill_competency: skillCompetency,
        answers
      };

      await setDoc(doc(db, "users", uid), {
        personalized_quiz_inferences: personalizedQuizInferences,
        lastLogin: new Date()
      }, { merge: true });

      console.log('Adaptive personalized quiz results saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save adaptive personalized quiz results:', error);
      return false;
    }
  }

  /**
   * Step 4: Save personalized quiz results to Firestore (Legacy method)
   */
  async savePersonalizedQuizResults(
    uid: string,
    selectedDomains: string[],
    answers: PersonalizedQuizAnswer[],
    domainScores: PersonalizedQuizResults,
    skillCompetency: { [domain: string]: number }
  ): Promise<boolean> {
    try {
      const personalizedQuizInferences: PersonalizedQuizInferences = {
        quiz_type: 'personalized',
        completed_at: new Date(),
        selected_domains: selectedDomains,
        domain_scores: domainScores,
        domain_accuracy: {}, // Legacy method doesn't track accuracy
        questions_attempted: {}, // Legacy method doesn't track per-domain attempts
        skill_competency: skillCompetency,
        answers
      };

      await setDoc(doc(db, "users", uid), {
        personalized_quiz_inferences: personalizedQuizInferences,
        lastLogin: new Date()
      }, { merge: true });

      console.log('Personalized quiz results saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save personalized quiz results:', error);
      return false;
    }
  }

  /**
   * Step 4: Save career suggestions to Firestore
   */
  async saveCareerSuggestions(
    uid: string,
    userInterests: string[],
    userSkills: string[],
    recommendations: CareerRecommendation[]
  ): Promise<boolean> {
    try {
      const careerSuggestions: CareerSuggestions = {
        generated_at: new Date(),
        user_interests: userInterests,
        user_skills: userSkills,
        recommendations,
        total_matches: recommendations.length
      };

      await setDoc(doc(db, "users", uid), {
        career_suggestions: careerSuggestions,
        lastLogin: new Date()
      }, { merge: true });

      console.log('Career suggestions saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save career suggestions:', error);
      return false;
    }
  }

  /**
   * Utility: Normalize domain names for consistency
   */
  private normalizeDomainName(domain: string): string {
    const normalized = DOMAIN_MAPPING[domain as keyof typeof DOMAIN_MAPPING];
    if (normalized) {
      return normalized;
    }
    
    // If not in mapping, try to match by keywords
    const lowerDomain = domain.toLowerCase();
    
    if (lowerDomain.includes('analytic') || lowerDomain.includes('logical')) {
      return 'Analytical/logical reasoning';
    }
    if (lowerDomain.includes('visual') || lowerDomain.includes('spatial')) {
      return 'Visualization/Spatial design';
    }
    if (lowerDomain.includes('math') || lowerDomain.includes('quant')) {
      return 'Math/quant';
    }
    if (lowerDomain.includes('problem') || lowerDomain.includes('creative')) {
      return 'Problem-solving/Creative thinking';
    }
    if (lowerDomain.includes('social') || lowerDomain.includes('interpersonal')) {
      return 'Social/intrapersonal skills';
    }
    
    // Return as-is if no match found
    return domain;
  }

  /**
   * Get user's quiz progress and results
   */
  async getUserQuizProgress(uid: string): Promise<{
    hasCompletedGeneral: boolean;
    hasCompletedPersonalized: boolean;
    hasCareerSuggestions: boolean;
    generalResults?: GeneralQuizInferences;
    personalizedResults?: PersonalizedQuizInferences;
    careerSuggestions?: CareerSuggestions;
  }> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      
      if (!userDoc.exists()) {
        return {
          hasCompletedGeneral: false,
          hasCompletedPersonalized: false,
          hasCareerSuggestions: false
        };
      }

      const userData = userDoc.data();
      
      return {
        hasCompletedGeneral: !!userData.general_quiz_inferences,
        hasCompletedPersonalized: !!userData.personalized_quiz_inferences,
        hasCareerSuggestions: !!userData.career_suggestions,
        generalResults: userData.general_quiz_inferences,
        personalizedResults: userData.personalized_quiz_inferences,
        careerSuggestions: userData.career_suggestions
      };
    } catch (error) {
      console.error('Failed to get user quiz progress:', error);
      return {
        hasCompletedGeneral: false,
        hasCompletedPersonalized: false,
        hasCareerSuggestions: false
      };
    }
  }

  /**
   * Complete Adaptive Three-Tier Quiz Workflow
   */
  async executeAdaptiveThreeTierQuiz(uid: string): Promise<{
    success: boolean;
    generalResults?: any;
    personalizedResults?: any;
    careerRecommendations?: any;
    error?: string;
  }> {
    try {
      // Step 1: Execute Level 1 - Interest Assessment (General Quiz)
      console.log('Starting Level 1: Interest Assessment...');
      const generalQuestions = await this.loadGeneralQuizQuestions();
      
      // For demo purposes, simulate user completing general quiz
      // In real implementation, this would be handled by UI
      const mockGeneralAnswers: GeneralQuizAnswer[] = [];
      // This would be replaced with actual user answers
      
      const { domainScores: generalDomainScores, topDomains } = 
        this.processGeneralQuizResults(mockGeneralAnswers);
      
      await this.saveGeneralQuizResults(uid, mockGeneralAnswers, generalDomainScores, topDomains);
      
      // Step 2: Execute Level 2 - Adaptive Skill Assessment
      console.log('Starting Level 2: Adaptive Skill Assessment...');
      const selectedDomains = this.selectPersonalizedQuizDomains(topDomains, generalDomainScores);
      const adaptiveState = await this.initializeAdaptiveQuiz(selectedDomains);
      
      // This would be handled by the UI in real implementation
      const adaptiveAnswers: PersonalizedQuizAnswer[] = [];
      
      // Simulate adaptive questioning loop (in real app, this is UI-driven)
      let questionCount = 0;
      while (questionCount < 50) { // Safety limit
        const nextQuestion = this.getNextAdaptiveQuestion(adaptiveState, selectedDomains);
        if (!nextQuestion) break;
        
        // In real implementation, present question to user and get answer
        // For now, break to avoid infinite loop
        break;
      }
      
      const adaptiveResults = this.processAdaptiveQuizResults(adaptiveAnswers, adaptiveState);
      
      await this.saveAdaptivePersonalizedQuizResults(
        uid,
        selectedDomains,
        adaptiveAnswers,
        adaptiveResults.domainScores,
        adaptiveResults.domainAccuracy,
        adaptiveResults.questionsAttempted,
        adaptiveResults.skillCompetency
      );
      
      // Step 3: Execute Level 3 - Career Recommendations
      console.log('Starting Level 3: Career Recommendations...');
      const userInterests = topDomains.slice(0, 3); // Top 3 domains from general quiz
      const userSkills = Object.keys(adaptiveResults.skillCompetency)
        .filter(domain => adaptiveResults.skillCompetency[domain] > 0.6)
        .slice(0, 5); // Top skills with competency > 60%
      
      const careerRecommendations = await this.generateCareerRecommendations(
        userInterests, 
        userSkills
      );
      
      await this.saveCareerSuggestions(uid, userInterests, userSkills, careerRecommendations);
      
      return {
        success: true,
        generalResults: { domainScores: generalDomainScores, topDomains },
        personalizedResults: adaptiveResults,
        careerRecommendations
      };
      
    } catch (error) {
      console.error('Error in adaptive three-tier quiz execution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get adaptive quiz summary for UI display
   */
  getAdaptiveQuizSummary(state: AdaptiveQuizState): {
    totalQuestionsAsked: number;
    domainBreakdown: { [domain: string]: { attempted: number; accuracy: number; }};
    overallProgress: number;
  } {
    const totalQuestionsAsked = Object.values(state.questions_attempted)
      .reduce((sum, count) => sum + count, 0);
    
    const domainBreakdown: { [domain: string]: { attempted: number; accuracy: number; }} = {};
    Object.keys(state.domain_accuracy).forEach(domain => {
      domainBreakdown[domain] = {
        attempted: state.questions_attempted[domain] || 0,
        accuracy: state.domain_accuracy[domain] || 0
      };
    });
    
    // Calculate overall progress (0-1) based on domain completion
    const totalDomains = Object.keys(state.should_continue).length;
    const completedDomains = Object.values(state.should_continue)
      .filter(shouldContinue => !shouldContinue).length;
    const overallProgress = totalDomains > 0 ? completedDomains / totalDomains : 0;
    
    return {
      totalQuestionsAsked,
      domainBreakdown,
      overallProgress
    };
  }
}

// Export singleton instance
export const quizSystem = new AdaptiveThreeTierQuizSystem();
