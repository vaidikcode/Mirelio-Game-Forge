import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../supabaseClient'

// Use relative path for production (Vercel), localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

function VideoEditor() {
  const location = useLocation()
  const navigate = useNavigate()
  const project = location.state?.project
  
  const [projectName, setProjectName] = useState(project?.name || '')
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [localVideoUrl, setLocalVideoUrl] = useState('')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [wwiseImportMap, setWwiseImportMap] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showManualEventForm, setShowManualEventForm] = useState(false)
  const [manualEvent, setManualEvent] = useState({
    name: '',
    start: 0,
    duration: 1.0,
    prompt: ''
  })
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [editingVariation, setEditingVariation] = useState(null)
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const videoRef = useRef(null)
  const videoTimeoutRef = useRef(null)

  useEffect(() => {
    // If coming from existing project, could load mock videos here
    // For demo purposes, we'll just show the upload interface
  }, [project])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      // Create local preview URL
      const url = URL.createObjectURL(file)
      setLocalVideoUrl(url)
    }
  }

  const handleVideoUpload = async () => {
    if (!videoFile || !projectName) {
      setError('Please provide both project name and video')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const fileName = `${projectName}_${Date.now()}_${videoFile.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      setVideoUrl(publicUrl)
      await processVideo(publicUrl, projectName)
    } catch (err) {
      setError(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const processVideo = async (url, project) => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/process`, {
        url,
        project
      })

      if (response.data.status === 'success') {
        setEvents(response.data.data)
        setWwiseImportMap(response.data.wwise_import_map || '')
        if (response.data.data.length > 0) {
          setSelectedEvent(response.data.data[0])
        }
      }
    } catch (err) {
      setError(`Processing failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl)
    if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current)
    setProjectName(project?.name || '')
    setVideoFile(null)
    setVideoUrl('')
    setLocalVideoUrl('')
    setEvents([])
    setSelectedEvent(null)
    setWwiseImportMap('')
    setError('')
    setShowManualEventForm(false)
    setManualEvent({ name: '', start: 0, duration: 1.0, prompt: '' })
  }

  const handleCreateManualEvent = async () => {
    if (!manualEvent.name || !manualEvent.prompt || !videoUrl || !projectName) {
      setError('Please fill all fields')
      return
    }

    setIsCreatingEvent(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/create-manual-event`, {
        project: projectName,
        video_url: videoUrl,
        event_name: manualEvent.name,
        start: parseFloat(manualEvent.start),
        duration: parseFloat(manualEvent.duration),
        text_prompt: manualEvent.prompt
      })

      if (response.data.status === 'success') {
        // Refresh events from database
        const { data: dbEvents } = await supabase
          .from('assets')
          .select('*')
          .eq('project', projectName)
          .order('timestamp', { ascending: true })

        const formattedEvents = dbEvents.map(e => ({
          name: e.event_name,
          start: e.timestamp,
          duration: 1.0, // Default if not stored
          variations: e.variations || [],
          prompts: e.prompts || [],
          id: e.id
        }))

        setEvents(formattedEvents)
        setShowManualEventForm(false)
        setManualEvent({ name: '', start: 0, duration: 1.0, prompt: '' })
      }
    } catch (err) {
      setError(`Failed to create event: ${err.response?.data?.detail || err.message}`)
    } finally {
      setIsCreatingEvent(false)
    }
  }

  const handleRegenerateVariation = async (eventId, variationIndex, newPrompt) => {
    if (!newPrompt || !selectedEvent) return

    setRegeneratingIndex(variationIndex)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/regenerate-variation`, {
        event_id: eventId,
        variation_index: variationIndex,
        video_url: videoUrl,
        start: selectedEvent.start,
        duration: selectedEvent.duration,
        text_prompt: newPrompt
      })

      if (response.data.status === 'success') {
        // Update the specific variation in state
        const updatedEvents = events.map(event => {
          if (event.id === eventId) {
            const newVariations = [...event.variations]
            const newPrompts = [...event.prompts]
            newVariations[variationIndex] = response.data.variation.url
            newPrompts[variationIndex] = response.data.variation.prompt
            return { ...event, variations: newVariations, prompts: newPrompts }
          }
          return event
        })
        
        setEvents(updatedEvents)
        
        if (selectedEvent.id === eventId) {
          const updatedSelected = updatedEvents.find(e => e.id === eventId)
          setSelectedEvent(updatedSelected)
        }
        
        setEditingVariation(null)
      }
    } catch (err) {
      setError(`Failed to regenerate: ${err.response?.data?.detail || err.message}`)
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const handleBackToProjects = () => {
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl)
    if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current)
    navigate('/projects')
  }

  const handleAudioPlay = (audioElement) => {
    if (videoRef.current && selectedEvent) {
      // Clear any existing timeout
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current)
      }
      
      // Seek to event start and play
      videoRef.current.currentTime = selectedEvent.start
      videoRef.current.play()
      
      // Stop video after event duration
      videoTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause()
        }
      }, selectedEvent.duration * 1000) // Convert to milliseconds
    }
  }

  const handleAudioPause = () => {
    // Clear timeout and pause video
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current)
    }
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const handleAudioEnded = () => {
    // Clear timeout and pause video
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current)
    }
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const handleDownloadWwise = () => {
    if (!wwiseImportMap) return
    
    const blob = new Blob([wwiseImportMap], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}_wwise_import.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      {/* Video Background */}
      {localVideoUrl && (
        <div className="video-background">
          <video ref={videoRef} muted playsInline>
            <source src={localVideoUrl} type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand">MIRELIO<span className="brand-sub">GAME FORGE</span></h1>
        </div>

        {!events.length ? (
          <div className="upload-section">
            <input
              type="text"
              placeholder="project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="terminal-input"
              disabled={isUploading || isProcessing}
            />
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="file-input"
              id="video-input"
              disabled={isUploading || isProcessing}
            />
            <label htmlFor="video-input" className="file-label">
              {videoFile ? '✓ ' + videoFile.name.substring(0, 15) + '...' : '+ upload video'}
            </label>
            <button
              onClick={handleVideoUpload}
              disabled={!projectName || !videoFile || isUploading || isProcessing}
              className="terminal-btn"
            >
              {isUploading ? '↑ uploading...' : isProcessing ? '⟳ processing...' : '→ generate'}
            </button>
            {error && <div className="error-msg">✗ {error}</div>}
            
            <button onClick={handleBackToProjects} className="reset-btn" style={{ marginTop: '20px' }}>
              ← back to projects
            </button>
          </div>
        ) : (
          <>
            <div className="project-info">
              <div className="project-name">{projectName}</div>
              <div className="project-stats">{events.length} events detected</div>
            </div>

            <div className="event-controls">
              <button 
                className="add-event-btn"
                onClick={() => setShowManualEventForm(!showManualEventForm)}
              >
                + ADD EVENT MANUALLY
              </button>
            </div>

            {showManualEventForm && (
              <div className="manual-event-form">
                <h4>CREATE EVENT</h4>
                <input
                  type="text"
                  placeholder="Event Name"
                  value={manualEvent.name}
                  onChange={(e) => setManualEvent({ ...manualEvent, name: e.target.value })}
                  className="terminal-input"
                />
                <input
                  type="number"
                  placeholder="Start (seconds)"
                  step="0.1"
                  value={manualEvent.start}
                  onChange={(e) => setManualEvent({ ...manualEvent, start: e.target.value })}
                  className="terminal-input"
                />
                <input
                  type="number"
                  placeholder="Duration (seconds)"
                  step="0.1"
                  min="1.0"
                  value={manualEvent.duration}
                  onChange={(e) => setManualEvent({ ...manualEvent, duration: e.target.value })}
                  className="terminal-input"
                />
                <textarea
                  placeholder="Text Prompt for Mirelo"
                  rows="3"
                  value={manualEvent.prompt}
                  onChange={(e) => setManualEvent({ ...manualEvent, prompt: e.target.value })}
                  className="terminal-input"
                />
                <div className="form-actions">
                  <button 
                    onClick={handleCreateManualEvent}
                    disabled={isCreatingEvent}
                    className="create-btn"
                  >
                    {isCreatingEvent ? 'CREATING...' : 'CREATE'}
                  </button>
                  <button 
                    onClick={() => setShowManualEventForm(false)}
                    className="cancel-btn"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            <nav className="event-nav">
              <div className="nav-label">EVENTS</div>
              {events.map((event, idx) => (
                <button
                  key={idx}
                  className={`nav-item ${selectedEvent?.name === event.name ? 'active' : ''}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <span className="nav-num">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="nav-name">{event.name}</span>
                  <span className="nav-time">{event.start.toFixed(1)}s</span>
                </button>
              ))}
            </nav>

            <button onClick={handleReset} className="reset-btn">
              ↻ new video
            </button>
            
            <button onClick={handleBackToProjects} className="reset-btn" style={{ marginTop: '10px' }}>
              ← back to projects
            </button>
          </>
        )}
      </aside>

      {/* Center Video Area */}
      <main className="center-area">
        {selectedEvent ? (
          <div className="event-display">
            <h2 className="event-title">{selectedEvent.name}</h2>
            <div className="event-info">
              <span>START: {selectedEvent.start.toFixed(2)}s</span>
              <span>DURATION: {selectedEvent.duration.toFixed(2)}s</span>
              <span>{selectedEvent.variations.length} VARIATIONS</span>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="center-message">
            <div className="message-icon">♪</div>
            <p>Select an event</p>
          </div>
        ) : (
          <div className="center-message">
            <div className="message-icon">🎮</div>
            <p>Upload gameplay video to start</p>
            {project && <p className="project-hint">Project: {project.name}</p>}
          </div>
        )}

        {/* Timeline */}
        {events.length > 0 && (
          <div className="timeline">
            <div className="timeline-bar">
              {events.map((event, idx) => {
                const maxTime = Math.max(...events.map(e => e.start + e.duration));
                const startPercent = (event.start / maxTime) * 100;
                const widthPercent = (event.duration / maxTime) * 100;
                
                return (
                  <div
                    key={idx}
                    className={`timeline-event ${selectedEvent?.name === event.name ? 'active' : ''}`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`
                    }}
                    onClick={() => setSelectedEvent(event)}
                    title={`${event.name} (${event.start.toFixed(1)}s)`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Variations */}
      {selectedEvent && (
        <aside className="variations-sidebar">
          <div className="variations-header">
            <h3>VARIATIONS</h3>
            {wwiseImportMap && (
              <button 
                className="wwise-download-btn" 
                onClick={handleDownloadWwise}
                title="Download Wwise Import Map"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                WWISE MAP
              </button>
            )}
          </div>
          <div className="variations-list">
            {selectedEvent.variations.map((url, idx) => (
              <div key={idx} className="variation-item">
                <div className="variation-top">
                  <span className="var-label">VAR {idx + 1}</span>
                  <a 
                    href={url} 
                    download={`${projectName}_${selectedEvent.name.replace(' ', '_')}_var${idx + 1}.mp3`}
                    className="dl-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ↓
                  </a>
                </div>
                <audio 
                  controls 
                  src={url} 
                  className="audio-player"
                  preload="metadata"
                  crossOrigin="anonymous"
                  onPlay={(e) => handleAudioPlay(e.target)}
                  onPause={handleAudioPause}
                  onEnded={handleAudioEnded}
                  onError={(e) => console.error('Audio playback error:', e)}
                />
                <div className="var-prompt-container">
                  {editingVariation === idx ? (
                    <>
                      <textarea
                        className="prompt-edit"
                        value={editingVariation === idx ? selectedEvent.prompts[idx] : ''}
                        onChange={(e) => {
                          const updatedPrompts = [...selectedEvent.prompts]
                          updatedPrompts[idx] = e.target.value
                          setSelectedEvent({ ...selectedEvent, prompts: updatedPrompts })
                        }}
                        rows="3"
                      />
                      <div className="prompt-actions">
                        <button
                          className="regenerate-btn"
                          onClick={() => handleRegenerateVariation(selectedEvent.id, idx, selectedEvent.prompts[idx])}
                          disabled={regeneratingIndex === idx}
                        >
                          {regeneratingIndex === idx ? 'Generating...' : 'Regenerate'}
                        </button>
                        <button
                          className="cancel-edit-btn"
                          onClick={() => setEditingVariation(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="var-prompt">
                        {selectedEvent.prompts[idx] || 'Generated audio'}
                      </div>
                      <button
                        className="edit-prompt-btn"
                        onClick={() => setEditingVariation(idx)}
                      >
                        Edit Prompt
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}

export default VideoEditor
