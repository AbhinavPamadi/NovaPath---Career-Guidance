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

// Quiz System Class
export class TwoTierQuizSystem {
  
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
   * Step 2: Load personalized quiz questions for selected domains
   */
  async loadPersonalizedQuizQuestions(selectedDomains: string[]): Promise<PersonalizedQuizQuestion[]> {
    const questions: PersonalizedQuizQuestion[] = [];

    const domainFileMapping: { [key: string]: string } = {
      'Analytical/logical reasoning': 'Analytical-logical reasoning.json',
      'Math/quant': 'MathQues.json',
      'Problem-solving/Creative thinking': 'problem_solving_creative_thinking_questions.json',
      'Social/intrapersonal skills': 'intrapersonal skills.json'
      // Note: No specific file for Visualization/Spatial design in the available files
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
   * Step 2: Process personalized quiz results
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
   * Step 4: Save personalized quiz results to Firestore
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
}

// Export singleton instance
export const quizSystem = new TwoTierQuizSystem();
