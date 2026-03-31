import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAjI6DcQ0COTF0WovnVI90YJe8iLOvEVhQ",
  authDomain: "mompulse-prototype.firebaseapp.com",
  projectId: "mompulse-prototype",
  storageBucket: "mompulse-prototype.firebasestorage.app",
  messagingSenderId: "901251625497",
  appId: "1:901251625497:web:8f7623f9a3a7b88db1b088",
  measurementId: "G-P7MP3PQ8GX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Register with email and password
export const registerWithEmail = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    
    return {
      success: true,
      user: userCredential.user,
      message: "Registration successful. Please check your email for verification."
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
};

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    case "auth/popup-closed-by-user":
      return "Registration cancelled";
    default:
      return "Registration failed. Please try again";
  }
};

export { auth };
