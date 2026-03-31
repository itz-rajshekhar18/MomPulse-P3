'use client';

import { useState, useEffect } from "react";
import { auth } from "../../../login/login";
import { onAuthStateChanged, updatePassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function PrivacySecurityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('Please log out and log back in before changing your password');
      } else {
        alert('Failed to change password');
      }
    } finally {
      setChangingPassword(false);
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
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl">
            🔒
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy & Security</h1>
            <p className="text-sm text-gray-600">Keep your data safe and private</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Anonymous Mode</h4>
              <p className="text-xs text-gray-600">Hide your name from shared data</p>
            </div>
            <button
              onClick={() => setAnonymousMode(!anonymousMode)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                anonymousMode ? 'bg-[#BFA2DB]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  anonymousMode ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">Change Password</h4>
              <p className="text-xs text-gray-600">Update your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] transition-colors text-sm font-semibold"
            >
              Change
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h4>
              <p className="text-xs text-gray-600">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => setTwoFactorAuth(!twoFactorAuth)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                twoFactorAuth ? 'bg-[#BFA2DB]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  twoFactorAuth ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] transition-colors disabled:opacity-50"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
