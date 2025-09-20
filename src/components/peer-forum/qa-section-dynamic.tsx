"use client";

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { PlusCircle, Tag, X, Loader2 } from 'lucide-react';
import { QuestionCard } from './question-card';
import { QAPlatform } from './qa-platform';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { ForumQuestion, listenToQuestions } from '@/lib/firestore-utils';
import { Skeleton } from '../ui/skeleton';

const COMMON_TAGS = [
  'Academic', 'Career', 'College', 'Entrance Exam', 'Study Tips', 
  'Time Management', 'Scholarships', 'Placement', 'Internship', 'Skills',
  'Engineering', 'Medical', 'Commerce', 'Arts', 'Science'
];

export function QASection() {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = listenToQuestions((newQuestions) => {
      setQuestions(newQuestions);
      setLoading(false);
    }, selectedTags);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredQuestions = selectedTags.length > 0
    ? questions.filter(q => selectedTags.some(tag => q.tags.includes(tag)))
    : questions;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold font-headline holographic-text">Q&A Forum</h2>
        <Button onClick={() => setShowQuestionForm(!showQuestionForm)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          {showQuestionForm ? 'Close' : 'Ask a Question'}
        </Button>
      </div>
      
      <AnimatePresence>
        {showQuestionForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mb-8 overflow-hidden"
          >
            <QAPlatform />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mb-8 p-4 rounded-lg glass-card">
          <div className='flex items-center gap-2 mb-3'>
            <Tag className='h-5 w-5 text-primary' />
            <h3 className="font-semibold text-lg">Filter by Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                onClick={() => toggleTag(tag)}
                className="cursor-pointer transition-all hover:opacity-80"
              >
                {tag}
                {selectedTags.includes(tag) && <X className="ml-2 h-3 w-3" />}
              </Badge>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => setSelectedTags([])}>Clear Filters</Button>
          )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg glass-card">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Questions List */}
      {!loading && !error && (
        <div className="space-y-6">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map(question => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No questions found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedTags.length > 0 
                    ? 'No questions match your selected tags. Try removing some filters.'
                    : 'Be the first to ask a question in the forum!'
                  }
                </p>
                {selectedTags.length > 0 ? (
                  <Button onClick={() => setSelectedTags([])} variant="outline">
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setShowQuestionForm(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ask First Question
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
