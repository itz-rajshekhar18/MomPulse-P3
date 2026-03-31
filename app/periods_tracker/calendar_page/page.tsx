'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { enableCalendar, isCalendarEnabled, getPeriodCycleData, getPeriodDatesArray, saveDailyLog, getDailyLog, formatDateForLog, getUserData } from "../../lib/firestore";
import { predictNextPeriod, formatDate, daysUntil, getCurrentCycleDay, type CyclePrediction } from "../../lib/cyclePrediction";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedMood, setSelectedMood] = useState('');
  const [notes, setNotes] = useState("");
  const [isCalendarEnabledState, setIsCalendarEnabledState] = useState(false);
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [cycleDay, setCycleDay] = useState(1);
  const [formData, setFormData] = useState({
    lastPeriodStart1: '',
    lastPeriodEnd1: '',
    lastPeriodStart2: '',
    lastPeriodEnd2: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [periodCycleData, setPeriodCycleData] = useState<any>(null);
  
  // Vitals and symptoms state
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vitalsData, setVitalsData] = useState({
    heartRate: '',
    hydration: '',
    temperature: '',
    weight: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Debug logging - must be at top level with other hooks
  useEffect(() => {
    if (periodCycleData && prediction && currentMonth) {
      const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      console.log('=== Calendar Debug Info ===');
      console.log('Current Month Display:', monthName);
      console.log('Period 1 Start:', periodCycleData.lastPeriodStart1);
      console.log('Period 1 End:', periodCycleData.lastPeriodEnd1);
      console.log('Period 2 Start:', periodCycleData.lastPeriodStart2);
      console.log('Period 2 End:', periodCycleData.lastPeriodEnd2);
      console.log('--- Current Cycle Predictions ---');
      console.log('Next Period:', prediction.nextPeriod.toDateString());
      console.log('Fertile Start:', prediction.fertileStart.toDateString());
      console.log('Fertile End:', prediction.fertileEnd.toDateString());
      console.log('Ovulation:', prediction.ovulationDate.toDateString());
      console.log('Avg Cycle Length:', prediction.avgCycleLength, 'days');
      console.log('Period Duration:', prediction.periodDuration, 'days');
      
      // Calculate next cycle predictions
      const nextPeriod = new Date(prediction.nextPeriod);
      nextPeriod.setHours(0, 0, 0, 0);
      const nextNextPeriod = new Date(nextPeriod);
      nextNextPeriod.setTime(nextPeriod.getTime() + (prediction.avgCycleLength * 24 * 60 * 60 * 1000));
      
      const nextOvulation = new Date(nextNextPeriod);
      nextOvulation.setTime(nextNextPeriod.getTime() - (14 * 24 * 60 * 60 * 1000));
      
      const nextFertileStart = new Date(nextOvulation);
      nextFertileStart.setTime(nextOvulation.getTime() - (5 * 24 * 60 * 60 * 1000));
      
      const nextFertileEnd = new Date(nextOvulation);
      nextFertileEnd.setTime(nextOvulation.getTime() + (1 * 24 * 60 * 60 * 1000));
      
      console.log('--- Next Cycle Predictions (after predicted period) ---');
      console.log('Next Next Period:', nextNextPeriod.toDateString());
      console.log('Next Fertile Start:', nextFertileStart.toDateString());
      console.log('Next Fertile End:', nextFertileEnd.toDateString());
      console.log('Next Ovulation:', nextOvulation.toDateString());
      
      // Test specific dates in current month
      console.log(`--- Testing ${monthName} Days ---`);
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const testDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        testDate.setHours(0, 0, 0, 0);
        
        // Check current cycle fertile window
        if (testDate.getTime() >= new Date(prediction.fertileStart).setHours(0,0,0,0) && 
            testDate.getTime() <= new Date(prediction.fertileEnd).setHours(0,0,0,0)) {
          console.log(`Day ${day}: Current cycle fertile/ovulation`);
        }
        
        // Check next cycle fertile window
        if (testDate.getTime() >= nextFertileStart.getTime() && testDate.getTime() <= nextFertileEnd.getTime()) {
          console.log(`Day ${day}: Next cycle fertile/ovulation`);
        }
        
        // Check predicted period
        const nextPeriodEnd = new Date(nextPeriod);
        nextPeriodEnd.setTime(nextPeriod.getTime() + ((prediction.periodDuration - 1) * 24 * 60 * 60 * 1000));
        if (testDate.getTime() >= nextPeriod.getTime() && testDate.getTime() <= nextPeriodEnd.getTime()) {
          console.log(`Day ${day}: Predicted period`);
        }
      }
    }
  }, [currentMonth, periodCycleData, prediction]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.uid);
      
      // Get user data
      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        setUserName(userData.data.fullName);
      }
      
      // Check if calendar is enabled
      const enabled = await isCalendarEnabled(user.uid);
      setIsCalendarEnabledState(enabled);
      
      // If enabled, fetch cycle data and make predictions
      if (enabled) {
        const cycleDataResult = await getPeriodCycleData(user.uid);
        if (cycleDataResult.success && cycleDataResult.data) {
          setPeriodCycleData(cycleDataResult.data);
          const { startDates, durations } = getPeriodDatesArray(cycleDataResult.data);
          const predictions = predictNextPeriod(startDates, durations);
          
          // Smart cycle detection: Show the most relevant cycle based on today's date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const nextPeriod = new Date(predictions.nextPeriod);
          nextPeriod.setHours(0, 0, 0, 0);
          
          const nextPeriodEnd = new Date(nextPeriod);
          nextPeriodEnd.setTime(nextPeriod.getTime() + ((predictions.periodDuration - 1) * 24 * 60 * 60 * 1000));
          
          // Check if we're past the predicted period (or currently in it)
          // If yes, calculate and show the NEXT cycle
          let displayPredictions = predictions;
          
          if (today.getTime() >= nextPeriod.getTime()) {
            // We're at or past the predicted period, show NEXT cycle
            const nextNextPeriod = new Date(nextPeriod);
            nextNextPeriod.setTime(nextPeriod.getTime() + (predictions.avgCycleLength * 24 * 60 * 60 * 1000));
            
            const nextOvulation = new Date(nextNextPeriod);
            nextOvulation.setTime(nextNextPeriod.getTime() - (14 * 24 * 60 * 60 * 1000));
            
            const nextFertileStart = new Date(nextOvulation);
            nextFertileStart.setTime(nextOvulation.getTime() - (5 * 24 * 60 * 60 * 1000));
            
            const nextFertileEnd = new Date(nextOvulation);
            nextFertileEnd.setTime(nextOvulation.getTime() + (1 * 24 * 60 * 60 * 1000));
            
            displayPredictions = {
              ...predictions,
              nextPeriod: nextNextPeriod,
              ovulationDate: nextOvulation,
              fertileStart: nextFertileStart,
              fertileEnd: nextFertileEnd
            };
            
            console.log('Showing NEXT cycle (current/predicted period has started)');
          } else {
            // We're before the predicted period, show current cycle predictions
            console.log('Showing CURRENT cycle predictions');
          }
          
          setPrediction(displayPredictions);
          
          // Keep calendar on current month (today)
          
          // Calculate current cycle day
          const currentDay = getCurrentCycleDay(startDates[startDates.length - 1]);
          setCycleDay(currentDay);
          
          console.log('Display Predictions:', displayPredictions);
          console.log('Current cycle day:', currentDay);
          console.log('Period data:', cycleDataResult.data);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleEnableCalendar = () => {
    setShowEnableForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Validate all fields are filled
    if (!formData.lastPeriodStart1 || !formData.lastPeriodEnd1 || 
        !formData.lastPeriodStart2 || !formData.lastPeriodEnd2) {
      setFormError('Please fill in all fields');
      setFormLoading(false);
      return;
    }

    // Validate dates are in correct order
    const start1 = new Date(formData.lastPeriodStart1);
    const end1 = new Date(formData.lastPeriodEnd1);
    const start2 = new Date(formData.lastPeriodStart2);
    const end2 = new Date(formData.lastPeriodEnd2);

    if (end1 <= start1) {
      setFormError('Period 1: End date must be after start date');
      setFormLoading(false);
      return;
    }

    if (end2 <= start2) {
      setFormError('Period 2: End date must be after start date');
      setFormLoading(false);
      return;
    }

    if (start1 <= start2) {
      setFormError('Most recent period should be Period 1');
      setFormLoading(false);
      return;
    }

    if (!userId) {
      setFormError('User not authenticated');
      setFormLoading(false);
      return;
    }

    // Save to Firestore
    const result = await enableCalendar(userId, formData);
    
    if (result.success) {
      setIsCalendarEnabledState(true);
      setShowEnableForm(false);
      
      // Fetch and calculate predictions
      const cycleDataResult = await getPeriodCycleData(userId);
      if (cycleDataResult.success && cycleDataResult.data) {
        setPeriodCycleData(cycleDataResult.data);
        const { startDates, durations } = getPeriodDatesArray(cycleDataResult.data);
        const predictions = predictNextPeriod(startDates, durations);
        
        // Smart cycle detection: Show the most relevant cycle based on today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextPeriod = new Date(predictions.nextPeriod);
        nextPeriod.setHours(0, 0, 0, 0);
        
        // Check if we're past the predicted period
        let displayPredictions = predictions;
        
        if (today.getTime() >= nextPeriod.getTime()) {
          // We're at or past the predicted period, show NEXT cycle
          const nextNextPeriod = new Date(nextPeriod);
          nextNextPeriod.setTime(nextPeriod.getTime() + (predictions.avgCycleLength * 24 * 60 * 60 * 1000));
          
          const nextOvulation = new Date(nextNextPeriod);
          nextOvulation.setTime(nextNextPeriod.getTime() - (14 * 24 * 60 * 60 * 1000));
          
          const nextFertileStart = new Date(nextOvulation);
          nextFertileStart.setTime(nextOvulation.getTime() - (5 * 24 * 60 * 60 * 1000));
          
          const nextFertileEnd = new Date(nextOvulation);
          nextFertileEnd.setTime(nextOvulation.getTime() + (1 * 24 * 60 * 60 * 1000));
          
          displayPredictions = {
            ...predictions,
            nextPeriod: nextNextPeriod,
            ovulationDate: nextOvulation,
            fertileStart: nextFertileStart,
            fertileEnd: nextFertileEnd
          };
        }
        
        setPrediction(displayPredictions);
        
        // Keep calendar on current month (today)
        
        const currentDay = getCurrentCycleDay(startDates[startDates.length - 1]);
        setCycleDay(currentDay);
      }
      
      console.log('Calendar enabled with average cycle:', result.averageCycleLength, 'days');
    } else {
      setFormError(result.message);
    }
    
    setFormLoading(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load daily log data when selected date changes
  useEffect(() => {
    const loadDailyLog = async () => {
      if (!userId || !isCalendarEnabledState) return;
      
      const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
      const dateStr = formatDateForLog(selectedDateObj);
      
      const result = await getDailyLog(userId, dateStr);
      if (result.success && result.data) {
        setSelectedMood(result.data.mood || '');
        setNotes(result.data.notes || '');
        setSelectedSymptoms(result.data.symptoms || []);
        if (result.data.vitals) {
          setVitalsData({
            heartRate: result.data.vitals.heartRate?.toString() || '',
            hydration: result.data.vitals.hydration?.toString() || '',
            temperature: result.data.vitals.temperature?.toString() || '',
            weight: result.data.vitals.weight?.toString() || ''
          });
        }
      } else {
        // Reset to empty if no data
        setSelectedMood('');
        setNotes('');
        setSelectedSymptoms([]);
        setVitalsData({ heartRate: '', hydration: '', temperature: '', weight: '' });
      }
    };
    
    loadDailyLog();
  }, [selectedDate, currentMonth, userId, isCalendarEnabledState]);

  // Save mood
  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    if (!userId) return;
    
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const dateStr = formatDateForLog(selectedDateObj);
    
    await saveDailyLog(userId, dateStr, { mood });
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!userId) return;
    
    setSaveLoading(true);
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const dateStr = formatDateForLog(selectedDateObj);
    
    const result = await saveDailyLog(userId, dateStr, { notes });
    
    if (result.success) {
      setSaveMessage('Notes saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    }
    setSaveLoading(false);
  };

  // Handle vitals modal
  const handleOpenVitalsModal = () => {
    setShowVitalsModal(true);
  };

  const handleSaveVitals = async () => {
    if (!userId) return;
    
    setSaveLoading(true);
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const dateStr = formatDateForLog(selectedDateObj);
    
    // Build vitals object, only including fields that have values
    const vitals: any = {};
    if (vitalsData.heartRate) vitals.heartRate = parseInt(vitalsData.heartRate);
    if (vitalsData.hydration) vitals.hydration = parseInt(vitalsData.hydration);
    if (vitalsData.temperature) vitals.temperature = parseFloat(vitalsData.temperature);
    if (vitalsData.weight) vitals.weight = parseFloat(vitalsData.weight);
    
    // Only save if at least one vital is provided
    if (Object.keys(vitals).length === 0) {
      setSaveMessage('Please enter at least one vital');
      setTimeout(() => setSaveMessage(''), 2000);
      setSaveLoading(false);
      return;
    }
    
    const result = await saveDailyLog(userId, dateStr, { vitals });
    
    if (result.success) {
      setSaveMessage('Vitals saved!');
      setTimeout(() => setSaveMessage(''), 2000);
      setShowVitalsModal(false);
    }
    setSaveLoading(false);
  };

  // Handle symptoms modal
  const handleOpenSymptomsModal = () => {
    setShowSymptomsModal(true);
  };

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSaveSymptoms = async () => {
    if (!userId) return;
    
    setSaveLoading(true);
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const dateStr = formatDateForLog(selectedDateObj);
    
    const result = await saveDailyLog(userId, dateStr, { symptoms: selectedSymptoms });
    
    if (result.success) {
      setSaveMessage('Symptoms saved!');
      setTimeout(() => setSaveMessage(''), 2000);
      setShowSymptomsModal(false);
    }
    setSaveLoading(false);
  };

  const availableSymptoms = [
    { name: 'Cramps', emoji: '🩸', color: 'red' },
    { name: 'Fatigue', emoji: '😴', color: 'blue' },
    { name: 'Headache', emoji: '🤕', color: 'purple' },
    { name: 'Bloating', emoji: '💨', color: 'yellow' },
    { name: 'Mood Swings', emoji: '😢', color: 'pink' },
    { name: 'Acne', emoji: '🔴', color: 'orange' },
    { name: 'Tender Breasts', emoji: '💗', color: 'pink' },
    { name: 'Back Pain', emoji: '🔙', color: 'red' },
    { name: 'Nausea', emoji: '🤢', color: 'green' },
    { name: 'Light Flow', emoji: '💧', color: 'blue' },
    { name: 'Heavy Flow', emoji: '🌊', color: 'red' },
    { name: 'Spotting', emoji: '🩸', color: 'pink' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  
  // Helper to check if a date is today
  const isToday = (day: number) => {
    const checkDate = new Date(currentYear, currentMonthIndex, day);
    return checkDate.toDateString() === today.toDateString();
  };
  
  // Helper to determine day type based on predictions
  const getDayType = (day: number): string => {
    const checkDate = new Date(currentYear, currentMonthIndex, day);
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
    
    // Check if in fertile window (current cycle - before next period)
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
    
    // Calculate NEXT cycle's fertile window and ovulation (after the predicted period)
    // This is for the cycle that comes AFTER the next predicted period
    const nextNextPeriod = new Date(nextPeriod);
    nextNextPeriod.setTime(nextPeriod.getTime() + (prediction.avgCycleLength * 24 * 60 * 60 * 1000));
    nextNextPeriod.setHours(0, 0, 0, 0);
    
    // Ovulation is 14 days before the next next period
    const nextOvulation = new Date(nextNextPeriod);
    nextOvulation.setTime(nextNextPeriod.getTime() - (14 * 24 * 60 * 60 * 1000));
    nextOvulation.setHours(0, 0, 0, 0);
    
    // Fertile window: 5 days before ovulation to 1 day after
    const nextFertileStart = new Date(nextOvulation);
    nextFertileStart.setTime(nextOvulation.getTime() - (5 * 24 * 60 * 60 * 1000));
    nextFertileStart.setHours(0, 0, 0, 0);
    
    const nextFertileEnd = new Date(nextOvulation);
    nextFertileEnd.setTime(nextOvulation.getTime() + (1 * 24 * 60 * 60 * 1000));
    nextFertileEnd.setHours(0, 0, 0, 0);
    
    // Check if in next cycle's fertile window
    if (checkDate.getTime() >= nextFertileStart.getTime() && checkDate.getTime() <= nextFertileEnd.getTime()) {
      if (checkDate.getTime() === nextOvulation.getTime()) {
        return 'ovulation';
      }
      return 'fertile';
    }
    
    // Check if in next next predicted period
    const nextNextPeriodEnd = new Date(nextNextPeriod);
    nextNextPeriodEnd.setTime(nextNextPeriod.getTime() + ((prediction.periodDuration - 1) * 24 * 60 * 60 * 1000));
    nextNextPeriodEnd.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() >= nextNextPeriod.getTime() && checkDate.getTime() <= nextNextPeriodEnd.getTime()) {
      return 'predicted';
    }
    
    return 'normal';
  };

  // Generate calendar days
  type CalendarDay = {
    day: number;
    type: string;
    dots: number;
    star?: boolean;
    label?: string;
  };
  
  const calendarDays: CalendarDay[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dayType = getDayType(i);
    calendarDays.push({
      day: i,
      type: dayType,
      dots: 0,
      star: dayType === 'ovulation',
      label: isToday(i) ? 'Today' : undefined
    });
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const getDayClass = (type: string) => {
    switch (type) {
      case 'period': return 'bg-red-300 border-red-400 text-white';
      case 'fertile': return 'bg-green-100 border-green-200';
      case 'ovulation': return 'bg-yellow-200 border-yellow-300';
      case 'today': return 'bg-purple-200 border-purple-400 border-2 ring-2 ring-purple-300';
      case 'predicted': return 'bg-red-100 border-red-200 border-dashed';
      default: return 'bg-white border-gray-200';
    }
  };

  const moods = [
    { emoji: '😊', value: 'happy', color: 'bg-green-200' },
    { emoji: '😌', value: 'calm', color: 'bg-purple-200' },
    { emoji: '☁️', value: 'cloudy', color: 'bg-gray-200' },
    { emoji: '⚡', value: 'energetic', color: 'bg-yellow-200' },
    { emoji: '🔥', value: 'hot', color: 'bg-orange-200' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative">
      {/* Enable Calendar Modal */}
      {showEnableForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Enable Period Calendar</h2>
              <button 
                onClick={() => setShowEnableForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              To provide accurate predictions, please enter your last two period cycles. This helps us understand your cycle pattern.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Most Recent Period */}
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>📅</span>
                  <span>Most Recent Period (Period 1)</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.lastPeriodStart1}
                      onChange={(e) => handleFormChange('lastPeriodStart1', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.lastPeriodEnd1}
                      onChange={(e) => handleFormChange('lastPeriodEnd1', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Previous Period */}
              <div className="bg-pink-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>📅</span>
                  <span>Previous Period (Period 2)</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.lastPeriodStart2}
                      onChange={(e) => handleFormChange('lastPeriodStart2', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.lastPeriodEnd2}
                      onChange={(e) => handleFormChange('lastPeriodEnd2', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">ℹ️</span>
                  <div>
                    <p className="font-semibold mb-1">Why do we need this?</p>
                    <p>Your last two cycles help us calculate your average cycle length and predict your next period, fertile window, and ovulation date more accurately.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEnableForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-6 py-3 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Enabling...' : 'Enable Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blur Overlay when calendar is not enabled */}
      {!isCalendarEnabledState && !showEnableForm && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-40 flex items-center justify-center">
          <div className="text-center px-6 max-w-md">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-[#BFA2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Enable Your Period Calendar</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Track your cycle, predict your next period, and get personalized insights by enabling your calendar.
            </p>
            <button
              onClick={handleEnableCalendar}
              className="px-8 py-4 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors shadow-lg text-lg"
            >
              Enable Calendar Now
            </button>
          </div>
        </div>
      )}

      {/* Main Content (blurred when not enabled) */}
      <div className={!isCalendarEnabledState ? 'filter blur-sm pointer-events-none' : ''}>
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
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg">
                  Calendar
                </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4">
                  <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-600">&lt;</button>
                  <h1 className="text-3xl font-bold text-gray-900">{monthName}</h1>
                  <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-600">&gt;</button>
                </div>
                {prediction && <p className="text-sm text-gray-500 mt-1">Tracking your cycle</p>}
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg font-semibold">
                  Period Mode
                </button>
                <button 
                  onClick={handleOpenSymptomsModal}
                  className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] transition-colors"
                >
                  + Log Symptom
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-red-400 mb-2">📅</div>
                <div className="text-sm text-gray-600 mb-1">Upcoming</div>
                <div className="text-xl font-bold text-gray-900">
                  {prediction ? formatDate(prediction.nextPeriod) : '--'}
                </div>
                <div className="text-xs text-gray-500">Next Period</div>
                <div className="text-sm text-orange-500 mt-1">
                  {prediction ? `⏱ in ${daysUntil(prediction.nextPeriod)} days` : 'Enable calendar'}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="text-yellow-400 mb-2">☀️</div>
                <div className="text-sm text-gray-600 mb-1">Peak Day</div>
                <div className="text-xl font-bold text-gray-900">
                  {prediction ? formatDate(prediction.ovulationDate) : '--'}
                </div>
                <div className="text-xs text-gray-500">Ovulation Date</div>
                <div className="text-sm text-orange-500 mt-1">
                  {prediction ? `⏱ in ${daysUntil(prediction.ovulationDate)} days` : 'Enable calendar'}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-green-400 mb-2">💚</div>
                <div className="text-sm text-gray-600 mb-1">Active</div>
                <div className="text-xl font-bold text-gray-900">
                  {prediction ? `${formatDate(prediction.fertileStart).split(',')[0]} - ${formatDate(prediction.fertileEnd).split(',')[0]}` : '--'}
                </div>
                <div className="text-xs text-gray-500">Fertile Window</div>
                <div className="text-sm text-green-600 mt-1">
                  {prediction ? `✓ ${Math.ceil((prediction.fertileEnd.getTime() - prediction.fertileStart.getTime()) / (1000 * 60 * 60 * 24)) + 1} fertile days` : 'Enable calendar'}
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-purple-400 mb-2">📊</div>
                <div className="text-sm text-gray-600 mb-1">Regular</div>
                <div className="text-xl font-bold text-gray-900">
                  {prediction ? prediction.avgCycleLength : '--'} Days
                </div>
                <div className="text-xs text-gray-500">Avg Cycle Length</div>
                <div className="text-sm text-purple-600 mt-1">
                  {prediction ? `⏱ ${prediction.periodDuration} day period` : 'Enable calendar'}
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {/* Calendar Header with Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous Month"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-lg font-bold text-gray-800">{monthName}</h3>
                
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Next Month"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {calendarDays.map((item) => (
                  <button
                    key={item.day}
                    onClick={() => setSelectedDate(item.day)}
                    className={`aspect-square rounded-xl border-2 p-2 relative hover:shadow-md transition-all ${getDayClass(item.type)} ${
                      selectedDate === item.day ? 'ring-2 ring-[#BFA2DB]' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-800">{item.day}</div>
                    {item.label && (
                      <div className="text-xs text-purple-600 font-medium">{item.label}</div>
                    )}
                    {item.star && (
                      <div className="absolute top-1 right-1 text-yellow-400">⭐</div>
                    )}
                    {item.dots > 0 && (
                      <div className="flex justify-center space-x-1 mt-1">
                        {Array.from({ length: item.dots }).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-300 rounded"></div>
                  <span className="text-gray-600">Period Days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Fertile Window</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                  <span className="text-gray-600">Ovulation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-200 rounded"></div>
                  <span className="text-gray-600">Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-dashed border-red-200 rounded"></div>
                  <span className="text-gray-600">Predicted Period</span>
                </div>
              </div>
            </div>

            {/* AI Health Insight */}
            <div className="bg-gradient-to-r from-[#BFA2DB] to-[#D4B5E8] rounded-2xl p-6 text-white">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✨</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">AI Health Insight</h3>
                  <p className="text-sm opacity-90 mb-1">Personalized for Cycle Day {cycleDay}</p>
                  <p className="text-sm mb-4">
                    {prediction ? (
                      `You're entering your fertile window. Ovulation is in ${daysUntil(prediction.ovulationDate)} days — energy levels may peak. Stay hydrated and embrace the momentum! 💜`
                    ) : (
                      'Enable your calendar to get personalized insights based on your cycle.'
                    )}
                  </p>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">
                      Learn more
                    </button>
                    <button className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">
                      💬 Ask MomBot
                    </button>
                  </div>
                  {periodCycleData && (
                    <div className="mt-4 text-xs opacity-75">
                      <p>📅 Navigate months to see your past periods and future predictions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cycle Predictions */}
            {prediction && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cycle Predictions</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-red-400">🩸</span>
                      <span className="font-semibold text-gray-700">Next Period</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {formatDate(prediction.nextPeriod).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-600">
                      in {daysUntil(prediction.nextPeriod)} days · {prediction.periodDuration} day duration
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-400">💚</span>
                      <span className="font-semibold text-gray-700">Fertile Window</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatDate(prediction.fertileStart).split(',')[0]} – {formatDate(prediction.fertileEnd).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-600">
                      Peak fertility on {formatDate(prediction.ovulationDate).split(',')[0]}
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-yellow-400">☀️</span>
                      <span className="font-semibold text-gray-700">Ovulation Day</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {formatDate(prediction.ovulationDate).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-600">
                      {daysUntil(prediction.ovulationDate) > 0 
                        ? `in ${daysUntil(prediction.ovulationDate)} days` 
                        : daysUntil(prediction.ovulationDate) === 0 
                        ? 'Today!' 
                        : `${Math.abs(daysUntil(prediction.ovulationDate))} days ago`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Day Details */}
          <div className="space-y-6">
            {/* Selected Day Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long' })} {selectedDate}, {currentYear}
                </h2>
                {getDayType(selectedDate) !== 'normal' && getDayType(selectedDate) !== 'today' && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    getDayType(selectedDate) === 'period' ? 'bg-red-100 text-red-700' :
                    getDayType(selectedDate) === 'fertile' ? 'bg-green-100 text-green-700' :
                    getDayType(selectedDate) === 'ovulation' ? 'bg-yellow-100 text-yellow-700' :
                    getDayType(selectedDate) === 'predicted' ? 'bg-red-50 text-red-600' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getDayType(selectedDate) === 'period' ? 'Period Day' :
                     getDayType(selectedDate) === 'fertile' ? 'Fertile Phase' :
                     getDayType(selectedDate) === 'ovulation' ? 'Ovulation Day' :
                     getDayType(selectedDate) === 'predicted' ? 'Predicted Period' :
                     'Normal Day'}
                  </span>
                )}
              </div>
              {prediction && <p className="text-sm text-gray-600 mb-4">Cycle Day {cycleDay}</p>}

              {/* Symptoms */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Symptoms</h3>
                  <button className="text-gray-400 hover:text-gray-600">ℹ️</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptom) => {
                    const symptomData = availableSymptoms.find(s => s.name === symptom);
                    return (
                      <span 
                        key={symptom}
                        className={`px-3 py-1 bg-${symptomData?.color || 'gray'}-100 text-${symptomData?.color || 'gray'}-700 rounded-full text-sm flex items-center space-x-1`}
                      >
                        <span>{symptomData?.emoji || '•'}</span>
                        <span>{symptom}</span>
                      </span>
                    );
                  })}
                  <button 
                    onClick={handleOpenSymptomsModal}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
                  >
                    + Add Symptom
                  </button>
                </div>
                {selectedSymptoms.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">Track symptoms like cramps, fatigue, headaches, etc.</p>
                )}
              </div>

              {/* Mood */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Mood</h3>
                  <button className="text-gray-400 hover:text-gray-600">ℹ️</button>
                </div>
                <div className="flex space-x-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                        selectedMood === mood.value ? `${mood.color} ring-2 ring-[#BFA2DB]` : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Notes</h3>
                  <button 
                    onClick={handleSaveNotes}
                    disabled={saveLoading}
                    className="text-[#BFA2DB] hover:text-[#A88BC4] text-sm font-semibold"
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about how you're feeling today..."
                  className="w-full p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                  rows={3}
                />
                {saveMessage && (
                  <p className="text-xs text-green-600 mt-1">{saveMessage}</p>
                )}
              </div>

              {/* Vitals Logged */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Vitals</h3>
                {(vitalsData.heartRate || vitalsData.hydration || vitalsData.temperature || vitalsData.weight) ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {vitalsData.heartRate && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-purple-400 mb-1">💓</div>
                        <div className="text-2xl font-bold text-gray-900">{vitalsData.heartRate} bpm</div>
                        <div className="text-xs text-gray-600">Heart Rate</div>
                      </div>
                    )}
                    {vitalsData.hydration && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-blue-400 mb-1">💧</div>
                        <div className="text-2xl font-bold text-gray-900">{vitalsData.hydration} glasses</div>
                        <div className="text-xs text-gray-600">Hydration</div>
                      </div>
                    )}
                    {vitalsData.temperature && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="text-red-400 mb-1">🌡️</div>
                        <div className="text-2xl font-bold text-gray-900">{vitalsData.temperature}°F</div>
                        <div className="text-xs text-gray-600">Temperature</div>
                      </div>
                    )}
                    {vitalsData.weight && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-green-400 mb-1">⚖️</div>
                        <div className="text-2xl font-bold text-gray-900">{vitalsData.weight} lbs</div>
                        <div className="text-xs text-gray-600">Weight</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">No vitals logged yet</p>
                  </div>
                )}
                <button 
                  onClick={handleOpenVitalsModal}
                  className="w-full py-3 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors"
                >
                  + Log Vitals
                </button>
              </div>
            </div>

            {/* Cycle Phase Overview */}
            {prediction && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Cycle Phase Overview</h3>
                
                <div className="relative h-3 bg-gray-200 rounded-full mb-4 overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-red-400" style={{ width: `${(prediction.periodDuration / prediction.avgCycleLength) * 100}%` }}></div>
                  <div className="absolute top-0 h-full bg-green-300" style={{ 
                    left: `${(prediction.periodDuration / prediction.avgCycleLength) * 100}%`,
                    width: `${((prediction.avgCycleLength - prediction.periodDuration - prediction.lutealPhaseLength - 1) / prediction.avgCycleLength) * 100}%` 
                  }}></div>
                  <div className="absolute top-0 h-full bg-yellow-300" style={{ 
                    left: `${((prediction.avgCycleLength - prediction.lutealPhaseLength - 1) / prediction.avgCycleLength) * 100}%`,
                    width: `${(1 / prediction.avgCycleLength) * 100}%` 
                  }}></div>
                  <div className="absolute right-0 top-0 h-full bg-gray-300" style={{ 
                    width: `${(prediction.lutealPhaseLength / prediction.avgCycleLength) * 100}%` 
                  }}></div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-red-600">Menstrual</div>
                      <div className="text-gray-600">Days 1-{prediction.periodDuration}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">Follicular</div>
                      <div className="text-gray-600">Days {prediction.periodDuration + 1}-{prediction.avgCycleLength - prediction.lutealPhaseLength - 1}</div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-yellow-600">Ovulation</div>
                      <div className="text-gray-600">Day {prediction.avgCycleLength - prediction.lutealPhaseLength}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-600">Luteal</div>
                      <div className="text-gray-600">Days {prediction.avgCycleLength - prediction.lutealPhaseLength + 1}-{prediction.avgCycleLength}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>

      {/* Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Log Vitals</h2>
              <button 
                onClick={() => setShowVitalsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💓 Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={vitalsData.heartRate}
                  onChange={(e) => setVitalsData(prev => ({ ...prev, heartRate: e.target.value }))}
                  placeholder="72"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💧 Hydration (glasses)
                </label>
                <input
                  type="number"
                  value={vitalsData.hydration}
                  onChange={(e) => setVitalsData(prev => ({ ...prev, hydration: e.target.value }))}
                  placeholder="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌡️ Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalsData.temperature}
                  onChange={(e) => setVitalsData(prev => ({ ...prev, temperature: e.target.value }))}
                  placeholder="98.6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚖️ Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalsData.weight}
                  onChange={(e) => setVitalsData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="150"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVitals}
                disabled={saveLoading}
                className="flex-1 px-6 py-3 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors disabled:opacity-50"
              >
                {saveLoading ? 'Saving...' : 'Save Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symptoms Modal */}
      {showSymptomsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Symptoms</h2>
              <button 
                onClick={() => setShowSymptomsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Select all symptoms you're experiencing today
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableSymptoms.map((symptom) => (
                <button
                  key={symptom.name}
                  onClick={() => handleToggleSymptom(symptom.name)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedSymptoms.includes(symptom.name)
                      ? `border-[#BFA2DB] bg-purple-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{symptom.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">{symptom.name}</div>
                </button>
              ))}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowSymptomsModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSymptoms}
                disabled={saveLoading}
                className="flex-1 px-6 py-3 bg-[#BFA2DB] text-white rounded-lg font-semibold hover:bg-[#A88BC4] transition-colors disabled:opacity-50"
              >
                {saveLoading ? 'Saving...' : 'Save Symptoms'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}