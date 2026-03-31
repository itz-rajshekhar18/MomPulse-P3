'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth } from "../../login/login";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  getUserData, 
  getPeriodCycleData, 
  getPeriodDatesArray,
  createConversation,
  getConversations,
  saveMessage,
  getMessages,
  type Conversation as FirestoreConversation,
  type ChatMessage
} from "../../lib/firestore";
import { predictNextPeriod, getCurrentCycleDay } from "../../lib/cyclePrediction";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  cards?: any[];
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  badge?: string;
}

export default function AIAssistantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');
  const [cycleDay, setCycleDay] = useState(1);
  const [cyclePhase, setCyclePhase] = useState('Unknown');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!userId || !selectedConversation) return;
      
      const result = await getMessages(userId, selectedConversation);
      if (result.success) {
        const formattedMessages = result.messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(),
          suggestions: msg.suggestions,
          cards: msg.cards
        }));
        setMessages(formattedMessages);
      }
    };
    
    loadMessages();
  }, [selectedConversation, userId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      
      // Load user data
      const userData = await getUserData(user.uid);
      if (userData.success && userData.data) {
        setUserName(userData.data.fullName.split(' ')[0]); // First name only
      }
      
      // Load cycle data
      const cycleData = await getPeriodCycleData(user.uid);
      if (cycleData.success && cycleData.data) {
        const { startDates } = getPeriodDatesArray(cycleData.data);
        const predictions = predictNextPeriod(startDates, []);
        const currentDay = getCurrentCycleDay(startDates[startDates.length - 1]);
        setCycleDay(currentDay);
        
        // Determine cycle phase
        if (currentDay <= 5) {
          setCyclePhase('Menstrual');
        } else if (currentDay <= 13) {
          setCyclePhase('Follicular');
        } else if (currentDay <= 16) {
          setCyclePhase('Ovulation');
        } else {
          setCyclePhase('Luteal');
        }
      }
      
      // Load conversations
      const convResult = await getConversations(user.uid);
      if (convResult.success) {
        const formattedConvs = convResult.conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          preview: conv.preview,
          timestamp: formatTimestamp(conv.updatedAt),
          badge: conv.badge
        }));
        setConversations(formattedConvs);
        
        // If no conversations, create a welcome one
        if (formattedConvs.length === 0) {
          const welcomeMsg = `Hey ${userName}! 👋 I'm MomPulse AI, your personal health companion. I'm here to support you with anything related to your cycle, pregnancy, or just how you're feeling today.\n\nI can see you're on Cycle Day ${cycleDay} — your ${cyclePhase.toLowerCase()} phase! How are you feeling today? 💜`;
          
          const newConv = await createConversation(user.uid, 'Welcome Chat', welcomeMsg);
          if (newConv.success && newConv.conversationId) {
            setSelectedConversation(newConv.conversationId);
            await saveMessage(user.uid, newConv.conversationId, {
              type: 'ai',
              content: welcomeMsg,
              suggestions: ['Tell me about my cycle', 'What should I eat?', 'Track my symptoms']
            });
            
            // Reload conversations
            const updatedConvs = await getConversations(user.uid);
            if (updatedConvs.success) {
              setConversations(updatedConvs.conversations.map(conv => ({
                id: conv.id,
                title: conv.title,
                preview: conv.preview,
                timestamp: formatTimestamp(conv.updatedAt),
                badge: conv.badge
              })));
            }
          }
        } else {
          // Load the most recent conversation
          setSelectedConversation(formattedConvs[0].id);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !userId) return;

    // If no conversation selected, create one
    let convId = selectedConversation;
    if (!convId) {
      const newConv = await createConversation(userId, inputMessage.substring(0, 30), inputMessage);
      if (newConv.success && newConv.conversationId) {
        convId = newConv.conversationId;
        setSelectedConversation(convId);
        
        // Reload conversations
        const updatedConvs = await getConversations(userId);
        if (updatedConvs.success) {
          setConversations(updatedConvs.conversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            preview: conv.preview,
            timestamp: formatTimestamp(conv.updatedAt),
            badge: conv.badge
          })));
        }
      } else {
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to Firestore
    await saveMessage(userId, convId!, {
      type: 'user',
      content: inputMessage
    });
    
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call Gemini API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          cycleDay,
          cyclePhase
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        suggestions: ['Tell me more', 'What should I do?', 'Is this normal?']
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Save AI message to Firestore
      await saveMessage(userId, convId!, {
        type: 'ai',
        content: data.response,
        suggestions: ['Tell me more', 'What should I do?', 'Is this normal?']
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment. 💜",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to Firestore
      await saveMessage(userId, convId!, {
        type: 'ai',
        content: errorMessage.content
      });
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { icon: '📝', label: 'Log symptoms', color: 'bg-purple-100 text-purple-600' },
    { icon: '🎯', label: 'Track mood', color: 'bg-blue-100 text-blue-600' },
    { icon: '🔴', label: 'Cycle help', color: 'bg-red-100 text-red-600' },
    { icon: '🤰', label: 'Pregnancy tips', color: 'bg-orange-100 text-orange-600' },
    { icon: '💤', label: 'Sleep tips', color: 'bg-indigo-100 text-indigo-600' }
  ];

  const exploreTopics = [
    { icon: '💜', label: 'Cycle Wellness', color: 'text-purple-600' },
    { icon: '🤰', label: 'Pregnancy Guide', color: 'text-green-600' },
    { icon: '💡', label: 'Mood & Mental Health', color: 'text-yellow-600' },
    { icon: '🍎', label: 'Nutrition & Diet', color: 'text-red-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA2DB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
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
                <Link href="/periods_tracker/insights_page" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Insights
                </Link>
                <button className="px-4 py-2 bg-[#BFA2DB] text-white rounded-lg">
                  AI Assistant
                </button>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
              <button className="w-8 h-8 bg-[#BFA2DB] rounded-lg flex items-center justify-center text-white hover:bg-[#A88BC4]">
                +
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BFA2DB]"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">Recent</div>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors mb-1 ${
                    selectedConversation === conv.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">{conv.title}</span>
                      {conv.badge && (
                        <span className="text-xs bg-[#BFA2DB] text-white px-2 py-0.5 rounded-full">
                          {conv.badge}
                        </span>
                      )}
                    </div>
                    <span 
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu click
                      }}
                    >
                      ⋮
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{conv.preview}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{conv.timestamp}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{userName}</div>
                <div className="text-xs text-gray-600">🔴 Cycle Day {cycleDay}</div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">⚙️</button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#BFA2DB] to-[#9B7EC4] rounded-full flex items-center justify-center text-white">
                  🤖
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">MomPulse AI</div>
                  <div className="text-sm text-gray-600">Your personal health companion 💜</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-semibold">
                  🔴 Cycle Day {cycleDay} • {cyclePhase} Phase
                </span>
                <button className="text-gray-400 hover:text-gray-600">🗑️</button>
                <button className="text-gray-400 hover:text-gray-600">⚙️</button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="text-center text-xs text-gray-500">
              Today, March 12
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#BFA2DB] to-[#9B7EC4] rounded-full flex items-center justify-center text-white mr-3 flex-shrink-0">
                    🤖
                  </div>
                )}
                
                <div className={`max-w-2xl ${message.type === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-[#BFA2DB] to-[#9B7EC4] text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className={`text-sm whitespace-pre-line ${message.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      {message.content}
                    </p>
                  </div>

                  {/* AI Message Extras */}
                  {message.type === 'ai' && (
                    <>
                      {/* Cards */}
                      {message.cards && message.cards.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {message.cards.map((card, index) => (
                            <div key={index} className={`bg-${card.color}-50 rounded-xl p-4 border-2 border-${card.color}-100`}>
                              <div className="text-3xl mb-2">{card.icon}</div>
                              <div className="text-sm font-bold text-gray-900 mb-1">{card.title}</div>
                              <div className="text-xs text-gray-600">{card.subtitle}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setInputMessage(suggestion)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white ml-3 flex-shrink-0">
                    S
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-[#BFA2DB] to-[#9B7EC4] rounded-full flex items-center justify-center text-white mr-3 flex-shrink-0">
                  🤖
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={`flex items-center space-x-2 px-3 py-2 ${action.color} rounded-lg text-sm font-medium whitespace-nowrap hover:opacity-80 transition-opacity`}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600">
                🎤
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Cycle Day ${cycleDay} · ${cyclePhase} Phase\nAsk me anything about your health...`}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BFA2DB] pr-20"
                />
                <div className="absolute right-3 top-3 flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">📎</button>
                  <button className="text-gray-400 hover:text-gray-600">😊</button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="w-10 h-10 bg-[#BFA2DB] rounded-full flex items-center justify-center text-white hover:bg-[#A88BC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➤
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Info */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          {/* Your Cycle Today */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Cycle Today</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#BFA2DB"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(14 / 28) * 2 * Math.PI * 56} ${2 * Math.PI * 56}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs text-gray-600">Day</div>
                  <div className="text-3xl font-bold text-[#BFA2DB]">{cycleDay}</div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold mb-2">
                🌟 {cyclePhase} Phase
              </div>
              <p className="text-xs text-gray-600">Peak fertility window</p>
            </div>
          </div>

          {/* At a Glance */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4">At a Glance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🩸</div>
                <div className="text-xs font-semibold text-gray-700">Light</div>
                <div className="text-xs text-gray-500">Flow</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">😌</div>
                <div className="text-xs font-semibold text-gray-700">Calm</div>
                <div className="text-xs text-gray-500">Mood</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">💚</div>
                <div className="text-xs font-semibold text-gray-700">High</div>
                <div className="text-xs text-gray-500">Energy</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">💤</div>
                <div className="text-xs font-semibold text-gray-700">6</div>
                <div className="text-xs text-gray-500">Hours Sleep</div>
              </div>
            </div>
          </div>

          {/* Explore Topics */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Explore Topics</h3>
            <div className="space-y-2">
              {exploreTopics.map((topic, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{topic.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{topic.label}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Safe & Private */}
          <div className="p-6 bg-purple-50 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">🔒</span>
              <h3 className="text-sm font-bold text-gray-900">Safe & Private</h3>
            </div>
            <p className="text-xs text-gray-600">
              All conversations are encrypted. Your health data is never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
