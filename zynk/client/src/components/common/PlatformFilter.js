import React from 'react';

export default function PlatformFilter({ platforms, selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        className={`btn ${!selected ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onChange(null)}
        style={{ padding: '6px 14px', fontSize: 13 }}
      >
        All
      </button>
      {platforms.map((p) => (
        <button
          key={p}
          className={`btn ${selected === p ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onChange(p)}
          style={{ padding: '6px 14px', fontSize: 13 }}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}
