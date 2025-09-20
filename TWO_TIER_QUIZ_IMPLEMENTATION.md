# Two-Tier Quiz System Implementation

## Overview

This document describes the implementation of a comprehensive two-tier quiz system for career guidance. The system follows a scientific approach to assess user interests and skills, then provides personalized career recommendations.

## System Architecture

### Core Components

1. **Quiz System Core** (`src/lib/quiz-system.ts`)
   - Main logic for both quiz tiers
   - Career recommendation engine
   - Firestore integration
   - Domain mapping and normalization

2. **Two-Tier Quiz Component** (`src/components/quiz/two-tier-quiz.tsx`)
   - React component with complete UI flow
   - State management for quiz progression
   - Results visualization
   - Career recommendations display

3. **Data Files**
   - General questions: `/public/Questions/generalQuestions/`
   - Specialized questions: `/public/Questions/`
   - Course data: `/public/courses1.json`

## Quiz Flow

### Step 1: General Quiz (Level 1)

**Goal**: Gauge user's interest/liking in 5 domains

**Process**:
1. Load 5 questions from each of 5 domain files (25 total):
   - `analytical.json` → Analytical/logical reasoning
   - `spatial.json` → Visualization/Spatial design  
   - `math.json` → Math/quantitative aptitude
   - `Problem.json` → Problem-solving/Creative thinking
   - `social.json` → Social/intrapersonal skills

2. Each question uses the format:
```json
{
  "question_id": "soc_1",
  "question_text": "In team meetings, you naturally tend to:",
  "options": [
    {
      "option_text": "Ensure everyone has a chance to contribute",
      "domain_weights": {"social": 3}
    }
  ]
}
```

3. Aggregate domain_weights to compute interest scores
4. Store results as `general_quiz_inferences` in Firestore

### Step 2: Personalized Quiz

**Goal**: Assess skill competency in most relevant domains

**Selection Logic**:
- Always include top 2 domains from general quiz
- Include 3rd domain if `(score_2 - score_3) ≈ (score_1 - score_2)` (within 20%)

**Process**:
1. Load questions from domain-specific files:
   - `Analytical-logical reasoning.json`
   - `MathQues.json`
   - `problem_solving_creative_thinking_questions.json`
   - `intrapersonal skills.json`

2. Select 6 random questions per chosen domain
3. Evaluate skill competency based on responses
4. Store results as `personalized_quiz_inferences` in Firestore

### Step 3: Career Recommendation

**Goal**: Recommend careers aligning with interests + skills

**Process**:
1. Load course data from `courses1.json`
2. Match user's top domains with course `skill_labels`
3. Recommend courses where ≥2 skills match
4. Calculate match scores and sort by relevance
5. Store results as `career_suggestions` in Firestore

## Data Structures

### General Quiz Interfaces
```typescript
interface GeneralQuizQuestion {
  question_id: string;
  question_text: string;
  options: GeneralQuizOption[];
}

interface GeneralQuizAnswer {
  question_id: string;
  selected_option_index: number;
  domain_weights: { [key: string]: number };
}
```

### Personalized Quiz Interfaces
```typescript
interface PersonalizedQuizQuestion {
  question_type?: string;
  question_text: string;
  options: PersonalizedQuizOption[];
}

interface PersonalizedQuizAnswer {
  question_index: number;
  selected_option_index: number;
  domain_weights: { [key: string]: number };
}
```

### Career Recommendation Interface
```typescript
interface CareerRecommendation {
  course: Course;
  match_score: number;
  matching_skills: string[];
}
```

## Firestore Storage

The system stores three separate data structures:

1. **general_quiz_inferences**
```typescript
{
  quiz_type: 'general';
  completed_at: Date;
  domain_scores: { [domain: string]: number };
  top_domains: string[];
  answers: GeneralQuizAnswer[];
}
```

2. **personalized_quiz_inferences**
```typescript
{
  quiz_type: 'personalized';
  completed_at: Date;
  selected_domains: string[];
  domain_scores: { [domain: string]: number };
  skill_competency: { [domain: string]: number };
  answers: PersonalizedQuizAnswer[];
}
```

3. **career_suggestions**
```typescript
{
  generated_at: Date;
  user_interests: string[];
  user_skills: string[];
  recommendations: CareerRecommendation[];
  total_matches: number;
}
```

## Domain Mapping

The system normalizes domain names for consistency:

```typescript
const DOMAIN_MAPPING = {
  'analytical': 'Analytical/logical reasoning',
  'visualization': 'Visualization/Spatial design', 
  'spatial': 'Visualization/Spatial design',
  'math': 'Math/quant',
  'problem_solving': 'Problem-solving/Creative thinking',
  'creative_thinking': 'Problem-solving/Creative thinking',
  'social': 'Social/intrapersonal skills'
};
```

## UI Features

### Progressive Disclosure
- Start screen with system overview
- Level 1 (General) quiz with progress tracking
- Results visualization between levels
- Level 2 (Personalized) quiz with domain focus
- Comprehensive career recommendations

### Visual Elements
- Progress bars and completion indicators
- Domain badges and skill tags
- Match percentage visualization
- Course availability indicators (JK-specific)
- Responsive design for mobile/desktop

### State Management
- Persistent state across quiz stages
- Resume capability for incomplete assessments
- Error handling and fallback states
- Loading states for async operations

## Usage

### Integration
```typescript
import { TwoTierQuiz } from "@/components/quiz/two-tier-quiz";

export default function QuizPage() {
  return <TwoTierQuiz />;
}
```

### Quiz System API
```typescript
import { quizSystem } from "@/lib/quiz-system";

// Load questions
const questions = await quizSystem.loadGeneralQuizQuestions();

// Process results
const results = quizSystem.processGeneralQuizResults(answers);

// Generate recommendations
const recommendations = await quizSystem.generateCareerRecommendations(
  userInterests, 
  userSkills
);
```

## Configuration

### Question Selection
- General quiz: 5 questions per domain (25 total)
- Personalized quiz: 6 questions per selected domain
- Random selection with shuffle to prevent memorization

### Scoring
- Domain weights range from -2 to +3
- Skill competency normalized to 0-1 scale
- Career match scores calculated as matching skills / total skills

### Thresholds
- Minimum 2 skills must match for career recommendation
- 3rd domain included if score differences within 20%
- Skill competency threshold of 0.3 for qualification

## Future Enhancements

1. **Adaptive Questioning**: Dynamic question selection based on confidence intervals
2. **ML Integration**: Machine learning models for improved recommendations
3. **Industry Trends**: Real-time job market data integration
4. **Peer Comparison**: Anonymous benchmarking against similar profiles
5. **Video Questions**: Multimedia assessment for spatial/visual domains

## Testing

The system can be tested by:
1. Running the development server: `npm run dev`
2. Navigating to `/quiz` route
3. Completing both quiz levels
4. Verifying Firestore data storage
5. Checking career recommendation accuracy

## Troubleshooting

Common issues:
- **Questions not loading**: Check file paths in `/public/Questions/`
- **Firestore errors**: Verify authentication and security rules
- **Career recommendations empty**: Ensure courses1.json is accessible
- **Domain mapping issues**: Check DOMAIN_MAPPING consistency

For detailed debugging, enable console logging in the quiz system components.
