import React from 'react';
import './PostingHeatmap.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function PostingHeatmap({ data, title = 'Best Posting Times' }) {
  // data: 7x24 array of engagement values
  const heatmap = data || Array(7).fill(null).map(() => Array(24).fill(0));

  const maxVal = Math.max(...heatmap.flat(), 1);

  const getColor = (value) => {
    if (value === 0) return 'rgba(255,255,255,0.02)';
    const intensity = value / maxVal;
    if (intensity > 0.75) return 'rgba(221, 42, 123, 0.9)';
    if (intensity > 0.5) return 'rgba(245, 133, 41, 0.7)';
    if (intensity > 0.25) return 'rgba(129, 52, 175, 0.5)';
    return 'rgba(129, 52, 175, 0.2)';
  };

  return (
    <div className="posting-heatmap card">
      <h3>{title}</h3>
      <div className="heatmap-container">
        <div className="heatmap-hours">
          <div className="heatmap-spacer" />
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <span key={h} className="heatmap-hour-label" style={{ left: `${(h / 24) * 100}%` }}>
              {h.toString().padStart(2, '0')}
            </span>
          ))}
        </div>
        <div className="heatmap-grid">
          {heatmap.map((row, dayIdx) => (
            <div key={dayIdx} className="heatmap-row">
              <span className="heatmap-day">{DAYS[dayIdx]}</span>
              <div className="heatmap-cells">
                {row.map((val, hourIdx) => (
                  <div
                    key={hourIdx}
                    className="heatmap-cell"
                    style={{ background: getColor(val) }}
                    title={`${DAYS[dayIdx]} ${hourIdx}:00 — Engagement: ${val}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Low</span>
          <div className="heatmap-legend-bar" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
