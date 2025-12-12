import { useState, useRef, useEffect } from 'react'
import { sendMessageToGemini, analyzeScheduleImage } from '../services/gemini'
import { saveChatMessages, getChatMessages, updateSchedule } from '../firebase/database'
import { auth } from '../firebase/config'
import chatbotAvatar from '../assets/photo_2025-12-11_21-44-00-removebg-preview.png'
import './Chatbot.css'

const initialMessage = {
  id: 1,
  text: "Hello! I'm your AI study companion focused on helping you manage study stress and build healthy habits. I can help you with study planning, stress reduction techniques, and scientifically-proven wellness practices. How can I support you today?",
  sender: 'bot'
}

const Chatbot = ({ userData }) => {
  const [messages, setMessages] = useState([initialMessage])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      const user = auth.currentUser || userData?.user
      if (!user?.uid) {
        setIsLoadingHistory(false)
        return
      }

      try {
        const result = await getChatMessages(user.uid)
        if (result.messages && result.messages.length > 0) {
          // If saved messages exist, use them (they should include the initial message if it was saved)
          setMessages(result.messages)
        } else {
          // If no saved messages, start with initial message
          setMessages([initialMessage])
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        setMessages([initialMessage])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [userData])

  // Save messages to Firestore whenever messages change
  useEffect(() => {
    const saveMessages = async () => {
      const user = auth.currentUser || userData?.user
      // Don't save if still loading history or if no user
      if (!user?.uid || isLoadingHistory) {
        return
      }

      // Only save if there are messages beyond just the initial greeting
      // This prevents saving empty chats
      if (messages.length === 0) {
        return
      }

      try {
        // Save all messages including the initial one so history is complete
        await saveChatMessages(user.uid, messages)
        console.log('Chat messages saved successfully')
      } catch (error) {
        console.error('Error saving chat messages:', error)
      }
    }

    // Debounce saving to avoid too many writes (increased to 2 seconds)
    const timeoutId = setTimeout(() => {
      saveMessages()
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [messages, userData, isLoadingHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessageText = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: 'user'
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Prepare conversation history (excluding the initial greeting for context)
      // Filter by id !== 1 OR by checking if it's the initial message text
      const conversationHistory = messages
        .filter(msg => {
          // Exclude initial greeting message
          return msg.id !== 1 && msg.text !== initialMessage.text
        })
        .map(msg => ({
          sender: msg.sender,
          text: msg.text
        }))

      // Get response from Gemini
      const botResponse = await sendMessageToGemini(userMessageText, conversationHistory)

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot'
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again in a moment.",
        sender: 'bot'
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setIsProcessingImage(true)

    try {
      // Check file size (max 20MB for Gemini API)
      if (file.size > 20 * 1024 * 1024) {
        alert('Image is too large. Please use an image smaller than 20MB.')
        setIsProcessingImage(false)
        return
      }

      // Convert image to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const result = reader.result
          if (!result || typeof result !== 'string') {
            throw new Error('Failed to read image file')
          }

          // Extract base64 string and mime type
          const base64Match = result.match(/^data:([^;]+);base64,(.+)$/)
          if (!base64Match) {
            throw new Error('Invalid image format')
          }

          const mimeType = base64Match[1] || file.type || 'image/jpeg'
          const base64String = base64Match[2]

          // Show user message with image preview
          const userMessage = {
            id: Date.now(),
            text: '📷 Schedule image uploaded',
            sender: 'user',
            image: reader.result // Store full data URL for preview
          }
          setMessages(prev => [...prev, userMessage])

          // Add processing message
          const processingMessage = {
            id: Date.now() + 1,
            text: 'Analyzing your schedule image...',
            sender: 'bot'
          }
          setMessages(prev => [...prev, processingMessage])

          // Analyze the image
          console.log('Starting image analysis...', { mimeType, base64Length: base64String.length })
          let scheduleData
          try {
            scheduleData = await analyzeScheduleImage(base64String, mimeType)
            console.log('Analysis result:', scheduleData)
          } catch (error) {
            console.error('Analysis error:', error)
            throw error
          }

          if (scheduleData && scheduleData.schedule && scheduleData.schedule.length > 0) {
            // Save schedule to Firestore
            const user = auth.currentUser || userData?.user
            if (user?.uid) {
              // Convert schedule entries to the format expected by WeeklySchedule
              const scheduleEntries = {}
              scheduleData.schedule.forEach((entry, index) => {
                const dateKey = entry.date
                if (!scheduleEntries[dateKey]) {
                  scheduleEntries[dateKey] = []
                }
                scheduleEntries[dateKey].push({
                  id: Date.now() + index,
                  title: entry.title || 'Untitled',
                  description: entry.description || '',
                  time: entry.time || '00:00',
                  highlighted: false
                })
              })

              // Get existing schedule and merge
              try {
                const { getUserData } = await import('../firebase/database')
                const userDataResult = await getUserData(user.uid)
                const existingSchedule = userDataResult.data?.schedule?.sessions || []

                // Merge new entries with existing ones
                const allEntries = [...existingSchedule]
                scheduleData.schedule.forEach((entry) => {
                  allEntries.push({
                    date: entry.date,
                    time: entry.time,
                    title: entry.title,
                    description: entry.description || ''
                  })
                })

                await updateSchedule(user.uid, allEntries)
              } catch (error) {
                console.error('Error saving schedule:', error)
              }
            }

            // Remove processing message and add success message
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== processingMessage.id)
              return [...filtered, {
                id: Date.now() + 2,
                text: `Great! I've extracted ${scheduleData.schedule.length} schedule entries from your image and added them to your weekly schedule. You can view them in the Schedule tab.`,
                sender: 'bot'
              }]
            })
          } else {
            // Remove processing message and add error message
            const rawResponse = scheduleData?.rawResponse
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== processingMessage.id)
              let errorText = "I couldn't extract any schedule information from the image. Please make sure:\n1. The image is clear and readable\n2. The schedule/timetable is visible\n3. The text is not too small or blurry\n4. Try taking a better photo or uploading a clearer image"
              
              // If we have a raw response, show it for debugging
              if (rawResponse && rawResponse.length < 500) {
                errorText += `\n\nAI Response: ${rawResponse}`
              }
              
              return [...filtered, {
                id: Date.now() + 2,
                text: errorText,
                sender: 'bot'
              }]
            })
          }
        } catch (error) {
          console.error('Error processing image:', error)
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id === processingMessage.id)
            let errorMessage = "I encountered an error while analyzing your schedule image."
            
            if (error.message?.includes('size') || error.message?.includes('large')) {
              errorMessage = "The image is too large. Please use an image smaller than 20MB."
            } else if (error.message?.includes('format') || error.message?.includes('invalid')) {
              errorMessage = "The image format is not supported. Please use JPG, PNG, or WebP format."
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
              errorMessage = "Network error. Please check your internet connection and try again."
            }
            
            return [...filtered, {
              id: Date.now() + 2,
              text: errorMessage + " Please try again with a clearer image.",
              sender: 'bot'
            }]
          })
        } finally {
          setIsProcessingImage(false)
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error reading file:', error)
      setIsProcessingImage(false)
      alert('Error reading image file. Please try again.')
    }
  }

  if (isLoadingHistory) {
    return (
      <div className="chatbot-page">
        <div className="chatbot-header">
          <h1>Study Assistant</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: 'var(--text-secondary)',
          fontWeight: 700
        }}>
          Loading chat history...
        </div>
      </div>
    )
  }

  return (
    <div className="chatbot-page">
      {/* Header */}
      <div className="chatbot-header">
        <h1>Study Assistant</h1>
      </div>

      {/* Messages Container */}
      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.sender === 'bot' && (
              <img 
                src={chatbotAvatar} 
                alt="Chatbot" 
                className="chatbot-avatar"
              />
            )}
            <div className="message-bubble">
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Uploaded schedule" 
                  className="uploaded-image-preview"
                />
              )}
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <img 
              src={chatbotAvatar} 
              alt="Chatbot" 
              className="chatbot-avatar"
            />
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="chatbot-input-form" onSubmit={handleSend}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          disabled={isProcessingImage || isLoading}
        />
        <button
          type="button"
          className="chatbot-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingImage || isLoading}
          title="Upload schedule image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 8L12 3L7 8" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V15" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me anything..."
          className="chatbot-input"
          disabled={isProcessingImage}
        />
        <button type="submit" className="chatbot-send-btn" disabled={isLoading || isProcessingImage}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default Chatbot
