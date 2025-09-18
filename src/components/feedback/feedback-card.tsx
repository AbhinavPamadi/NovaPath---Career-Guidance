"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare, Flag, Star, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedbackEntry {
  id: number;
  title: string;
  description: string;
  author: string;
  avatar?: string;
  timestamp: Date;
  category: string;
  priority: string;
  upvotes: number;
  downvotes: number;
  status: string;
  replies: number;
  rating?: number;
  userType?: string;
}

interface FeedbackCardProps {
  feedback: FeedbackEntry;
  onVote?: (feedbackId: number, voteType: 'up' | 'down') => void;
  onReply?: (feedbackId: number, reply: string) => void;
  onReport?: (feedbackId: number) => void;
  className?: string;
}

export function FeedbackCard({ 
  feedback, 
  onVote, 
  onReply, 
  onReport, 
  className 
}: FeedbackCardProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleVote = (voteType: 'up' | 'down') => {
    const newVote = userVote === voteType ? null : voteType;
    setUserVote(newVote);
    onVote?.(feedback.id, voteType);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply?.(feedback.id, replyText);
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "under review": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "in progress": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "planned": return "bg-purple-500/20 text-purple-600 border-purple-500/30";
      case "completed": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "declined": return "bg-red-500/20 text-red-600 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500/20 text-red-600 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-600 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "bug-report": return "🐛";
      case "feature-request": return "✨";
      case "improvement": return "📈";
      case "suggestion": return "💡";
      default: return "💬";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className={cn("glass-card hover:border-accent/50 transition-colors", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={feedback.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${feedback.author}`} />
              <AvatarFallback>{getInitials(feedback.author)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span>{getCategoryIcon(feedback.category)}</span>
                    {feedback.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="font-medium">{feedback.author}</span>
                    {feedback.userType && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{feedback.userType}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(feedback.timestamp)} ago</span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReport?.(feedback.id)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={getStatusColor(feedback.status)}>
                  {feedback.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {feedback.category.replace('-', ' ')}
                </Badge>
                <Badge className={getPriorityColor(feedback.priority)}>
                  {feedback.priority} priority
                </Badge>
              </div>

              {/* Rating */}
              {feedback.rating && feedback.rating > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= feedback.rating! 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({feedback.rating}/5)
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feedback.description}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleVote('up')}
                  className={cn(
                    "flex items-center gap-1 h-8",
                    userVote === 'up' && "text-green-600 bg-green-100/50"
                  )}
                >
                  <ThumbsUp className={cn("h-4 w-4", userVote === 'up' && "fill-current")} />
                  <span>{feedback.upvotes + (userVote === 'up' ? 1 : 0)}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleVote('down')}
                  className={cn(
                    "flex items-center gap-1 h-8",
                    userVote === 'down' && "text-red-600 bg-red-100/50"
                  )}
                >
                  <ThumbsDown className={cn("h-4 w-4", userVote === 'down' && "fill-current")} />
                  <span>{feedback.downvotes + (userVote === 'down' ? 1 : 0)}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 h-8"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{feedback.replies} replies</span>
                </Button>
              </div>

              {/* Reply Form */}
              {showReplyForm && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Add a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowReplyForm(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
