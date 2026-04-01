'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from "../lib/firestore";

// Postpartum Dashboard Component
function PostpartumDashboard({ userName }: { userName: string }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-[#BFA2DB] rounded-lg flex items-center justify-center text-white font-bold">
                  M
                </div>
                <span className="text-xl font-bold text-gray-800">MomPulse</span>
              </div>
              <nav className="flex space-x-4">
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-medium">
                  👶 Postpartum
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  📅 Recovery
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  🍼 Baby Care
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  💬 Consult
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  👥 Community
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-800 text-xl">🔍</button>
              <button className="text-gray-600 hover:text-gray-800 text-xl">🔔</button>
              <Link href="/periods_tracker/profile">
                <div className="w-10 h-10 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-[#A88BC4] transition-colors">
                  {userName.charAt(0)}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Hi, {userName} 💜
              </h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  👶 Week 4 Postpartum · Healing Well
                </span>
              </p>
              <p className="text-gray-600 mt-1">
                Take care of yourself — a healthy mama means a happy baby 💜
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <span>📝</span>
                <span>Log Baby</span>
              </button>
              <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] flex items-center space-x-2">
                <span>📋</span>
                <span>Recovery Plan</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recovery Progress Card */}
            <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-purple-800 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">📊</span>
                <h2 className="text-xl font-bold">Recovery Progress</h2>
              </div>
              
              <p className="text-purple-100 mb-6">You're doing amazing, mama 💜</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-purple-200 text-sm mb-1">DELIVERY</p>
                  <p className="text-2xl font-bold">May 2, 2025 · 6 weeks ago</p>
                </div>
                
                <div>
                  <p className="text-purple-200 text-sm mb-1">RECOVERY STATUS</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-purple-700 rounded-full h-3">
                      <div className="bg-white rounded-full h-3" style={{width: '75%'}}></div>
                    </div>
                    <span className="font-bold">75%</span>
                  </div>
                  <p className="text-sm text-purple-200 mt-1">Physical Recovery: 75%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-purple-200 text-sm mb-1">BABY AGE</p>
                  <p className="text-2xl font-bold">6 weeks, 3 days old</p>
                </div>
                
                <div>
                  <p className="text-purple-200 text-sm mb-1">NEXT CHECKUP</p>
                  <p className="text-2xl font-bold">June 18 · 6-Week OB Visit</p>
                </div>
              </div>

              <button className="w-full mt-6 py-3 bg-white text-purple-700 rounded-xl font-medium hover:bg-purple-50 flex items-center justify-center space-x-2">
                <span>📋</span>
                <span>View My Recovery Plan</span>
              </button>
            </div>

            {/* Today's AI Insight */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#BFA2DB] rounded-xl flex items-center justify-center text-white text-2xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Today's AI Insight</h3>
                    <p className="text-sm text-gray-600">Postpartum wellness analysis</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">✨ ACTIVE</span>
              </div>
              
              <div className="bg-white rounded-xl p-4 mb-4">
                <p className="text-gray-800 leading-relaxed mb-3">
                  It's completely normal to feel exhausted during your postpartum recovery — your body has done incredible work! Here's what you can do when you can: stay hydrated, and remember you are healing beautifully 💜
                </p>
              </div>
              
              <button className="w-full py-3 bg-[#BFA2DB] text-white rounded-xl font-medium hover:bg-[#A88BC4] flex items-center justify-center space-x-2 mb-3">
                <span>🤖</span>
                <span>Ask Follow-up</span>
              </button>

              <button className="w-full py-3 border border-purple-300 text-purple-700 rounded-xl font-medium hover:bg-purple-50 flex items-center justify-center space-x-2">
                <span>📊</span>
                <span>View Full Insight →</span>
              </button>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Postpartum depression (PPD) screening tools available — check in with yourself daily.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-pink-50 rounded-xl p-4 text-center">
                <p className="text-pink-600 text-sm font-medium mb-1">Recovery</p>
                <p className="text-3xl font-bold text-gray-900">75%</p>
                <p className="text-xs text-gray-600 mt-1">On track</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-blue-600 text-sm font-medium mb-1">Sleep</p>
                <p className="text-3xl font-bold text-gray-900">4.2 hrs</p>
                <p className="text-xs text-gray-600 mt-1">Avg Sleep</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-green-600 text-sm font-medium mb-1">Feeding</p>
                <p className="text-3xl font-bold text-gray-900">8x</p>
                <p className="text-xs text-gray-600 mt-1">Today (so far)</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-yellow-600 text-sm font-medium mb-1">Mood</p>
                <p className="text-3xl font-bold text-gray-900">😊 Good</p>
                <p className="text-xs text-gray-600 mt-1">Mood Today</p>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  💬
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Ask AI Assistant</h3>
                <p className="text-xs text-gray-600">Recovery & baby care questions answered</p>
                <button className="mt-3 w-full py-2 bg-purple-100 text-[#BFA2DB] rounded-lg text-sm font-medium hover:bg-purple-200">
                  Ask Now
                </button>
              </button>

              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  💗
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Book Consultation</h3>
                <p className="text-xs text-gray-600">Talk to lactation & postpartum specialists</p>
                <button className="mt-3 w-full py-2 bg-pink-100 text-pink-600 rounded-lg text-sm font-medium hover:bg-pink-200">
                  Book Now
                </button>
              </button>

              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  📚
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Read Articles</h3>
                <p className="text-xs text-gray-600">Evidence-based tips & recovery guides</p>
                <button className="mt-3 w-full py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200">
                  Explore
                </button>
              </button>

              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  👥
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Community</h3>
                <p className="text-xs text-gray-600">Support from moms who understand</p>
                <button className="mt-3 w-full py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200">
                  Join Now
                </button>
              </button>
            </div>

            {/* Recommended Articles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-pink-600">📚</span>
                  <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                  <span className="text-sm text-gray-500">Curated on May 14 from 52 articles</span>
                </div>
                <button className="text-[#BFA2DB] text-sm font-medium hover:underline">
                  See all 52 articles →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl p-6 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                    💗 Recovery
                  </span>
                  <div className="text-4xl mb-4">💗</div>
                  <h3 className="font-bold text-lg mb-2">Postpartum Recovery: What to Expect First 6 Weeks</h3>
                  <p className="text-sm text-pink-50 mb-4">
                    A gentle, research-backed guide to the first 42 days of healing after delivery.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      <span>Dr. Priya Nair</span>
                    </div>
                    <span>⏱️ 8 min read</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                    🍼 Newborn Care
                  </span>
                  <div className="text-4xl mb-4">👶</div>
                  <h3 className="font-bold text-lg mb-2">Newborn Care Basics: Your First 30 Days Guide</h3>
                  <p className="text-sm text-orange-50 mb-4">
                    Everything you need to know about feeding, sleep schedules, and diaper changes.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      <span>Dr. Ravi Malvai</span>
                    </div>
                    <span>⏱️ 9 min read</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                    🧠 Mental Health
                  </span>
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="font-bold text-lg mb-2">Mental Health After Delivery: Signs, Support & Healing</h3>
                  <p className="text-sm text-purple-50 mb-4">
                    Recognizing postpartum depression, anxiety, and when to ask for help. You're not alone.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      <span>Sarah Gupta, PhD</span>
                    </div>
                    <span>⏱️ 11 min read</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Baby Milestones Timeline */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">👶</span>
                  <h2 className="text-xl font-bold text-gray-900">Baby Milestones & Recovery Timeline</h2>
                </div>
                <button className="text-[#BFA2DB] text-sm font-medium hover:underline">
                  View full timeline →
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white relative z-10">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">Birth</h3>
                        <span className="text-sm text-gray-500">May 2</span>
                      </div>
                      <p className="text-sm text-gray-600">✓ Done</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white relative z-10">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">Week 1</h3>
                        <span className="text-sm text-gray-500">May 9</span>
                      </div>
                      <p className="text-sm text-gray-600">✓ Done</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white relative z-10">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">Week 2</h3>
                        <span className="text-sm text-gray-500">May 16</span>
                      </div>
                      <p className="text-sm text-gray-600">✓ Done</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white relative z-10">
                      <span className="text-2xl text-white">👶</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">Week 6</h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          📍 You're here
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Postpartum checkup · Days 42-49</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 opacity-50">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white relative z-10">
                      <span className="text-2xl">⏱️</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <h3 className="font-bold text-gray-900">Week 12</h3>
                      <p className="text-sm text-gray-600">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Consultations */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Consultations</h3>
                <button className="text-[#BFA2DB] text-sm font-medium hover:underline">+ Book</button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                      👩‍⚕️
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Dr. Priya Nair</p>
                      <p className="text-xs text-gray-600">Today 3 PM</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-pink-600 text-white rounded-lg text-xs font-medium">
                    Join Bridge
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Dr. Ravi Malvai</p>
                      <p className="text-xs text-gray-600">June 18 · 7 PM</p>
                    </div>
                  </div>
                  <button className="text-purple-600 text-xs font-medium hover:underline">
                    Set Reminder →
                  </button>
                </div>
              </div>

              <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50">
                📋 Load More Specialists
              </button>
            </div>

            {/* Wellness Summary */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Wellness Summary</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Physical Recovery</span>
                    <span className="font-bold text-pink-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-pink-400 to-pink-600 rounded-full h-2" style={{width: '75%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Emotional Wellbeing</span>
                    <span className="font-bold text-purple-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-full h-2" style={{width: '85%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sleep Quality</span>
                    <span className="font-bold text-blue-600">48%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full h-2" style={{width: '48%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Breastfeeding</span>
                    <span className="font-bold text-green-600">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-full h-2" style={{width: '90%'}}></div>
                  </div>
                </div>
              </div>

              <button className="w-full mt-4 py-2 bg-purple-50 text-[#BFA2DB] rounded-lg text-sm font-medium hover:bg-purple-100">
                📊 View Full Wellness Report
              </button>
            </div>

            {/* Logging Streak */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🔥</span>
                <h3 className="font-bold">Logging Streak</h3>
              </div>
              <p className="text-4xl font-bold mb-2">12 days</p>
              <p className="text-sm text-yellow-50 mb-4">
                Keep it up! You're building a great habit.
              </p>
              <div className="flex items-center space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {i < 5 ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PregnancyTrackerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [pregnancyStage, setPregnancyStage] = useState<'planning' | 'pregnant' | 'postpartum'>('planning');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        setUserName(userData.data.fullName);
        if (userData.data.pregnancyStage) {
          setPregnancyStage(userData.data.pregnancyStage);
        }
      }

      setLoading(false);
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

  // Render different dashboards based on pregnancy stage
  if (pregnancyStage === 'postpartum') {
    return <PostpartumDashboard userName={userName} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-[#BFA2DB] rounded-lg flex items-center justify-center text-white font-bold">
                  M
                </div>
                <span className="text-xl font-bold text-gray-800">MomPulse</span>
              </div>
              <nav className="flex space-x-4">
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-medium">
                  📊 Dashboard
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  📅 Calendar
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  💡 Insights
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  💬 Consult
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  👥 Community
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-800 text-xl">🔍</button>
              <button className="text-gray-600 hover:text-gray-800 text-xl">🔔</button>
              <Link href="/periods_tracker/profile">
                <div className="w-10 h-10 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-[#A88BC4] transition-colors">
                  {userName.charAt(0)}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Hi, {userName} 🌸
              </h1>
              <p className="text-gray-600">
                Let's plan your journey to motherhood — your body is ready to be understood 💜
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <span>📝</span>
                <span>Log Today</span>
              </button>
              <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] flex items-center space-x-2">
                <span>📅</span>
                <span>Full Calendar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fertility Status Card */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📅</span>
                  <h2 className="text-xl font-bold">View Full Cycle Calendar</h2>
                </div>
                <span className="px-3 py-1 bg-purple-500 rounded-full text-sm">🌸 Ovulation Window · Day 14</span>
              </div>
              
              <p className="text-purple-100 mb-6">Your cycle: beautifully understood</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-purple-200 text-sm mb-1">CURRENT PHASE</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💜</span>
                    <div>
                      <p className="font-bold text-lg">Ovulation Window</p>
                      <p className="text-sm text-purple-200">Highest fertility phase — optimal for conception</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-purple-200 text-sm mb-1">FERTILE DAYS</p>
                  <p className="text-3xl font-bold">June 12 - June 17</p>
                  <p className="text-sm text-purple-200 mt-1">Peak fertility 💜</p>
                </div>
                
                <div>
                  <p className="text-purple-200 text-sm mb-1">NEXT PERIOD EXPECTED</p>
                  <p className="text-3xl font-bold">June 30, 2025</p>
                </div>
              </div>
              
              <div>
                <p className="text-purple-200 text-sm mb-2">CYCLE REGULARITY</p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-purple-700 rounded-full h-3">
                    <div className="bg-white rounded-full h-3" style={{width: '87%'}}></div>
                  </div>
                  <span className="font-bold text-lg">87%</span>
                </div>
              </div>
            </div>

            {/* Today's AI Insight */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#BFA2DB] rounded-xl flex items-center justify-center text-white text-2xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Today's AI Insight</h3>
                    <p className="text-sm text-gray-600">Personalized for your cycle</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">✨ ACTIVE</span>
              </div>
              
              <div className="bg-white rounded-xl p-4 mb-4">
                <p className="text-gray-800 leading-relaxed">
                  You are entering your fertile window — the most powerful phase of your cycle. This is your optimal window for conception. Your body is ready 💜
                </p>
              </div>
              
              <button className="w-full py-3 bg-[#BFA2DB] text-white rounded-xl font-medium hover:bg-[#A88BC4] flex items-center justify-center space-x-2">
                <span>🤖</span>
                <span>Ask Follow-up</span>
              </button>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Track basal body temperature daily during this phase for higher conception accuracy.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-pink-50 rounded-xl p-4 text-center">
                <p className="text-pink-600 text-sm font-medium mb-1">Avg Cycle</p>
                <p className="text-3xl font-bold text-gray-900">28 days</p>
                <p className="text-xs text-gray-600 mt-1">Avg Cycle</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-purple-600 text-sm font-medium mb-1">Period Length</p>
                <p className="text-3xl font-bold text-gray-900">5 days</p>
                <p className="text-xs text-gray-600 mt-1">Period Length</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-yellow-600 text-sm font-medium mb-1">Last Period</p>
                <p className="text-3xl font-bold text-gray-900">June 2</p>
                <p className="text-xs text-gray-600 mt-1">Last Period</p>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  💬
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Ask AI Assistant</h3>
                <p className="text-xs text-gray-600">Fertility questions answered, personalized for you</p>
                <button className="mt-3 w-full py-2 bg-purple-100 text-[#BFA2DB] rounded-lg text-sm font-medium hover:bg-purple-200">
                  Ask Now
                </button>
              </button>

              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  💗
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Book Consultation</h3>
                <p className="text-xs text-gray-600">Talk to certified OB-GYNs and fertility specialists</p>
                <button className="mt-3 w-full py-2 bg-pink-100 text-pink-600 rounded-lg text-sm font-medium hover:bg-pink-200">
                  Book Now
                </button>
              </button>

              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  📚
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Explore Articles</h3>
                <p className="text-xs text-gray-600">Evidence-based tips to improve your fertility</p>
                <button className="mt-3 w-full py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200">
                  Explore
                </button>
              </button>

              <button className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                  👥
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Community</h3>
                <p className="text-xs text-gray-600">Connect with women on the same journey as you</p>
                <button className="mt-3 w-full py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200">
                  Join Now
                </button>
              </button>
            </div>

            {/* Recommended Articles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">📚</span>
                  <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                  <span className="text-sm text-gray-500">Curated on May 14 from 48 articles</span>
                </div>
                <button className="text-[#BFA2DB] text-sm font-medium hover:underline">
                  See all 48 articles →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                    🍎 Nutrition
                  </span>
                  <div className="text-4xl mb-4">🍎</div>
                  <h3 className="font-bold text-lg mb-2">Best Foods to Boost Fertility Naturally</h3>
                  <p className="text-sm text-green-50 mb-4">
                    Discover the top 12 fertility-boosting foods recommended by OB-GYNs and nutritionists.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      <span>Dr. Ravi Malvai</span>
                    </div>
                    <span>⏱️ 5 min read</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                    📊 Tracking
                  </span>
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="font-bold text-lg mb-2">How to Track Ovulation Accurately at Home</h3>
                  <p className="text-sm text-purple-50 mb-4">
                    From BBT charting to LH strips — a complete guide to knowing your fertile window.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      <span>Dr. Priya Nair</span>
                    </div>
                    <span>⏱️ 7 min read</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl p-6 text-white">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                    🧘 Wellness
                  </span>
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="font-bold text-lg mb-2">Stress & Fertility: The Hidden Connection</h3>
                  <p className="text-sm text-pink-50 mb-4">
                    Learn how cortisol levels affect your cycle and what to do about it to boost conception.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      <span>Dr. Sarah Gupta, PhD</span>
                    </div>
                    <span>⏱️ 6 min read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Consultations */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Consultations</h3>
                <button className="text-[#BFA2DB] text-sm font-medium hover:underline">+ Book</button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                      👩‍⚕️
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Dr. Priya Nair</p>
                      <p className="text-xs text-gray-600">Today 3 PM</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-pink-600 text-white rounded-lg text-xs font-medium">
                    Health Bridge
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Dr. Ravi Malvai</p>
                      <p className="text-xs text-gray-600">June 18 · 11 AM</p>
                    </div>
                  </div>
                  <button className="text-green-600 text-xs font-medium hover:underline">
                    See Reminder →
                  </button>
                </div>
              </div>

              <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50">
                📋 Find More Specialists
              </button>
            </div>

            {/* Health Summary */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Health Summary</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cycle Regularity</span>
                  <span className="font-bold text-gray-900">87%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Cycle Length</span>
                  <span className="font-bold text-purple-600">28 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Period Length</span>
                  <span className="font-bold text-green-600">5 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Period Logged</span>
                  <span className="font-bold text-orange-600">June 2</span>
                </div>
              </div>

              <button className="w-full mt-4 py-2 bg-purple-50 text-[#BFA2DB] rounded-lg text-sm font-medium hover:bg-purple-100">
                📊 View Detailed Health Report
              </button>
            </div>

            {/* Logging Streak */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🔥</span>
                <h3 className="font-bold">Logging Streak</h3>
              </div>
              <p className="text-4xl font-bold mb-2">12 days</p>
              <p className="text-sm text-yellow-50">
                Keep it up! You're building a great habit.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
