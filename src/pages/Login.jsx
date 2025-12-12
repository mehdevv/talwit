import { useState } from 'react'
import { registerWithEmail, signInWithEmail, signInWithGoogle } from '../firebase/auth'
import './Login.css'

const Login = ({ onComplete, surveyData }) => {
  const [isLogin, setIsLogin] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!isLogin) {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required'
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = 'Full name must be at least 2 characters'
      }
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      try {
        let result
        if (isLogin) {
          // Sign in
          result = await signInWithEmail(formData.email, formData.password)
        } else {
          // Register
          result = await registerWithEmail(formData.email, formData.password, formData.fullName)
        }

        if (result.error) {
          setErrors({ submit: result.error })
        } else {
          onComplete({
            user: result.user,
            email: result.user.email,
            fullName: result.user.displayName || formData.fullName,
            surveyData: surveyData
          })
        }
      } catch (error) {
        setErrors({ submit: error.message })
      }
    }
  }

  const handleSocialAuth = async (provider) => {
    try {
      if (provider === 'Google') {
        const result = await signInWithGoogle()
        if (result.error) {
          setErrors({ submit: result.error })
        } else {
          onComplete({
            user: result.user,
            email: result.user.email,
            fullName: result.user.displayName || '',
            provider: provider,
            surveyData: surveyData
          })
        }
      }
    } catch (error) {
      setErrors({ submit: error.message })
    }
  }

  return (
    <div className="login-screen">
      <div className="login-content">
        {/* White Card Container */}
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">
              {isLogin ? 'Sign in' : 'Create Account'}
            </h1>
            <p className="login-subtitle">
              {isLogin 
                ? 'Stay updated on your study journey' 
                : 'Join Talwit to get your personalized study plan'}
            </p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Full Name Input (only for register) */}
            {!isLogin && (
              <div className="input-group">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`text-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="Full Name"
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>
            )}

            {/* Email Input */}
            <div className="input-group">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`text-input ${errors.email ? 'error' : ''}`}
                placeholder="Email or Phone"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Password Input */}
            <div className="input-group password-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`text-input ${errors.password ? 'error' : ''}`}
                placeholder="Password"
              />
              {formData.password && (
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password (only for register) */}
            {!isLogin && (
              <div className="input-group password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`text-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm Password"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            )}

            {/* Forgot Password Link (only for login) */}
            {isLogin && (
              <div className="forgot-password">
                <button 
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    // TODO: Implement forgot password
                    console.log('Forgot password')
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

          {/* Error Message */}
          {errors.submit && (
            <div className="error-message" style={{ marginTop: '8px', textAlign: 'center' }}>
              {errors.submit}
            </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="error-message" style={{ marginTop: '8px', textAlign: 'center', marginBottom: '8px' }}>
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn-submit">
              {isLogin ? 'Sign in' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>or</span>
          </div>

          {/* Google Sign In Button */}
          <button 
            className="btn-google"
            onClick={() => handleSocialAuth('Google')}
          >
            <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Toggle Login/Register */}
          <div className="auth-toggle">
            <span>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button 
              type="button"
              className="toggle-link"
              onClick={() => {
                setIsLogin(!isLogin)
                setErrors({})
              setFormData({
                fullName: '',
                email: '',
                password: '',
                confirmPassword: ''
              })
                setShowPassword(false)
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

