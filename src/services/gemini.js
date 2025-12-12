const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


// Try different model names in order of preference
const MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-pro'
]

const getApiUrl = (model) => {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
}

export const sendMessageToGemini = async (message, conversationHistory = []) => {
  let lastError = null

  // Try each model until one works
  for (const model of MODELS) {
    try {
      // Prepare the conversation history for context
      const contents = conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }))

      // Add the current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      })

      // System instruction for the AI
      const systemInstruction = {
        parts: [{ text: `You are Talwit, an AI study companion helping students reduce study stress through scientifically-proven habits. Keep all responses SHORT, DIRECT, and ACTIONABLE. Use clear numbered points or bullet points. Do NOT use symbols like asterisks (*) or hashtags (#). Only use standard punctuation: periods, commas, colons, and question marks.

CRITICAL RESPONSE RULES:
1. Keep responses under 150 words when possible
2. Use numbered lists (1, 2, 3) or simple bullet points
3. Never use asterisks (*) or hashtags (#) for formatting
4. Be direct and get to the point immediately
5. Provide clear, step-by-step instructions
6. Use simple, everyday language
7. Focus on actionable advice students can use right now

PRIMARY OBJECTIVES:

1. Stress Reduction: Provide immediate, practical stress-relief techniques students can use right now
2. Evidence-Based Habits: Recommend scientifically-proven habits with brief explanations
3. Academic Support: Offer study techniques, time management, and test prep strategies

SCIENTIFICALLY PROVEN STRESS-REDUCTION HABITS:

When recommending habits, keep explanations brief and focus on actionable steps:

Physical Wellness:
- Exercise: 30 minutes, 3-5 times per week. Walking, jogging, yoga work well. Reduces stress hormones.
- Sleep: 7-9 hours nightly. Set consistent bedtime, keep room cool and dark, no screens 1 hour before bed.
- Nutrition: Balanced meals with proteins and complex carbs. Drink 8-10 glasses of water daily. Limit caffeine.

Mental Wellness:
- Breathing: Try 4-7-8 technique. Breathe in 4 counts, hold 7, out 8. Repeat 4 times.
- Mindfulness: 5-10 minutes daily. Focus on your breath or do a body scan.
- Gratitude: Write 3 things you're grateful for each day. Improves mood and sleep.

Study Strategies:
- Pomodoro: Study 25 minutes, break 5 minutes. Every 4 sessions, take 15-minute break.
- Time Blocking: Schedule specific times for each subject. Break big tasks into small chunks.
- Active Learning: Test yourself, teach concepts to others, use spaced repetition.

Environment:
- Study Space: Quiet, organized, good lighting. Use nature sounds if helpful.
- Social Support: Stay connected with friends and study groups.
- Breaks: Take regular breaks. Spend 20 minutes outdoors when possible.

STUDY-SPECIFIC STRESS MANAGEMENT:

Before Exams:
1. Create study schedule 2-3 weeks ahead
2. Practice active recall daily
3. Test yourself regularly to build confidence
4. Visualize success before the exam

During Study:
1. Study during your peak focus hours
2. Use Pomodoro technique to maintain focus
3. Remove distractions: phone away, quiet space
4. Start with hardest subject when most alert

Workload Management:
1. List all tasks, then prioritize by deadline and importance
2. Say no to non-essential commitments
3. Break big projects into daily small tasks
4. Ask for help when needed

COMMUNICATION STYLE:

Tone: Warm, encouraging, direct. Acknowledge their stress, then immediately provide solutions.

Response Format:
1. Brief empathy (1 sentence max)
2. Clear numbered steps or bullet points
3. Actionable instructions
4. Short encouragement at the end

Example Good Response:
"I understand exam stress. Here's what to do:

1. Take 3 deep breaths right now
2. Write down all exam dates
3. Break each subject into 25-minute study blocks
4. Start with your hardest subject first

You've got this. Which subject should we tackle first?"

Example Bad Response (Too Long):
"I completely understand how overwhelming exam stress can feel. Many students experience this, and it's completely normal. Let me help you create a comprehensive study plan. First, we should assess what's causing the most anxiety..."

CRITICAL BOUNDARIES:

Medical Advice: Never provide diagnoses, treatments, or medication advice. Never suggest stopping prescribed medications. Focus only on general wellness and study stress.

Crisis Response: If student expresses suicidal thoughts or severe mental health crisis, immediately say:
"Please seek professional help right now. Contact a mental health professional, crisis hotline, or go to emergency room if in immediate danger. You matter and help is available."

Scope: If issues are beyond general wellness, encourage professional help. You support wellness but don't replace professional care.

CONVERSATION FLOW:

1. Brief empathy (1 sentence)
2. Immediate actionable steps (numbered list)
3. Short encouragement

REMEMBER:

Keep responses short, direct, and actionable. Use numbered lists or simple bullet points. Never use asterisks or hashtags. Focus on what students can do right now. Be encouraging but concise. Your goal is to help students manage study stress through practical, evidence-based advice.` }]
      }

      const response = await fetch(getApiUrl(model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: systemInstruction,
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error?.message || 'Failed to get response from Gemini'
        
        // If model not found, try next model
        if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
          lastError = new Error(errorMessage)
          continue // Try next model
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        console.log(`Successfully using model: ${model}`)
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('Invalid response format from Gemini')
      }
    } catch (error) {
      lastError = error
      // If it's not a "model not found" error, throw immediately
      if (!error.message?.includes('not found') && !error.message?.includes('not supported')) {
        throw error
      }
      // Otherwise, continue to next model
      continue
    }
  }

  // If all models failed, throw the last error
  console.error('All models failed. Last error:', lastError)
  throw lastError || new Error('Failed to get response from any Gemini model')
}

