'use client';

import { useState, useEffect } from "react";
import { auth } from "../../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'help' | 'contact' | 'about'>('help');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const faqs = [
    {
      question: 'How do I enable the calendar?',
      answer: 'To enable the calendar, you need to log your last two period cycles. Go to the Calendar page and click "Enable Calendar" to get started.'
    },
    {
      question: 'How accurate are the predictions?',
      answer: 'Our predictions are based on your logged cycle data. The more cycles you log, the more accurate the predictions become.'
    },
    {
      question: 'Can I track pregnancy with MomPulse?',
      answer: 'Yes! You can switch to Pregnancy Mode from your Cycle Settings in the profile section.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. All your data is encrypted and stored securely in Firebase. Only you have access to your health information.'
    },
    {
      question: 'How do I export my data?',
      answer: 'Go to Data & Export in your profile settings. You can download your data as PDF or CSV format.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl">
            💬
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support</h1>
            <p className="text-sm text-gray-600">We're here whenever you need us</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('help')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'help'
                ? 'bg-[#BFA2DB] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ❓ Help & FAQs
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'contact'
                ? 'bg-[#BFA2DB] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📧 Contact Us
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'about'
                ? 'bg-[#BFA2DB] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ℹ️ About
          </button>
        </div>
      </div>

      {/* Help & FAQs Tab */}
      {activeTab === 'help' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <span className="text-[#BFA2DB] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 text-sm text-gray-600 border-l-4 border-[#BFA2DB] ml-4 mt-2">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Contact Us Tab */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Get in Touch</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <span className="text-2xl">📧</span>
              <div>
                <div className="text-sm font-semibold text-gray-900">Email Support</div>
                <div className="text-sm text-gray-600">support@mompulse.com</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <span className="text-2xl">💬</span>
              <div>
                <div className="text-sm font-semibold text-gray-900">Live Chat</div>
                <div className="text-sm text-gray-600">Available Mon-Fri, 9am-5pm EST</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Send us a message</h4>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
                  placeholder="What can we help you with?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BFA2DB] focus:border-transparent"
                  placeholder="Tell us more about your question or issue..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full px-6 py-3 bg-[#BFA2DB] text-white rounded-lg hover:bg-[#A88BC4] transition-colors font-semibold"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#BFA2DB] to-[#9B7EC4] rounded-2xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              M
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">MomPulse</h3>
            <p className="text-sm text-gray-600">Your Partner from Periods to Parenthood</p>
            <p className="text-xs text-gray-500 mt-2">Version 1.0.1</p>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <p>
              MomPulse is designed to empower women with comprehensive health tracking throughout their journey - from menstrual cycles to pregnancy and beyond.
            </p>
            
            <p>
              Our mission is to provide accurate, personalized insights that help you understand your body better and make informed decisions about your health.
            </p>

            <div className="border-t pt-4 mt-6">
              <h4 className="font-bold text-gray-900 mb-2">Features</h4>
              <ul className="space-y-2">
                <li>✓ Period & cycle tracking with predictions</li>
                <li>✓ Symptom & mood logging</li>
                <li>✓ AI-powered health assistant</li>
                <li>✓ Personalized insights & analytics</li>
                <li>✓ Secure data storage</li>
              </ul>
            </div>

            <div className="border-t pt-4 mt-6">
              <h4 className="font-bold text-gray-900 mb-2">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-[#BFA2DB] hover:underline">Privacy Policy</a>
                <a href="#" className="block text-[#BFA2DB] hover:underline">Terms of Service</a>
                <a href="#" className="block text-[#BFA2DB] hover:underline">Cookie Policy</a>
              </div>
            </div>

            <div className="text-center pt-6 border-t">
              <p className="text-xs text-gray-500">
                © 2026 MomPulse. All rights reserved.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                💜 Made with love for every woman's journey 💜
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
