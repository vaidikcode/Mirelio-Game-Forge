import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Mock projects data
const MOCK_PROJECTS = [
  {
    id: 1,
    name: 'Valorant Highlights',
    videoCount: 5,
    lastUpdated: '2 hours ago',
    thumbnail: '🎮'
  },
  {
    id: 2,
    name: 'CS:GO Tournament',
    videoCount: 12,
    lastUpdated: '1 day ago',
    thumbnail: '🎯'
  },
  {
    id: 3,
    name: 'League Gameplay',
    videoCount: 8,
    lastUpdated: '3 days ago',
    thumbnail: '⚔️'
  },
  {
    id: 4,
    name: 'Fortnite Streams',
    videoCount: 15,
    lastUpdated: '5 days ago',
    thumbnail: '🏆'
  },
  {
    id: 5,
    name: 'Apex Legends',
    videoCount: 6,
    lastUpdated: '1 week ago',
    thumbnail: '🎪'
  }
]

function ProjectList() {
  const navigate = useNavigate()
  const [selectedProject, setSelectedProject] = useState(null)

  const handleProjectClick = (project) => {
    setSelectedProject(project)
  }

  const handleOpenProject = () => {
    if (selectedProject) {
      navigate('/video-selection', { state: { project: selectedProject } })
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="project-list-container">
      <div className="project-list-sidebar">
        <div className="sidebar-header">
          <h1 className="brand">MIRELIO<span className="brand-sub">GAME FORGE</span></h1>
        </div>
        
        <div className="project-list-header">
          <h2 className="section-title">Your Projects</h2>
          <p className="section-subtitle">{MOCK_PROJECTS.length} projects available</p>
        </div>

        <div className="project-items-container">
          {MOCK_PROJECTS.map((project) => (
            <div
              key={project.id}
              className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-thumbnail">{project.thumbnail}</div>
              <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <div className="project-meta">
                  <span className="project-video-count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    {project.videoCount} videos
                  </span>
                  <span className="project-last-updated">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {project.lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="project-list-actions">
          <button 
            className="terminal-button secondary-button"
            onClick={handleBack}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            BACK
          </button>
          <button 
            className="terminal-button primary-button"
            onClick={handleOpenProject}
            disabled={!selectedProject}
          >
            OPEN PROJECT
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {selectedProject && (
        <div className="project-preview">
          <div className="preview-content">
            <div className="preview-icon">{selectedProject.thumbnail}</div>
            <h2 className="preview-title">{selectedProject.name}</h2>
            <div className="preview-stats">
              <div className="stat-item">
                <div className="stat-value">{selectedProject.videoCount}</div>
                <div className="stat-label">Videos</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{selectedProject.lastUpdated}</div>
                <div className="stat-label">Last Updated</div>
              </div>
            </div>
            <p className="preview-description">
              Click "OPEN PROJECT" to view and process videos in this project
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectList
