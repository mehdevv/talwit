import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import { saveUserData, updateTasks, updateSchedule, updateHabits, updateUserData } from './firebase/database'
import { initializeSampleData } from './utils/sampleData'
import SplashScreen from './pages/SplashScreen'
import Survey from './pages/Survey'
import Login from './pages/Login'
import MainLayout from './pages/MainLayout'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState(null) // null = checking auth, 'splash', 'survey', 'login', 'home'
  const [surveyData, setSurveyData] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const handleSplashComplete = () => {
    setCurrentScreen('survey')
  }

  const handleSplashLogin = () => {
    setCurrentScreen('login')
  }

  const handleSurveyComplete = (data) => {
    setSurveyData(data)
    setCurrentScreen('login')
    // TODO: Send survey data to backend/AI for plan generation
    console.log('Survey completed:', data)
  }

  const handleLoginComplete = async (data) => {
    try {
      const user = data.user || auth.currentUser
      
      if (user && data.surveyData) {
        // Save user data and survey responses to Firestore
        const saveResult = await saveUserData(
          user.uid,
          {
            email: data.email,
            fullName: data.fullName || user.displayName || '',
            displayName: user.displayName || data.fullName || ''
          },
          data.surveyData
        )
        
        if (saveResult.error) {
          console.error('Error saving user data:', saveResult.error)
        } else {
          console.log('User data saved successfully')
          // Initialize sample data for new users
          await initializeSampleData(
            user.uid,
            updateUserData,
            updateTasks,
            updateSchedule,
            updateHabits
          )
        }
      }
      
      setUserData({
        ...data,
        uid: user?.uid
      })
      setCurrentScreen('home')
    } catch (error) {
      console.error('Error in handleLoginComplete:', error)
      // Still proceed to home screen even if save fails
      setUserData(data)
      setCurrentScreen('home')
    }
  }

  const handleLogout = () => {
    setUserData(null)
    setSurveyData(null)
    setCurrentScreen('login')
  }

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsCheckingAuth(true)
      
      if (user) {
        // User is logged in - go directly to home
        if (currentScreen === null) {
          // First load - fetch user data and go to home
          try {
            const { getUserData } = await import('./firebase/database')
            const result = await getUserData(user.uid)
            
            // Always go to home if user is logged in
            setUserData({
              user: user,
              uid: user.uid,
              email: user.email,
              fullName: result.data?.fullName || user.displayName || '',
              displayName: user.displayName || result.data?.fullName || ''
            })
            
            // Set survey data if available, but don't require it
            if (result.data && result.data.preferences) {
              setSurveyData(result.data.preferences)
            }
            
            // Initialize sample data if user doesn't have any
            await initializeSampleData(
              user.uid,
              updateUserData,
              updateTasks,
              updateSchedule,
              updateHabits
            )
            
            setCurrentScreen('home')
          } catch (error) {
            console.error('Error fetching user data:', error)
            // If error, still show home with basic user data
            setUserData({
              user: user,
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || '',
              displayName: user.displayName || ''
            })
            setCurrentScreen('home')
          }
        } else if (currentScreen === 'home') {
          // User is signed in and on home screen - update user data
          setUserData(prev => ({
            ...prev,
            user: user,
            uid: user.uid,
            email: user.email,
            fullName: prev?.fullName || user.displayName || '',
            displayName: user.displayName || prev?.fullName || ''
          }))
        }
      } else {
        // User is not logged in
        if (currentScreen === null) {
          // First load - show splash screen
          setCurrentScreen('splash')
        } else if (currentScreen === 'home') {
          // User signed out while on home - redirect to login
          setCurrentScreen('login')
          setUserData(null)
        }
      }
      
      setIsCheckingAuth(false)
    })

    return () => unsubscribe()
  }, [currentScreen])

  // Show loading state while checking auth
  if (isCheckingAuth || currentScreen === null) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #E8F4F8 0%, #F0F9FA 100%)'
        }}>
          <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700 }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} onLogin={handleSplashLogin} />
      )}
      {currentScreen === 'survey' && (
        <Survey onComplete={handleSurveyComplete} />
      )}
      {currentScreen === 'login' && (
        <Login onComplete={handleLoginComplete} surveyData={surveyData} />
      )}
      {currentScreen === 'home' && (
        <MainLayout surveyData={surveyData} userData={userData} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
