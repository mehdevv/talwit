import { signOutUser } from '../firebase/auth'
import './Profile.css'

const Profile = ({ userData, onLogout }) => {
  const handleLogout = async () => {
    try {
      const result = await signOutUser()
      if (result.error) {
        console.error('Error signing out:', result.error)
        alert('Failed to sign out. Please try again.')
      } else {
        if (onLogout) {
          onLogout()
        }
      }
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  const getUserInitials = () => {
    if (userData?.fullName) {
      return userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'U'
  }

  const getUserName = () => {
    return userData?.fullName || 'User'
  }

  const getUsername = () => {
    if (userData?.email) {
      return '@' + userData.email.split('@')[0]
    }
    return '@user'
  }

  const settingsItems = [
    { id: 1, label: 'Saved Messages' },
    { id: 2, label: 'Recent Calls' },
    { id: 3, label: 'Devices' },
    { id: 4, label: 'Notifications' },
    { id: 5, label: 'Appearance' },
    { id: 6, label: 'Language' },
    { id: 7, label: 'Privacy & Security' },
    { id: 8, label: 'Storage' }
  ]

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>Settings</h1>
      </div>

      {/* Profile Section */}
      <div className="profile-section-top">
        <div className="profile-avatar-container">
          <div className="profile-avatar-large">
            <div className="avatar-circle-large">
              {getUserInitials()}
            </div>
            <button className="edit-profile-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="profile-name-large">{getUserName()}</div>
          <div className="profile-username">{getUsername()}</div>
        </div>
      </div>

      {/* Settings List */}
      <div className="settings-section">
        <div className="settings-list">
          {settingsItems.map((item) => (
            <button key={item.id} className="setting-item">
              <span>{item.label}</span>
              <span className="arrow">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="logout-section">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Profile
