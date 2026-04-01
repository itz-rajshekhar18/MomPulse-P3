import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "../login/login"; // Reuse the auth instance from login

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
    
    // Send email verification (optional - can be commented out if causing issues)
    try {
      await sendEmailVerification(userCredential.user);
    } catch (emailError) {
      console.log('Email verification failed, but registration succeeded');
    }
    
    return {
      success: true,
      user: userCredential.user,
      message: "Registration successful"
    };
  } catch (error: any) {
    console.error('Registration error:', error);
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
