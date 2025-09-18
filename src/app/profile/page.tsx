
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserInferredSkills } from '@/lib/firestore-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  gender: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  university: z.string().optional(),
  hobbies: z.string().optional(),
  skills: z.string().optional(),
  age: z.coerce.number().optional(),
  grade: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [inferredSkills, setInferredSkills] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      gender: '',
      address: '',
      phone: '',
      university: '',
      hobbies: '',
      skills: '',
      age: undefined,
      grade: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        console.log('Fetching profile for user:', user.uid);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as any;
          console.log('Profile data loaded:', profileData);
          
          // Convert null values to empty strings to prevent React warning
          const sanitizedData: ProfileFormValues = {
            fullName: profileData.fullName || '',
            email: profileData.email || '',
            gender: profileData.gender || '',
            address: profileData.address || '',
            phone: profileData.phone || '',
            university: profileData.university || '',
            hobbies: profileData.hobbies || '',
            skills: profileData.skills || '',
            age: profileData.age || undefined,
            grade: profileData.grade || '',
          };
          
          form.reset(sanitizedData);
        } else {
          console.log('No profile exists, using auth data');
          // Pre-fill from auth if no profile exists
          form.reset({
            fullName: user.displayName || '',
            email: user.email || '',
            gender: '',
            address: '',
            phone: '',
            university: '',
            hobbies: '',
            skills: '',
            age: undefined,
            grade: '',
          });
        }
          
          // Fetch inferred skills
          console.log('Fetching inferred skills...');
          const skills = await getUserInferredSkills(user.uid);
          console.log('Inferred skills loaded:', skills);
          setInferredSkills(skills);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      fetchProfile();
    }
  }, [user, form, lastRefresh]);

  // Add effect to refresh when coming back from quiz
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, refreshing profile data...');
      setLastRefresh(Date.now());
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Sanitize data to prevent null values
      const sanitizedData = {
        ...data,
        fullName: data.fullName || '',
        email: data.email || '',
        gender: data.gender || '',
        address: data.address || '',
        phone: data.phone || '',
        university: data.university || '',
        hobbies: data.hobbies || '',
        skills: data.skills || '',
        grade: data.grade || '',
        lastLogin: new Date(),
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, sanitizedData, { merge: true });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
           <Skeleton className="h-48 w-full" />
           <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline holographic-text">
            Your Profile
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Manage your personal information and preferences.
          </p>
        </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>This is your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" readOnly {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Extended Profile</CardTitle>
              <CardDescription>Tell us more about yourself to get better recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University or Organization</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class or Grade</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., 12th Grade, 2nd Year B.Tech" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hobbies and Interests</FormLabel>
                    <FormControl><Textarea {...field} placeholder="e.g., Reading, coding, hiking" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Skills</FormLabel>
                    <FormControl><Textarea {...field} placeholder="e.g., Python, Graphic Design, Public Speaking" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Inferred Skills Section */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI-Inferred Skills</CardTitle>
                  <CardDescription>
                    Skills identified from your quiz responses and activities. These are automatically updated when you complete quizzes.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLastRefresh(Date.now())}
                  title="Refresh skills from latest quiz results"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inferredSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {inferredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="capitalize">
                      {skill.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <p className="mb-4">No inferred skills yet.</p>
                  <p className="text-sm">
                    Take the career quiz to automatically discover and add skills to your profile!
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/quiz">Take Career Quiz</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
