import { useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { getAllUsers } from '../firebase/database'
import './Leaderboard.css'

const Leaderboard = ({ userData }) => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('combined') // 'combined', 'todos', 'streak'

  useEffect(() => {
    loadLeaderboard()
  }, [userData, sortBy])

  const loadLeaderboard = async () => {
    setIsLoading(true)
    try {
      const result = await getAllUsers()
      const users = result.users || []

      // Calculate scores for each user
      const usersWithScores = users.map((user) => {
        // Calculate todo completion percentage
        const tasks = user.tasks?.tasks || []
        const todoCompletion = tasks.length > 0
          ? Math.round((tasks.filter(t => t.completed === true).length / tasks.length) * 100)
          : 0

        // Get streak days
        const streak = user.streak || 0

        // Calculate combined score (weighted: 60% todos, 40% streak)
        // Normalize streak to 0-100 scale (assuming max streak of 30 days = 100)
        const normalizedStreak = Math.min((streak / 30) * 100, 100)
        const combinedScore = (todoCompletion * 0.6) + (normalizedStreak * 0.4)

        return {
          id: user.id,
          name: user.fullName || user.email?.split('@')[0] || 'Anonymous',
          email: user.email || '',
          todoCompletion,
          streak,
          combinedScore,
          isCurrentUser: user.id === (auth.currentUser?.uid || userData?.uid)
        }
      })

      // Sort based on selected criteria
      let sortedUsers = []
      if (sortBy === 'todos') {
        sortedUsers = usersWithScores.sort((a, b) => b.todoCompletion - a.todoCompletion)
      } else if (sortBy === 'streak') {
        sortedUsers = usersWithScores.sort((a, b) => b.streak - a.streak)
      } else {
        // Combined score (default)
        sortedUsers = usersWithScores.sort((a, b) => b.combinedScore - a.combinedScore)
      }

      // Add rank
      const rankedUsers = sortedUsers.map((user, index) => ({
        ...user,
        rank: index + 1
      }))

      setLeaderboardData(rankedUsers)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      setLeaderboardData([])
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreDisplay = (user) => {
    if (sortBy === 'todos') {
      return `${user.todoCompletion}%`
    } else if (sortBy === 'streak') {
      return `${user.streak}`
    } else {
      return `${Math.round(user.combinedScore)}`
    }
  }

  const getScoreLabel = () => {
    if (sortBy === 'todos') {
      return 'Todos'
    } else if (sortBy === 'streak') {
      return 'Streak'
    } else {
      return 'Score'
    }
  }

  if (isLoading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>Leaderboard</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: 'var(--text-secondary)',
          fontWeight: 700
        }}>
          Loading leaderboard...
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>Top performers</p>
      </div>

      {/* Sort Options */}
      <div className="sort-options">
        <button
          className={`sort-btn ${sortBy === 'combined' ? 'active' : ''}`}
          onClick={() => setSortBy('combined')}
        >
          Combined
        </button>
        <button
          className={`sort-btn ${sortBy === 'todos' ? 'active' : ''}`}
          onClick={() => setSortBy('todos')}
        >
          Todos %
        </button>
        <button
          className={`sort-btn ${sortBy === 'streak' ? 'active' : ''}`}
          onClick={() => setSortBy('streak')}
        >
          Streak
        </button>
      </div>

      {leaderboardData.length === 0 ? (
        <div className="empty-leaderboard">
          <p>No users found. Be the first to join the leaderboard!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboardData.map((user) => (
            <div
              key={user.id}
              className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="rank-badge">
                {user.rank <= 3 ? (
                  <span className={`medal medal-${user.rank}`}>
                    {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="rank-number">{user.rank}</span>
                )}
              </div>
              <div className="user-info">
                <div className="user-name">
                  {user.name}
                  {user.isCurrentUser && <span className="you-badge"> (You)</span>}
                </div>
                <div className="user-stats">
                  <span>📋 {user.todoCompletion}% todos</span>
                  <span>🔥 {user.streak} days</span>
                </div>
              </div>
              <div className="user-score">
                <div className="score-value">{getScoreDisplay(user)}</div>
                <div className="score-label">{getScoreLabel()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Leaderboard
