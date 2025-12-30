import React from 'react'

function EventList({ events, selectedEvent, onEventSelect }) {
  return (
    <div className="event-list">
      <h3 className="section-title">Events ({events.length})</h3>
      <div className="event-items">
        {events.map((event, index) => (
          <div
            key={index}
            className={`event-item ${selectedEvent?.name === event.name ? 'active' : ''}`}
            onClick={() => onEventSelect(event)}
          >
            <div className="event-item-header">
              <span className="event-number">{index + 1}</span>
              <h4 className="event-name">{event.name}</h4>
            </div>
            <div className="event-item-meta">
              <span className="event-time">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {event.start.toFixed(1)}s
              </span>
              <span className="event-duration">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                {event.duration.toFixed(1)}s
              </span>
            </div>
            <div className="event-badge">
              {event.variations.length} variations
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventList
