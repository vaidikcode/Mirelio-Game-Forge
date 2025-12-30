import React, { useState } from 'react'

function EventDetail({ event }) {
  const [playingIndex, setPlayingIndex] = useState(null)

  if (!event) {
    return (
      <div className="event-detail empty">
        <div className="empty-state">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <h3>Select an Event</h3>
          <p>Choose an event from the list to view details and play audio variations</p>
        </div>
      </div>
    )
  }

  const handlePlay = (index) => {
    setPlayingIndex(index)
  }

  return (
    <div className="event-detail">
      <div className="event-detail-header">
        <h2>{event.name}</h2>
        <div className="event-detail-meta">
          <span>
            <strong>Start:</strong> {event.start.toFixed(2)}s
          </span>
          <span>
            <strong>Duration:</strong> {event.duration.toFixed(2)}s
          </span>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Audio Variations
        </h3>
        <div className="variations-grid">
          {event.variations.map((url, index) => (
            <div key={index} className="variation-card">
              <div className="variation-header">
                <span className="variation-label">Variation {index + 1}</span>
                {playingIndex === index && <span className="playing-indicator">Playing</span>}
              </div>
              <audio
                controls
                src={url}
                className="audio-player"
                onPlay={() => handlePlay(index)}
                onEnded={() => setPlayingIndex(null)}
              >
                Your browser does not support audio playback.
              </audio>
              <a
                href={url}
                download={`${event.name}_variation_${index + 1}.wav`}
                className="download-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Generation Prompts
        </h3>
        <div className="prompts-list">
          {event.prompts.map((prompt, index) => (
            <div key={index} className="prompt-item">
              <span className="prompt-number">{index + 1}</span>
              <p className="prompt-text">{prompt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EventDetail
