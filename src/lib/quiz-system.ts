import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Enhanced Domain mappings for consistent naming across all components
export const DOMAIN_MAPPING = {
  // Question file domain keys → Normalized domain names
  'analytical': 'Analytical/logical reasoning',
  'analytical_reasoning': 'Analytical/logical reasoning',
  'logical': 'Analytical/logical reasoning',
  'visualization': 'Visualization/Spatial design', 
  'spatial': 'Visualization/Spatial design',
  'visual': 'Visualization/Spatial design',
  'math': 'Math/quant',
  'mathematical': 'Math/quant',
  'quantitative': 'Math/quant',
  'problem_solving': 'Problem-solving/Creative thinking',
  'creative_thinking': 'Problem-solving/Creative thinking',
  'creative': 'Problem-solving/Creative thinking',
  'problem': 'Problem-solving/Creative thinking',
  'social': 'Social/intrapersonal skills',
  'interpersonal': 'Social/intrapersonal skills',
  'intrapersonal': 'Social/intrapersonal skills'
} as const;

export const NORMALIZED_DOMAINS = [
  'Analytical/logical reasoning',
  'Visualization/Spatial design',
  'Math/quant', 
  'Problem-solving/Creative thinking',
  'Social/intrapersonal skills'
] as const;

// Reverse mapping for quick lookups
export const DOMAIN_KEYS = {
  'Analytical/logical reasoning': ['analytical', 'analytical_reasoning', 'logical'],
  'Visualization/Spatial design': ['visualization', 'spatial', 'visual'],
  'Math/quant': ['math', 'mathematical', 'quantitative'],
  'Problem-solving/Creative thinking': ['problem_solving', 'creative_thinking', 'creative', 'problem'],
  'Social/intrapersonal skills': ['social', 'interpersonal', 'intrapersonal']
} as const;

export type NormalizedDomain = typeof NORMALIZED_DOMAINS[number];

// General Quiz interfaces
export interface GeneralQuizOption {
  option_text: string;
  domain_weights: { [key: string]: number };
}

export interface GeneralQuizQuestion {
  question_id: string;
  question_text: string;
  question_type?: string;
  image_path?: string; // For image-based questions like spatial reasoning
  options: GeneralQuizOption[];
}

// Subject-specific quiz interfaces for Level 2
export interface SubjectQuizOption {
  option_text: string;
  domain_weights: { [key: string]: number };
}

export interface SubjectQuizQuestion {
  question_id: string;
  question_text: string;
  options: SubjectQuizOption[];
}

export interface SubjectQuizAnswer {
  question_id: string;
  selected_option_index: number;
  domain_weights: { [key: string]: number };
  subject: string;
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
  image_path?: string; // For image-based questions like spatial reasoning
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
  domain_confidence: { [domain: string]: number };
  recent_performance: { [domain: string]: number[] }; // Track last 5 answers per domain
  progression_trend: { [domain: string]: 'improving' | 'stable' | 'declining' | 'unknown' };
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
  subject_interest?: string; // Added for Level 2 subject matching
}

export interface CareerRecommendation {
  course: Course;
  matching_skills: string[];
  subject_matched?: boolean;
  user_subject_scores?: { [subject: string]: number };
  primary_subject_score?: number;
  ranking_position?: number;
  
  // Enhanced recommendation fields
  overall_fit_score: number;        // 0-100 composite score
  interest_alignment: number;       // 0-100 how much they'll enjoy it
  aptitude_match: number;          // 0-100 how likely they'll succeed
  confidence_level: number;        // 0-100 how sure we are
  recommendation_tier: 'perfect_match' | 'strong_candidate' | 'growth_opportunity' | 'alternative_path' | 'backup_option';
  
  explanation: {
    why_recommended: string[];      // Reasons for recommendation
    strengths: string[];           // User's matching strengths
    growth_areas: string[];        // Areas to develop
    success_factors: string[];     // What makes this a good fit
  };
}

