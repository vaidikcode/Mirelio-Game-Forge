import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

function VideoSelection() {
  const navigate = useNavigate()
  const location = useLocation()
  const project = location.state?.project || { name: 'New Project' }
  const [selectedOption, setSelectedOption] = useState(null)

  const handleContinue = () => {
    if (selectedOption === 'new') {
      navigate('/editor', { state: { project, mode: 'new' } })
    } else if (selectedOption === 'existing') {
      navigate('/editor', { state: { project, mode: 'existing' } })
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="video-selection-container">
      <div className="video-selection-content">
        <div className="video-selection-header">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            BACK
          </button>
          <h1 className="brand">MIRELIO<span className="brand-sub">GAME FORGE</span></h1>
        </div>

        <div className="video-selection-body">
          <h2 className="project-title">{project.name}</h2>
          <p className="selection-subtitle">Choose how to proceed</p>

          <div className="video-options">
            <div
              className={`video-option-card ${selectedOption === 'new' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('new')}
            >
              <div className="option-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3>Process New Video</h3>
              <p>Upload and process a new video file</p>
              <div className="option-features">
                <div className="feature">◉ Upload from device</div>
                <div className="feature">◉ Real-time processing</div>
                <div className="feature">◉ AI event detection</div>
              </div>
            </div>

            <div
              className={`video-option-card ${selectedOption === 'existing' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('existing')}
            >
              <div className="option-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
              </div>
              <h3>Load Existing Video</h3>
              <p>Work with previously uploaded videos</p>
              <div className="option-features">
                <div className="feature">◉ View processed videos</div>
                <div className="feature">◉ Edit existing analysis</div>
                <div className="feature">◉ Export highlights</div>
              </div>
            </div>
          </div>

          <button
            className={`terminal-button primary-button continue-button ${!selectedOption ? 'disabled' : ''}`}
            onClick={handleContinue}
            disabled={!selectedOption}
          >
            CONTINUE
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoSelection
