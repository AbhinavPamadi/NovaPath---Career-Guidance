"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { HelpCircle, Send, Tag, X } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { createQuestion } from '@/lib/firestore-utils';
import { toast } from '@/hooks/use-toast';

const COMMON_TAGS = [
  'Academic', 'Career', 'College', 'Entrance Exam', 'Study Tips', 
  'Time Management', 'Scholarships', 'Placement', 'Internship', 'Skills'
];

export function QAPlatform() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim()) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to ask a question.",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description for your question.",
        variant: "destructive"
      });
      return;
    }

    if (selectedTags.length === 0) {
      toast({
        title: "Tags Required",
        description: "Please add at least one tag to your question.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const questionId = await createQuestion(
        title.trim(),
        content.trim(),
        selectedTags,
        user.uid,
        user.displayName || user.email || 'Anonymous User',
        isAnonymous
      );

      if (questionId) {
        toast({
          title: "Question Posted!",
          description: "Your question has been posted successfully and will appear in the forum.",
          variant: "default"
        });
        
        // Reset form
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setIsAnonymous(false);
      } else {
        throw new Error('Failed to create question');
      }
    } catch (error) {
      console.error('Error posting question:', error);
      toast({
        title: "Error",
        description: "Failed to post your question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <HelpCircle className="text-primary" />
          Ask a Question
        </CardTitle>
        <CardDescription>
          Ask questions openly. Your identity can be kept anonymous. Get answers from senior peers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">
              Question Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., How much time should I dedicate to competitive programming?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium mb-2 block">
              Question Details *
            </Label>
            <Textarea
              id="content"
              placeholder="Provide more details about your question. The more specific you are, the better answers you'll get."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags * (Select up to 5)
            </Label>
            
            {/* Common tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                disabled={selectedTags.length >= 5}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addCustomTag}
                disabled={!customTag.trim() || selectedTags.length >= 5}
              >
                Add
              </Button>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Selected tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="default" className="cursor-pointer">
                      {tag}
                      <X 
                        className="ml-1 h-3 w-3 hover:bg-destructive/20 rounded-full" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit section */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymous" 
                checked={isAnonymous} 
                onCheckedChange={(checked) => setIsAnonymous(!!checked)} 
              />
              <Label htmlFor="anonymous" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Ask Anonymously
              </Label>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !title.trim() || !content.trim() || selectedTags.length === 0}
              className="w-full max-w-xs"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Question'}
            </Button>
          </div>

          {!user && (
            <p className="text-sm text-yellow-600 text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              Please sign in to ask a question.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}