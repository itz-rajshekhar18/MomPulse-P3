'use client';

import { useState, useEffect } from "react";
import { auth } from "../../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DataExportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleExportPDF = () => {
    alert('PDF export feature coming soon!');
  };

  const handleExportCSV = () => {
    alert('CSV export feature coming soon!');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    
    setDeleting(true);
    // TODO: Implement account deletion
    setTimeout(() => {
      setDeleting(false);
      alert('Account deletion feature coming soon!');
      setShowDeleteModal(false);
    }, 1000);
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
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-2xl">
            📊
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data & Export</h1>
            <p className="text-sm text-gray-600">Manage and export your health data</p>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Export Your Data</h3>
        <p className="text-sm text-gray-600 mb-6">Download your health data in various formats</p>
        
        <div className="space-y-3">
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[#BFA2DB] transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
                📄
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-900">Export as PDF</h4>
                <p className="text-xs text-gray-600">Comprehensive health report</p>
              </div>
            </div>
            <span className="text-[#BFA2DB] font-semibold">Download →</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[#BFA2DB] transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                📊
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-900">Export as CSV</h4>
                <p className="text-xs text-gray-600">Raw data for analysis</p>
              </div>
            </div>
            <span className="text-[#BFA2DB] font-semibold">Download →</span>
          </button>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Data Summary</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-[#BFA2DB]">12</div>
            <div className="text-sm text-gray-600">Logged Cycles</div>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">48</div>
            <div className="text-sm text-gray-600">Daily Logs</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">156</div>
            <div className="text-sm text-gray-600">Symptoms Tracked</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">24</div>
            <div className="text-sm text-gray-600">AI Conversations</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-red-200">
        <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type <span className="text-red-600 font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type DELETE"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmation !== 'DELETE'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
