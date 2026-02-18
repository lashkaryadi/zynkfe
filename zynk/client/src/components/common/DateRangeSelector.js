import React from 'react';
import './DateRangeSelector.css';

const presets = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
];

export default function DateRangeSelector({ range, onChange }) {
  return (
    <div className="date-range-selector">
      {presets.map((p) => (
        <button
          key={p.value}
          className={`range-btn ${range === p.value ? 'active' : ''}`}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
