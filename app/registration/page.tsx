'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerWithEmail } from "./register";
import { saveUserData } from "../lib/firestore";
import { auth } from "../login/login";
import { getUserData } from "../lib/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function RegistrationPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [journey, setJourney] = useState<'period' | 'pregnancy' | null>(null);
  const [cycleStartDate, setCycleStartDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is already logged in, redirect to their tracker
        try {
          const userData = await getUserData(user.uid);
          
          if (userData.success && userData.data) {
            if (userData.data.journey === 'period') {
              router.push('/periods_tracker');
            } else if (userData.data.journey === 'pregnancy') {
              router.push('/pregnancy_tracker');
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

    if (!journey) {
      setError('Please select your journey');
      return;
    }

    if (!cycleStartDate) {
      setError('Please select cycle start date');
      return;
    }

    setLoading(true);

    try {
      const result = await registerWithEmail(email, password, fullName);
      
      if (result.success && result.user) {
        // Save additional user data to Firestore
        const saveResult = await saveUserData(result.user.uid, {
          fullName,
          email,
          age: parseInt(age),
          journey: journey!,
          cycleStartDate
        });

        if (saveResult.success) {
          console.log('Registration successful:', result.user);
          // Redirect to login page
          router.push('/login');
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

          {/* Select Your Journey */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Journey
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJourney('period')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  journey === 'period'
                    ? 'bg-[#BFA2DB] border-[#BFA2DB] text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#BFA2DB]'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold">Track Period</div>
                <div className="text-xs mt-1 opacity-90">Monitor your menstrual cycle</div>
              </button>

              <button
                type="button"
                onClick={() => setJourney('pregnancy')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  journey === 'pregnancy'
                    ? 'bg-[#F4C2C2] border-[#F4C2C2] text-gray-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#F4C2C2]'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold">Track Pregnancy</div>
                <div className="text-xs mt-1 opacity-90">Follow your pregnancy journey</div>
              </button>
            </div>
          </div>

          {/* Cycle Start Date */}
          <div>
            <label htmlFor="cycleStartDate" className="block text-sm font-medium text-gray-700 mb-2">
              Cycle Start Date
            </label>
            <input
              type="date"
              id="cycleStartDate"
              value={cycleStartDate}
              onChange={(e) => setCycleStartDate(e.target.value)}
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
          <Link href="/login" className="text-[#BFA2DB] font-semibold hover:text-[#A88BC4]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
