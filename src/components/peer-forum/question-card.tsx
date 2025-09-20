
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { MessageSquare, Flag, ArrowBigUp, ArrowBigDown, Eye, Clock } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { ForumAnswer } from './forum-answer';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ForumQuestion, ForumReply, voteQuestion, createReply, getUserInteractions, UserInteraction, listenToReplies } from '@/lib/firestore-utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function QuestionCard({ question }: { question: ForumQuestion }) {
  const { user } = useAuth();
  const [showAnswers, setShowAnswers] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [userInteractions, setUserInteractions] = useState<UserInteraction | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Load user interactions on mount
  useEffect(() => {
    if (user) {
      getUserInteractions(user.uid).then(setUserInteractions);
    }
  }, [user]);

  // Listen to replies when answers are shown
  useEffect(() => {
    if (showAnswers) {
      const unsubscribe = listenToReplies(question.id, setReplies);
      return unsubscribe;
    }
  }, [showAnswers, question.id]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote.",
        variant: "destructive"
      });
      return;
    }

    setIsVoting(true);
    try {
      await voteQuestion(question.id, user.uid, voteType);
      // Refresh user interactions
      const updated = await getUserInteractions(user.uid);
      setUserInteractions(updated);
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to reply.",
        variant: "destructive"
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please write your reply before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingReply(true);
    try {
      await createReply(
        question.id,
        replyContent.trim(),
        user.uid,
        user.displayName || user.email || 'Anonymous User',
        false // not anonymous for now
      );
      
      setReplyContent('');
      setIsReplying(false);
      toast({
        title: "Reply Posted!",
        description: "Your reply has been added to the discussion.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post your reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const hasUpvoted = userInteractions?.questionUpvotes.includes(question.id);
  const hasDownvoted = userInteractions?.questionDownvotes.includes(question.id);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-2">{question.title}</CardTitle>
            {question.content && (
              <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                {question.content}
              </CardDescription>
            )}
          </div>
          <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Report</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={question.authorAvatar} />
            <AvatarFallback>{question.authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{question.isAnonymous ? 'Anonymous' : question.authorName}</span>
          <span>•</span>
          <span>{question.createdAt ? formatDistanceToNowStrict(question.createdAt.toDate()) : 'Recently'} ago</span>
          {question.views > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{question.views}</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 pt-3">
          {question.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Voting */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={cn(
                  "h-8 px-2",
                  hasUpvoted && "text-green-600 bg-green-50 dark:bg-green-900/20"
                )}
              >
                <ArrowBigUp className="h-4 w-4 mr-1" />
                <span className="text-xs">{question.upvotes}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className={cn(
                  "h-8 px-2",
                  hasDownvoted && "text-red-600 bg-red-50 dark:bg-red-900/20"
                )}
              >
                <ArrowBigDown className="h-4 w-4 mr-1" />
                <span className="text-xs">{question.downvotes}</span>
              </Button>
            </div>
            
            {/* Replies */}
            <Button variant="ghost" size="sm" onClick={() => setShowAnswers(!showAnswers)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>{question.replyCount} {question.replyCount === 1 ? 'Reply' : 'Replies'}</span>
            </Button>
          </div>
          
          {question.isResolved && (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Resolved
            </Badge>
          )}
        </div>
      </CardContent>
      
      {showAnswers && (
        <div className="px-6 pb-6">
          <Separator className="my-4" />
          <div className="space-y-4">
            {replies.map(reply => (
              <ForumAnswer key={reply.id} answer={reply} questionId={question.id} />
            ))}
            
            {user && (
              <div className="flex items-start gap-4 pt-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ""} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="w-full space-y-2">
                  <Textarea 
                    placeholder="Write your reply..." 
                    className="text-sm" 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    {isReplying && (
                      <Button variant="outline" size="sm" onClick={() => {
                        setIsReplying(false);
                        setReplyContent('');
                      }}>
                        Cancel
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={handleReplySubmit}
                      disabled={isSubmittingReply || !replyContent.trim()}
                    >
                      {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {!user && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link> to reply to this question.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
