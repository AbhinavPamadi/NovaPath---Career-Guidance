"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowRight, Search, UserCheck, Plus, Star, MapPin, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { MentorProfile, getMentors, createMentorConnection, createMentorProfile, getMentorConnections } from '@/lib/firestore-utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const EXPERTISE_OPTIONS = [
  'Web Development', 'Mobile App Development', 'Data Science', 'Machine Learning', 
  'AI/ML', 'DevOps', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 
  'Game Development', 'UI/UX Design', 'Product Management', 'Software Engineering',
  'Research', 'Competitive Programming', 'Academic Excellence'
];

const SUBJECT_OPTIONS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Electronics', 'Information Technology',
  'Business Administration', 'Economics', 'Psychology', 'Medicine',
  'Law', 'Arts', 'Commerce', 'English Literature'
];

export function PeerMentorMatching() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  // Search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [minYear, setMinYear] = useState('');
  
  // Connect dialog
  const [connectingMentor, setConnectingMentor] = useState<MentorProfile | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Become mentor dialog
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    bio: '',
    degree: '',
    college: '',
    graduationYear: new Date().getFullYear() + 4,
    currentRole: '',
    company: '',
    expertise: [] as string[],
    subjects: [] as string[],
    yearOfStudy: 1,
    gpa: '',
    achievements: [] as string[],
    menteeCapacity: 5
  });

  // Load mentors on component mount
  useEffect(() => {
    loadMentors();
  }, []);

  // Filter mentors when search criteria change
  useEffect(() => {
    filterMentors();
  }, [mentors, searchTerm, selectedExpertise, selectedSubject, minYear]);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const mentorsList = await getMentors();
      setMentors(mentorsList);
    } catch (error) {
      console.error('Error loading mentors:', error);
      toast({
        title: "Error",
        description: "Failed to load mentors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMentors = () => {
    let filtered = mentors;

    if (searchTerm) {
      filtered = filtered.filter(mentor => 
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.degree.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedExpertise) {
      filtered = filtered.filter(mentor => 
        mentor.expertise.includes(selectedExpertise)
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(mentor => 
        mentor.subjects.includes(selectedSubject)
      );
    }

    if (minYear) {
      filtered = filtered.filter(mentor => 
        mentor.yearOfStudy >= parseInt(minYear)
      );
    }

    setFilteredMentors(filtered);
  };

  const handleConnect = async () => {
    if (!user || !connectingMentor) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect with mentors.",
        variant: "destructive"
      });
      return;
    }

    if (!connectionMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please write a message to the mentor.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await createMentorConnection(
        connectingMentor.id,
        user.uid,
        user.displayName || user.email || 'Anonymous User',
        user.email || '',
        connectionMessage.trim()
      );

      toast({
        title: "Connection Request Sent!",
        description: `Your request has been sent to ${connectingMentor.name}. They will be notified and can accept or decline.`,
        variant: "default"
      });

      setConnectingMentor(null);
      setConnectionMessage('');
    } catch (error) {
      console.error('Error creating mentor connection:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBecomeMentor = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to become a mentor.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!mentorForm.bio.trim() || !mentorForm.degree.trim() || !mentorForm.college.trim() ||
        mentorForm.expertise.length === 0 || mentorForm.subjects.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createMentorProfile({
        userId: user.uid,
        name: user.displayName || user.email || 'Anonymous User',
        email: user.email || '',
        avatar: user.photoURL || '',
        bio: mentorForm.bio.trim(),
        degree: mentorForm.degree.trim(),
        college: mentorForm.college.trim(),
        graduationYear: mentorForm.graduationYear,
        currentRole: mentorForm.currentRole.trim(),
        company: mentorForm.company.trim(),
        expertise: mentorForm.expertise,
        subjects: mentorForm.subjects,
        yearOfStudy: mentorForm.yearOfStudy,
        gpa: mentorForm.gpa ? parseFloat(mentorForm.gpa) : undefined,
        achievements: mentorForm.achievements.filter(a => a.trim()),
        menteeCapacity: mentorForm.menteeCapacity,
        isActive: true
      });

      toast({
        title: "Mentor Profile Created!",
        description: "Your mentor profile is now live. Students can now find and connect with you.",
        variant: "default"
      });

      setShowMentorForm(false);
      loadMentors(); // Refresh the list
    } catch (error) {
      console.error('Error creating mentor profile:', error);
      toast({
        title: "Error",
        description: "Failed to create mentor profile. Please try again.",
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
                <UserCheck className="text-primary" />
                Peer Mentor Matching
              </CardTitle>
              <CardDescription>
                Find college students 1-3 years senior who took a similar academic path.
              </CardDescription>
            </div>
            <Dialog open={showMentorForm} onOpenChange={setShowMentorForm}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Become a Mentor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Your Mentor Profile</DialogTitle>
                  <DialogDescription>
                    Help junior students by sharing your experience and knowledge.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio *</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell students about yourself, your journey, and how you can help them..."
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({...mentorForm, bio: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="degree">Degree/Course *</Label>
                      <Input
                        id="degree"
                        placeholder="e.g., B.Tech Computer Science"
                        value={mentorForm.degree}
                        onChange={(e) => setMentorForm({...mentorForm, degree: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="college">College/University *</Label>
                      <Input
                        id="college"
                        placeholder="e.g., IIT Bombay"
                        value={mentorForm.college}
                        onChange={(e) => setMentorForm({...mentorForm, college: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="yearOfStudy">Year of Study *</Label>
                      <Select value={mentorForm.yearOfStudy.toString()} 
                              onValueChange={(value) => setMentorForm({...mentorForm, yearOfStudy: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                          <SelectItem value="5">5th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input
                        id="graduationYear"
                        type="number"
                        value={mentorForm.graduationYear}
                        onChange={(e) => setMentorForm({...mentorForm, graduationYear: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gpa">GPA/CGPA</Label>
                      <Input
                        id="gpa"
                        placeholder="e.g., 8.5"
                        value={mentorForm.gpa}
                        onChange={(e) => setMentorForm({...mentorForm, gpa: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMentorForm(false)}>Cancel</Button>
                  <Button onClick={handleBecomeMentor}>Create Profile</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search mentors, colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger>
                <SelectValue placeholder="Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Expertise</SelectItem>
                {EXPERTISE_OPTIONS.map(exp => (
                  <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {SUBJECT_OPTIONS.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={minYear} onValueChange={setMinYear}>
              <SelectTrigger>
                <SelectValue placeholder="Min Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Year</SelectItem>
                <SelectItem value="2">2nd Year+</SelectItem>
                <SelectItem value="3">3rd Year+</SelectItem>
                <SelectItem value="4">4th Year+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMentors.length > 0 ? (
            filteredMentors.map((mentor) => (
              <Card key={mentor.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{mentor.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          <span>{mentor.degree}</span>
                          <span>•</span>
                          <span>{mentor.yearOfStudy}{mentor.yearOfStudy === 1 ? 'st' : mentor.yearOfStudy === 2 ? 'nd' : mentor.yearOfStudy === 3 ? 'rd' : 'th'} Year</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>{mentor.college}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{mentor.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({mentor.reviewCount})</span>
                        </div>
                        <Badge variant="secondary">
                          {mentor.currentMentees}/{mentor.menteeCapacity} mentees
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{mentor.bio}</p>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise.slice(0, 4).map(exp => (
                          <Badge key={exp} variant="outline" className="text-xs">{exp}</Badge>
                        ))}
                        {mentor.expertise.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{mentor.expertise.length - 4} more</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {mentor.subjects.slice(0, 3).map(sub => (
                          <Badge key={sub} variant="secondary" className="text-xs">{sub}</Badge>
                        ))}
                        {mentor.subjects.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{mentor.subjects.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Dialog open={connectingMentor?.id === mentor.id} onOpenChange={(open) => !open && setConnectingMentor(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setConnectingMentor(mentor)}
                        disabled={mentor.currentMentees >= mentor.menteeCapacity}
                      >
                        {mentor.currentMentees >= mentor.menteeCapacity ? 'Full' : 'Connect'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect with {mentor.name}</DialogTitle>
                        <DialogDescription>
                          Send a message introducing yourself and explaining what you'd like guidance on.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message">Your Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Hi! I'm a first-year student interested in web development. I'd love your guidance on..."
                            value={connectionMessage}
                            onChange={(e) => setConnectionMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConnectingMentor(null)}>Cancel</Button>
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
            <Card className="p-12 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No mentors found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedExpertise || selectedSubject || minYear
                  ? 'Try adjusting your search filters to find more mentors.'
                  : 'Be the first to create a mentor profile and help fellow students!'
                }
              </p>
              {!(searchTerm || selectedExpertise || selectedSubject || minYear) && (
                <Button onClick={() => setShowMentorForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Become a Mentor
                </Button>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
