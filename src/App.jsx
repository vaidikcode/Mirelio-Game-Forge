import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProjectLanding from './components/ProjectLanding'
import ProjectList from './components/ProjectList'
import VideoSelection from './components/VideoSelection'
import VideoEditor from './components/VideoEditor'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProjectLanding />} />
        <Route path="/video-selection" element={<VideoSelection />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/editor" element={<VideoEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
