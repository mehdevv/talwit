import { useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { getUserData, updateSchedule } from '../firebase/database'
import './WeeklySchedule.css'

const WeeklySchedule = ({ userData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddTask, setShowAddTask] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    time: '',
    date: ''
  })

  const [scheduleEntries, setScheduleEntries] = useState({})

  // Load schedule from Firestore
  useEffect(() => {
    loadSchedule()
  }, [userData])

  const loadSchedule = async () => {
    const user = auth.currentUser || userData?.user
    if (!user?.uid) {
      setIsLoading(false)
      return
    }

    try {
      const result = await getUserData(user.uid)
      const sessions = result.data?.schedule?.sessions || []
      
      // Convert sessions array to scheduleEntries object format
      const entries = {}
      sessions.forEach((session) => {
        const dateKey = session.date
        if (!entries[dateKey]) {
          entries[dateKey] = []
        }
        entries[dateKey].push({
          id: session.id || Date.now() + Math.random(),
          title: session.title || 'Untitled',
          description: session.description || '',
          time: session.time || '00:00',
          highlighted: session.highlighted || false
        })
      })

      setScheduleEntries(entries)
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveScheduleToFirestore = async (entries) => {
    const user = auth.currentUser || userData?.user
    if (!user?.uid) return

    try {
      // Convert scheduleEntries object to sessions array
      const sessions = []
      Object.keys(entries).forEach((dateKey) => {
        entries[dateKey].forEach((entry) => {
          sessions.push({
            date: dateKey,
            time: entry.time,
            title: entry.title,
            description: entry.description,
            highlighted: entry.highlighted || false
          })
        })
      })

      await updateSchedule(user.uid, sessions)
    } catch (error) {
      console.error('Error saving schedule:', error)
    }
  }

  // Get current week dates (Monday to Sunday)
  const getWeekDates = () => {
    const dates = []
    const today = new Date(selectedDate)
    const dayOfWeek = today.getDay()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)) // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const today = new Date()
  
  const isToday = (date) => {
    return date.toDateString() === today.toDateString()
  }

  const getMonthName = (date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December']
    return months[date.getMonth()]
  }

  const getDayInitial = (date) => {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
  }

  // Check if date has events
  const hasEvents = (date) => {
    const dateKey = date.toISOString().split('T')[0]
    return scheduleEntries[dateKey] && scheduleEntries[dateKey].length > 0
  }

  // Get entries for selected date
  const selectedDateKey = selectedDate.toISOString().split('T')[0]
  const dayEntries = scheduleEntries[selectedDateKey] || []

  // Add new entry
  const handleAddTask = async () => {
    if (!newTask.title || !newTask.time || !newTask.date) return

    const dateKey = newTask.date
    const newEntry = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description || '',
      time: newTask.time,
      highlighted: false
    }

    const updatedEntries = {
      ...scheduleEntries,
      [dateKey]: [...(scheduleEntries[dateKey] || []), newEntry]
    }

    setScheduleEntries(updatedEntries)
    await saveScheduleToFirestore(updatedEntries)

    setNewTask({ title: '', description: '', time: '', date: '' })
    setShowAddTask(false)
  }

  // Delete entry
  const deleteEntry = async (dateKey, entryId) => {
    const updatedEntries = {
      ...scheduleEntries,
      [dateKey]: scheduleEntries[dateKey].filter(e => e.id !== entryId)
    }
    setScheduleEntries(updatedEntries)
    await saveScheduleToFirestore(updatedEntries)
  }

  if (isLoading) {
    return (
      <div className="schedule-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: 'var(--text-secondary)',
          fontWeight: 700
        }}>
          Loading schedule...
        </div>
      </div>
    )
  }

  return (
    <div className="schedule-page">
      {/* Month and Calendar Info */}
      <div className="month-info">
        <div className="month-name">{getMonthName(selectedDate)}</div>
        <div className="calendar-info">
          <span className="calendar-icon">📅</span>
          <span className="calendar-number">{selectedDate.getDate()}</span>
        </div>
      </div>

      {/* Weekly Date Selector */}
      <div className="week-selector">
        {weekDates.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0]
          const isSelected = dateKey === selectedDateKey
          const hasEventsForDay = hasEvents(date)
          
          return (
            <button
              key={index}
              className={`week-day ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              {hasEventsForDay && !isSelected && <div className="event-dot"></div>}
              {isSelected && <div className="selected-dot"></div>}
              <div className="day-initial">{getDayInitial(date)}</div>
              <div className={`day-number ${isSelected ? 'selected' : ''}`}>
                {date.getDate()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Schedule Entries */}
      <div className="schedule-entries">
        {dayEntries.length === 0 ? (
          <div className="empty-entries">
            <p>No entries for this day</p>
          </div>
        ) : (
          dayEntries.map((entry) => (
            <div key={entry.id} className={`schedule-entry ${entry.highlighted ? 'highlighted' : ''}`}>
              <div className="entry-time">{entry.time}</div>
              <div className="entry-card">
                <div className="entry-bar"></div>
                <div className="entry-content">
                  <div className="entry-header">
                    <div className="entry-title">{entry.title}</div>
                    <button className="entry-menu" onClick={() => deleteEntry(selectedDateKey, entry.id)}>
                      ⋮
                    </button>
                  </div>
                  <div className="entry-description">{entry.description}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Button - Floating */}
      <button className="btn-add-task" onClick={() => {
        const todayKey = selectedDate.toISOString().split('T')[0]
        setNewTask({ ...newTask, date: todayKey })
        setShowAddTask(true)
      }}>
        +
      </button>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Entry</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter title"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter description"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddTask(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddTask}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklySchedule
