import { useState } from 'react'
import axios from 'axios'
import { supabase } from './supabaseClient'
import VideoUpload from './components/VideoUpload'
import EventList from './components/EventList'
import EventDetail from './components/EventDetail'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [projectName, setProjectName] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleVideoUpload = async () => {
    if (!videoFile || !projectName) {
      setError('Please provide both a project name and a video file')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')

    try {
      // Upload video to Supabase Storage
      const fileName = `${projectName}_${Date.now()}_${videoFile.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      setVideoUrl(publicUrl)
      setSuccess('Video uploaded successfully! Now processing...')
      
      // Process video
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
        setSuccess('Audio generation complete!')
      }
    } catch (err) {
      setError(`Processing failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEventSelect = (event) => {
    setSelectedEvent(event)
  }

  const handleReset = () => {
    setProjectName('')
    setVideoFile(null)
    setVideoUrl('')
    setEvents([])
    setSelectedEvent(null)
    setError('')
    setSuccess('')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">🎮</span>
            Mirelio Game Forge
          </h1>
          <p className="tagline">AI-Powered Game Audio Generation</p>
        </div>
      </header>

      <main className="main">
        {!events.length ? (
          <VideoUpload
            projectName={projectName}
            setProjectName={setProjectName}
            videoFile={videoFile}
            setVideoFile={setVideoFile}
            onUpload={handleVideoUpload}
            isUploading={isUploading}
            isProcessing={isProcessing}
            error={error}
            success={success}
          />
        ) : (
          <div className="results-container">
            <div className="results-header">
              <h2>Generated Audio Events</h2>
              <button onClick={handleReset} className="btn-secondary">
                New Project
              </button>
            </div>
            
            <div className="content-grid">
              <EventList
                events={events}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
              />
              
              <EventDetail event={selectedEvent} />
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 Mirelio Game Forge. Powered by AI.</p>
      </footer>
    </div>
  )
}

export default App
