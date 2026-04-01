'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from "../lib/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firestore";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [age, setAge] = useState('26');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUserId(user.uid);
      
      // Check if user has already completed onboarding
      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        // Only redirect if onboarding is completed
        if (userData.data.onboardingCompleted) {
          if (userData.data.journey === 'period') {
            router.push('/periods_tracker');
          } else {
            router.push('/pregnancy_tracker');
          }
          return;
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleContinue = async () => {
    if (!selectedStage || !userId) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', userId);
      
      // Determine journey and pregnancy stage
      let journey: 'period' | 'pregnancy';
      let updateData: Record<string, any>;
      
      if (selectedStage === 'period') {
        journey = 'period';
        updateData = {
          journey,
          age: parseInt(age),
          onboardingCompleted: true
        };
      } else {
        journey = 'pregnancy';
        let pregnancyStage: 'planning' | 'pregnant' | 'postpartum';
        
        if (selectedStage === 'planning') {
          pregnancyStage = 'planning';
        } else if (selectedStage === 'pregnant') {
          pregnancyStage = 'pregnant';
        } else {
          pregnancyStage = 'postpartum';
        }
        
        updateData = {
          journey,
          age: parseInt(age),
          onboardingCompleted: true,
          pregnancyStage
        };
      }
      
      await updateDoc(userRef, updateData);
      
      // Redirect based on selection
      if (journey === 'period') {
        router.push('/periods_tracker');
      } else {
        router.push('/pregnancy_tracker');
      }
    } catch (error) {
      console.error('Error saving journey:', error);
      alert('Failed to save your selection. Please try again.');
      setSaving(false);
    }
  };

  const stages = [
    {
      id: 'period',
      icon: '🩸',
      title: 'Track My Period',
      description: 'Monitor your menstrual cycle, predict periods, track symptoms, and understand your body better.',
      tags: ['Cycle Tracking', 'Predictions', 'Symptom Logging'],
      color: 'from-pink-100 to-purple-100',
      borderColor: 'border-pink-300'
    },
    {
      id: 'planning',
      icon: '🌸',
      title: 'Planning Pregnancy',
      description: 'Preparing your body and mind for pregnancy. Track ovulation, get fertility insights, and connect with preconception specialists.',
      tags: ['Fertility Tracking', 'AI Coach', 'OB-GYN Access'],
      color: 'from-green-100 to-teal-100',
      borderColor: 'border-green-300'
    },
    {
      id: 'pregnant',
      icon: '🤰',
      title: 'Currently Pregnant',
      description: 'Track your pregnancy journey week by week. Monitor baby\'s growth, log symptoms, and get personalized care tips.',
      tags: ['Week Tracking', 'Baby Growth', 'Health Tips'],
      color: 'from-blue-100 to-indigo-100',
      borderColor: 'border-blue-300'
    },
    {
      id: 'postpartum',
      icon: '👶',
      title: 'Postpartum Care',
      description: 'Supporting your recovery after birth. Track healing, manage emotions, access breastfeeding help, and PPD screening tools.',
      tags: ['Recovery', 'Mental Health', 'Breastfeeding'],
      color: 'from-yellow-100 to-orange-100',
      borderColor: 'border-yellow-300'
    }
  ];

  const ageRanges = ['18-24', '25-29', '30-34', '35-40', '40+'];

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
    <div className="min-h-screen bg-gradient-to-br from-[#BFA2DB] to-[#9B7EC4] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Branding */}
          <div className="text-white space-y-6 flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-[#BFA2DB]">M</span>
              </div>
              <span className="text-2xl font-bold">MomPulse</span>
            </div>
            
            <h1 className="text-5xl font-bold leading-tight">
              Your journey.<br />
              Your way.<br />
              Supported.
            </h1>
            
            <p className="text-xl text-purple-100">
              Every woman's path to motherhood is beautifully unique. MomPulse adapts to yours.
            </p>

            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <div className="font-semibold">Personalized Cycle Tracking</div>
                  <div className="text-sm text-purple-100">Insights built around your unique body</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <div className="font-semibold">AI Health Assistant</div>
                  <div className="text-sm text-purple-100">Smart answers for every question</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <div className="font-semibold">Community & Expert Support</div>
                  <div className="text-sm text-purple-100">50,000+ women, always beside you</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 pt-8 text-sm">
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔐</span>
                <span>End-to-End Encrypted</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <span>⭐⭐⭐⭐⭐</span>
              <span>4.9 · App Store · 12,000+ reviews</span>
            </div>
          </div>

          {/* Right Side - Selection Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Step 2 of 4</span>
                <button className="text-sm text-[#BFA2DB] hover:underline">Skip for now →</button>
              </div>
              <div className="flex space-x-2 mb-6">
                <div className="h-2 flex-1 bg-[#BFA2DB] rounded-full"></div>
                <div className="h-2 flex-1 bg-[#BFA2DB] rounded-full"></div>
                <div className="h-2 flex-1 bg-gray-200 rounded-full"></div>
                <div className="h-2 flex-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-purple-100 text-[#BFA2DB] rounded-full text-sm mb-4">
                ✨ Personalization · Step 2
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Let's personalize your journey 💜
              </h2>
              <p className="text-gray-600">
                Tell us a little about where you are in your journey so we can tailor everything just for you.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Choose your stage</h3>
              <div className="space-y-3">
                {stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedStage(stage.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedStage === stage.id
                        ? `bg-gradient-to-r ${stage.color} ${stage.borderColor} shadow-md`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">{stage.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-900">{stage.title}</h4>
                          {selectedStage === stage.id && (
                            <div className="w-6 h-6 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white">
                              ✓
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{stage.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {stage.tags.map((tag, index) => (
                            <span key={index} className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                How old are you?
                <span className="text-gray-500 font-normal ml-2">Optional — Helps us personalize insights for you</span>
              </label>
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
                    placeholder="26"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">years old</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Quick pick:</span>
                {ageRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setAge(range.split('-')[0])}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedStage || saving}
              className="w-full py-4 bg-[#BFA2DB] text-white rounded-xl font-semibold hover:bg-[#A88BC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {saving ? 'Saving...' : 'Continue →'}
            </button>

            <p className="text-center text-xs text-gray-500">
              🔒 Your data stays private and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
