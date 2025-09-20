"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, CheckCircle, Plus, ThumbsUp, ThumbsDown, Filter, Search } from 'lucide-react';
import { CollegeReview, createCollegeReview, getCollegeReviews, rateReviewHelpfulness, getUserInteractions } from '@/lib/firestore-utils';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  { key: 'academics', label: 'Academics' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'placement', label: 'Placement' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'campusLife', label: 'Campus Life' }
];

export function RealityCheckSystem() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<CollegeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInteractions, setUserInteractions] = useState<any>({});
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [authorTypeFilter, setAuthorTypeFilter] = useState('all');
  const [minRating, setMinRating] = useState('');
  
  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    collegeName: '',
    courseName: '',
    rating: 5,
    content: '',
    pros: [] as string[],
    cons: [] as string[],
    authorType: 'student' as 'student' | 'alumni',
    graduationYear: undefined as number | undefined,
    currentYear: undefined as number | undefined,
    categories: {
      academics: 5,
      infrastructure: 5,
      placement: 5,
      faculty: 5,
      campusLife: 5
    }
  });

  // Load reviews with real-time listener
  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CollegeReview));
      setReviews(reviewsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user interactions
  useEffect(() => {
    if (user) {
      getUserInteractions(user.uid).then(setUserInteractions);
    }
  }, [user]);

  // Filter reviews
  useEffect(() => {
    let filtered = reviews;

    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (collegeFilter) {
      filtered = filtered.filter(review => 
        review.collegeName.toLowerCase().includes(collegeFilter.toLowerCase())
      );
    }

    if (courseFilter) {
      filtered = filtered.filter(review => 
        review.courseName.toLowerCase().includes(courseFilter.toLowerCase())
      );
    }

    if (authorTypeFilter && authorTypeFilter !== 'all') {
      filtered = filtered.filter(review => review.authorType === authorTypeFilter);
    }

    if (minRating) {
      filtered = filtered.filter(review => review.rating >= parseInt(minRating));
    }

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, collegeFilter, courseFilter, authorTypeFilter, minRating]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a review.",
        variant: "destructive"
      });
      return;
    }

    if (!reviewForm.collegeName.trim() || !reviewForm.courseName.trim() || !reviewForm.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createCollegeReview({
        collegeName: reviewForm.collegeName.trim(),
        courseName: reviewForm.courseName.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorType: reviewForm.authorType,
        graduationYear: reviewForm.graduationYear,
        currentYear: reviewForm.currentYear,
        rating: reviewForm.rating,
        content: reviewForm.content.trim(),
        pros: reviewForm.pros.filter(p => p.trim()),
        cons: reviewForm.cons.filter(c => c.trim()),
        categories: reviewForm.categories
      });

      toast({
        title: "Review Submitted!",
        description: "Your review has been posted and will help other students make informed decisions.",
        variant: "default"
      });

      setShowReviewForm(false);
      setReviewForm({
        collegeName: '',
        courseName: '',
        rating: 5,
        content: '',
        pros: [],
        cons: [],
        authorType: 'student',
        graduationYear: undefined,
        currentYear: undefined,
        categories: {
          academics: 5,
          infrastructure: 5,
          placement: 5,
          faculty: 5,
          campusLife: 5
        }
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRateHelpfulness = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to rate review helpfulness.",
        variant: "destructive"
      });
      return;
    }

    try {
      await rateReviewHelpfulness(reviewId, user.uid, isHelpful);
      // Refresh user interactions
      const newInteractions = await getUserInteractions(user.uid);
      setUserInteractions(newInteractions);
    } catch (error) {
      console.error('Error rating review helpfulness:', error);
      toast({
        title: "Error",
        description: "Failed to rate review helpfulness.",
        variant: "destructive"
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <CheckCircle className="text-primary" />
                Reality Check System
              </CardTitle>
              <CardDescription>
                Genuine, experience-based reviews of courses and colleges from current students and alumni.
              </CardDescription>
            </div>
            <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                  <DialogDescription>
                    Share your honest experience to help other students make informed decisions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="collegeName">College/University *</Label>
                      <Input
                        id="collegeName"
                        placeholder="e.g., IIT Bombay"
                        value={reviewForm.collegeName}
                        onChange={(e) => setReviewForm({...reviewForm, collegeName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseName">Course *</Label>
                      <Input
                        id="courseName"
                        placeholder="e.g., B.Tech Computer Science"
                        value={reviewForm.courseName}
                        onChange={(e) => setReviewForm({...reviewForm, courseName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="authorType">You are *</Label>
                      <Select value={reviewForm.authorType} onValueChange={(value: 'student' | 'alumni') => setReviewForm({...reviewForm, authorType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Current Student</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year">
                        {reviewForm.authorType === 'alumni' ? 'Graduation Year' : 'Current Year'}
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder={reviewForm.authorType === 'alumni' ? '2023' : '2'}
                        value={reviewForm.authorType === 'alumni' ? reviewForm.graduationYear || '' : reviewForm.currentYear || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (reviewForm.authorType === 'alumni') {
                            setReviewForm({...reviewForm, graduationYear: value});
                          } else {
                            setReviewForm({...reviewForm, currentYear: value});
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rating">Overall Rating *</Label>
                      <Select value={reviewForm.rating.toString()} onValueChange={(value) => setReviewForm({...reviewForm, rating: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Star</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Your Review *</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your detailed experience about the course, faculty, infrastructure, placement opportunities, campus life, etc."
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>Category Ratings</Label>
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {CATEGORIES.map(category => (
                        <div key={category.key} className="flex items-center justify-between">
                          <span className="text-sm">{category.label}</span>
                          <Select 
                            value={reviewForm.categories[category.key as keyof typeof reviewForm.categories].toString()} 
                            onValueChange={(value) => setReviewForm({
                              ...reviewForm, 
                              categories: {
                                ...reviewForm.categories,
                                [category.key]: parseInt(value)
                              }
                            })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                  <Button onClick={handleSubmitReview}>Submit Review</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />
            
            <Input
              placeholder="College..."
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            />
            
            <Input
              placeholder="Course..."
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            />
            
            <Select value={authorTypeFilter} onValueChange={setAuthorTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Author Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <Card key={review.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{review.courseName}</h3>
                      <p className="text-muted-foreground">{review.collegeName}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {renderStars(review.rating, 'lg')}
                        <Badge variant="secondary">
                          {review.authorType === 'alumni' ? `Alumni ${review.graduationYear}` : `Year ${review.currentYear}`}
                        </Badge>
                        {review.isVerified && (
                          <Badge variant="default">Verified</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{review.rating}/5</div>
                      <div className="text-sm text-muted-foreground">Overall</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {CATEGORIES.map(category => (
                      <div key={category.key} className="text-center">
                        <div className="text-sm font-medium">{review.categories[category.key as keyof typeof review.categories]}/5</div>
                        <div className="text-xs text-muted-foreground">{category.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm leading-relaxed">{review.content}</p>
                  
                  {(review.pros.length > 0 || review.cons.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                      {review.pros.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-green-600 mb-2">Pros</h4>
                          <ul className="text-sm space-y-1">
                            {review.pros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.cons.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-red-600 mb-2">Cons</h4>
                          <ul className="text-sm space-y-1">
                            {review.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      by {review.authorName} • {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRateHelpfulness(review.id, true)}
                          className={userInteractions.reviewsHelpful?.includes(review.id) ? 'text-green-600' : ''}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {review.helpful}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRateHelpfulness(review.id, false)}
                          className={userInteractions.reviewsNotHelpful?.includes(review.id) ? 'text-red-600' : ''}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {review.notHelpful}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No reviews found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || collegeFilter || courseFilter || (authorTypeFilter !== 'all') || minRating
                  ? 'Try adjusting your search filters to find more reviews.'
                  : 'Be the first to write a review and help fellow students!'
                }
              </p>
              {!(searchTerm || collegeFilter || courseFilter || (authorTypeFilter !== 'all') || minRating) && (
                <Button onClick={() => setShowReviewForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Write Review
                </Button>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
