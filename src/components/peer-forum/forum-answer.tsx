"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowBigUp, ArrowBigDown, CornerDownRight, CheckCircle } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { ForumReply, voteReply, getUserInteractions, UserInteraction } from '@/lib/firestore-utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

export function ForumAnswer({ answer, questionId }: { answer: ForumReply; questionId: string }) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [userInteractions, setUserInteractions] = useState<UserInteraction | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Load user interactions on mount
  useEffect(() => {
    if (user) {
      getUserInteractions(user.uid).then(setUserInteractions);
    }
  }, [user]);

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
      await voteReply(questionId, answer.id, user.uid, voteType);
      // Refresh user interactions
      const updated = await getUserInteractions(user.uid);
      setUserInteractions(updated);
    } catch (error) {
      console.error('Error voting on reply:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const hasUpvoted = userInteractions?.replyUpvotes.includes(answer.id);
  const hasDownvoted = userInteractions?.replyDownvotes.includes(answer.id);

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={answer.authorAvatar} />
        <AvatarFallback>{answer.authorName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className={cn(
          "p-4 rounded-lg",
          answer.isAcceptedAnswer 
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
            : "bg-muted/30"
        )}>
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span className="font-medium">
              {answer.isAnonymous ? 'Anonymous' : answer.authorName}
            </span>
            <span>•</span>
            <span>{formatDistanceToNowStrict(answer.createdAt.toDate())} ago</span>
            {answer.isAcceptedAnswer && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle className="h-3 w-3" />
                  <span>Accepted Answer</span>
                </div>
              </>
            )}
          </div>
          
          <p className="text-sm mb-3 whitespace-pre-wrap">{answer.content}</p>
          
          <div className="flex items-center gap-2">
            {/* Voting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className={cn(
                "h-7 px-2",
                hasUpvoted && "text-green-600 bg-green-50 dark:bg-green-900/20"
              )}
            >
              <ArrowBigUp className="h-3 w-3 mr-1" />
              <span className="text-xs">{answer.upvotes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className={cn(
                "h-7 px-2",
                hasDownvoted && "text-red-600 bg-red-50 dark:bg-red-900/20"
              )}
            >
              <ArrowBigDown className="h-3 w-3 mr-1" />
              <span className="text-xs">{answer.downvotes}</span>
            </Button>

            {/* Reply button - for future nested replies implementation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplying(!replying)}
              disabled={!user}
            >
              <CornerDownRight className="h-3 w-3 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          </div>
        </div>
        
        {replying && user && (
          <div className="mt-3 ml-4 space-y-2">
            <Textarea placeholder="Reply to this answer..." rows={2} className="text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReplying(false)}>Cancel</Button>
              <Button size="sm">Post Reply</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}