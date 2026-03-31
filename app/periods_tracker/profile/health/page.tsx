'use client';

import { useState, useEffect } from "react";
import { auth } from "../../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function HealthPreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    trackMood: true,
    trackSymptoms: true,
    trackFlow: true,
    trackSleep: false,
    trackWeight: false,
    trackExercise: false,
    trackWater: true,
    trackMedication: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to Firestore
    setTimeout(() => {
      setSaving(false);
      alert('Health preferences updated successfully!');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const preferenceItems = [
    { key: 'trackMood', icon: '😊', label: 'Daily Mood', description: 'Track your emotional wellbeing' },
    { key: 'trackSymptoms', icon: '🤕', label: 'Symptoms', description: 'Log physical symptoms' },
    { key: 'trackFlow', icon: '💧', label: 'Flow Intensity', description: 'Monitor period flow levels' },
    { key: 'trackSleep', icon: '😴', label: 'Sleep Quality', description: 'Track your sleep patterns' },
    { key: 'trackWeight', icon: '⚖️', label: 'Weight', description: 'Monitor weight changes' },
    { key: 'trackExercise', icon: '🏃‍♀️', label: 'Exercise', description: 'Log physical activity' },
    { key: 'trackWater', icon: '💦', label: 'Hydration', description: 'Track water intake' },
    { key: 'trackMedication', icon: '💊', label: 'Medication', description: 'Log medications and supplements' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-2xl">
            💚
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Preferences</h1>
            <p className="text-sm text-gray-600">Choose what you'd like to track daily</p>
          </div>
        </div>
      </div>

      {/* Preferences List */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="space-y-4">
          {preferenceItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#BFA2DB] transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.label}</h3>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle(item.key as keyof typeof preferences)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences[item.key as keyof typeof preferences]
                    ? 'bg-[#BFA2DB]'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    preferences[item.key as keyof typeof preferences]
                      ? 'transform translate-x-6'
                      : ''
                  }`}
                />
              </button>
            </div>
          ))}
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
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
