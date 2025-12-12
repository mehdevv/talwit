import { useState, useEffect } from 'react'
import logoImage from '../assets/photo_2025-12-11_21-44-00__2_-removebg-preview.png'
import './SplashScreen.css'

const SplashScreen = ({ onComplete, onLogin }) => {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const coreFeatures = [
    {
      icon: '📋',
      title: 'Survey Onboarding',
      description: 'Personalized setup based on your goals'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Plan',
      description: 'Get a customized study & wellness plan'
    },
    {
      icon: '📊',
      title: 'Smart Dashboard',
      description: 'Track your progress at a glance'
    },
    {
      icon: '📅',
      title: 'Schedule & Tasks',
      description: 'Organize your study sessions'
    },
    {
      icon: '💪',
      title: 'Habit Tracking',
      description: 'Build healthy study habits'
    },
    {
      icon: '💬',
      title: 'AI Chatbot',
      description: 'Get help and motivation anytime'
    }
  ]

  return (
    <div className="splash-screen">
      <div className={`splash-content ${showContent ? 'visible' : ''}`}>
        {/* Upper Visual Section */}
        <div className="splash-visual">
          <div className="visual-background">
            {/* Floating Elements */}
            <div className="floating-elements">
              {coreFeatures.slice(0, 4).map((feature, index) => (
                <div 
                  key={index}
                  className={`floating-element element-${index + 1}`}
                >
                  {feature.icon}
                </div>
              ))}
            </div>
            
            {/* Logo Overlay */}
            <div className="logo-overlay">
              <img 
                src={logoImage} 
                alt="Talwit Logo" 
                className="logo-image"
              />
            </div>
          </div>
        </div>

        {/* Lower Text Section */}
        <div className="splash-text-section">
          <div className="divider-line"></div>
          <h1 className="splash-heading">
            Transform Your Study Journey with AI-Powered Wellness
          </h1>
          <p className="splash-description">
            Welcome to Talwit, where personalized study plans meet wellness tracking for your best academic performance.
          </p>
          
          <div className="splash-buttons">
            <button className="btn-login" onClick={onLogin}>
              Login
            </button>
            <button className="btn-start" onClick={onComplete}>
              Get Started
            </button>
          </div>
          
          {/* Home Indicator (iOS style) */}
          <div className="home-indicator"></div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen

