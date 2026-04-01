import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface UserData {
  uid: string;
  fullName: string;
  email: string;
  age: number;
  journey: 'period' | 'pregnancy';
  cycleStartDate: string;
  createdAt: any;
  updatedAt: any;
  calendarEnabled?: boolean;
  onboardingCompleted?: boolean;
  pregnancyStage?: 'planning' | 'pregnant' | 'postpartum';
}

export interface PeriodCycleData {
  lastPeriodStart1: string;
  lastPeriodEnd1: string;
  lastPeriodStart2: string;
  lastPeriodEnd2: string;
  averageCycleLength?: number;
  createdAt: any;
}

// Save user data to Firestore
export const saveUserData = async (userId: string, userData: Omit<UserData, 'uid' | 'createdAt' | 'updatedAt'>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      uid: userId,
      ...userData,
      calendarEnabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, message: "User data saved successfully" };
  } catch (error: any) {
    console.error("Error saving user data:", error);
    return { success: false, message: "Failed to save user data" };
  }
};

// Get user data from Firestore
export const getUserData = async (userId: string): Promise<{ success: boolean; data?: UserData; message?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { 
        success: true, 
        data: userSnap.data() as UserData 
      };
    } else {
      return { 
        success: false, 
        message: "User data not found" 
      };
    }
  } catch (error: any) {
    console.error("Error fetching user data:", error);
    return { 
      success: false, 
      message: "Failed to fetch user data" 
    };
  }
};

// Enable calendar and save period cycle data
export const enableCalendar = async (userId: string, periodData: Omit<PeriodCycleData, 'createdAt' | 'averageCycleLength'>) => {
  try {
    // Calculate average cycle length
    const start1 = new Date(periodData.lastPeriodStart1);
    const start2 = new Date(periodData.lastPeriodStart2);
    const daysDifference = Math.floor((start1.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24));
    
    // Save period cycle data
    const cycleRef = doc(db, 'users', userId, 'periodCycles', 'initial');
    await setDoc(cycleRef, {
      ...periodData,
      averageCycleLength: daysDifference,
      createdAt: serverTimestamp()
    });
    
    // Update user document to mark calendar as enabled
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      calendarEnabled: true,
      updatedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      message: "Calendar enabled successfully",
      averageCycleLength: daysDifference
    };
  } catch (error: any) {
    console.error("Error enabling calendar:", error);
    return { 
      success: false, 
      message: "Failed to enable calendar" 
    };
  }
};

// Check if calendar is enabled
export const isCalendarEnabled = async (userId: string): Promise<boolean> => {
  try {
    const userData = await getUserData(userId);
    return userData.success && userData.data?.calendarEnabled === true;
  } catch (error) {
    console.error("Error checking calendar status:", error);
    return false;
  }
};

// Get period cycle data
export const getPeriodCycleData = async (userId: string): Promise<{ success: boolean; data?: PeriodCycleData; message?: string }> => {
  try {
    const cycleRef = doc(db, 'users', userId, 'periodCycles', 'initial');
    const cycleSnap = await getDoc(cycleRef);
    
    if (cycleSnap.exists()) {
      return { 
        success: true, 
        data: cycleSnap.data() as PeriodCycleData 
      };
    } else {
      return { 
        success: false, 
        message: "Period cycle data not found" 
      };
    }
  } catch (error: any) {
    console.error("Error fetching period cycle data:", error);
    return { 
      success: false, 
      message: "Failed to fetch period cycle data" 
    };
  }
};

