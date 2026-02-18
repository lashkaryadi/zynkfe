import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './GrowthChart.css';

const COLORS = {
  views: '#FF6B6B',
  likes: '#F58529',
  comments: '#833AB4',
  followerNet: '#00F2EA',
  impressions: '#1DA1F2',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="chart-tooltip" style={{ 
      background: 'rgba(20, 20, 35, 0.9)', 
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <p className="tooltip-label" style={{ color: '#fff', marginBottom: 8, fontWeight: 600 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="tooltip-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="tooltip-dot" style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: '#b0b0cc', fontSize: 13 }}>{entry.name}: </span>
          <strong style={{ color: '#fff', fontSize: 13 }}>{entry.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

export default function GrowthChart({ data, metrics = ['views', 'likes', 'followerNet'] }) {
  if (!data || data.length === 0) {
    return <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No growth data available yet</div>;
  }

  return (
    <div className="growth-chart card">
      <h3 className="chart-title">Unified Growth Chart</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {Object.entries(COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {metrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={COLORS[metric]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: COLORS[metric] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
