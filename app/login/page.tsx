'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail } from "./login";
import { getUserData } from "../lib/firestore";
import { auth } from "./login";
import { onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

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
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password, rememberMe);
      
      if (result.success && result.user) {
        // Fetch user data from Firestore
        const userData = await getUserData(result.user.uid);
        
        if (userData.success && userData.data) {
          console.log('Login successful:', userData.data);
          
          // Redirect based on user's journey
          if (userData.data.journey === 'period') {
            router.push('/periods_tracker');
          } else if (userData.data.journey === 'pregnancy') {
            router.push('/pregnancy_tracker');
          } else {
            // Fallback to a default page
            router.push('/dashboard');
          }
        } else {
          setError('Login successful but failed to load profile data');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
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
          Welcome back! Please login to your account
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
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

          {/* Password Field */}
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
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#BFA2DB] border-gray-300 rounded focus:ring-[#BFA2DB]"
              />
              <span className="ml-2 text-gray-600">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-[#BFA2DB] hover:text-[#A88BC4]">
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BFA2DB] text-white py-3 rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link href="/registration" className="text-[#BFA2DB] font-semibold hover:text-[#A88BC4]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
