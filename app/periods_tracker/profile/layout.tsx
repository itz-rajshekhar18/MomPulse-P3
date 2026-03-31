'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../login/login";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getUserData } from "../../lib/firestore";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        setUserName(userData.data.fullName);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { id: 'personal', icon: '👤', label: 'Personal Info', href: '/periods_tracker/profile/personal' },
    { id: 'cycle', icon: '🔄', label: 'Cycle Settings', href: '/periods_tracker/profile/cycle' },
    { id: 'health', icon: '💚', label: 'Health Prefs', href: '/periods_tracker/profile/health' },
    { id: 'privacy', icon: '🔒', label: 'Privacy & Security', href: '/periods_tracker/profile/privacy' },
    { id: 'app', icon: '⚙️', label: 'App Settings', href: '/periods_tracker/profile/app' },
    { id: 'data', icon: '📊', label: 'Data & Export', href: '/periods_tracker/profile/data' },
    { id: 'support', icon: '💬', label: 'Support', href: '/periods_tracker/profile/support' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
            <Link href="/periods_tracker" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#BFA2DB] rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-xl font-bold text-gray-800">MomPulse</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-800">🔔</button>
              <div className="w-10 h-10 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white font-bold">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#BFA2DB] to-[#9B7EC4] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                  {userName.charAt(0)}
                </div>
                <h2 className="text-lg font-bold text-gray-900">Hi, {userName.split(' ')[0]}! 💜</h2>
                <p className="text-sm text-gray-600">Your health, your journey</p>
              </div>

              {/* Menu */}
              <nav className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2">Menu</div>
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-purple-50 text-[#BFA2DB]' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                >
                  <span className="text-lg">🚪</span>
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