// Firestore storage interfaces
export interface GeneralQuizInferences {
  quiz_type: 'general';
  completed_at: Date;
  domain_scores: GeneralQuizResults;
  top_domains: string[];
  answers: GeneralQuizAnswer[];
}

export interface SubjectQuizInferences {
  quiz_type: 'subject_continuation';
  completed_at: Date;
  selected_subjects: string[];
  subject_scores: { [subject: string]: number };
  answers: SubjectQuizAnswer[];
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
  user_subjects?: string[]; // Added for Level 2 subject continuation
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
          // Select 5 non-repeating questions and ensure all fields are preserved
          const shuffled = [...questions].sort(() => Math.random() - 0.5);
          const selectedFromDomain = shuffled.slice(0, 5).map(q => ({
            question_id: q.question_id,
            question_text: q.question_text,
            question_type: q.question_type,
            image_path: q.image_path, // Preserve image path if present
            options: q.options
          }));
          selectedQuestions.push(...selectedFromDomain);
        }
      } catch (error) {
        console.error(`Failed to load ${file}:`, error);
      }
    }

    return selectedQuestions;
  }

  /**
   * Step 1.5: Load subject-specific questions for Level 2 continuation
   */
  async loadSubjectQuestions(subjects: string[]): Promise<{ [subject: string]: SubjectQuizQuestion[] }> {
    const subjectQuestions: { [subject: string]: SubjectQuizQuestion[] } = {};
    
    const subjectFileMapping: { [key: string]: string } = {
      'Arts': 'arts.json',
      'Biology': 'biology.json', 
      'Chemistry': 'chemistry.json',
      'CS': 'cs.json',
      'Economics': 'economics.json',
      'Physics': 'physics.json'
    };

    for (const subject of subjects) {
      const filename = subjectFileMapping[subject];
      if (!filename) {
        console.warn(`No question file found for subject: ${subject}`);
        continue;
      }

      try {
        const response = await fetch(`/otherQuestions/${filename}`);
        const data: SubjectQuizQuestion[] = await response.json();
        
        if (data && Array.isArray(data)) {
          // Randomly select 5 non-repeating questions
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          subjectQuestions[subject] = shuffled.slice(0, 5);
        }
      } catch (error) {
        console.error(`Failed to load subject questions for ${subject}:`, error);
      }
    }

    return subjectQuestions;
  }

  /**
   * Step 1.5: Process subject quiz results
   */
  processSubjectQuizResults(answers: SubjectQuizAnswer[]): { [subject: string]: number } {
    const subjectScores: { [subject: string]: number } = {};

    // Group answers by subject and aggregate scores
    answers.forEach(answer => {
      const normalizedSubject = this.normalizeSubjectName(answer.subject);
      
      // Sum all domain weights for this subject answer
      const totalWeight = Object.values(answer.domain_weights).reduce((sum, weight) => sum + weight, 0);
      subjectScores[normalizedSubject] = (subjectScores[normalizedSubject] || 0) + totalWeight;
    });

    return subjectScores;
  }

  /**
   * Helper: Normalize subject names for consistency
   */
  private normalizeSubjectName(subject: string): string {
    const lowerSubject = subject.toLowerCase();
    
    if (lowerSubject.includes('art')) return 'Arts';
    if (lowerSubject.includes('bio')) return 'Biology';
    if (lowerSubject.includes('chem')) return 'Chemistry';
    if (lowerSubject.includes('comp') || lowerSubject.includes('cs')) return 'CS';
    if (lowerSubject.includes('econ')) return 'Economics';
    if (lowerSubject.includes('phys')) return 'Physics';
    
    return subject;
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
            question_type: item.question_type || domain,
            image_path: item.image_path // Include image path for spatial questions
          }));
        } else {
          const dataKey = Object.keys(data)[0];
          const rawQuestions = data[dataKey];
          if (rawQuestions && Array.isArray(rawQuestions)) {
            domainQuestions = rawQuestions.map(item => ({
              question_text: item.question_text,
              options: item.options,
              question_type: item.question_type || domain,
              image_path: item.image_path // Include image path for spatial questions
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
      should_continue: {},
      domain_confidence: {},
      recent_performance: {},
      progression_trend: {}
    };

    // Initialize counters for all domains
    selectedDomains.forEach(domain => {
      adaptiveState.domain_accuracy[domain] = 0;
      adaptiveState.questions_attempted[domain] = 0;
      adaptiveState.questions_correct[domain] = 0;
      adaptiveState.should_continue[domain] = true;
      adaptiveState.domain_confidence[domain] = 0;
      adaptiveState.recent_performance[domain] = [];
      adaptiveState.progression_trend[domain] = 'unknown';
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
            question_type: item.question_type || domain,
            image_path: item.image_path // Include image path for spatial questions
          }));
        } else {
          // Object format with domain key
          const dataKey = Object.keys(data)[0];
          const rawQuestions = data[dataKey];
          if (rawQuestions && Array.isArray(rawQuestions)) {
            domainQuestions = rawQuestions.map(item => ({
              question_text: item.question_text,
              options: item.options,
              question_type: item.question_type || domain,
              image_path: item.image_path // Include image path for spatial questions
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
      state.questions_attempted[domain] >= 40
    );
    
    if (shouldStop) {
      return null;
    }

    // Enhanced strategy: Prioritize domains based on performance trends and confidence
    let targetDomain = null;
    let highestPriority = -1;
    
    for (const domain of selectedDomains) {
      if (!state.should_continue[domain] || state.questions_attempted[domain] >= 40) continue;
      
      const accuracy = state.questions_attempted[domain] > 0 
        ? state.questions_correct[domain] / state.questions_attempted[domain] 
        : 0;
      
      const attempts = state.questions_attempted[domain];
      const confidence = state.domain_confidence[domain];
      const trend = state.progression_trend[domain];
      
      // Calculate priority score for this domain
      let priority = 0;
      
      // High priority for low accuracy domains
      if (accuracy < 0.75) priority += 10;
      
      // High priority for improving trends
      if (trend === 'improving') priority += 8;
      
      // Medium priority for declining trends (need more data)
      if (trend === 'declining') priority += 6;
      
      // Low confidence domains need more questions
      if (confidence < 0.6) priority += 5;
      
      // Ensure minimum exploration for all domains
      if (attempts < 5) priority += 7;
      
      // Moderate exploration for medium-confidence domains
      if (accuracy >= 0.60 && accuracy < 0.85 && attempts < 20) priority += 4;
      
      // Occasional testing of high-confidence domains
      if (accuracy >= 0.85 && attempts < 15 && Math.random() < 0.3) priority += 2;
      
      if (priority > highestPriority && state.domain_question_pool[domain]?.length > 0) {
        highestPriority = priority;
        targetDomain = domain;
      }
    }
    
    // Fallback: if no domain was prioritized, pick first available domain
    if (!targetDomain) {
      targetDomain = selectedDomains.find(domain => 
        state.should_continue[domain] && 
        state.questions_attempted[domain] < 40 &&
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
    
    // Track recent performance (last 5 answers)
    const recentPerf = state.recent_performance[questionDomain];
    recentPerf.push(isCorrect ? 1 : 0);
    if (recentPerf.length > 5) {
      recentPerf.shift(); // Remove oldest
    }
    
    // Calculate confidence based on consistency
    const accuracy = state.domain_accuracy[questionDomain];
    const attempts = state.questions_attempted[questionDomain];
    
    if (attempts >= 3) {
      const recentAccuracy = recentPerf.reduce((sum, val) => sum + val, 0) / recentPerf.length;
      const consistency = 1 - Math.abs(accuracy - recentAccuracy);
      state.domain_confidence[questionDomain] = Math.min((accuracy + consistency) / 2, 1.0);
    }
    
    // Update progression trend
    if (attempts >= 6) {
      const firstHalf = recentPerf.slice(0, Math.floor(recentPerf.length / 2));
      const secondHalf = recentPerf.slice(Math.floor(recentPerf.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      const improvement = secondHalfAvg - firstHalfAvg;
      
      if (improvement > 0.2) {
        state.progression_trend[questionDomain] = 'improving';
      } else if (improvement < -0.2) {
        state.progression_trend[questionDomain] = 'declining';
      } else {
        state.progression_trend[questionDomain] = 'stable';
      }
    }
    
    // Enhanced stopping criteria for better skill refinement:
    // 1. We've asked 40 questions (absolute maximum), OR
    // 2. High confidence: accuracy >= 85% with confidence >= 0.8 and at least 8 questions, OR
    // 3. Stable high performance: accuracy >= 75% with stable trend and at least 12 questions, OR
    // 4. Low performance plateau: accuracy < 50% with stable/declining trend and at least 15 questions, OR
    // 5. High confidence reached: confidence >= 0.9 with at least 10 questions
    const confidence = state.domain_confidence[questionDomain];
    const trend = state.progression_trend[questionDomain];
    
    if (attempts >= 40 || 
        (accuracy >= 0.85 && confidence >= 0.8 && attempts >= 8) ||
        (accuracy >= 0.75 && trend === 'stable' && attempts >= 12) ||
        (accuracy < 0.50 && (trend === 'stable' || trend === 'declining') && attempts >= 15) ||
        (confidence >= 0.9 && attempts >= 10)) {
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
   * Step 2.5: Save subject quiz results to Firestore
   */
  async saveSubjectQuizResults(
    uid: string,
    selectedSubjects: string[],
    answers: SubjectQuizAnswer[],
    subjectScores: { [subject: string]: number }
  ): Promise<boolean> {
    try {
      const subjectQuizInferences: SubjectQuizInferences = {
        quiz_type: 'subject_continuation',
        completed_at: new Date(),
        selected_subjects: selectedSubjects,
        subject_scores: subjectScores,
        answers
      };

      await setDoc(doc(db, "users", uid), {
        subject_quiz_inferences: subjectQuizInferences,
        lastLogin: new Date()
      }, { merge: true });

      console.log('Subject quiz results saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save subject quiz results:', error);
      return false;
    }
  }

  /**
   * Enhanced multi-factor career recommendation engine
   */
  async generateCareerRecommendations(
    userInterests: string[],
    userSkills: string[],
    userSubjects?: string[],
    userSubjectScores?: { [subject: string]: number },
    userDomainScores?: { [domain: string]: number },
    personalizedResults?: any
  ): Promise<CareerRecommendation[]> {
    try {
      const response = await fetch('/courses1.json');
      const data = await response.json();
      const courses: Course[] = Array.isArray(data) ? data : data.courses || [];

      const recommendations: CareerRecommendation[] = [];

      courses.forEach(course => {
        const analysis = this.analyzeCareerFit(
          course, 
          userInterests, 
          userSkills, 
          userSubjects, 
          userSubjectScores,
          userDomainScores,
          personalizedResults
        );
        
        recommendations.push(analysis);
      });

      // Filter recommendations with minimum 75% fit score and sort by overall fit score
      return recommendations
        .filter(rec => rec.overall_fit_score >= 75) // Only show courses with 75+ fit score
        .sort((a, b) => b.overall_fit_score - a.overall_fit_score)
        .map((rec, index) => ({
          ...rec,
          ranking_position: index + 1
        }));
    } catch (error) {
      console.error('Failed to load courses or generate recommendations:', error);
      return [];
    }
  }

  /**
   * Multi-factor career fit analysis with enhanced scoring
   */
  private analyzeCareerFit(
    course: Course,
    userInterests: string[],
    userSkills: string[],
    userSubjects?: string[],
    userSubjectScores?: { [subject: string]: number },
    userDomainScores?: { [domain: string]: number },
    personalizedResults?: any
  ): CareerRecommendation {
    
    // 1. Calculate Interest Alignment (0-100)
    const interestAlignment = this.calculateInterestAlignment(course, userInterests);
    
    // 2. Calculate Aptitude Match (0-100) 
    const aptitudeMatch = this.calculateAptitudeMatch(course, userSkills);
    
    // 3. Calculate Subject Relevance (0-100)
    const subjectRelevance = this.calculateSubjectRelevance(course, userSubjects, userSubjectScores);
    
    // 4. Calculate Confidence Level based on data quality
    const confidenceLevel = this.calculateConfidenceLevel(course, userInterests, userSkills, userSubjects);
    
    // 5. Composite Overall Fit Score (weighted combination)
    const overallFitScore = Math.round(
      interestAlignment * 0.35 +        // How much they'll enjoy it
      aptitudeMatch * 0.40 +            // How likely they'll succeed  
      subjectRelevance * 0.25           // Subject-specific alignment
    );
    
    // 6. Determine Recommendation Tier
    const recommendationTier = this.determineRecommendationTier(overallFitScore, confidenceLevel);
    
    // 7. Generate Growth Area Analysis
    const explanation = this.generateGrowthAreaAnalysis(
      course, 
      userInterests, 
      userSkills, 
      userDomainScores,
      personalizedResults
    );
    
    // 8. Find matching skills for backward compatibility
    const matchingSkills = course.skill_labels.filter(skill => 
          userInterests.includes(skill) || userSkills.includes(skill)
        );

    return {
      course,
      matching_skills: matchingSkills,
      subject_matched: userSubjects?.includes(course.subject_interest || '') || false,
      user_subject_scores: userSubjectScores || {},
      primary_subject_score: userSubjectScores && course.subject_interest ? 
        userSubjectScores[course.subject_interest] || 0 : 0,
      ranking_position: 0, // Will be set after sorting
      
      // Enhanced fields
      overall_fit_score: overallFitScore,
      interest_alignment: Math.round(interestAlignment),
      aptitude_match: Math.round(aptitudeMatch),
      confidence_level: Math.round(confidenceLevel),
      recommendation_tier: recommendationTier,
      explanation
    };
  }

  /**
   * Calculate how well the course aligns with user interests
   */
  private calculateInterestAlignment(course: Course, userInterests: string[]): number {
    if (!course.skill_labels || course.skill_labels.length === 0) return 0;
    
    let matchCount = 0;
    let weightedScore = 0;
    
    course.skill_labels.forEach(skill => {
      const userInterestIndex = userInterests.indexOf(skill);
      if (userInterestIndex !== -1) {
        matchCount++;
        // Higher weight for top interests (earlier in array)
        const interestWeight = Math.max(1, userInterests.length - userInterestIndex);
        weightedScore += interestWeight;
      }
    });
    
    if (matchCount === 0) return 0;
    
    // Normalize to 0-100 scale
    const maxPossibleScore = course.skill_labels.length * userInterests.length;
    return Math.min(100, (weightedScore / maxPossibleScore) * 100 * 2); // Boost factor
  }

  /**
   * Calculate how well user skills match course requirements
   */
  private calculateAptitudeMatch(course: Course, userSkills: string[]): number {
    if (!course.skill_labels || course.skill_labels.length === 0) return 0;
    
    const skillMatches = course.skill_labels.filter(skill => userSkills.includes(skill)).length;
    const matchRatio = skillMatches / course.skill_labels.length;
    
    // Apply bonus for having multiple skill matches
    let bonus = 0;
    if (skillMatches >= 3) bonus = 20;
    else if (skillMatches >= 2) bonus = 10;
    else if (skillMatches >= 1) bonus = 5;
    
    return Math.min(100, (matchRatio * 80) + bonus);
  }

  /**
   * Calculate subject-specific relevance and performance
   */
  private calculateSubjectRelevance(
    course: Course, 
    userSubjects?: string[], 
    userSubjectScores?: { [subject: string]: number }
  ): number {
    if (!course.subject_interest) return 50; // Neutral if no subject specified
    
    if (!userSubjects || userSubjects.length === 0) return 50; // Neutral if no subjects taken
    
    const isSubjectMatch = userSubjects.includes(course.subject_interest);
    
    if (!isSubjectMatch) return 20; // Low relevance for non-matching subjects
    
    // Perfect match - check performance if available
    if (!userSubjectScores) return 80; // Good relevance without performance data
    
          const subjectScore = userSubjectScores[course.subject_interest] || 0;
          const maxSubjectScore = Math.max(...Object.values(userSubjectScores), 1);
    const normalizedPerformance = subjectScore / maxSubjectScore;
    
    // Combine subject match with performance (80% base + 20% performance bonus)
    return Math.min(100, 80 + (normalizedPerformance * 20));
  }

  /**
   * Calculate confidence level based on available data quality
   */
  private calculateConfidenceLevel(
    course: Course,
    userInterests: string[],
    userSkills: string[],
    userSubjects?: string[]
  ): number {
    let confidence = 40; // Base confidence
    
    // Boost confidence based on data availability
    if (userInterests.length >= 3) confidence += 20;
    if (userSkills.length >= 2) confidence += 20;  
    if (userSubjects && userSubjects.length > 0) confidence += 15;
    if (course.skill_labels && course.skill_labels.length >= 3) confidence += 5;
    
    return Math.min(100, confidence);
  }

  /**
   * Determine recommendation tier based on fit score and confidence
   * Note: Only courses with 75+ scores are shown, so tiers are within that range
   */
  private determineRecommendationTier(
    overallFitScore: number, 
    confidenceLevel: number
  ): 'perfect_match' | 'strong_candidate' | 'growth_opportunity' | 'alternative_path' | 'backup_option' {
    
    // Since we only show 75+ scores, adjust tier thresholds accordingly
    // High confidence recommendations
    if (confidenceLevel >= 70) {
      if (overallFitScore >= 90) return 'perfect_match';    // 90-100: Exceptional fit
      if (overallFitScore >= 85) return 'strong_candidate'; // 85-89: Excellent fit  
      if (overallFitScore >= 80) return 'growth_opportunity'; // 80-84: Very good fit
      if (overallFitScore >= 75) return 'alternative_path';  // 75-79: Good fit
      return 'backup_option'; // This shouldn't happen with 75+ filter
    }
    
    // Medium/Low confidence - be more conservative with tier assignment
    if (overallFitScore >= 85) return 'strong_candidate';   // Only highest scores get top tier
    if (overallFitScore >= 80) return 'growth_opportunity'; // 80-84: Good with development potential
    if (overallFitScore >= 75) return 'alternative_path';   // 75-79: Minimum acceptable fit
    return 'backup_option'; // This shouldn't happen with 75+ filter
  }

  /**
   * Generate focused growth area analysis based on interest vs competency gaps
   */
  private generateGrowthAreaAnalysis(
    course: Course,
    userInterests: string[],
    userSkills: string[],
    userDomainScores?: { [domain: string]: number },
    personalizedResults?: any
  ): {
    why_recommended: string[];
    strengths: string[];
    growth_areas: string[];
    success_factors: string[];
  } {
    
    const growthAreas: string[] = [];
    const strengths: string[] = [];
    
    // Get user's competency scores (from quiz 2/personalized quiz)
    const userCompetencies = personalizedResults?.skill_competency || {};
    
    // Analyze each skill required by the course
    course.skill_labels.forEach(skill => {
      const hasInterest = userInterests.includes(skill);
      const hasSkill = userSkills.includes(skill);
      
      // Get normalized domain name for this skill
      const normalizedDomain = this.normalizeDomainName(skill);
      const competencyScore = userCompetencies[normalizedDomain] || 0;
      const domainScore = userDomainScores?.[normalizedDomain] || 0;
      
      // Check if user shows interest but lacks competency
      if (hasInterest && (!hasSkill || competencyScore < 0.6)) {
        // High interest but low competency = growth area
        if (domainScore > 0.3) { // Shows some interest from quiz 1
          growthAreas.push(`${skill} - You show interest but need to develop stronger competency`);
        }
      } else if (hasInterest && hasSkill && competencyScore >= 0.6) {
        // High interest and good competency = strength
        strengths.push(`${skill} - Strong interest and competency alignment`);
      } else if (!hasInterest && hasSkill) {
        // Low interest but good skill = potential strength to build on
        strengths.push(`${skill} - Good foundation to build upon`);
      }
    });
    
    // Add subject-specific growth areas
    if (course.subject_interest && userDomainScores) {
      const subjectDomainScore = userDomainScores[course.subject_interest] || 0;
      const hasSubjectInterest = subjectDomainScore > 0.3;
      const hasSubjectSkill = userSkills.some(skill => skill.toLowerCase().includes(course.subject_interest?.toLowerCase() || ''));
      
      if (hasSubjectInterest && !hasSubjectSkill) {
        growthAreas.push(`${course.subject_interest} knowledge - Build expertise in this subject area`);
      }
    }
    
    // If no specific growth areas identified, provide general guidance
    if (growthAreas.length === 0) {
      const nonMatchingSkills = course.skill_labels.filter(skill => 
        !userInterests.includes(skill) && !userSkills.includes(skill)
      );
      
      if (nonMatchingSkills.length > 0) {
        growthAreas.push(`Consider developing: ${nonMatchingSkills.slice(0, 2).join(', ')}`);
      }
    }
    
    return {
      why_recommended: [], // Removed as requested
      strengths: strengths.length > 0 ? strengths : ['Good foundational alignment with this field'],
      growth_areas: growthAreas.length > 0 ? growthAreas : ['Well-matched to current skill set'],
      success_factors: [] // Simplified to focus on growth areas
    };
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
   * Step 4: Save enhanced career suggestions to Firestore
   */
  async saveCareerSuggestions(
    uid: string,
    userInterests: string[],
    userSkills: string[],
    recommendations: CareerRecommendation[],
    userSubjects?: string[]
  ): Promise<boolean> {
    try {
      const careerSuggestions: CareerSuggestions = {
        generated_at: new Date(),
        user_interests: userInterests,
        user_skills: userSkills,
        user_subjects: userSubjects, // Added for Level 2 subject continuation
        recommendations,
        total_matches: recommendations.length
      };

      await setDoc(doc(db, "users", uid), {
        career_suggestions: careerSuggestions,
        lastLogin: new Date()
      }, { merge: true });

      console.log('Enhanced career suggestions saved successfully');
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
   * Get user's enhanced quiz progress and results with subject continuation
   */
  async getUserQuizProgress(uid: string): Promise<{
    hasCompletedGeneral: boolean;
    hasCompletedSubjects: boolean;
    hasCompletedPersonalized: boolean;
    hasCareerSuggestions: boolean;
    generalResults?: GeneralQuizInferences;
    subjectResults?: SubjectQuizInferences;
    personalizedResults?: PersonalizedQuizInferences;
    careerSuggestions?: CareerSuggestions;
  }> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      
      if (!userDoc.exists()) {
        return {
          hasCompletedGeneral: false,
          hasCompletedSubjects: false,
          hasCompletedPersonalized: false,
          hasCareerSuggestions: false
        };
      }

      const userData = userDoc.data();
      
      return {
        hasCompletedGeneral: !!userData.general_quiz_inferences,
        hasCompletedSubjects: !!userData.subject_quiz_inferences,
        hasCompletedPersonalized: !!userData.personalized_quiz_inferences,
        hasCareerSuggestions: !!userData.career_suggestions,
        generalResults: userData.general_quiz_inferences,
        subjectResults: userData.subject_quiz_inferences,
        personalizedResults: userData.personalized_quiz_inferences,
        careerSuggestions: userData.career_suggestions
      };
    } catch (error) {
      console.error('Failed to get user quiz progress:', error);
      return {
        hasCompletedGeneral: false,
        hasCompletedSubjects: false,
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
      
      // Step 2.5: Execute Subject Continuation (Mock - would be UI driven)
      console.log('Starting Level 2.5: Subject Continuation...');
      // In real implementation, user selects subjects in UI
      const mockSelectedSubjects = ['CS', 'Physics']; // This would come from UI
      const subjectQuestions = await this.loadSubjectQuestions(mockSelectedSubjects);
      const mockSubjectAnswers: SubjectQuizAnswer[] = []; // Would be populated by UI
      const subjectScores = this.processSubjectQuizResults(mockSubjectAnswers);
      await this.saveSubjectQuizResults(uid, mockSelectedSubjects, mockSubjectAnswers, subjectScores);
      
      // Step 3: Execute Level 3 - Enhanced Career Recommendations
      console.log('Starting Level 3: Enhanced Career Recommendations...');
      const userInterests = topDomains.slice(0, 3); // Top 3 domains from general quiz
      const userSkills = Object.keys(adaptiveResults.skillCompetency)
        .filter(domain => adaptiveResults.skillCompetency[domain] > 0.6)
        .slice(0, 5); // Top skills with competency > 60%
      const userSubjects = mockSelectedSubjects; // From subject continuation
      
      const careerRecommendations = await this.generateCareerRecommendations(
        userInterests, 
        userSkills,
        userSubjects,
        subjectScores // Pass subject scores
      );
      
      await this.saveCareerSuggestions(uid, userInterests, userSkills, careerRecommendations, userSubjects);
      
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
   * Get enhanced adaptive quiz summary for UI display
   */
  getAdaptiveQuizSummary(state: AdaptiveQuizState): {
    totalQuestionsAsked: number;
    domainBreakdown: { [domain: string]: { 
      attempted: number; 
      accuracy: number; 
      confidence: number; 
      trend: 'improving' | 'stable' | 'declining' | 'unknown';
    }};
    overallProgress: number;
    averageConfidence: number;
  } {
    const totalQuestionsAsked = Object.values(state.questions_attempted)
      .reduce((sum, count) => sum + count, 0);
    
    const domainBreakdown: { [domain: string]: { 
      attempted: number; 
      accuracy: number; 
      confidence: number; 
      trend: 'improving' | 'stable' | 'declining' | 'unknown';
    }} = {};
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    Object.keys(state.domain_accuracy).forEach(domain => {
      const confidence = state.domain_confidence[domain] || 0;
      domainBreakdown[domain] = {
        attempted: state.questions_attempted[domain] || 0,
        accuracy: state.domain_accuracy[domain] || 0,
        confidence: confidence,
        trend: state.progression_trend[domain] || 'unknown'
      };
      
      if (confidence > 0) {
        totalConfidence += confidence;
        confidenceCount++;
      }
    });
    
    // Calculate overall progress (0-1) based on domain completion and confidence
    const totalDomains = Object.keys(state.should_continue).length;
    const completedDomains = Object.values(state.should_continue)
      .filter(shouldContinue => !shouldContinue).length;
    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    // Enhanced progress calculation: 70% completion + 30% confidence
    const completionProgress = totalDomains > 0 ? completedDomains / totalDomains : 0;
    const overallProgress = (completionProgress * 0.7) + (averageConfidence * 0.3);
    
    return {
      totalQuestionsAsked,
      domainBreakdown,
      overallProgress: Math.min(overallProgress, 1.0),
      averageConfidence
    };
  }
}

// Export singleton instance
export const quizSystem = new AdaptiveThreeTierQuizSystem();
