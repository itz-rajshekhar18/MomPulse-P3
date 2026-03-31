import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged } from "firebase/auth";

export { onAuthStateChanged };

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

// Login with email and password
export const loginWithEmail = async (email: string, password: string, rememberMe: boolean = false) => {
  try {
    // Set persistence based on remember me option
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user,
      message: "Login successful"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
};

// Logout
export const logout = async () => {
  try {
    await auth.signOut();
    return {
      success: true,
      message: "Logout successful"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.code,
      message: "Logout failed"
    };
  }
};

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    case "auth/popup-closed-by-user":
      return "Login cancelled";
    default:
      return "Login failed. Please try again";
  }
};

export { auth };
