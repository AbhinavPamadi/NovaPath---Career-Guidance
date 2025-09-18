"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Plus, Filter, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Mock data for feedback entries
const mockFeedback = [
  {
    id: 1,
    title: "Add Dark Mode Toggle",
    description: "It would be great to have a dark mode option for better user experience during night time study sessions.",
    author: "Alex Chen",
    avatar: "AC",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    category: "Feature Request",
    upvotes: 15,
    downvotes: 2,
    status: "Under Review",
    replies: 3
  },
  {
    id: 2,
    title: "Quiz Loading Issues",
    description: "The quiz page sometimes takes too long to load, especially when there are many questions.",
    author: "Sarah Johnson",
    avatar: "SJ",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    category: "Bug Report",
    upvotes: 8,
    downvotes: 0,
    status: "In Progress",
    replies: 1
  },
  {
    id: 3,
    title: "More Career Paths",
    description: "Please add more non-traditional career paths like content creation, freelancing, and entrepreneurship.",
    author: "Mike Rodriguez",
    avatar: "MR",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    category: "Suggestion",
    upvotes: 23,
    downvotes: 1,
    status: "Planned",
    replies: 7
  }
];

const categories = ["All", "Feature Request", "Bug Report", "Suggestion", "General"];
const statuses = ["Open", "Under Review", "In Progress", "Planned", "Completed"];

export default function FeedbackForumPage() {
  const [showNewFeedback, setShowNewFeedback] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    description: "",
    category: "Suggestion"
  });

  const filteredFeedback = mockFeedback.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitFeedback = () => {
    if (newFeedback.title && newFeedback.description) {
      console.log("New feedback:", newFeedback);
      setNewFeedback({ title: "", description: "", category: "Suggestion" });
      setShowNewFeedback(false);
      // Here you would typically make an API call to save the feedback
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Review": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "In Progress": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "Planned": return "bg-purple-500/20 text-purple-600 border-purple-500/30";
      case "Completed": return "bg-green-500/20 text-green-600 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline holographic-text">
          Feedback Forum
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          Share your thoughts, report issues, and help us make NovaPath better for everyone.
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewFeedback(!showNewFeedback)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Feedback
          </Button>
        </div>

        {/* New Feedback Form */}
        {showNewFeedback && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Share Your Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Feedback title..."
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Describe your feedback in detail..."
                  rows={4}
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select 
                  value={newFeedback.category} 
                  onValueChange={(value) => setNewFeedback(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="Bug Report">Bug Report</SelectItem>
                    <SelectItem value="Suggestion">Suggestion</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" onClick={() => setShowNewFeedback(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitFeedback}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feedback List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {filteredFeedback.map(feedback => (
          <Card key={feedback.id} className="glass-card hover:border-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${feedback.author}`} />
                    <AvatarFallback>{feedback.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{feedback.title}</h3>
                      <Badge className={getStatusColor(feedback.status)}>
                        {feedback.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>{feedback.author}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(feedback.timestamp)} ago</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {feedback.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{feedback.description}</p>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{feedback.upvotes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8">
                        <ThumbsDown className="h-4 w-4" />
                        <span>{feedback.downvotes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8">
                        <MessageSquare className="h-4 w-4" />
                        <span>{feedback.replies} replies</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== "All" 
              ? "Try adjusting your search or filter criteria."
              : "Be the first to share your feedback!"}
          </p>
        </div>
      )}
    </div>
  );
}
