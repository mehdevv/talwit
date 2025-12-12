// Sample data generator for the app

export const generateSampleTasks = () => {
  return [
    {
      id: Date.now() + 1,
      title: 'Complete Math homework',
      description: 'Finish chapter 5 exercises',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 2,
      title: 'Review Chemistry notes',
      description: 'Study for upcoming quiz',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 3,
      title: 'Write History essay',
      description: '500 words on World War II',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 4,
      title: 'Prepare Physics presentation',
      description: 'Create slides for Newton\'s laws',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 5,
      title: 'Read Biology chapter 8',
      description: 'Take notes on cell structure',
      completed: false,
      createdAt: new Date().toISOString()
    }
  ]
}

export const generateSampleSchedule = () => {
  const today = new Date()
  const sessions = []
  
  // Generate schedule for the next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]
    
    // Monday, Wednesday, Friday - Morning classes
    if (date.getDay() === 1 || date.getDay() === 3 || date.getDay() === 5) {
      sessions.push({
        date: dateKey,
        time: '09:00',
        title: 'Mathematics',
        description: 'Algebra and Calculus',
        highlighted: i === 0
      })
      sessions.push({
        date: dateKey,
        time: '11:00',
        title: 'Physics',
        description: 'Mechanics and Dynamics',
        highlighted: false
      })
    }
    
    // Tuesday, Thursday - Afternoon classes
    if (date.getDay() === 2 || date.getDay() === 4) {
      sessions.push({
        date: dateKey,
        time: '14:00',
        title: 'Chemistry',
        description: 'Organic Chemistry Lab',
        highlighted: false
      })
      sessions.push({
        date: dateKey,
        time: '16:00',
        title: 'Biology',
        description: 'Cell Biology Lecture',
        highlighted: false
      })
    }
    
    // Wednesday - Evening study session
    if (date.getDay() === 3) {
      sessions.push({
        date: dateKey,
        time: '19:00',
        title: 'Study Session',
        description: 'Review week\'s material',
        highlighted: false
      })
    }
  }
  
  return sessions
}

export const generateSampleHabits = () => {
  return {
    waterCount: 6,
    steps: 7500,
    sleepHours: 7.5,
    exercise: 25,
    meditation: 8
  }
}

export const generateSampleChatMessages = () => {
  return [
    {
      id: 1,
      text: "Hello! I'm your AI study companion focused on helping you manage study stress and build healthy habits. I can help you with study planning, stress reduction techniques, and scientifically-proven wellness practices. How can I support you today?",
      sender: 'bot'
    },
    {
      id: Date.now() - 1000,
      text: 'Hi! I\'m feeling stressed about my upcoming exams. Can you help?',
      sender: 'user'
    },
    {
      id: Date.now() - 500,
      text: 'I understand exam stress can be overwhelming. Here are three immediate steps to help:\n\n1. Take 3 deep breaths right now\n2. Break your study material into 25-minute blocks\n3. Create a study schedule for the next week\n\nStart with your hardest subject first when you\'re most alert. Which subject should we tackle first?',
      sender: 'bot'
    }
  ]
}

export const generateSampleStreak = () => {
  return 5 // 5 days streak
}

export const generateSampleStressLevel = () => {
  return 6 // Moderate stress level
}

// Initialize sample data for a user
export const initializeSampleData = async (userId, updateUserData, updateTasks, updateSchedule, updateHabits) => {
  try {
    // Check if user already has data
    const { getUserData } = await import('../firebase/database')
    const result = await getUserData(userId)
    
    if (result.data) {
      // Check if user already has tasks
      const hasTasks = result.data.tasks?.tasks && result.data.tasks.tasks.length > 0
      const hasSchedule = result.data.schedule?.sessions && result.data.schedule.sessions.length > 0
      const hasHabits = result.data.habits && (
        result.data.habits.waterCount > 0 ||
        result.data.habits.steps > 0 ||
        result.data.habits.sleepHours > 0
      )
      
      // Only add sample data if user doesn't have any
      if (!hasTasks) {
        const sampleTasks = generateSampleTasks()
        await updateTasks(userId, sampleTasks)
      }
      
      if (!hasSchedule) {
        const sampleSchedule = generateSampleSchedule()
        await updateSchedule(userId, sampleSchedule)
      }
      
      if (!hasHabits) {
        const sampleHabits = generateSampleHabits()
        await updateHabits(userId, sampleHabits)
      }
      
      // Update streak if not set
      if (!result.data.streak || result.data.streak === 0) {
        await updateUserData(userId, { streak: generateSampleStreak() })
      }
      
      // Update stress level if not set
      if (!result.data.preferences?.stressLevel) {
        const currentPreferences = result.data.preferences || {}
        await updateUserData(userId, {
          preferences: {
            ...currentPreferences,
            stressLevel: generateSampleStressLevel()
          }
        })
      }
    }
  } catch (error) {
    console.error('Error initializing sample data:', error)
  }
}

