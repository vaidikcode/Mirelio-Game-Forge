import { useNavigate } from 'react-router-dom'

function ProjectLanding() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <h1 className="landing-brand">MIRELIO</h1>
          <span className="landing-brand-sub">GAME FORGE</span>
        </div>
        
        <div className="landing-description">
          <p>Advanced video processing and event detection system</p>
          <p className="landing-description-sub">Transform your gameplay into actionable insights</p>
        </div>

        <div className="landing-buttons">
          <button 
            className="terminal-button primary-button"
            onClick={() => navigate('/video-selection', { state: { project: { name: 'New Project' } } })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            CREATE NEW PROJECT
          </button>
          
          <button 
            className="terminal-button secondary-button"
            onClick={() => navigate('/projects')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            OPEN EXISTING PROJECT
          </button>
        </div>

        <div className="landing-features">
          <div className="feature-item">
            <div className="feature-icon">◉</div>
            <div className="feature-text">AI-Powered Event Detection</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">◉</div>
            <div className="feature-text">Real-time Video Processing</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">◉</div>
            <div className="feature-text">Multi-variation Analysis</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectLanding
