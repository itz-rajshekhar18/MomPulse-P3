'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./login/login";
import { getUserData } from "./lib/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, fetch their data and redirect
        try {
          const userData = await getUserData(user.uid);
          
          if (userData.success && userData.data) {
            // Redirect based on journey
            if (userData.data.journey === 'period') {
              router.push('/periods_tracker');
            } else if (userData.data.journey === 'pregnancy') {
              router.push('/pregnancy_tracker');
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking auth:", error);
          setLoading(false);
        }
      } else {
        // No user logged in, show welcome screen
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Logo Section */}
      <div className="pt-12 px-6 text-center">
        <h1 className="text-4xl font-bold text-[#BFA2DB] mb-2">MomPulse</h1>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Illustration Placeholder */}
        <div className="mb-8 w-64 h-64 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#BFA2DB]/20 to-[#E8DFF5]/30 flex items-center justify-center">
            <svg 
              className="w-32 h-32 text-[#BFA2DB]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Tagline */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3 text-center">
          Your Partner from Periods to Parenthood
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center max-w-md mb-12 px-4">
          Supporting your wellness journey with personalized care, expert guidance, and a community that understands.
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4 px-6">
          <Link 
            href="/registration"
            className="block w-full bg-[#BFA2DB] text-white py-4 rounded-full text-center font-semibold hover:bg-[#A88BC4] transition-colors shadow-md"
          >
            Get Started
          </Link>
          
          <Link 
            href="/login"
            className="block w-full bg-white text-[#BFA2DB] py-4 rounded-full text-center font-semibold border-2 border-[#BFA2DB] hover:bg-[#FAF7F2] transition-colors"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pb-6 text-center text-xs text-gray-400">
        <p>Your supportive digital companion 🌸</p>
      </div>
    </div>
  );
}
