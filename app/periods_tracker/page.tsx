'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../login/login";
import { getUserData, isCalendarEnabled, getPeriodCycleData, getPeriodDatesArray } from "../lib/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { predictNextPeriod, getCurrentCycleDay, type CyclePrediction } from "../lib/cyclePrediction";

interface FlyingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export default function PeriodTrackerPage() {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date()); 
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const [emojiIdCounter, setEmojiIdCounter] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isCalendarEnabledState, setIsCalendarEnabledState] = useState(false);
  const [periodCycleData, setPeriodCycleData] = useState<any>(null);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [cycleDay, setCycleDay] = useState(1);

  const handleMoodClick = (emoji: string) => {
    // Check rate limit
    if (isRateLimited) {
      return;
    }

    // Increment click count
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // If reached 5 clicks, enable rate limit
    if (newClickCount >= 5) {
      setIsRateLimited(true);
      
      // Reset after 1 second
      setTimeout(() => {
        setClickCount(0);
        setIsRateLimited(false);
      }, 1000);
    }

    // Create initial emoji
    const newEmojis: FlyingEmoji[] = [{
      id: emojiIdCounter,
      emoji: emoji,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight
    }];
    
    let currentId = emojiIdCounter + 1;
    
    // Multiply emojis every second for 5 seconds
    const intervals: NodeJS.Timeout[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const interval = setTimeout(() => {
        setFlyingEmojis(prev => {
          const multipliedEmojis = prev.map(e => ({
            ...e,
            id: currentId++
          }));
          return [...prev, ...multipliedEmojis];
        });
      }, i * 1000);
      intervals.push(interval);
    }
    
    // Clear all emojis after 5 seconds
    setTimeout(() => {
      setFlyingEmojis([]);
      intervals.forEach(clearTimeout);
    }, 5000);
    
    setFlyingEmojis(newEmojis);
    setEmojiIdCounter(currentId);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // User not logged in, redirect to login
        router.push('/login');
        return;
      }

      try {
        // Fetch user data from Firestore
        const userData = await getUserData(user.uid);
        
        if (!userData.success || !userData.data) {
          // User data not found
          router.push('/login');
          return;
        }

        // Check if user's journey is 'period'
        if (userData.data.journey !== 'period') {
          // User selected pregnancy journey, redirect to pregnancy tracker
          router.push('/pregnancy_tracker');
          return;
        }

        // Set user name for display
        setUserName(userData.data.fullName || "User");
        
        // Fetch Calendar Data
        const enabled = await isCalendarEnabled(user.uid);
        setIsCalendarEnabledState(enabled);
        
        if (enabled) {
          const cycleDataResult = await getPeriodCycleData(user.uid);
          if (cycleDataResult.success && cycleDataResult.data) {
            setPeriodCycleData(cycleDataResult.data);
            const { startDates, durations } = getPeriodDatesArray(cycleDataResult.data);
            const predictions = predictNextPeriod(startDates, durations);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextPeriod = new Date(predictions.nextPeriod);
            nextPeriod.setHours(0, 0, 0, 0);
            
            let displayPredictions = predictions;
            if (today.getTime() >= nextPeriod.getTime()) {
              const nextNextPeriod = new Date(nextPeriod);
              nextNextPeriod.setTime(nextPeriod.getTime() + (predictions.avgCycleLength * 86400000));
              const nextOvulation = new Date(nextNextPeriod);
              nextOvulation.setTime(nextNextPeriod.getTime() - (14 * 86400000));
              const nextFertileStart = new Date(nextOvulation);
              nextFertileStart.setTime(nextOvulation.getTime() - (5 * 86400000));
              const nextFertileEnd = new Date(nextOvulation);
              nextFertileEnd.setTime(nextOvulation.getTime() + (1 * 86400000));
              
              displayPredictions = {
                ...predictions,
                nextPeriod: nextNextPeriod,
                ovulationDate: nextOvulation,
                fertileStart: nextFertileStart,
                fertileEnd: nextFertileEnd
              };
            }
            setPrediction(displayPredictions);
            const currentDay = getCurrentCycleDay(startDates[startDates.length - 1]);
            setCycleDay(currentDay);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const symptoms = [
    { icon: "💧", name: "Light Flow", time: "2 hours ago", color: "bg-red-100" },
    { icon: "😣", name: "Mild Cramps", time: "5 hours ago", color: "bg-green-100" },
    { icon: "😴", name: "Fatigue", time: "today", color: "bg-yellow-100" }
  ];

  const moods = [
    { emoji: "😊", label: "Happy" },
    { emoji: "✨", label: "Energetic" },
    { emoji: "😌", label: "Calm" },
    { emoji: "😢", label: "Sad" },
    { emoji: "⚡", label: "Energized" },
    { emoji: "🌙", label: "Tired" },
    { emoji: "❌", label: "Irritated" },
    { emoji: "😐", label: "Neutral" }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);

  const isToday = (day: number) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate.toDateString() === today.toDateString();
  };

  const getDayType = (day: number): string => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    
    if (isToday(day)) return 'today';
    
    if (!prediction || !periodCycleData) return 'normal';
    
    // Check if in past period 1 (most recent)
    const period1Start = new Date(periodCycleData.lastPeriodStart1);
    period1Start.setHours(0, 0, 0, 0);
    const period1End = new Date(periodCycleData.lastPeriodEnd1);
    period1End.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() >= period1Start.getTime() && checkDate.getTime() <= period1End.getTime()) {
      return 'period';
    }
    
    // Check if in past period 2
    const period2Start = new Date(periodCycleData.lastPeriodStart2);
    period2Start.setHours(0, 0, 0, 0);
    const period2End = new Date(periodCycleData.lastPeriodEnd2);
    period2End.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() >= period2Start.getTime() && checkDate.getTime() <= period2End.getTime()) {
      return 'period';
    }
    
    // Check if predicted next period
    const nextPeriod = new Date(prediction.nextPeriod);
    nextPeriod.setHours(0, 0, 0, 0);
    const nextPeriodEnd = new Date(nextPeriod);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + prediction.periodDuration - 1);
    
    if (checkDate.getTime() >= nextPeriod.getTime() && checkDate.getTime() <= nextPeriodEnd.getTime()) {
      return 'predicted';
    }
    
    // Check if in fertile window (current cycle)
    const fertileStart = new Date(prediction.fertileStart);
    fertileStart.setHours(0, 0, 0, 0);
    const fertileEnd = new Date(prediction.fertileEnd);
    fertileEnd.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() >= fertileStart.getTime() && checkDate.getTime() <= fertileEnd.getTime()) {
      // Check if ovulation day
      const ovulation = new Date(prediction.ovulationDate);
      ovulation.setHours(0, 0, 0, 0);
      if (checkDate.getTime() === ovulation.getTime()) {
        return 'ovulation';
      }
      return 'fertile';
    }

    // Calculate NEXT cycle's fertile window and ovulation
    const nextNextPeriod = new Date(nextPeriod);
    nextNextPeriod.setTime(nextPeriod.getTime() + (prediction.avgCycleLength * 86400000));
    nextNextPeriod.setHours(0, 0, 0, 0);
    
    const nextOvulation = new Date(nextNextPeriod);
    nextOvulation.setTime(nextNextPeriod.getTime() - (14 * 86400000));
    nextOvulation.setHours(0, 0, 0, 0);
    
    const nextFertileStart = new Date(nextOvulation);
    nextFertileStart.setTime(nextOvulation.getTime() - (5 * 86400000));
    nextFertileStart.setHours(0, 0, 0, 0);
    
    const nextFertileEnd = new Date(nextOvulation);
    nextFertileEnd.setTime(nextOvulation.getTime() + (1 * 86400000));
    nextFertileEnd.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() >= nextFertileStart.getTime() && checkDate.getTime() <= nextFertileEnd.getTime()) {
      if (checkDate.getTime() === nextOvulation.getTime()) return 'ovulation';
      return 'fertile';
    }
    
    const nextNextPeriodEnd = new Date(nextNextPeriod);
    nextNextPeriodEnd.setTime(nextNextPeriod.getTime() + ((prediction.periodDuration - 1) * 86400000));
    nextNextPeriodEnd.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() >= nextNextPeriod.getTime() && checkDate.getTime() <= nextNextPeriodEnd.getTime()) {
      return 'predicted';
    }
    
    return 'normal';
  };

  const getDayClass = (type: string) => {
    switch (type) {
      case 'period': return 'bg-red-300 border-red-400 text-white';
      case 'fertile': return 'bg-green-100 border-green-200';
      case 'ovulation': return 'bg-yellow-200 border-yellow-300';
      case 'today': return 'bg-purple-200 border-purple-400 border-2 ring-2 ring-purple-300';
      case 'predicted': return 'bg-red-100 border-red-200 border-dashed';
      default: return 'bg-white border-gray-200 hover:bg-gray-50';
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden">
      {/* Flying Emojis */}
      <AnimatePresence>
        {flyingEmojis.map((flyingEmoji) => (
          <motion.div
            key={flyingEmoji.id}
            initial={{ 
              x: flyingEmoji.x, 
              y: flyingEmoji.y,
              scale: 0,
              opacity: 1
            }}
            animate={{ 
              x: flyingEmoji.x + (Math.random() - 0.5) * 400,
              y: flyingEmoji.y - Math.random() * 300,
              scale: [0, 1.5, 1],
              opacity: [1, 1, 0],
              rotate: Math.random() * 360
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 2,
              ease: "easeOut"
            }}
            className="fixed text-6xl pointer-events-none z-50"
            style={{ left: 0, top: 0 }}
          >
            {flyingEmoji.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

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
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg">
                  Dashboard
                </button>
                <Link href="/periods_tracker/calendar_page" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Calendar
                </Link>
                <Link href="/periods_tracker/insights_page" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Insights
                </Link>
                <Link href="/periods_tracker/ai_assistant" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  AI Assistant
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {userName}!</h1>
            <p className="text-gray-600">Here's your cycle overview for today</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-6 py-2 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] flex items-center space-x-2">
              <span>+</span>
              <span>Log Symptom</span>
            </button>
            <button className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <span>📅</span>
              <span>Mark Period</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Cycle Status */}
            <div className="bg-white rounded-2xl shadow-sm p-8 relative">
              {/* Blur overlay */}
              {!isCalendarEnabledState && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/30 rounded-2xl z-10 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="mb-4">
                    <svg className="w-20 h-20 mx-auto text-[#BFA2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Enable your status cycle</h3>
                  <p className="text-gray-600 mb-6 text-lg">Start tracking your cycle to get personalized predictions</p>
                  <button onClick={() => router.push('/periods_tracker/calendar_page')} className="px-8 py-3 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors shadow-md text-lg">
                    Enable Status Cycle
                  </button>
                </div>
              </div>
              )}

              {/* Content (blurred) */}
              <div className={!isCalendarEnabledState ? "filter blur-sm pointer-events-none" : ""}>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Current Cycle Status</h2>
                <p className="text-base text-gray-500 mb-8">Track your menstrual cycle and predict your next period</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cycle Day Circle */}
                <div className="flex justify-center items-center">
                  <div className="relative w-80 h-80">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="160" cy="160" r="140" stroke="#E5D4F5" strokeWidth="24" fill="none" />
                      <circle cx="160" cy="160" r="140" stroke="#BFA2DB" strokeWidth="24" fill="none"
                        strokeDasharray="880" strokeDashoffset="220" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg text-gray-500 mb-2">Day</span>
                      <span className="text-8xl font-bold text-gray-900 leading-none">{isCalendarEnabledState ? cycleDay : 14}</span>
                      <span className="text-lg text-gray-500 mt-2">{isCalendarEnabledState && prediction ? (cycleDay <= prediction.periodDuration ? 'Menstrual Phase' : cycleDay <= 14 ? 'Follicular Phase' : cycleDay <= 16 ? 'Ovulation Phase' : 'Luteal Phase') : 'Follicular Phase'}</span>
                    </div>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-4 flex flex-col justify-center">
                  <div className="bg-[#FFE5E5] rounded-xl p-5">
                    <div className="flex items-center space-x-2 text-gray-700 mb-2">
                      <span className="text-xl">📅</span>
                      <span className="font-semibold text-base">Next Period</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">Expected in {isCalendarEnabledState && prediction ? Math.max(0, Math.ceil((prediction.nextPeriod.getTime() - new Date().getTime()) / 86400000)) : 14} days</div>
                    <div className="text-sm text-gray-600">{isCalendarEnabledState && prediction ? prediction.nextPeriod.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'January 28, 2024'}</div>
                  </div>

                  <div className="bg-[#D4F5E5] rounded-xl p-5">
                    <div className="flex items-center space-x-2 text-gray-700 mb-2">
                      <span className="text-xl">💚</span>
                      <span className="font-semibold text-base">Fertile Window</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{isCalendarEnabledState && prediction ? `Days ${prediction.fertileStart.getDate()}-${prediction.fertileEnd.getDate()}` : 'Days 12-16'}</div>
                    <div className="text-sm text-gray-600">{isCalendarEnabledState && prediction ? `${prediction.fertileStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${prediction.fertileEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'High fertility period'}</div>
                  </div>

                  <div className="bg-[#FFF4D4] rounded-xl p-5">
                    <div className="flex items-center space-x-2 text-gray-700 mb-2">
                      <span className="text-xl">📊</span>
                      <span className="font-semibold text-base">Average Cycle</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{isCalendarEnabledState && prediction ? prediction.avgCycleLength : 28} days</div>
                    <div className="text-sm text-gray-600">Regular cycle detected</div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Today's Symptoms & Mood Tracker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Symptoms */}
              <div className="bg-white rounded-2xl shadow-sm p-6 relative">
                {/* Blur overlay */}
                {!isCalendarEnabledState && (
                <div className="absolute inset-0 backdrop-blur-md bg-white/30 rounded-2xl z-10 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="mb-3">
                      <svg className="w-12 h-12 mx-auto text-[#BFA2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Track Symptoms</h4>
                    <p className="text-xs text-gray-600 mb-3">Log your daily symptoms</p>
                    <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors text-sm">
                      Enable
                    </button>
                  </div>
                </div>
                )}

                {/* Content (blurred) */}
                <div className={!isCalendarEnabledState ? "filter blur-sm pointer-events-none" : ""}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Today's Symptoms</h3>
                    <button className="text-gray-400 hover:text-gray-600">+</button>
                  </div>
                  <div className="space-y-3">
                    {symptoms.map((symptom, index) => (
                      <div key={index} className={`${symptom.color} rounded-lg p-3 flex items-center space-x-3`}>
                        <span className="text-2xl">{symptom.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{symptom.name}</div>
                          <div className="text-sm text-gray-600">Logged {symptom.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mood Tracker */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Mood Tracker</h3>
                  <button className="text-gray-400 hover:text-gray-600">↻</button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {moods.map((mood, index) => (
                    <button
                      key={index}
                      onClick={() => handleMoodClick(mood.emoji)}
                      disabled={isRateLimited}
                      className={`w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-gray-200 transition-colors active:scale-95 ${
                        isRateLimited ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={mood.label}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
                {isRateLimited && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Too many clicks! Please wait a moment...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm p-6 relative">
              {/* Blur overlay */}
              {!isCalendarEnabledState && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/30 rounded-2xl z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-[#BFA2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enable your periods calendar</h3>
                  <p className="text-gray-600 mb-4">Track your cycle and get personalized insights</p>
                  <button onClick={() => router.push('/periods_tracker/calendar_page')} className="px-6 py-3 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors shadow-md">
                    Enable Calendar
                  </button>
                </div>
              </div>
              )}

              {/* Calendar content (blurred) */}
              <div className={!isCalendarEnabledState ? "filter blur-sm pointer-events-none" : ""}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex space-x-2">
                    <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-600">&lt;</button>
                    <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-600">&gt;</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayType = getDayType(day);
                    return (
                      <button
                        key={day}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${getDayClass(dayType)}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-300 border border-red-400 rounded"></div>
                    <span className="text-gray-600">Period Days</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                    <span className="text-gray-600">Fertile Window</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
                    <span className="text-gray-600">Ovulation Day</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 border-dashed rounded"></div>
                    <span className="text-gray-600">Predicted Period</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Insights */}
            <div className="bg-white rounded-2xl shadow-sm p-6 relative">
              {/* Blur overlay */}
              {!isCalendarEnabledState && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/30 rounded-2xl z-10 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="mb-3">
                    <svg className="w-12 h-12 mx-auto text-[#BFA2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Get Insights</h4>
                  <p className="text-xs text-gray-600 mb-3">Personalized health tips</p>
                  <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors text-sm">
                    Enable
                  </button>
                </div>
              </div>
              )}

              {/* Content (blurred) */}
              <div className={!isCalendarEnabledState ? "filter blur-sm pointer-events-none" : ""}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Health Insights</h3>
                
                <div className="space-y-3">
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600">✓</span>
                      <span className="font-semibold text-gray-800">Regular Cycle</span>
                    </div>
                    <p className="text-sm text-gray-600">Your cycle has been consistent for the past 3 months</p>
                  </div>

                  <div className="bg-yellow-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-yellow-600">⚠</span>
                      <span className="font-semibold text-gray-800">Hydration Reminder</span>
                    </div>
                    <p className="text-sm text-gray-600">Stay hydrated during your follicular phase to support energy levels</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cycle Statistics */}
            <div className="bg-white rounded-2xl shadow-sm p-6 relative">
              {/* Blur overlay */}
              {!isCalendarEnabledState && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/30 rounded-2xl z-10 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="mb-3">
                    <svg className="w-12 h-12 mx-auto text-[#BFA2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">View Statistics</h4>
                  <p className="text-xs text-gray-600 mb-3">Track your cycle data</p>
                  <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors text-sm">
                    Enable
                  </button>
                </div>
              </div>
              )}

              {/* Content (blurred) */}
              <div className={!isCalendarEnabledState ? "filter blur-sm pointer-events-none" : ""}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Cycle Statistics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average cycle length</span>
                    <span className="font-semibold text-gray-800">{isCalendarEnabledState && prediction ? prediction.avgCycleLength : 28} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Period duration</span>
                    <span className="font-semibold text-gray-800">{isCalendarEnabledState && prediction ? prediction.periodDuration : 5} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cycles tracked</span>
                    <span className="font-semibold text-gray-800">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last period started</span>
                    <span className="font-semibold text-gray-800">{isCalendarEnabledState && periodCycleData ? new Date(periodCycleData.lastPeriodStart1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 1, 2024'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
