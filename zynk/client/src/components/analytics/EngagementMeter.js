import React from 'react';
import './EngagementMeter.css';

export default function EngagementMeter({ rate, label = 'Engagement Rate', size = 120 }) {
  const clampedRate = Math.min(Math.max(rate || 0, 0), 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (clampedRate / 100) * circumference;

  let color = '#00d68f';
  if (clampedRate < 2) color = '#ff3d71';
  else if (clampedRate < 5) color = '#ffaa00';

  return (
    <div className="engagement-meter">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Space Grotesk">
          {clampedRate.toFixed(1)}%
        </text>
        <text x="50" y="62" textAnchor="middle" fill="#a0a0b8" fontSize="8">
          {label}
        </text>
      </svg>
    </div>
  );
}
