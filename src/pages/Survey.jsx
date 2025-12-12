import { useState } from 'react'
import './Survey.css'

const Survey = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const questions = [
    // 1️⃣ User Identity
    {
      id: 'q1',
      category: 'User Identity',
      question: 'What best describes you?',
      type: 'radio',
      options: [
        'High school student',
        'University student',
        "Master's student",
        'Preparing for exams/competitions',
        'Other'
      ]
    },
    // 2️⃣ Study Goals
    {
      id: 'q2',
      category: 'Study Goals',
      question: 'What are your main goals? (Select up to 3)',
      type: 'multi-select',
      maxSelections: 3,
      options: [
        'Improve my grades',
        'Organise my study schedule',
        'Reduce stress and anxiety',
        'Build stronger habits',
        'Stay consistent',
        'Balance school & personal life',
        'Increase productivity'
      ]
    },
    // 3️⃣ Subjects
    {
      id: 'q3',
      category: 'Subjects & Study Areas',
      question: 'What subjects are you studying this semester?',
      type: 'text-list',
      placeholder: 'Enter subjects separated by commas (e.g., Math, Physics, Chemistry)'
    },
    // 4️⃣ Weekly Study Commitment
    {
      id: 'q4',
      category: 'Weekly Study Commitment',
      question: 'How many hours per week would you LIKE to study?',
      type: 'radio',
      options: ['0–5h', '5–10h', '10–15h', '15–20h', '20+']
    },
    // 5️⃣ Time Preferences
    {
      id: 'q5',
      category: 'Time Preferences',
      question: 'When do you prefer to study?',
      type: 'radio',
      options: ['Morning', 'Afternoon', 'Evening', 'No preference']
    },
    // 6️⃣ Stress & Mental Wellbeing
    {
      id: 'q6',
      category: 'Stress & Mental Wellbeing',
      question: 'How stressed do you currently feel?',
      type: 'scale',
      min: 1,
      max: 10,
      labels: { min: 'Very calm', max: 'Very stressed' }
    },
    // 7️⃣ Lifestyle & Healthy Habits
    {
      id: 'q7',
      category: 'Lifestyle & Healthy Habits',
      question: 'How many hours do you sleep on average?',
      type: 'radio',
      options: ['<6', '6–7', '7–8', '8+']
    },
    // 8️⃣ Productivity & Study Style
    {
      id: 'q8',
      category: 'Productivity & Study Style',
      question: 'What is your biggest challenge?',
      type: 'radio',
      options: [
        'Staying consistent',
        'Starting tasks',
        'Managing deadlines',
        'Balancing study & personal life',
        'Staying focused',
        'Avoiding burnout'
      ]
    },
    // 9️⃣ Notifications Preferences
    {
      id: 'q9',
      category: 'Notifications Preferences',
      question: 'What notifications would you like to receive?',
      type: 'multi-select',
      options: [
        'Daily motivation',
        'Study reminders',
        'Break reminders',
        'Habit reminders',
        'Stress check-in',
        'Weekly progress summary'
      ]
    }
  ]

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentStep].id]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(answers)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100
  const canProceed = answers[currentQuestion.id] !== undefined && 
                     answers[currentQuestion.id] !== null &&
                     answers[currentQuestion.id] !== ''

  return (
    <div className="survey-screen">
      {/* Fixed Progress Bar at Top */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {currentStep + 1} / {questions.length}
        </span>
      </div>

      {/* Scrollable Content Area */}
      <div className="survey-scrollable">
        <div className="survey-content">
          {/* Category Badge */}
          <div className="category-badge">
            {currentQuestion.category}
          </div>

          {/* Question */}
          <h1 className="question-text">{currentQuestion.question}</h1>

          {/* Answer Input */}
          <div className="answer-container">
            {currentQuestion.type === 'radio' && (
              <RadioInput
                options={currentQuestion.options}
                value={answers[currentQuestion.id]}
                onChange={handleAnswer}
              />
            )}
            {currentQuestion.type === 'multi-select' && (
              <MultiSelectInput
                options={currentQuestion.options}
                value={answers[currentQuestion.id] || []}
                onChange={handleAnswer}
                maxSelections={currentQuestion.maxSelections}
              />
            )}
            {currentQuestion.type === 'text-list' && (
              <TextListInput
                value={answers[currentQuestion.id] || ''}
                onChange={handleAnswer}
                placeholder={currentQuestion.placeholder}
              />
            )}
            {currentQuestion.type === 'slider' && (
              <SliderInput
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                unit={currentQuestion.unit}
                value={answers[currentQuestion.id] || currentQuestion.min}
                onChange={handleAnswer}
              />
            )}
            {currentQuestion.type === 'scale' && (
              <ScaleInput
                min={currentQuestion.min}
                max={currentQuestion.max}
                labels={currentQuestion.labels}
                value={answers[currentQuestion.id] || currentQuestion.min}
                onChange={handleAnswer}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fixed Navigation Buttons at Bottom */}
      <div className="survey-navigation">
        {currentStep > 0 && (
          <button className="btn-back" onClick={handleBack}>
            Back
          </button>
        )}
        <button 
          className={`btn-next ${canProceed ? 'enabled' : ''}`}
          onClick={handleNext}
          disabled={!canProceed}
        >
          {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  )
}

// Radio Input Component
const RadioInput = ({ options, value, onChange }) => {
  return (
    <div className="radio-group">
      {options.map((option, index) => (
        <button
          key={index}
          className={`radio-option ${value === option ? 'selected' : ''}`}
          onClick={() => onChange(option)}
        >
          <div className="radio-circle">
            {value === option && <div className="radio-dot"></div>}
          </div>
          <span>{option}</span>
        </button>
      ))}
    </div>
  )
}

// Multi-Select Input Component
const MultiSelectInput = ({ options, value, onChange, maxSelections }) => {
  const handleToggle = (option) => {
    const currentValue = value || []
    if (currentValue.includes(option)) {
      onChange(currentValue.filter(item => item !== option))
    } else {
      if (maxSelections && currentValue.length >= maxSelections) {
        return
      }
      onChange([...currentValue, option])
    }
  }

  return (
    <div className="multi-select-group">
      {options.map((option, index) => {
        const isSelected = value && value.includes(option)
        const isDisabled = maxSelections && value && value.length >= maxSelections && !isSelected
        return (
          <button
            key={index}
            className={`multi-select-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => handleToggle(option)}
            disabled={isDisabled}
          >
            <div className="checkbox">
              {isSelected && <span className="checkmark">✓</span>}
            </div>
            <span>{option}</span>
            {maxSelections && isSelected && (
              <span className="selection-count">{value.indexOf(option) + 1}</span>
            )}
          </button>
        )
      })}
      {maxSelections && (
        <p className="selection-hint">
          Select up to {maxSelections} ({value ? value.length : 0} selected)
        </p>
      )}
    </div>
  )
}

// Text List Input Component
const TextListInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="text-input-container">
      <textarea
        className="text-list-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
      <p className="input-hint">Separate subjects with commas</p>
    </div>
  )
}

// Slider Input Component
const SliderInput = ({ min, max, step, unit, value, onChange }) => {
  return (
    <div className="slider-container">
      <div className="slider-value-display">
        <span className="value-number">{value}</span>
        <span className="value-unit">{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-input"
      />
      <div className="slider-labels">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// Scale Input Component
const ScaleInput = ({ min, max, labels, value, onChange }) => {
  const scalePoints = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  
  return (
    <div className="scale-container">
      <div className="scale-labels">
        <span className="scale-label-left">{labels.min}</span>
        <span className="scale-label-right">{labels.max}</span>
      </div>
      <div className="scale-points">
        {scalePoints.map((point) => (
          <button
            key={point}
            className={`scale-point ${value === point ? 'selected' : ''}`}
            onClick={() => onChange(point)}
          >
            {point}
          </button>
        ))}
      </div>
      <div className="scale-selected-value">
        Selected: {value}
      </div>
    </div>
  )
}

export default Survey

