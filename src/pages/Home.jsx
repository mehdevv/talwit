import { useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { getUserData } from '../firebase/database'
import './Home.css'

const Home = ({ surveyData, userData }) => {
  const userName = userData?.fullName || userData?.email?.split('@')[0] || 'User'
  const [stats, setStats] = useState({
    stressLevel: null,
    habitsPercentage: 0,
    todosPercentage: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [userData, surveyData])

  const loadStatistics = async () => {
    const user = auth.currentUser || userData?.user
    if (!user?.uid) {
      setIsLoading(false)
      return
    }

    try {
      const result = await getUserData(user.uid)
      const userDataFromDB = result.data

      // Get stress level from survey data or user preferences
      const stressLevel = surveyData?.q6 || userDataFromDB?.preferences?.stressLevel || null

      // Calculate habits completion percentage
      let habitsPercentage = 0
      if (userDataFromDB?.habits) {
        const habits = userDataFromDB.habits
        const habitGoals = {
          water: { current: habits.waterCount || 0, goal: 8 },
          steps: { current: habits.steps || 0, goal: 10000 },
          sleep: { current: habits.sleepHours || 0, goal: 8 },
          exercise: { current: habits.exercise || 0, goal: 30 },
          meditation: { current: habits.meditation || 0, goal: 10 }
        }
        
        const habitPercentages = Object.values(habitGoals).map(habit => {
          return Math.min((habit.current / habit.goal) * 100, 100)
        })
        habitsPercentage = habitPercentages.reduce((sum, p) => sum + p, 0) / habitPercentages.length
      }

      // Calculate todos completion percentage
      let todosPercentage = 0
      if (userDataFromDB?.tasks?.tasks && Array.isArray(userDataFromDB.tasks.tasks)) {
        const tasks = userDataFromDB.tasks.tasks
        if (tasks.length > 0) {
          const completedTasks = tasks.filter(task => task.completed === true).length
          todosPercentage = (completedTasks / tasks.length) * 100
        }
      }

      setStats({
        stressLevel,
        habitsPercentage: Math.round(habitsPercentage),
        todosPercentage: Math.round(todosPercentage)
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStressLevelLabel = (level) => {
    if (level === null || level === undefined) return 'Not set'
    if (level <= 3) return 'Low'
    if (level <= 6) return 'Moderate'
    if (level <= 8) return 'High'
    return 'Very High'
  }

  const getStressLevelColor = (level) => {
    if (level === null || level === undefined) return '#E0E0E0'
    if (level <= 3) return '#10B981' // Green
    if (level <= 6) return '#F59E0B' // Orange
    if (level <= 8) return '#EF4444' // Red
    return '#DC2626' // Dark red
  }

  const renderStatIcon = (type) => {
    const iconColor = 'var(--primary-color)'
    switch (type) {
      case 'stress':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'habits':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01L8 10.01" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'todos':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="home-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: 'var(--text-secondary)',
          fontWeight: 700
        }}>
          Loading statistics...
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      {/* Top Bar */}
      <div className="home-top-bar">
        <button className="menu-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="profile-picture">
          <div className="avatar-circle">
            {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="greeting-section">
        <div className="greeting-text">Hello {userName}! 👋</div>
        <div className="greeting-subtitle">Your Statistics</div>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-section">
        {/* Stress Level Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              {renderStatIcon('stress')}
            </div>
            <div className="stat-info">
              <div className="stat-label">Stress Level</div>
              <div 
                className="stat-value"
                style={{ color: getStressLevelColor(stats.stressLevel) }}
              >
                {stats.stressLevel !== null ? `${stats.stressLevel}/10` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="stat-footer">
            <div className="stat-description">
              {getStressLevelLabel(stats.stressLevel)}
            </div>
            {stats.stressLevel !== null && (
              <div className="stat-progress-bar">
                <div 
                  className="stat-progress-fill"
                  style={{ 
                    width: `${(stats.stressLevel / 10) * 100}%`,
                    backgroundColor: getStressLevelColor(stats.stressLevel)
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Habits Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              {renderStatIcon('habits')}
            </div>
            <div className="stat-info">
              <div className="stat-label">Habits</div>
              <div className="stat-value" style={{ color: 'var(--primary-color)' }}>
                {stats.habitsPercentage}%
              </div>
            </div>
          </div>
          <div className="stat-footer">
            <div className="stat-description">
              Daily habits completion
            </div>
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill"
                style={{ 
                  width: `${stats.habitsPercentage}%`,
                  backgroundColor: 'var(--primary-color)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Todos Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              {renderStatIcon('todos')}
            </div>
            <div className="stat-info">
              <div className="stat-label">Todos</div>
              <div className="stat-value" style={{ color: 'var(--primary-color)' }}>
                {stats.todosPercentage}%
              </div>
            </div>
          </div>
          <div className="stat-footer">
            <div className="stat-description">
              Tasks completed
            </div>
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill"
                style={{ 
                  width: `${stats.todosPercentage}%`,
                  backgroundColor: 'var(--primary-color)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
