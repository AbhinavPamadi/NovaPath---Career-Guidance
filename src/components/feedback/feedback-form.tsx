"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  onSubmit?: (feedback: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function FeedbackForm({ onSubmit, onCancel, className }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState({
    title: "",
    description: "",
    category: "suggestion",
    priority: "medium",
    rating: 0,
    anonymous: false,
    email: "",
    userType: "student"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.title || !feedback.description) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      onSubmit?.(feedback);
      setIsSubmitting(false);
      setFeedback({
        title: "",
        description: "",
        category: "suggestion",
        priority: "medium",
        rating: 0,
        anonymous: false,
        email: "",
        userType: "student"
      });
    }, 1000);
  };

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Share Your Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Feedback Title *</Label>
            <Input
              id="title"
              placeholder="Brief title for your feedback..."
              value={feedback.title}
              onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your feedback in detail..."
              rows={4}
              value={feedback.description}
              onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={feedback.category} 
                onValueChange={(value) => setFeedback(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="feature-request">Feature Request</SelectItem>
                  <SelectItem value="bug-report">Bug Report</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <RadioGroup
                value={feedback.priority}
                onValueChange={(value) => setFeedback(prev => ({ ...prev, priority: value }))}
                className="flex flex-row space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="text-sm">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-sm">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="text-sm">High</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* User Type */}
          <div className="space-y-2">
            <Label>I am a...</Label>
            <Select 
              value={feedback.userType} 
              onValueChange={(value) => setFeedback(prev => ({ ...prev, userType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="educator">Educator</SelectItem>
                <SelectItem value="counselor">Career Counselor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Experience Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={cn(
                      "h-6 w-6 transition-colors",
                      star <= feedback.rating 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground hover:text-yellow-400"
                    )}
                  />
                </button>
              ))}
              {feedback.rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {feedback.rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Email (optional) */}
          {!feedback.anonymous && (
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={feedback.email}
                onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                We'll only use this to follow up if needed.
              </p>
            </div>
          )}

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={feedback.anonymous}
              onCheckedChange={(checked) => setFeedback(prev => ({ ...prev, anonymous: !!checked }))}
            />
            <Label htmlFor="anonymous" className="text-sm">
              Submit anonymously
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="sm:w-auto">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || !feedback.title || !feedback.description}
              className="sm:w-auto"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
