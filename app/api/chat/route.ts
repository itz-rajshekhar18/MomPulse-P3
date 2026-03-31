import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      cycleDay, 
      cyclePhase, 
      userName, 
      todayMood, 
      todaySymptoms, 
      todayNotes, 
      daysUntilPeriod, 
      nextPeriodDate,
      vitals 
    } = await request.json();

    // Build symptoms string
    const symptomsStr = todaySymptoms && todaySymptoms.length > 0 
      ? todaySymptoms.join(', ') 
      : 'None logged';

    // Build vitals string
    const vitalsStr = vitals 
      ? `Heart Rate: ${vitals.heartRate || 'N/A'} bpm, Hydration: ${vitals.hydration || 'N/A'}L, Temperature: ${vitals.temperature || 'N/A'}°F, Weight: ${vitals.weight || 'N/A'} lbs`
      : 'No vitals logged';

    // Create context-aware prompt
    const prompt = `You are MomPulse AI, a compassionate and knowledgeable health companion for women. You specialize in menstrual health, pregnancy, and women's wellness.

Current User Context:
- User Name: ${userName || 'User'}
- Cycle Day: ${cycleDay || 'Unknown'}
- Cycle Phase: ${cyclePhase || 'Unknown'}
- Days Until Next Period: ${daysUntilPeriod || 'Unknown'}
- Next Period Date: ${nextPeriodDate || 'Unknown'}
- Today's Mood: ${todayMood || 'Not logged'}
- Today's Symptoms: ${symptomsStr}
- Today's Notes: ${todayNotes || 'None'}
- Today's Vitals: ${vitalsStr}

Guidelines:
- Be warm, supportive, and empathetic
- Provide evidence-based health information
- Use emojis naturally (💜, 🩸, 💚, etc.)
- Keep responses concise but informative (2-3 paragraphs max)
- Always encourage users to consult healthcare providers for serious concerns
- Focus on menstrual health, fertility, pregnancy, and women's wellness topics
- Reference the user's current data when relevant (symptoms, mood, cycle phase, etc.)
- Provide personalized advice based on their cycle phase and symptoms

User Message: ${message}

Please provide a helpful, caring response that takes into account their current health data:`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(data.error?.message || 'Failed to get response from Gemini API');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error. Please try again.';

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
