"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Plus, MapPin, Clock, Target } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { StudyBuddy, BuddyConnection, getStudyBuddies, createStudyBuddyProfile, createBuddyConnection } from '@/lib/firestore-utils';
import { onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const EXAM_OPTIONS = [
  'JEE Main', 'JEE Advanced', 'NEET', 'BITSAT', 'COMEDK', 'VITEEE', 'SRMEEE',
  'UPSC', 'SSC', 'CAT', 'GATE', 'GRE', 'GMAT', 'IELTS', 'TOEFL',
  'Class 10 Boards', 'Class 12 Boards', 'State Entrance Exams'
];

const STUDY_LEVELS = [
  'Beginner', 'Intermediate', 'Advanced'
];

const STUDY_PREFERENCES = [
  'Morning Study', 'Evening Study', 'Group Discussion', 'Mock Tests', 
  'Note Sharing', 'Doubt Solving', 'Revision Sessions', 'Competitive Practice'
];

export function StudyBuddyFinder() {
  const { user } = useAuth();
  const [buddies, setBuddies] = useState<StudyBuddy[]>([]);
  const [filteredBuddies, setFilteredBuddies] = useState<StudyBuddy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Connect dialog
  const [connectingBuddy, setConnectingBuddy] = useState<StudyBuddy | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Create buddy profile dialog
  const [showBuddyForm, setShowBuddyForm] = useState(false);
  const [buddyForm, setBuddyForm] = useState({
    bio: '',
    examsTags: [] as string[],
    studyPreferences: [] as string[],
    location: '',
    timezone: 'Asia/Kolkata',
    availableHours: [] as string[],
    currentGoals: [] as string[],
    studyLevel: 'Intermediate' as string
  });

  // Load study buddies with real-time listener
  useEffect(() => {
    const q = query(
      collection(db, 'studyBuddies'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const buddiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StudyBuddy));
      setBuddies(buddiesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter buddies when search criteria change
  useEffect(() => {
    filterBuddies();
  }, [buddies, searchTerm, selectedExam, selectedLevel, selectedLocation]);

  const filterBuddies = () => {
    let filtered = buddies;

    if (searchTerm) {
      filtered = filtered.filter(buddy => 
        buddy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buddy.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buddy.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedExam && selectedExam !== 'all') {
      filtered = filtered.filter(buddy => 
        buddy.examsTags.some(exam => exam.toLowerCase().includes(selectedExam.toLowerCase()))
      );
    }

    if (selectedLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(buddy => 
        buddy.studyLevel === selectedLevel
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(buddy => 
        buddy.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredBuddies(filtered);
  };

  const handleConnect = async () => {
    if (!user || !connectingBuddy) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect with study buddies.",
        variant: "destructive"
      });
      return;
    }

    if (!connectionMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please write a message to introduce yourself.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await createBuddyConnection(
        user.uid,
        connectingBuddy.id,
        user.displayName || user.email || 'Anonymous User',
        connectingBuddy.name,
        connectionMessage.trim()
      );

      toast({
        title: "Connection Request Sent!",
        description: `Your request has been sent to ${connectingBuddy.name}.`,
        variant: "default"
      });

      setConnectingBuddy(null);
      setConnectionMessage('');
    } catch (error) {
      console.error('Error creating buddy connection:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a study buddy profile.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!buddyForm.bio.trim() || buddyForm.examsTags.length === 0 || !buddyForm.location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createStudyBuddyProfile({
        userId: user.uid,
        name: user.displayName || user.email || 'Anonymous User',
        email: user.email || '',
        avatar: user.photoURL || '',
        bio: buddyForm.bio.trim(),
        examsTags: buddyForm.examsTags,
        studyPreferences: buddyForm.studyPreferences,
        location: buddyForm.location.trim(),
        timezone: buddyForm.timezone,
        availableHours: buddyForm.availableHours,
        currentGoals: buddyForm.currentGoals.filter(g => g.trim()),
        studyLevel: buddyForm.studyLevel,
        isActive: true
      });

      toast({
        title: "Study Buddy Profile Created!",
        description: "Your profile is now live. Other students can find and connect with you.",
        variant: "default"
      });

      setShowBuddyForm(false);
    } catch (error) {
      console.error('Error creating study buddy profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Users className="text-primary" />
                Study Buddy Finder
              </CardTitle>
              <CardDescription>
                Connect with peers preparing for the same entrance exams and study together.
              </CardDescription>
            </div>
            <Dialog open={showBuddyForm} onOpenChange={setShowBuddyForm}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Your Study Buddy Profile</DialogTitle>
                  <DialogDescription>
                    Let other students find you and connect for study sessions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio *</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell others about your study goals, preparation strategy, and what kind of study partner you're looking for..."
                      value={buddyForm.bio}
                      onChange={(e) => setBuddyForm({...buddyForm, bio: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Mumbai, Delhi, Online"
                        value={buddyForm.location}
                        onChange={(e) => setBuddyForm({...buddyForm, location: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="studyLevel">Study Level</Label>
                      <Select value={buddyForm.studyLevel} onValueChange={(value) => setBuddyForm({...buddyForm, studyLevel: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STUDY_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Preparing For (Exams) *</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded">
                      {EXAM_OPTIONS.map(exam => (
                        <Label key={exam} className="flex items-center space-x-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={buddyForm.examsTags.includes(exam)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBuddyForm({...buddyForm, examsTags: [...buddyForm.examsTags, exam]});
                              } else {
                                setBuddyForm({...buddyForm, examsTags: buddyForm.examsTags.filter(x => x !== exam)});
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span>{exam}</span>
                        </Label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Study Preferences</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded">
                      {STUDY_PREFERENCES.map(pref => (
                        <Label key={pref} className="flex items-center space-x-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={buddyForm.studyPreferences.includes(pref)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBuddyForm({...buddyForm, studyPreferences: [...buddyForm.studyPreferences, pref]});
                              } else {
                                setBuddyForm({...buddyForm, studyPreferences: buddyForm.studyPreferences.filter(x => x !== pref)});
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span>{pref}</span>
                        </Label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBuddyForm(false)}>Cancel</Button>
                  <Button onClick={handleCreateProfile}>Create Profile</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {EXAM_OPTIONS.map(exam => (
                  <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Study Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {STUDY_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Location..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Buddies List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex flex-col items-center space-y-3">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuddies.length > 0 ? (
            filteredBuddies.map((buddy) => (
              <Card key={buddy.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={buddy.avatar} />
                    <AvatarFallback>{buddy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-bold text-lg">{buddy.name}</h3>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{buddy.location}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">{buddy.studyLevel}</Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">{buddy.bio}</p>
                  
                  <div className="space-y-2 w-full">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {buddy.examsTags.slice(0, 3).map(exam => (
                        <Badge key={exam} variant="secondary" className="text-xs">{exam}</Badge>
                      ))}
                      {buddy.examsTags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{buddy.examsTags.length - 3} more</Badge>
                      )}
                    </div>
                    
                    {buddy.studyPreferences.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {buddy.studyPreferences.slice(0, 2).map(pref => (
                          <Badge key={pref} variant="outline" className="text-xs">{pref}</Badge>
                        ))}
                        {buddy.studyPreferences.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{buddy.studyPreferences.length - 2} more</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Dialog open={connectingBuddy?.id === buddy.id} onOpenChange={(open) => !open && setConnectingBuddy(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setConnectingBuddy(buddy)}
                        className="w-full"
                      >
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect with {buddy.name}</DialogTitle>
                        <DialogDescription>
                          Send a message introducing yourself and your study goals.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message">Your Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Hi! I'm also preparing for JEE and would love to study together. My current focus is..."
                            value={connectionMessage}
                            onChange={(e) => setConnectionMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConnectingBuddy(null)}>Cancel</Button>
                        <Button onClick={handleConnect} disabled={isConnecting}>
                          {isConnecting ? 'Sending...' : 'Send Request'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No study buddies found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || (selectedExam !== 'all') || (selectedLevel !== 'all') || selectedLocation
                    ? 'Try adjusting your search filters to find more study buddies.'
                    : 'Be the first to create a study buddy profile!'
                  }
                </p>
                {!(searchTerm || (selectedExam !== 'all') || (selectedLevel !== 'all') || selectedLocation) && (
                  <Button onClick={() => setShowBuddyForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Profile
                  </Button>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