// Get period dates array from cycle data
export const getPeriodDatesArray = (cycleData: PeriodCycleData): { startDates: Date[], durations: number[] } => {
  const start1 = new Date(cycleData.lastPeriodStart1);
  const end1 = new Date(cycleData.lastPeriodEnd1);
  const start2 = new Date(cycleData.lastPeriodStart2);
  const end2 = new Date(cycleData.lastPeriodEnd2);
  
  const duration1 = Math.ceil((end1.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const duration2 = Math.ceil((end2.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    startDates: [start2, start1], // Oldest to newest
    durations: [duration2, duration1]
  };
};

export { db };

// Daily log interfaces
export interface DailyLog {
  date: string; // Format: YYYY-MM-DD
  mood?: string;
  symptoms?: string[];
  notes?: string;
  vitals?: {
    heartRate?: number;
    hydration?: number;
    temperature?: number;
    weight?: number;
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
  };
  createdAt: any;
  updatedAt: any;
}

// Save or update daily log
export const saveDailyLog = async (
  userId: string, 
  date: string, 
  logData: Partial<Omit<DailyLog, 'date' | 'createdAt' | 'updatedAt'>>
) => {
  try {
    // Remove undefined values from logData
    const cleanedData: any = {};
    Object.keys(logData).forEach(key => {
      const value = (logData as any)[key];
      if (value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });
    
    const logRef = doc(db, 'users', userId, 'dailyLogs', date);
    const logSnap = await getDoc(logRef);
    
    if (logSnap.exists()) {
      // Update existing log
      await updateDoc(logRef, {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new log
      await setDoc(logRef, {
        date,
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true, message: "Daily log saved successfully" };
  } catch (error: any) {
    console.error("Error saving daily log:", error);
    return { success: false, message: "Failed to save daily log" };
  }
};

// Get daily log for a specific date
export const getDailyLog = async (
  userId: string, 
  date: string
): Promise<{ success: boolean; data?: DailyLog; message?: string }> => {
  try {
    const logRef = doc(db, 'users', userId, 'dailyLogs', date);
    const logSnap = await getDoc(logRef);
    
    if (logSnap.exists()) {
      return { 
        success: true, 
        data: logSnap.data() as DailyLog 
      };
    } else {
      return { 
        success: false, 
        message: "No log found for this date" 
      };
    }
  } catch (error: any) {
    console.error("Error fetching daily log:", error);
    return { 
      success: false, 
      message: "Failed to fetch daily log" 
    };
  }
};

// Save mood for a specific date
export const saveMood = async (userId: string, date: string, mood: string) => {
  return saveDailyLog(userId, date, { mood });
};

// Save symptoms for a specific date
export const saveSymptoms = async (userId: string, date: string, symptoms: string[]) => {
  return saveDailyLog(userId, date, { symptoms });
};

// Save notes for a specific date
export const saveNotes = async (userId: string, date: string, notes: string) => {
  return saveDailyLog(userId, date, { notes });
};

// Save vitals for a specific date
export const saveVitals = async (userId: string, date: string, vitals: DailyLog['vitals']) => {
  return saveDailyLog(userId, date, { vitals });
};

// Helper to format date as YYYY-MM-DD
export const formatDateForLog = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// AI Conversation interfaces
export interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: any;
  badge?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: any;
  suggestions?: string[];
  cards?: any[];
}

// Create a new conversation
export const createConversation = async (userId: string, title: string, firstMessage: string) => {
  try {
    const conversationId = Date.now().toString();
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    
    await setDoc(conversationRef, {
      id: conversationId,
      title,
      preview: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, conversationId };
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return { success: false, message: 'Failed to create conversation' };
  }
};

// Get all conversations for a user
export const getConversations = async (userId: string) => {
  try {
    const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
    const conversationsRef = collection(db, 'users', userId, 'conversations');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      conversations.push(doc.data() as Conversation);
    });
    
    return { success: true, conversations };
  } catch (error: any) {
    console.error('Error getting conversations:', error);
    return { success: false, conversations: [], message: 'Failed to get conversations' };
  }
};

// Save a message to a conversation
export const saveMessage = async (
  userId: string,
  conversationId: string,
  message: Omit<ChatMessage, 'id' | 'conversationId' | 'timestamp'>
) => {
  try {
    const messageId = Date.now().toString();
    const messageRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', messageId);
    
    await setDoc(messageRef, {
      id: messageId,
      conversationId,
      ...message,
      timestamp: serverTimestamp()
    });
    
    // Update conversation preview and timestamp
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      preview: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, messageId };
  } catch (error: any) {
    console.error('Error saving message:', error);
    return { success: false, message: 'Failed to save message' };
  }
};

// Get all messages for a conversation
export const getMessages = async (userId: string, conversationId: string) => {
  try {
    const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
    const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push(doc.data() as ChatMessage);
    });
    
    return { success: true, messages };
  } catch (error: any) {
    console.error('Error getting messages:', error);
    return { success: false, messages: [], message: 'Failed to get messages' };
  }
};

// Update conversation title
export const updateConversationTitle = async (userId: string, conversationId: string, title: string) => {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      title,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating conversation title:', error);
    return { success: false, message: 'Failed to update conversation title' };
  }
};

// Delete a conversation
export const deleteConversation = async (userId: string, conversationId: string) => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(conversationRef);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return { success: false, message: 'Failed to delete conversation' };
  }
};
