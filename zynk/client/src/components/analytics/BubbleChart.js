import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.title || 'Content'}</p>
      <p>Views: {d.views?.toLocaleString()}</p>
      <p>Engagement: {d.engagement?.toLocaleString()}</p>
      <p>Shares: {d.shares?.toLocaleString()}</p>
    </div>
  );
}

export default function BubbleChart({ content, title = 'Content Performance Map' }) {
  const data = (content || []).map((c) => ({
    views: c.metrics?.views || 0,
    engagement: (c.metrics?.likes || 0) + (c.metrics?.comments || 0),
    shares: c.metrics?.shares || 0,
    title: c.title || c.description?.substring(0, 40),
  }));

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        No content data for bubble chart
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="views" name="Views" stroke="var(--text-muted)" fontSize={12}
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <YAxis dataKey="engagement" name="Engagement" stroke="var(--text-muted)" fontSize={12}
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <ZAxis dataKey="shares" range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill="#DD2A7B" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
