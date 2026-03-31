'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getUserData, isCalendarEnabled, getPeriodCycleData, getPeriodDatesArray, type PeriodCycleData } from "../../lib/firestore";
import { predictNextPeriod, getCurrentCycleDay, type CyclePrediction } from "../../lib/cyclePrediction";

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [isCalendarEnabledState, setIsCalendarEnabledState] = useState(false);
  const [periodCycleData, setPeriodCycleData] = useState<PeriodCycleData | null>(null);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [cycleDay, setCycleDay] = useState<number>(14);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch User Name
      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        setUserName(userData.data.fullName.split(' ')[0]);
      }

      // Fetch Calendar Data
      const enabled = await isCalendarEnabled(user.uid);
      setIsCalendarEnabledState(enabled);
      
      if (enabled) {
        const cycleDataResult = await getPeriodCycleData(user.uid);
        if (cycleDataResult.success && cycleDataResult.data) {
          setPeriodCycleData(cycleDataResult.data);
          const { startDates, durations } = getPeriodDatesArray(cycleDataResult.data);
          const predictions = predictNextPeriod(startDates, durations);
          
          // Use logic similar to dashboard to ensure we show current/next cycle correctly
          const today = new Date();
          let displayPredictions = predictions;
          if (today > predictions.nextPeriod) {
            const nextCycleStart = new Date(predictions.nextPeriod);
            const nextCyclePredictions = predictNextPeriod([nextCycleStart], [predictions.periodDuration]);
            displayPredictions = nextCyclePredictions;
          }
          
          setPrediction(displayPredictions);
          const currentDay = getCurrentCycleDay(startDates[startDates.length - 1]);
          setCycleDay(currentDay);
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
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
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
                <Link href="/periods_tracker" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Dashboard
                </Link>
                <Link href="/periods_tracker/calendar_page" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Calendar
                </Link>
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg">
                  Insights
                </button>
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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Insights</h1>
            <p className="text-gray-600 mt-1">Understand your body better with personalized trends</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4]">
              30 Days
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              3 Months
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              6 Months
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              📥 Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Cycle Regularity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                ✨
              </div>
              <span className="text-sm text-gray-600">Excellent</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">94%</div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Cycle Regularity</div>
            <div className="text-xs text-gray-500">Consistent over 12 months</div>
            <div className="mt-3 h-1 bg-purple-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#BFA2DB]" style={{ width: '94%' }}></div>
            </div>
          </div>

          {/* Avg Cycle Length */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-2xl">
                🔄
              </div>
              <span className="text-sm text-gray-600">Stable</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{isCalendarEnabledState && prediction ? prediction.avgCycleLength : 28} Days</div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Avg Cycle Length</div>
            <div className="text-xs text-gray-500">Based on your history</div>
            <div className="mt-3 h-1 bg-pink-200 rounded-full overflow-hidden">
              <div className="h-full bg-pink-400" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Avg Period Length */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                💧
              </div>
              <span className="text-sm text-gray-600">Stable</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{isCalendarEnabledState && prediction ? prediction.periodDuration : 5} Days</div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Avg Period Length</div>
            <div className="text-xs text-gray-500">Consistent over time</div>
            <div className="mt-3 h-1 bg-green-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Total Logged */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
              <span className="text-sm text-gray-600">Tracking</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{isCalendarEnabledState && periodCycleData ? '2' : '0'} Cycles</div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Total Logged</div>
            <div className="text-xs text-gray-500">{isCalendarEnabledState && periodCycleData ? `Tracking since ${new Date(periodCycleData.lastPeriodStart2).toLocaleDateString()}` : 'No history yet'}</div>
            <div className="mt-3 h-1 bg-yellow-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Cycle Length Over Time */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cycle Length Over Time</h3>
                <p className="text-sm text-gray-600">Past 8 cycles tracked</p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#BFA2DB] rounded-full"></div>
                  <span className="text-gray-600">On target</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-300 rounded-full"></div>
                  <span className="text-gray-600">Avg</span>
                </div>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className="flex items-end justify-between h-48 space-x-4">
              {[
                { month: 'Sep', days: 28, color: 'bg-[#BFA2DB]' },
                { month: 'Oct', days: 27, color: 'bg-[#BFA2DB]' },
                { month: 'Nov', days: 29, color: 'bg-[#BFA2DB]' },
                { month: 'Dec', days: 32, color: 'bg-red-300' },
                { month: 'Jan', days: 28, color: 'bg-[#BFA2DB]' },
                { month: 'Feb', days: 28, color: 'bg-[#BFA2DB]' },
                { month: 'Mar', days: 29, color: 'bg-[#BFA2DB]' },
                { month: 'Apr', days: 28, color: 'bg-[#BFA2DB]' }
              ].map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-xs text-gray-600 mb-2">{item.days}</span>
                    <div 
                      className={`w-full ${item.color} rounded-t-lg`}
                      style={{ height: `${(item.days / 35) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{item.month}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
              <span className="text-red-400">⚠️</span>
              <span>November cycle was 4 days longer than average — this is normal variation</span>
            </div>
          </div>

          {/* Symptom Frequency */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Symptom Frequency</h3>
              <p className="text-sm text-gray-600">Last month</p>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Cramps', count: 8, color: 'bg-red-200' },
                { name: 'Fatigue', count: 6, color: 'bg-blue-200' },
                { name: 'Headache', count: 4, color: 'bg-purple-200' },
                { name: 'Bloating', count: 3, color: 'bg-yellow-200' },
                { name: 'Insomnia', count: 2, color: 'bg-gray-200' }
              ].map((symptom, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{index + 1}. {symptom.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{symptom.count}×</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${symptom.color}`}
                      style={{ width: `${(symptom.count / 8) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-6 text-[#BFA2DB] text-sm font-semibold hover:text-[#A88BC4]">
              View all symptoms →
            </button>
          </div>
        </div>

        {/* Mood and AI Insights Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Mood vs Cycle Phase */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mood vs Cycle Phase</h3>
                <p className="text-sm text-gray-600">How your mood shifts across your cycle (last 28 days)</p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span>😊</span>
                  <span className="text-gray-600">High</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>😐</span>
                  <span className="text-gray-600">Neutral</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>😢</span>
                  <span className="text-gray-600">Low</span>
                </div>
              </div>
            </div>
            
            {/* Mood Bar Chart */}
            <div className="relative">
              {/* Phase Labels */}
              <div className="flex justify-between mb-2 text-xs font-semibold">
                <span className="text-red-600 text-center">Menstrual<br/>Days 1-{isCalendarEnabledState && prediction ? prediction.periodDuration : 5}</span>
                <span className="text-green-600 text-center">Follicular<br/>Days {isCalendarEnabledState && prediction ? `${prediction.periodDuration + 1}-13` : '6-13'}</span>
                <span className="text-yellow-600 text-center">Ovulation<br/>Day 14</span>
                <span className="text-gray-600 text-center">Luteal<br/>Days 15-{isCalendarEnabledState && prediction ? prediction.avgCycleLength : 28}</span>
              </div>
              
              <div className="flex items-end justify-between h-40 space-x-1">
                {/* Menstrual Phase - Red */}
                {[4, 5, 6, 5, 4].map((height, i) => (
                  <div key={`m${i}`} className="flex-1 bg-red-200 rounded-t" style={{ height: `${height * 15}%` }}></div>
                ))}
                {/* Follicular Phase - Green */}
                {[6, 7, 8, 9, 10, 11, 10, 9].map((height, i) => (
                  <div key={`f${i}`} className="flex-1 bg-green-200 rounded-t" style={{ height: `${height * 10}%` }}></div>
                ))}
                {/* Ovulation - Yellow */}
                {[11, 12, 11].map((height, i) => (
                  <div key={`o${i}`} className="flex-1 bg-yellow-200 rounded-t" style={{ height: `${height * 8}%` }}></div>
                ))}
                {/* Luteal Phase - Gray */}
                {[10, 9, 8, 7, 6, 5, 4, 3, 3, 3, 3, 3, 3, 3].map((height, i) => (
                  <div key={`l${i}`} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${height * 10}%` }}></div>
                ))}
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Day 1</span>
                <span>Day 28</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-linear-to-br from-[#BFA2DB] to-[#9B7EC4] rounded-2xl p-6 shadow-sm text-white">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">✨</span>
              <h3 className="text-xl font-bold">AI Insights</h3>
            </div>
            <p className="text-sm opacity-90 mb-6">Personalized intelligence</p>
            
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span>🔄</span>
                  <span className="font-semibold text-sm">Cycle Consistency</span>
                </div>
                <p className="text-xs opacity-90">
                  Your cycle has been beautifully consistent over the last 6 months. Keep up the healthy habits! 💜
                </p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span>🩸</span>
                  <span className="font-semibold text-sm">Cramp Pattern Detected</span>
                </div>
                <p className="text-xs opacity-90">
                  You tend to experience cramps on Days 1-2 of your period. Consider preemptive pain relief on Day 1 next cycle.
                </p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span>⚡</span>
                  <span className="font-semibold text-sm">Energy Pattern</span>
                </div>
                <p className="text-xs opacity-90">
                  Your energy peaks around Day 10-14. This is great time to schedule important tasks and workouts.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-white/20 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
                💬 Ask MomBot
              </button>
              <button className="flex-1 px-4 py-2 bg-white/20 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
                View all insights
              </button>
            </div>
          </div>
        </div>

        {/* Pattern Detection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">Pattern Detection</h3>
            <p className="text-sm text-gray-600">Recurring patterns detected over your last year</p>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Early Cycle Cramps */}
            <div className="border-2 border-red-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">
                    🩸
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">High Confidence</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Early Cycle Cramps</h4>
              <p className="text-sm text-gray-600 mb-4">
                Cramps usually occur on Days 1-2 of your period. Intensity peaks on Day 1 and gradually reduces.
              </p>
              <div className="flex items-end space-x-1 h-16">
                {[8, 6, 4].map((height, i) => (
                  <div key={i} className="flex-1 bg-red-300 rounded-t" style={{ height: `${height * 10}%` }}></div>
                ))}
              </div>
            </div>

            {/* Luteal Phase Mood Dip */}
            <div className="border-2 border-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                    😢
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">Consistent</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Luteal Phase Mood Dip</h4>
              <p className="text-sm text-gray-600 mb-4">
                You tend to feel low on Days 23-25. You aren't alone — this is common due to hormone shifts.
              </p>
              <div className="flex items-end space-x-1 h-16">
                {[3, 4, 5, 6, 5, 4, 3].map((height, i) => (
                  <div key={i} className="flex-1 bg-purple-300 rounded-t" style={{ height: `${height * 10}%` }}></div>
                ))}
              </div>
            </div>

            {/* Ovulation Energy Surge */}
            <div className="border-2 border-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Real Energy</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Ovulation Energy Surge</h4>
              <p className="text-sm text-gray-600 mb-4">
                Energy and mood peak during Days 10-15. This is a great time to schedule important tasks or gym.
              </p>
              <div className="flex items-end space-x-1 h-16">
                {[6, 7, 8, 9, 10, 9, 8].map((height, i) => (
                  <div key={i} className="flex-1 bg-green-300 rounded-t" style={{ height: `${height * 8}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Predictions and History */}
        <div className="grid grid-cols-2 gap-6">
          {/* Cycle Predictions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cycle Predictions</h3>
                <p className="text-sm text-gray-600">Based on your 12 cycle history</p>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">94% Accuracy</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Next Period */}
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center text-lg">
                    🩸
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">Upcoming</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {isCalendarEnabledState && prediction ? prediction.nextPeriod.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'March 28'}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Next Period</div>
                <div className="text-xs text-gray-600">{isCalendarEnabledState && prediction ? `⏱ in ${Math.max(0, Math.ceil((prediction.nextPeriod.getTime() - new Date().getTime()) / 86400000))} days` : 'in 16 days'}</div>
              </div>

              {/* Ovulation */}
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center text-lg">
                    ☀️
                  </div>
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Ovulation</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {isCalendarEnabledState && prediction ? prediction.ovulationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'March 14'}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Ovulation Day</div>
                <div className="text-xs text-gray-600">{isCalendarEnabledState && prediction ? `⏱ in ${Math.max(0, Math.ceil((prediction.ovulationDate.getTime() - new Date().getTime()) / 86400000))} days` : 'in 2 days'}</div>
              </div>

              {/* Fertile Window */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center text-lg">
                    💚
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">Fertile Window</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {isCalendarEnabledState && prediction ? `${prediction.fertileStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${prediction.fertileEnd.getDate()}` : 'Mar 11–16'}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Fertile Window</div>
                <div className="text-xs text-gray-600">🌱 6 fertile days</div>
              </div>

              {/* Status */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center text-lg">
                    📊
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">Status</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">Regular</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Fertility Trend</div>
                <div className="text-xs text-gray-600">✓ Healthy pattern</div>
              </div>
            </div>
          </div>

          {/* Recent Cycle History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Cycle History</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Last Period 1 */}
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center text-lg">
                    🩸
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">Most Recent</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {isCalendarEnabledState && periodCycleData ? new Date(periodCycleData.lastPeriodStart1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Feb 28'}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Period Start</div>
                <div className="text-xs text-gray-600">Duration: 5 days</div>
              </div>

              {/* Last Period 2 */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-lg">
                    🩸
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Previous</span>
                </div>
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {isCalendarEnabledState && periodCycleData ? new Date(periodCycleData.lastPeriodStart2).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jan 30'}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Period Start</div>
                <div className="text-xs text-gray-600">Duration: 5 days</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
