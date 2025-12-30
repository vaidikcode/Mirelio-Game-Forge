import { useState, useRef } from 'react'
import axios from 'axios'
import { supabase } from './supabaseClient'
import './App.css'

// Use relative path for production (Vercel), localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

function App() {
  const [projectName, setProjectName] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [localVideoUrl, setLocalVideoUrl] = useState('')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const videoTimeoutRef = useRef(null)

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
    setProjectName('')
    setVideoFile(null)
    setVideoUrl('')
    setLocalVideoUrl('')
    setEvents([])
    setSelectedEvent(null)
    setError('')
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
          <h1 className="brand">MIRELIO</h1>
          <span className="brand-sub">GAME FORGE</span>
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
          </div>
        ) : (
          <>
            <div className="project-info">
              <div className="project-name">{projectName}</div>
              <div className="project-stats">{events.length} events detected</div>
            </div>

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
              ← new project
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
          </div>
          <div className="variations-list">
            {selectedEvent.variations.map((url, idx) => (
              <div key={idx} className="variation-item">
                <div className="variation-top">
                  <span className="var-label">VAR {idx + 1}</span>
                  <a href={url} download className="dl-btn">↓</a>
                </div>
                <audio 
                  controls 
                  src={url} 
                  className="audio-player"
                  onPlay={(e) => handleAudioPlay(e.target)}
                  onPause={handleAudioPause}
                  onEnded={handleAudioEnded}
                />
                <div className="var-prompt">
                  {selectedEvent.prompts[idx] || 'Generated audio'}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}

export default App
