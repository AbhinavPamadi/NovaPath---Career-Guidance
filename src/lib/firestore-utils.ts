import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot, 
  increment, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  fullName: string | null;
  email: string | null;
  createdAt?: Date;
  lastLogin?: Date;
  inferredSkills?: string[];
  quizResults?: QuizResult[];
  // New two-tier quiz system fields
  general_quiz_inferences?: any;
  personalized_quiz_inferences?: any;
  career_suggestions?: any;
}

export interface QuizResult {
  completedAt: Date;
  answers: QuizAnswer[];
  topSkills: string[];
}

export interface QuizAnswer {
  questionIndex: number;
  selectedOption: 'a' | 'b' | 'c' | 'd';
  inference: string[];
}

// Forum Data Structures
export interface ForumQuestion {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  upvotes: number;
  downvotes: number;
  views: number;
  replyCount: number;
  isResolved: boolean;
}

export interface ForumReply {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  upvotes: number;
  downvotes: number;
  parentReplyId?: string; // For nested replies
  isAcceptedAnswer: boolean;
}

export interface MentorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  bio: string;
  degree: string;
  college: string;
  graduationYear: number;
  currentRole?: string;
  company?: string;
  expertise: string[];
  subjects: string[];
  yearOfStudy: number;
  gpa?: number;
  achievements: string[];
  menteeCapacity: number;
  currentMentees: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MentorConnection {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  requestMessage: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export interface StudyBuddy {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  bio: string;
  examsTags: string[];
  studyPreferences: string[];
  location: string;
  timezone: string;
  availableHours: string[];
  currentGoals: string[];
  studyLevel: string; // 'beginner' | 'intermediate' | 'advanced'
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BuddyConnection {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CollegeReview {
  id: string;
  collegeName: string;
  courseName: string;
  authorId: string;
  authorName: string;
  authorType: 'student' | 'alumni';
  graduationYear?: number;
  currentYear?: number;
  rating: number; // 1-5
  content: string;
  pros: string[];
  cons: string[];
  categories: {
    academics: number;
    infrastructure: number;
    placement: number;
    faculty: number;
    campusLife: number;
  };
  helpful: number;
  notHelpful: number;
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserInteraction {
  userId: string;
  questionUpvotes: string[];
  questionDownvotes: string[];
  replyUpvotes: string[];
  replyDownvotes: string[];
  questionsViewed: string[];
  reviewsHelpful: string[];
  reviewsNotHelpful: string[];
}

/**
 * Creates or updates a user profile in Firestore with retry logic
 * @param user - Firebase Auth user object
 * @param isNewUser - Whether this is a new user signup
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<boolean> - Success status
 */
export async function createOrUpdateUserProfile(
  user: User, 
  isNewUser: boolean = false, 
  maxRetries: number = 3
): Promise<boolean> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        fullName: user.displayName,
        email: user.email,
        lastLogin: new Date(),
      };

      if (isNewUser) {
        userProfile.createdAt = new Date();
      }

      await setDoc(doc(db, "users", user.uid), userProfile, { merge: true });
      
      console.log(`User profile ${isNewUser ? 'created' : 'updated'} successfully for user: ${user.uid}`);
      return true;
    } catch (error: any) {
      attempts++;
      console.warn(`Attempt ${attempts} failed to ${isNewUser ? 'create' : 'update'} user profile:`, error);
      
      if (attempts >= maxRetries) {
        console.error(`Failed to ${isNewUser ? 'create' : 'update'} user profile after ${maxRetries} attempts:`, error);
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  return false;
}

/**
 * Gets a user profile from Firestore
 * @param uid - User ID
 * @returns Promise<UserProfile | null>
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Retry a Firestore operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<T | null>
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempts++;
      console.warn(`Firestore operation attempt ${attempts} failed:`, error);
      
      if (attempts >= maxRetries) {
        console.error(`Firestore operation failed after ${maxRetries} attempts:`, error);
        return null;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  return null;
}

/**
 * Tests if user has write permissions to their profile
 * @param uid - User ID
 * @returns Promise<boolean> - Whether user can write to their profile
 */
export async function testUserWritePermissions(uid: string): Promise<boolean> {
  try {
    console.log('Testing write permissions for user:', uid);
    const testDoc = doc(db, "users", uid);
    await setDoc(testDoc, { 
      lastPermissionTest: new Date(),
      testField: "permission-test" 
    }, { merge: true });
    console.log('Write permission test successful');
    return true;
  } catch (error: any) {
    console.error('Write permission test failed:', error);
    return false;
  }
}

/**
 * Saves quiz results and updates inferred skills for a user
 * @param uid - User ID
 * @param quizAnswers - Array of quiz answers
 * @returns Promise<boolean> - Success status
 */
export async function saveQuizResultsAndUpdateSkills(
  uid: string,
  quizAnswers: QuizAnswer[]
): Promise<boolean> {
  try {
    console.log('saveQuizResultsAndUpdateSkills called with:', { uid, answersCount: quizAnswers.length });
    
    // Calculate skill frequencies
    const skillCount: { [key: string]: number } = {};
    quizAnswers.forEach(answer => {
      answer.inference.forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    console.log('Skill count calculated:', skillCount);

    // Get top skills (most frequent ones)
    const topSkills = Object.entries(skillCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Keep top 10 skills
      .map(([skill]) => skill);

    console.log('Top skills identified:', topSkills);

    const quizResult: QuizResult = {
      completedAt: new Date(),
      answers: quizAnswers,
      topSkills
    };

    console.log('Getting current profile for user:', uid);
    // Get current profile
    const userDoc = await getDoc(doc(db, "users", uid));
    const currentProfile = userDoc.exists() ? userDoc.data() as UserProfile : null;
    
    console.log('Current profile exists:', userDoc.exists());
    console.log('Current profile data:', currentProfile);

    // Merge skills with existing inferred skills
    const existingSkills = currentProfile?.inferredSkills || [];
    const allSkills = [...new Set([...existingSkills, ...topSkills])]; // Remove duplicates

    console.log('Existing skills:', existingSkills);
    console.log('All skills (merged):', allSkills);

    // Update profile with new quiz results and skills
    const updatedProfile = {
      uid: uid,
      fullName: currentProfile?.fullName || '',
      email: currentProfile?.email || '',
      createdAt: currentProfile?.createdAt || new Date(),
      lastLogin: new Date(),
      inferredSkills: allSkills,
      quizResults: [
        ...(currentProfile?.quizResults || []),
        quizResult
      ].slice(-5), // Keep only last 5 quiz results
      // Preserve any other existing fields (sanitized)
      ...Object.fromEntries(
        Object.entries(currentProfile || {}).map(([key, value]) => [
          key, 
          value === null ? '' : value
        ])
      )
    };

    console.log('About to save updated profile:', updatedProfile);

    await setDoc(doc(db, "users", uid), updatedProfile, { merge: true });
    
    console.log(`Quiz results saved and skills updated for user: ${uid}`);
    console.log(`New inferred skills:`, topSkills);
    console.log(`All skills in profile:`, allSkills);
    return true;
  } catch (error: any) {
    console.error('Failed to save quiz results and update skills:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

/**
 * Gets inferred skills for a user
 * @param uid - User ID
 * @returns Promise<string[]>
 */
export async function getUserInferredSkills(uid: string): Promise<string[]> {
  try {
    console.log('getUserInferredSkills called for user:', uid);
    const profile = await getUserProfile(uid);
    console.log('Profile loaded in getUserInferredSkills:', profile);
    const skills = profile?.inferredSkills || [];
    console.log('Returning inferred skills:', skills);
    return skills;
  } catch (error: any) {
    console.error('Failed to get user inferred skills:', error);
    return [];
  }
}

/**
 * Adds manual skills to a user's profile (from profile form)
 * @param uid - User ID
 * @param manualSkills - Skills entered manually by user
 * @returns Promise<boolean>
 */
export async function updateManualSkills(
  uid: string,
  manualSkills: string
): Promise<boolean> {
  try {
    const profile = await getUserProfile(uid);
    if (!profile) return false;

    // Parse manual skills (comma-separated)
    const skillsList = manualSkills
      .split(',')
      .map(skill => skill.trim().toLowerCase())
      .filter(skill => skill.length > 0);

    await setDoc(doc(db, "users", uid), {
      manualSkills: skillsList,
      lastLogin: new Date()
    }, { merge: true });

    return true;
  } catch (error: any) {
    console.error('Failed to update manual skills:', error);
    return false;
  }
}

// =======================
// Q&A FORUM FUNCTIONS
// =======================

/**
 * Creates a new question in the forum
 */
export async function createQuestion(
  title: string,
  content: string,
  tags: string[],
  authorId: string,
  authorName: string,
  isAnonymous: boolean = false
): Promise<string | null> {
  try {
    const questionData = {
      title,
      content,
      tags,
      authorId,
      authorName: isAnonymous ? 'Anonymous' : authorName,
      isAnonymous,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      upvotes: 0,
      downvotes: 0,
      views: 0,
      replyCount: 0,
      isResolved: false
    };

    const docRef = await addDoc(collection(db, 'questions'), questionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating question:', error);
    return null;
  }
}

/**
 * Gets all questions with pagination
 */
export async function getQuestions(
  limitCount: number = 20,
  tags: string[] = []
): Promise<ForumQuestion[]> {
  try {
    let q = query(
      collection(db, 'questions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (tags.length > 0) {
      q = query(
        collection(db, 'questions'),
        where('tags', 'array-contains-any', tags),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ForumQuestion));
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
}

/**
 * Gets a single question by ID
 */
export async function getQuestion(questionId: string): Promise<ForumQuestion | null> {
  try {
    const docSnap = await getDoc(doc(db, 'questions', questionId));
    if (docSnap.exists()) {
      // Increment view count
      await updateDoc(doc(db, 'questions', questionId), {
        views: increment(1)
      });

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ForumQuestion;
    }
    return null;
  } catch (error) {
    console.error('Error getting question:', error);
    return null;
  }
}

/**
 * Updates a question
 */
export async function updateQuestion(
  questionId: string,
  updates: Partial<ForumQuestion>
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'questions', questionId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating question:', error);
    return false;
  }
}

/**
 * Deletes a question
 */
export async function deleteQuestion(questionId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'questions', questionId));
    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    return false;
  }
}

/**
 * Creates a reply to a question
 */
export async function createReply(
  questionId: string,
  content: string,
  authorId: string,
  authorName: string,
  isAnonymous: boolean = false,
  parentReplyId?: string
): Promise<string | null> {
  try {
    const replyData = {
      questionId,
      content,
      authorId,
      authorName: isAnonymous ? 'Anonymous' : authorName,
      isAnonymous,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      upvotes: 0,
      downvotes: 0,
      parentReplyId: parentReplyId || null,
      isAcceptedAnswer: false
    };

    const docRef = await addDoc(collection(db, 'questions', questionId, 'replies'), replyData);
    
    // Update reply count in question
    await updateDoc(doc(db, 'questions', questionId), {
      replyCount: increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating reply:', error);
    return null;
  }
}

/**
 * Gets replies for a question
 */
export async function getReplies(questionId: string): Promise<ForumReply[]> {
  try {
    const q = query(
      collection(db, 'questions', questionId, 'replies'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ForumReply));
  } catch (error) {
    console.error('Error getting replies:', error);
    return [];
  }
}

/**
 * Votes on a question
 */
export async function voteQuestion(
  questionId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<boolean> {
  try {
    // Get user interactions
    const userInteractionDoc = doc(db, 'userInteractions', userId);
    const userInteractionSnap = await getDoc(userInteractionDoc);
    const userInteractions = userInteractionSnap.data() as UserInteraction || {
      userId,
      questionUpvotes: [],
      questionDownvotes: [],
      replyUpvotes: [],
      replyDownvotes: [],
      questionsViewed: [],
      reviewsHelpful: [],
      reviewsNotHelpful: []
    };

    const hasUpvoted = userInteractions.questionUpvotes.includes(questionId);
    const hasDownvoted = userInteractions.questionDownvotes.includes(questionId);

    // Update vote counts
    const questionRef = doc(db, 'questions', questionId);
    const updates: any = {};

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        // Remove upvote
        updates.upvotes = increment(-1);
        userInteractions.questionUpvotes = userInteractions.questionUpvotes.filter(id => id !== questionId);
      } else {
        // Add upvote
        updates.upvotes = increment(1);
        userInteractions.questionUpvotes.push(questionId);
        
        if (hasDownvoted) {
          // Remove previous downvote
          updates.downvotes = increment(-1);
          userInteractions.questionDownvotes = userInteractions.questionDownvotes.filter(id => id !== questionId);
        }
      }
    } else {
      if (hasDownvoted) {
        // Remove downvote
        updates.downvotes = increment(-1);
        userInteractions.questionDownvotes = userInteractions.questionDownvotes.filter(id => id !== questionId);
      } else {
        // Add downvote
        updates.downvotes = increment(1);
        userInteractions.questionDownvotes.push(questionId);
        
        if (hasUpvoted) {
          // Remove previous upvote
          updates.upvotes = increment(-1);
          userInteractions.questionUpvotes = userInteractions.questionUpvotes.filter(id => id !== questionId);
        }
      }
    }

    // Update both documents
    await updateDoc(questionRef, updates);
    await setDoc(userInteractionDoc, userInteractions);

    return true;
  } catch (error) {
    console.error('Error voting on question:', error);
    return false;
  }
}

/**
 * Votes on a reply
 */
export async function voteReply(
  questionId: string,
  replyId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<boolean> {
  try {
    // Similar logic to voteQuestion but for replies
    const userInteractionDoc = doc(db, 'userInteractions', userId);
    const userInteractionSnap = await getDoc(userInteractionDoc);
    const userInteractions = userInteractionSnap.data() as UserInteraction || {
      userId,
      questionUpvotes: [],
      questionDownvotes: [],
      replyUpvotes: [],
      replyDownvotes: [],
      questionsViewed: [],
      reviewsHelpful: [],
      reviewsNotHelpful: []
    };

    const hasUpvoted = userInteractions.replyUpvotes.includes(replyId);
    const hasDownvoted = userInteractions.replyDownvotes.includes(replyId);

    const replyRef = doc(db, 'questions', questionId, 'replies', replyId);
    const updates: any = {};

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        updates.upvotes = increment(-1);
        userInteractions.replyUpvotes = userInteractions.replyUpvotes.filter(id => id !== replyId);
      } else {
        updates.upvotes = increment(1);
        userInteractions.replyUpvotes.push(replyId);
        
        if (hasDownvoted) {
          updates.downvotes = increment(-1);
          userInteractions.replyDownvotes = userInteractions.replyDownvotes.filter(id => id !== replyId);
        }
      }
    } else {
      if (hasDownvoted) {
        updates.downvotes = increment(-1);
        userInteractions.replyDownvotes = userInteractions.replyDownvotes.filter(id => id !== replyId);
      } else {
        updates.downvotes = increment(1);
        userInteractions.replyDownvotes.push(replyId);
        
        if (hasUpvoted) {
          updates.upvotes = increment(-1);
          userInteractions.replyUpvotes = userInteractions.replyUpvotes.filter(id => id !== replyId);
        }
      }
    }

    await updateDoc(replyRef, updates);
    await setDoc(userInteractionDoc, userInteractions);

    return true;
  } catch (error) {
    console.error('Error voting on reply:', error);
    return false;
  }
}

/**
 * Real-time listener for questions
 */
export function listenToQuestions(
  callback: (questions: ForumQuestion[]) => void,
  tags: string[] = []
): () => void {
  let q = query(
    collection(db, 'questions'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  if (tags.length > 0) {
    q = query(
      collection(db, 'questions'),
      where('tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }

  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ForumQuestion));
    callback(questions);
  });
}

/**
 * Real-time listener for replies
 */
export function listenToReplies(
  questionId: string,
  callback: (replies: ForumReply[]) => void
): () => void {
  const q = query(
    collection(db, 'questions', questionId, 'replies'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const replies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ForumReply));
    callback(replies);
  });
}

// =======================
// MENTOR MATCHING FUNCTIONS
// =======================

/**
 * Creates a mentor profile
 */
export async function createMentorProfile(
  mentorData: Omit<MentorProfile, 'id' | 'createdAt' | 'updatedAt' | 'currentMentees' | 'rating' | 'reviewCount'>
): Promise<string | null> {
  try {
    const profile = {
      ...mentorData,
      currentMentees: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'mentors'), profile);
    return docRef.id;
  } catch (error) {
    console.error('Error creating mentor profile:', error);
    return null;
  }
}

/**
 * Gets mentors with filters
 */
export async function getMentors(
  filters: {
    expertise?: string[];
    college?: string;
    yearOfStudy?: number;
    subjects?: string[];
  } = {}
): Promise<MentorProfile[]> {
  try {
    let q = query(
      collection(db, 'mentors'),
      where('isActive', '==', true),
      orderBy('rating', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    let mentors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MentorProfile));

    // Apply client-side filters for complex queries
    if (filters.expertise && filters.expertise.length > 0) {
      mentors = mentors.filter(mentor => 
        filters.expertise!.some(exp => mentor.expertise.includes(exp))
      );
    }

    if (filters.subjects && filters.subjects.length > 0) {
      mentors = mentors.filter(mentor => 
        filters.subjects!.some(sub => mentor.subjects.includes(sub))
      );
    }

    if (filters.college) {
      mentors = mentors.filter(mentor => 
        mentor.college.toLowerCase().includes(filters.college!.toLowerCase())
      );
    }

    if (filters.yearOfStudy) {
      mentors = mentors.filter(mentor => mentor.yearOfStudy >= filters.yearOfStudy!);
    }

    return mentors;
  } catch (error) {
    console.error('Error getting mentors:', error);
    return [];
  }
}

/**
 * Creates a mentor connection request
 */
export async function createMentorConnection(
  mentorId: string,
  studentId: string,
  studentName: string,
  studentEmail: string,
  requestMessage: string
): Promise<string | null> {
  try {
    const connectionData = {
      mentorId,
      studentId,
      studentName,
      studentEmail,
      requestMessage,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'mentorConnections'), connectionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating mentor connection:', error);
    return null;
  }
}

/**
 * Updates mentor connection status
 */
export async function updateMentorConnection(
  connectionId: string,
  status: 'accepted' | 'rejected' | 'completed',
  notes?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (notes) {
      updates.notes = notes;
    }

    await updateDoc(doc(db, 'mentorConnections', connectionId), updates);

    // If accepted, increment mentor's current mentees count
    if (status === 'accepted') {
      const connectionSnap = await getDoc(doc(db, 'mentorConnections', connectionId));
      if (connectionSnap.exists()) {
        const connection = connectionSnap.data() as MentorConnection;
        await updateDoc(doc(db, 'mentors', connection.mentorId), {
          currentMentees: increment(1)
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating mentor connection:', error);
    return false;
  }
}

/**
 * Gets mentor connections for a user
 */
export async function getMentorConnections(
  userId: string,
  type: 'mentor' | 'student'
): Promise<MentorConnection[]> {
  try {
    const field = type === 'mentor' ? 'mentorId' : 'studentId';
    const q = query(
      collection(db, 'mentorConnections'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MentorConnection));
  } catch (error) {
    console.error('Error getting mentor connections:', error);
    return [];
  }
}

// =======================
// STUDY BUDDY FUNCTIONS
// =======================

/**
 * Creates a study buddy profile
 */
export async function createStudyBuddyProfile(
  buddyData: Omit<StudyBuddy, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const profile = {
      ...buddyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'studyBuddies'), profile);
    return docRef.id;
  } catch (error) {
    console.error('Error creating study buddy profile:', error);
    return null;
  }
}

/**
 * Gets study buddies with filters
 */
export async function getStudyBuddies(
  filters: {
    examsTags?: string[];
    location?: string;
    studyLevel?: string;
  } = {}
): Promise<StudyBuddy[]> {
  try {
    let q = query(
      collection(db, 'studyBuddies'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    let buddies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StudyBuddy));

    // Apply client-side filters
    if (filters.examsTags && filters.examsTags.length > 0) {
      buddies = buddies.filter(buddy => 
        filters.examsTags!.some(tag => buddy.examsTags.includes(tag))
      );
    }

    if (filters.location) {
      buddies = buddies.filter(buddy => 
        buddy.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.studyLevel) {
      buddies = buddies.filter(buddy => buddy.studyLevel === filters.studyLevel);
    }

    return buddies;
  } catch (error) {
    console.error('Error getting study buddies:', error);
    return [];
  }
}

/**
 * Creates a buddy connection request
 */
export async function createBuddyConnection(
  senderId: string,
  receiverId: string,
  senderName: string,
  receiverName: string,
  message: string
): Promise<string | null> {
  try {
    const connectionData = {
      senderId,
      receiverId,
      senderName,
      receiverName,
      message,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'buddyConnections'), connectionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating buddy connection:', error);
    return null;
  }
}

/**
 * Updates buddy connection status
 */
export async function updateBuddyConnection(
  connectionId: string,
  status: 'accepted' | 'rejected'
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'buddyConnections', connectionId), {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating buddy connection:', error);
    return false;
  }
}

/**
 * Gets buddy connections for a user
 */
export async function getBuddyConnections(userId: string): Promise<BuddyConnection[]> {
  try {
    const q1 = query(
      collection(db, 'buddyConnections'),
      where('senderId', '==', userId)
    );
    
    const q2 = query(
      collection(db, 'buddyConnections'),
      where('receiverId', '==', userId)
    );

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const connections = [
      ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuddyConnection)),
      ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuddyConnection))
    ];

    return connections.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('Error getting buddy connections:', error);
    return [];
  }
}

// =======================
// REALITY CHECK FUNCTIONS
// =======================

/**
 * Creates a college review
 */
export async function createCollegeReview(
  reviewData: Omit<CollegeReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful' | 'notHelpful' | 'isVerified'>
): Promise<string | null> {
  try {
    const review = {
      ...reviewData,
      helpful: 0,
      notHelpful: 0,
      isVerified: false, // Can be manually verified later
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'reviews'), review);
    return docRef.id;
  } catch (error) {
    console.error('Error creating review:', error);
    return null;
  }
}

/**
 * Gets college reviews with filters
 */
export async function getCollegeReviews(
  filters: {
    collegeName?: string;
    courseName?: string;
    authorType?: 'student' | 'alumni';
    minRating?: number;
  } = {}
): Promise<CollegeReview[]> {
  try {
    let q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    let reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CollegeReview));

    // Apply client-side filters
    if (filters.collegeName) {
      reviews = reviews.filter(review => 
        review.collegeName.toLowerCase().includes(filters.collegeName!.toLowerCase())
      );
    }

    if (filters.courseName) {
      reviews = reviews.filter(review => 
        review.courseName.toLowerCase().includes(filters.courseName!.toLowerCase())
      );
    }

    if (filters.authorType) {
      reviews = reviews.filter(review => review.authorType === filters.authorType);
    }

    if (filters.minRating) {
      reviews = reviews.filter(review => review.rating >= filters.minRating!);
    }

    return reviews;
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
}

/**
 * Marks a review as helpful or not helpful
 */
export async function rateReviewHelpfulness(
  reviewId: string,
  userId: string,
  isHelpful: boolean
): Promise<boolean> {
  try {
    const userInteractionDoc = doc(db, 'userInteractions', userId);
    const userInteractionSnap = await getDoc(userInteractionDoc);
    const userInteractions = userInteractionSnap.data() as UserInteraction || {
      userId,
      questionUpvotes: [],
      questionDownvotes: [],
      replyUpvotes: [],
      replyDownvotes: [],
      questionsViewed: [],
      reviewsHelpful: [],
      reviewsNotHelpful: []
    };

    const hasMarkedHelpful = userInteractions.reviewsHelpful.includes(reviewId);
    const hasMarkedNotHelpful = userInteractions.reviewsNotHelpful.includes(reviewId);

    const reviewRef = doc(db, 'reviews', reviewId);
    const updates: any = {};

    if (isHelpful) {
      if (hasMarkedHelpful) {
        // Remove helpful mark
        updates.helpful = increment(-1);
        userInteractions.reviewsHelpful = userInteractions.reviewsHelpful.filter(id => id !== reviewId);
      } else {
        // Add helpful mark
        updates.helpful = increment(1);
        userInteractions.reviewsHelpful.push(reviewId);
        
        if (hasMarkedNotHelpful) {
          // Remove not helpful mark
          updates.notHelpful = increment(-1);
          userInteractions.reviewsNotHelpful = userInteractions.reviewsNotHelpful.filter(id => id !== reviewId);
        }
      }
    } else {
      if (hasMarkedNotHelpful) {
        // Remove not helpful mark
        updates.notHelpful = increment(-1);
        userInteractions.reviewsNotHelpful = userInteractions.reviewsNotHelpful.filter(id => id !== reviewId);
      } else {
        // Add not helpful mark
        updates.notHelpful = increment(1);
        userInteractions.reviewsNotHelpful.push(reviewId);
        
        if (hasMarkedHelpful) {
          // Remove helpful mark
          updates.helpful = increment(-1);
          userInteractions.reviewsHelpful = userInteractions.reviewsHelpful.filter(id => id !== reviewId);
        }
      }
    }

    await updateDoc(reviewRef, updates);
    await setDoc(userInteractionDoc, userInteractions);

    return true;
  } catch (error) {
    console.error('Error rating review helpfulness:', error);
    return false;
  }
}

/**
 * Gets user's interaction state for UI
 */
export async function getUserInteractions(userId: string): Promise<UserInteraction> {
  try {
    const docSnap = await getDoc(doc(db, 'userInteractions', userId));
    if (docSnap.exists()) {
      return docSnap.data() as UserInteraction;
    }
    
    // Return default interactions
    return {
      userId,
      questionUpvotes: [],
      questionDownvotes: [],
      replyUpvotes: [],
      replyDownvotes: [],
      questionsViewed: [],
      reviewsHelpful: [],
      reviewsNotHelpful: []
    };
  } catch (error) {
    console.error('Error getting user interactions:', error);
    return {
      userId,
      questionUpvotes: [],
      questionDownvotes: [],
      replyUpvotes: [],
      replyDownvotes: [],
      questionsViewed: [],
      reviewsHelpful: [],
      reviewsNotHelpful: []
    };
  }
}

/**
 * Safely converts Firestore timestamp to Date
 * @param timestamp - Firestore timestamp (may be null)
 * @returns Date object or current date if timestamp is null
 */
export function safeTimestampToDate(timestamp: Timestamp | null | undefined): Date {
  if (!timestamp) {
    return new Date();
  }
  try {
    return timestamp.toDate();
  } catch (error) {
    console.warn('Error converting timestamp to date:', error);
    return new Date();
  }
}

/**
 * Safely formats Firestore timestamp to relative time string
 * @param timestamp - Firestore timestamp (may be null)
 * @param fallback - Fallback string if timestamp is invalid
 * @returns Formatted time string
 */
export function safeFormatRelativeTime(timestamp: Timestamp | null | undefined, fallback: string = 'Recently'): string {
  if (!timestamp) {
    return fallback;
  }
  try {
    return timestamp.toDate().toLocaleString();
  } catch (error) {
    console.warn('Error formatting timestamp:', error);
    return fallback;
  }
}