'use client';

import { useState, useEffect } from "react";
import { auth } from "../../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getUserData, getPeriodCycleData } from "../../../lib/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firestore";

export default function CycleSettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [trackingMode, setTrackingMode] = useState<'period' | 'pregnancy'>('period');
  const [averageCycleLength, setAverageCycleLength] = useState('28');
  const [averagePeriodLength, setAveragePeriodLength] = useState('5');
  const [lastPeriodDate, setLastPeriodDate] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUserId(user.uid);
      
      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        setTrackingMode(userData.data.journey);
      }
      
      const cycleData = await getPeriodCycleData(user.uid);
      if (cycleData.success && cycleData.data) {
        setAverageCycleLength(cycleData.data.averageCycleLength?.toString() || '28');
        setLastPeriodDate(cycleData.data.lastPeriodStart1);
        
        const start = new Date(cycleData.data.lastPeriodStart1);
        const end = new Date(cycleData.data.lastPeriodEnd1);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setAveragePeriodLength(duration.toString());
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        journey: trackingMode
      });
      
      alert('Cycle settings updated successfully!');
    } catch (error) {
      console.error('Error updating cycle settings:', error);
      alert('Failed to update cycle settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 text-2xl">
            🔄
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cycle Settings</h1>
            <p className="text-sm text-gray-600">Customize your tracking preferences</p>
          </div>
        </div>
      </div>

      {/* Tracking Mode */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tracking Mode</h3>
        <p className="text-sm text-gray-600 mb-4">Choose what you'd like to track</p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setTrackingMode('period')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-colors ${
              trackingMode === 'period'
                ? 'bg-[#BFA2DB] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🩸 Period Mode
          </button>
          <button
            onClick={() => setTrackingMode('pregnancy')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-colors ${
              trackingMode === 'pregnancy'
                ? 'bg-[#BFA2DB] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🤰 Pregnancy Mode
          </button>
        </div>
      </div>

      {/* Cycle Information */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cycle Information</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Average Cycle Length (days)
            </label>
            <input
              type="number"
              value={averageCycleLength}
              onChange={(e) => setAverageCycleLength(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              placeholder="28"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Calculated from your logged cycles</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Average Period Length (days)
            </label>
            <input
              type="number"
              value={averagePeriodLength}
              onChange={(e) => setAveragePeriodLength(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              placeholder="5"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Calculated from your logged periods</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Period Start Date
            </label>
            <input
              type="date"
              value={lastPeriodDate}
              onChange={(e) => setLastPeriodDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Update this from the calendar page</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