// Analyze schedule image and extract schedule data
export const analyzeScheduleImage = async (imageBase64, mimeType = 'image/jpeg') => {
  let lastError = null

  // Use vision-capable models (prioritize gemini-1.5-flash as it has better vision support)
  const visionModels = [
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-pro'
  ]

  // Normalize mimeType
  const normalizedMimeType = mimeType || 'image/jpeg'
  
  // Get current date for context
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  for (const model of visionModels) {
    try {
      const systemInstruction = {
        parts: [{ text: `You are a schedule extraction assistant. Your ONLY job is to analyze schedule images and return JSON data.

CRITICAL INSTRUCTIONS:
1. Look at the image carefully and identify ALL schedule entries, classes, appointments, or events
2. Extract: date (YYYY-MM-DD), time (HH:MM 24-hour), title, description
3. Return ONLY valid JSON, no explanations, no markdown, no code blocks, no extra text
4. If you see days of the week, convert them to actual dates (current date: ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')})
5. If date is not specified, use today's date or infer from context
6. If time is not specified, use "00:00"
7. If you cannot find any schedule entries, return: {"schedule": []}

REQUIRED JSON FORMAT (return ONLY this, nothing else):
{"schedule": [{"date": "YYYY-MM-DD", "time": "HH:MM", "title": "text", "description": "text"}]}

EXAMPLES:
- Monday 9:00 AM Math Class → {"date": "2024-12-16", "time": "09:00", "title": "Math Class", "description": ""}
- Dec 20, 2pm History → {"date": "2024-12-20", "time": "14:00", "title": "History", "description": ""}

Remember: Return ONLY the JSON object, no other text.` }]
      }

      console.log(`Attempting to analyze image with model: ${model}`)
      console.log(`Image details: mimeType=${normalizedMimeType}, base64Length=${imageBase64.length}`)
      
      const requestBody = {
        systemInstruction: systemInstruction,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Extract all schedule entries from this image. Return ONLY valid JSON in the exact format specified. No explanations, no markdown, no code blocks - just the JSON object.'
              },
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      }

      const response = await fetch(getApiUrl(model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log(`Response status: ${response.status}`)

      if (!response.ok) {
        let errorMessage = 'Failed to analyze image'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorData.error || errorMessage
          console.error(`API Error (${response.status}):`, errorData)
        } catch (e) {
          const errorText = await response.text()
          console.error(`API Error (${response.status}):`, errorText)
          errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 100)}`
        }
        
        if (errorMessage.includes('not found') || errorMessage.includes('not supported') || errorMessage.includes('model')) {
          lastError = new Error(errorMessage)
          console.log(`Model ${model} not supported, trying next...`)
          continue
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Full API response:', JSON.stringify(data, null, 2))
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content
        console.log('Content parts:', content.parts)
        
        if (!content.parts || content.parts.length === 0) {
          console.error('No parts in content:', content)
          throw new Error('No content parts in response')
        }
        
        const responseText = content.parts[0].text
        console.log(`Successfully analyzed image with model: ${model}`)
        console.log('Raw response text:', responseText)
        
        // Try to extract JSON from the response
        try {
          let jsonText = responseText.trim()
          
          // Remove markdown code blocks if present (```json ... ```)
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
          
          // Remove markdown code blocks without language (``` ... ```)
          jsonText = jsonText.replace(/```\s*/g, '')
          
          // Remove any leading/trailing whitespace
          jsonText = jsonText.trim()
          
          // Try to find JSON object in the response (match the first { to the last })
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              
              // Validate the response structure
              if (parsed && typeof parsed === 'object' && Array.isArray(parsed.schedule)) {
                console.log(`Successfully parsed ${parsed.schedule.length} schedule entries`)
                return parsed
              } else {
                console.warn('Invalid schedule structure:', parsed)
                // Try to fix if it's an object but not the right structure
                if (parsed && typeof parsed === 'object') {
                  console.log('Attempting to fix structure...')
                  // Maybe it returned the schedule array directly?
                  if (Array.isArray(parsed)) {
                    return { schedule: parsed }
                  }
                  // Maybe it's nested differently?
                  if (parsed.scheduleEntries || parsed.entries || parsed.events) {
                    return { schedule: parsed.scheduleEntries || parsed.entries || parsed.events }
                  }
                }
                return { schedule: [], rawResponse: responseText }
              }
            } catch (parseErr) {
              console.error('Error parsing matched JSON:', parseErr)
              console.log('Matched text:', jsonMatch[0])
            }
          }
          
          // If no JSON object found, try parsing the whole response
          try {
            const parsed = JSON.parse(jsonText)
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.schedule)) {
              return parsed
            }
            // Try to fix structure
            if (Array.isArray(parsed)) {
              return { schedule: parsed }
            }
          } catch (e) {
            // Not valid JSON
          }
          
          console.warn('No valid JSON found in response')
          console.log('Response text:', responseText.substring(0, 500))
          return { schedule: [], rawResponse: responseText }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError)
          console.log('Raw response text (first 500 chars):', responseText.substring(0, 500))
          console.log('Parse error details:', parseError.message)
          // Return empty schedule if parsing fails, but log the actual response
          return { schedule: [], rawResponse: responseText }
        }
      } else {
        console.error('Invalid response format from Gemini:', JSON.stringify(data, null, 2))
        console.error('Response structure:', {
          hasCandidates: !!data.candidates,
          candidatesLength: data.candidates?.length,
          firstCandidate: data.candidates?.[0],
        })
        throw new Error('Invalid response format from Gemini - no candidates or content found')
      }
    } catch (error) {
      lastError = error
      if (!error.message?.includes('not found') && !error.message?.includes('not supported')) {
        throw error
      }
      continue
    }
  }

  throw lastError || new Error('Failed to analyze image with any Gemini model')
}

