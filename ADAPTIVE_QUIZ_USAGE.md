# Adaptive Three-Tier Quiz System - Usage Guide

## Overview

The new **Adaptive Three-Tier Quiz System** replaces the legacy fixed Two-Tier Quiz with a dynamic, threshold-driven assessment that provides more accurate career guidance through adaptive questioning.

## System Architecture

### Level 1 — Interest Assessment (General Quiz)
- **Goal**: Gauge user interest across 5 core domains
- **Questions**: 5 questions per domain (25 total, fixed)
- **Scoring**: Domain weights determine interest levels
- **Output**: Ranked domain list with scores
- **Storage**: `general_quiz_inferences` in Firestore

### Level 2 — Enhanced Adaptive Skill Assessment (Personalized Quiz)
- **Goal**: Evaluate actual competency using intelligent dynamic questioning
- **Enhanced Adaptive Rules**:
  - **Maximum 40 questions per domain** (increased from 15)
  - **Dynamic stopping criteria** based on performance trends and confidence
  - **Intelligent prioritization** using performance trends and confidence levels
  - **Progressive tracking** of recent performance (last 5 answers)
  - **Trend analysis**: detecting improving, stable, or declining performance
  - **Confidence scoring**: based on accuracy consistency
- **Storage**: `personalized_quiz_inferences` with comprehensive metrics

### Level 3 — Career Recommendations
- **Goal**: Match interests + skills to career paths
- **Matching**: Recommend courses where ≥2 user skills match
- **Storage**: `career_suggestions` with detailed course info

## Usage Examples

### Basic Usage - Complete Workflow

```typescript
import { quizSystem } from '@/lib/quiz-system';

// Execute complete adaptive three-tier quiz
const result = await quizSystem.executeAdaptiveThreeTierQuiz(userId);

if (result.success) {
  console.log('General Results:', result.generalResults);
  console.log('Personalized Results:', result.personalizedResults);
  console.log('Career Recommendations:', result.careerRecommendations);
} else {
  console.error('Quiz failed:', result.error);
}
```

### Level 1 - Interest Assessment

```typescript
// Load general quiz questions (5 per domain)
const generalQuestions = await quizSystem.loadGeneralQuizQuestions();
console.log(`Loaded ${generalQuestions.length} questions`); // Should be 25

// Process user answers
const userAnswers: GeneralQuizAnswer[] = [
  {
    question_id: "analytical_1",
    selected_option_index: 0,
    domain_weights: { "analytical": 3, "math": 1 }
  },
  // ... more answers
];

const { domainScores, topDomains } = quizSystem.processGeneralQuizResults(userAnswers);
console.log('Top domains:', topDomains);

// Save to Firestore
await quizSystem.saveGeneralQuizResults(userId, userAnswers, domainScores, topDomains);
```

### Level 2 - Adaptive Skill Assessment

```typescript
// Initialize adaptive quiz
const selectedDomains = quizSystem.selectPersonalizedQuizDomains(topDomains, domainScores);
const adaptiveState = await quizSystem.initializeAdaptiveQuiz(selectedDomains);

console.log('Selected domains for adaptive assessment:', selectedDomains);

// Adaptive questioning loop
const answers: PersonalizedQuizAnswer[] = [];
let questionCount = 0;

while (questionCount < 50) { // Safety limit
  // Get next question based on current state
  const nextQuestion = quizSystem.getNextAdaptiveQuestion(adaptiveState, selectedDomains);
  
  if (!nextQuestion) {
    console.log('Adaptive quiz completed - no more questions needed');
    break;
  }
  
  console.log(`Question ${questionCount + 1}: ${nextQuestion.question.question_text}`);
  console.log(`Domain: ${nextQuestion.domain}`);
  
  // Present question to user and get answer
  const userAnswer = getUserAnswer(nextQuestion.question); // Your UI implementation
  
  const answer: PersonalizedQuizAnswer = {
    question_index: questionCount,
    selected_option_index: userAnswer.selectedIndex,
    domain_weights: nextQuestion.question.options[userAnswer.selectedIndex].domain_weights
  };
  
  // Process the answer and update state
  quizSystem.processAdaptiveAnswer(adaptiveState, answer, nextQuestion.domain, nextQuestion.questionId);
  answers.push(answer);
  
  // Get current progress
  const summary = quizSystem.getAdaptiveQuizSummary(adaptiveState);
  console.log(`Progress: ${Math.round(summary.overallProgress * 100)}%`);
  
  questionCount++;
}

// Process final results
const results = quizSystem.processAdaptiveQuizResults(answers, adaptiveState);

// Save adaptive results
await quizSystem.saveAdaptivePersonalizedQuizResults(
  userId,
  selectedDomains,
  answers,
  results.domainScores,
  results.domainAccuracy,
  results.questionsAttempted,
  results.skillCompetency
);
```

### Level 3 - Career Recommendations

```typescript
// Extract user interests and skills
const userInterests = topDomains.slice(0, 3); // Top 3 from general quiz
const userSkills = Object.keys(results.skillCompetency)
  .filter(domain => results.skillCompetency[domain] > 0.6); // Skills with >60% competency

// Generate career recommendations
const recommendations = await quizSystem.generateCareerRecommendations(userInterests, userSkills);

console.log(`Found ${recommendations.length} career matches`);

recommendations.forEach(rec => {
  console.log(`${rec.course.course_name} - Match: ${Math.round(rec.match_score * 100)}%`);
  console.log(`Skills: ${rec.matching_skills.join(', ')}`);
  console.log(`Available in J&K: ${rec.course.available_in_jk ? 'Yes' : 'No'}`);
});

// Save recommendations
await quizSystem.saveCareerSuggestions(userId, userInterests, userSkills, recommendations);
```

