'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerWithEmail } from "./register";
import { saveUserData, db } from "../lib/firestore";
import { auth } from "../login/login";
import { getUserData } from "../lib/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export default function RegistrationPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is already logged in, check if they've completed onboarding
        try {
          const userData = await getUserData(user.uid);
          
          if (userData.success && userData.data) {
            // If user has completed onboarding, redirect to their tracker
            if (userData.data.onboardingCompleted) {
              if (userData.data.journey === 'period') {
                router.push('/periods_tracker');
              } else if (userData.data.journey === 'pregnancy') {
                router.push('/pregnancy_tracker');
              }
            } else {
              // User hasn't completed onboarding, redirect there
              router.push('/onboarding');
            }
          } else {
            setCheckingAuth(false);
          }
        } catch (error) {
          console.error("Error checking auth:", error);
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await registerWithEmail(email, password, fullName);
      
      if (result.success && result.user) {
        // Save basic user data to Firestore with temporary defaults
        const saveResult = await saveUserData(result.user.uid, {
          fullName,
          email,
          age: parseInt(age),
          journey: 'period', // Temporary default, will be updated in onboarding
          cycleStartDate: new Date().toISOString().split('T')[0]
        });

        if (saveResult.success) {
          // Set onboarding as not completed
          const userRef = doc(db, 'users', result.user.uid);
          await updateDoc(userRef, {
            onboardingCompleted: false
          });
          
          console.log('Registration successful - redirecting to onboarding');
          // Always redirect to onboarding for journey selection
          router.push('/onboarding');
        } else {
          setError('Account created but failed to save profile data');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo/Title */}
        <h1 className="text-3xl font-bold text-[#BFA2DB] text-center mb-2">
          MomPulse
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-500 text-center mb-8">
          Create your account and start your journey
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              required
              min="13"
              max="100"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              required
            />
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BFA2DB] text-white py-3 rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#BFA2DB] font-semibold hover:bg-[#A88BC4]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
