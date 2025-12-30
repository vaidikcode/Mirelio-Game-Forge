import React from 'react'

function VideoUpload({ 
  projectName, 
  setProjectName, 
  videoFile, 
  setVideoFile, 
  onUpload, 
  isUploading, 
  isProcessing, 
  error, 
  success 
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
    } else {
      alert('Please select a valid video file')
    }
  }

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="upload-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        
        <h2>Upload Your Gameplay Video</h2>
        <p className="upload-description">
          Upload your gameplay video to automatically generate AI-powered sound effects
        </p>

        <div className="form-group">
          <label htmlFor="projectName">Project Name</label>
          <input
            id="projectName"
            type="text"
            placeholder="Enter project name..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="input"
            disabled={isUploading || isProcessing}
          />
        </div>

        <div className="form-group">
          <label htmlFor="videoFile">Video File</label>
          <div className="file-input-wrapper">
            <input
              id="videoFile"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="file-input"
              disabled={isUploading || isProcessing}
            />
            <label htmlFor="videoFile" className="file-input-label">
              {videoFile ? videoFile.name : 'Choose video file...'}
            </label>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </div>
        )}

        <button
          onClick={onUpload}
          disabled={!projectName || !videoFile || isUploading || isProcessing}
          className="btn-primary"
        >
          {isUploading ? (
            <>
              <span className="spinner"></span>
              Uploading...
            </>
          ) : isProcessing ? (
            <>
              <span className="spinner"></span>
              Processing Video...
            </>
          ) : (
            'Generate Audio'
          )}
        </button>
      </div>
    </div>
  )
}

export default VideoUpload