### Enhanced Progress Monitoring

```typescript
// Get comprehensive real-time summary during adaptive quiz
const summary = quizSystem.getAdaptiveQuizSummary(adaptiveState);

console.log(`Total questions asked: ${summary.totalQuestionsAsked}`);
console.log(`Overall progress: ${Math.round(summary.overallProgress * 100)}%`);
console.log(`Average confidence: ${Math.round(summary.averageConfidence * 100)}%`);

Object.entries(summary.domainBreakdown).forEach(([domain, stats]) => {
  console.log(`${domain}:`);
  console.log(`  Questions: ${stats.attempted}/40`);
  console.log(`  Accuracy: ${Math.round(stats.accuracy * 100)}%`);
  console.log(`  Confidence: ${Math.round(stats.confidence * 100)}%`);
  console.log(`  Trend: ${stats.trend}`);
  
  // Determine if domain assessment is complete
  const isComplete = !adaptiveState.should_continue[domain];
  console.log(`  Status: ${isComplete ? 'Complete' : 'In Progress'}`);
});

// Dynamic stopping prediction
const remainingDomains = Object.entries(adaptiveState.should_continue)
  .filter(([domain, shouldContinue]) => shouldContinue)
  .map(([domain]) => domain);

console.log(`Remaining domains: ${remainingDomains.join(', ')}`);
```

### Checking User Progress

```typescript
// Check user's quiz completion status
const progress = await quizSystem.getUserQuizProgress(userId);

if (progress.hasCompletedGeneral) {
  console.log('User completed general quiz');
  console.log('Top domains:', progress.generalResults?.top_domains);
}

if (progress.hasCompletedPersonalized) {
  console.log('User completed personalized quiz');
  console.log('Domain accuracy:', progress.personalizedResults?.domain_accuracy);
}

if (progress.hasCareerSuggestions) {
  console.log('Career suggestions available');
  console.log(`${progress.careerSuggestions?.total_matches} recommendations`);
}
```

## Key Features

### Enhanced Adaptive Logic
- **Intelligent Question Selection**: Priority-based system considering:
  - Performance trends (improving/stable/declining)
  - Confidence levels (accuracy consistency)
  - Domain exploration requirements
  - Recent performance patterns
- **Maximum 40 Questions**: Per domain limit for thorough assessment
- **Dynamic Stopping Criteria**:
  - High confidence: 85% accuracy + 80% confidence + 8+ questions
  - Stable performance: 75% accuracy + stable trend + 12+ questions
  - Low performance plateau: <50% accuracy + stable/declining trend + 15+ questions
  - Maximum confidence: 90% confidence + 10+ questions
- **Progressive Refinement**: Continuously adapts based on user performance

### Enhanced Metrics
- **Domain Accuracy**: Percentage correct per domain
- **Questions Attempted**: Count per domain for confidence assessment
- **Confidence Scoring**: Accuracy consistency measurement (0-1)
- **Performance Trends**: Recent performance direction (improving/stable/declining)
- **Recent Performance**: Track last 5 answers per domain
- **Skill Competency**: Enhanced metric combining accuracy, confidence, and attempts

### Firestore Structure
```javascript
// User document structure
{
  general_quiz_inferences: {
    quiz_type: 'general',
    completed_at: Date,
    domain_scores: { [domain]: number },
    top_domains: string[],
    answers: GeneralQuizAnswer[]
  },
  
  personalized_quiz_inferences: {
    quiz_type: 'personalized',
    completed_at: Date,
    selected_domains: string[],
    domain_scores: { [domain]: number },
    domain_accuracy: { [domain]: number },      // New
    questions_attempted: { [domain]: number },  // New
    skill_competency: { [domain]: number },
    answers: PersonalizedQuizAnswer[]
  },
  
  career_suggestions: {
    generated_at: Date,
    user_interests: string[],
    user_skills: string[],
    recommendations: CareerRecommendation[],
    total_matches: number
  }
}
```

## Migration Notes

### From Two-Tier to Three-Tier
- **Backward Compatible**: Legacy methods still work
- **Enhanced Data**: New adaptive methods provide more detailed metrics
- **UI Updates**: Frontend needs to handle adaptive questioning flow
- **Progressive Enhancement**: Can be rolled out gradually

### Question Pool Requirements
- **General Questions**: 5 questions per domain in `/Questions/generalQuestions/`
- **Specialized Questions**: Domain-specific pools in `/Questions/`
- **Adaptive Ready**: All questions need proper domain weight mapping

## Performance Considerations

- **Question Loading**: Pools loaded once per domain at initialization
- **State Management**: Adaptive state kept in memory during quiz
- **Database Writes**: Results saved after each level completion
- **Caching**: Consider caching question pools for better performance

## Error Handling

The system includes comprehensive error handling:
- Missing question files gracefully handled
- Invalid user answers filtered out
- Database connection failures logged
- Adaptive state corruption recovery

This adaptive system provides a more accurate and engaging quiz experience while maintaining compatibility with existing infrastructure.
