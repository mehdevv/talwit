import { useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { getUserData, updateHabits } from '../firebase/database'
import './HabitTracking.css'

const HabitTracking = ({ userData }) => {
  const [habits, setHabits] = useState({
    water: { current: 0, goal: 8, unit: 'glasses' },
    steps: { current: 0, goal: 10000, unit: 'steps' },
    sleep: { current: 0, goal: 8, unit: 'hours' },
    exercise: { current: 0, goal: 30, unit: 'minutes' },
    meditation: { current: 0, goal: 10, unit: 'minutes' }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [editingHabit, setEditingHabit] = useState(null)
  const [timeUntilReset, setTimeUntilReset] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [lastResetDate, setLastResetDate] = useState(null)

  useEffect(() => {
    loadHabits()
  }, [userData])

  // Timer to reset habits at midnight
  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0) // Next midnight
      
      const diff = midnight - now
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      return { hours, minutes, seconds }
    }

    const checkAndReset = async () => {
      const now = new Date()
      const today = now.toDateString()
      
      // Check if we need to reset (it's a new day and we haven't reset today)
      if (lastResetDate !== null && lastResetDate !== today) {
        await resetHabits()
        setLastResetDate(today)
      } else if (lastResetDate === null) {
        // Initialize lastResetDate on first load
        setLastResetDate(today)
      }
    }

    const updateTimer = () => {
      const timeUntil = calculateTimeUntilMidnight()
      setTimeUntilReset(timeUntil)
      
      // If we're at or past midnight (hours, minutes, seconds all 0 or negative)
      if (timeUntil.hours === 0 && timeUntil.minutes === 0 && timeUntil.seconds <= 0) {
        checkAndReset()
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [lastResetDate])

  const resetHabits = async () => {
    const user = auth.currentUser || userData?.user
    if (!user?.uid) return

    const resetHabitsData = {
      water: { current: 0, goal: 8, unit: 'glasses' },
      steps: { current: 0, goal: 10000, unit: 'steps' },
      sleep: { current: 0, goal: 8, unit: 'hours' },
      exercise: { current: 0, goal: 30, unit: 'minutes' },
      meditation: { current: 0, goal: 10, unit: 'minutes' }
    }

    setHabits(resetHabitsData)

    try {
      await updateHabits(user.uid, {
        waterCount: 0,
        steps: 0,
        sleepHours: 0,
        exercise: 0,
        meditation: 0
      })
      console.log('Habits reset at midnight')
    } catch (error) {
      console.error('Error resetting habits:', error)
    }
  }

  const loadHabits = async () => {
    const user = auth.currentUser || userData?.user
    if (!user?.uid) {
      setIsLoading(false)
      return
    }

    try {
      const result = await getUserData(user.uid)
      if (result.data?.habits) {
        const savedHabits = result.data.habits
        setHabits({
          water: { current: savedHabits.waterCount || 0, goal: 8, unit: 'glasses' },
          steps: { current: savedHabits.steps || 0, goal: 10000, unit: 'steps' },
          sleep: { current: savedHabits.sleepHours || 0, goal: 8, unit: 'hours' },
          exercise: { current: savedHabits.exercise || 0, goal: 30, unit: 'minutes' },
          meditation: { current: savedHabits.meditation || 0, goal: 10, unit: 'minutes' }
        })
        setStreak(result.data.streak || 0)
      }
    } catch (error) {
      console.error('Error loading habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateHabit = async (habitName, value) => {
    const user = auth.currentUser || userData?.user
    if (!user?.uid) return

    const updatedHabits = {
      ...habits,
      [habitName]: {
        ...habits[habitName],
        current: Math.max(0, value)
      }
    }
    setHabits(updatedHabits)

    try {
      await updateHabits(user.uid, {
        waterCount: updatedHabits.water.current,
        steps: updatedHabits.steps.current,
        sleepHours: updatedHabits.sleep.current,
        exercise: updatedHabits.exercise.current,
        meditation: updatedHabits.meditation.current
      })
    } catch (error) {
      console.error('Error updating habits:', error)
    }
  }

  const incrementHabit = (habitName) => {
    const habit = habits[habitName]
    if (habitName === 'water') {
      updateHabit(habitName, habit.current + 1)
    } else if (habitName === 'steps') {
      updateHabit(habitName, habit.current + 1000)
    } else if (habitName === 'sleep') {
      updateHabit(habitName, habit.current + 0.5)
    } else if (habitName === 'exercise') {
      updateHabit(habitName, habit.current + 5)
    } else if (habitName === 'meditation') {
      updateHabit(habitName, habit.current + 1)
    }
  }

  const decrementHabit = (habitName) => {
    const habit = habits[habitName]
    updateHabit(habitName, habit.current - (habitName === 'water' || habitName === 'meditation' ? 1 : habitName === 'steps' ? 1000 : habitName === 'sleep' ? 0.5 : 5))
  }

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100)
  }

  const renderHabitIcon = (habitName) => {
    const iconColor = 'var(--primary-color)'
    switch (habitName) {
      case 'water':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.69L5 12.19C5 16.19 8 20.19 12 20.19C16 20.19 19 16.19 19 12.19L12 2.69Z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2.69V20.19" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'steps':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 7L9 3M9 3L5 7M9 3V15M11 17L15 21M15 21L19 17M15 21V9" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'sleep':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'exercise':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2"/>
          </svg>
        )
      case 'meditation':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  const habitConfig = {
    water: { name: 'Water', color: '#3B82F6' },
    steps: { name: 'Steps', color: '#10B981' },
    sleep: { name: 'Sleep', color: '#8B5CF6' },
    exercise: { name: 'Exercise', color: '#F59E0B' },
    meditation: { name: 'Meditation', color: '#EC4899' }
  }

  if (isLoading) {
    return (
      <div className="habit-tracking-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: 'var(--text-secondary)',
          fontWeight: 700
        }}>
          Loading habits...
        </div>
      </div>
    )
  }

  return (
    <div className="habit-tracking-page">
      {/* Header */}
      <div className="habits-header">
        <h1>Habits</h1>
      </div>

      {/* Streak Badge and Reset Timer */}
      <div className="streak-section">
        <div className="streak-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.228 9C7.136 9 6.589 9.487 6.589 10.5C6.589 11.513 7.136 12 8.228 12H15.772C16.864 12 17.411 11.513 17.411 10.5C17.411 9.487 16.864 9 15.772 9H8.228Z" fill="var(--primary-color)"/>
            <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20C7.582 20 4 16.418 4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12C20 16.418 16.418 20 12 20Z" fill="var(--primary-color)"/>
          </svg>
          <span className="streak-count">{streak} days streak</span>
        </div>
        <div className="reset-timer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="var(--text-secondary)" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="timer-text">
            Resets in: {String(timeUntilReset.hours).padStart(2, '0')}:{String(timeUntilReset.minutes).padStart(2, '0')}:{String(timeUntilReset.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Habits List */}
      <div className="habits-list-section">
        <div className="habits-list">
          {Object.entries(habits).map(([key, habit]) => {
            const config = habitConfig[key]
            const progress = getProgressPercentage(habit.current, habit.goal)
            const isComplete = habit.current >= habit.goal

            return (
              <div key={key} className={`habit-item ${isComplete ? 'complete' : ''}`}>
                <div className="habit-item-content">
                  <div className="habit-item-left">
                    <div className="habit-icon-wrapper">
                      {renderHabitIcon(key)}
                    </div>
                    <div className="habit-item-info">
                      <div className="habit-item-name">{config.name}</div>
                      <div className="habit-item-progress">
                        {habit.current} / {habit.goal} {habit.unit}
                      </div>
                    </div>
                  </div>
                  <div className="habit-item-right">
                    <div className="progress-circle">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="#F5F5F5"
                          strokeWidth="4"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke={isComplete ? config.color : 'var(--primary-color)'}
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      <div className="progress-percentage">{Math.round(progress)}%</div>
                    </div>
                    <button 
                      className="habit-edit-btn" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingHabit(editingHabit === key ? null : key)
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {editingHabit === key && (
                  <div className="habit-controls">
                    <button 
                      className="control-btn minus"
                      onClick={() => decrementHabit(key)}
                    >
                      −
                    </button>
                    <div className="habit-value">
                      {habit.current} {habit.unit}
                    </div>
                    <button 
                      className="control-btn plus"
                      onClick={() => incrementHabit(key)}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default HabitTracking
