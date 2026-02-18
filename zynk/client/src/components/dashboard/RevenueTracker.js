import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import './RevenueTracker.css';

const SOURCE_COLORS = {
  adRevenue: '#FF0000',
  sponsorships: '#F58529',
  tips: '#00F2EA',
  memberships: '#833AB4',
  merchandise: '#1DA1F2',
  affiliates: '#E1306C',
  other: '#6b6b82',
};

export default function RevenueTracker({ totals, byPlatform }) {
  if (!totals) return null;

  const sources = Object.entries(totals)
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      value,
      color: SOURCE_COLORS[key] || '#6b6b82',
    }))
    .filter((s) => s.value > 0);

  return (
    <motion.div
      className="revenue-tracker card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="rt-header">
        <h3>Revenue Tracker</h3>
        <div className="rt-total">
          <FiDollarSign size={20} />
          <span>${(totals.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {sources.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sources} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString()}`}
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {sources.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 20 }}>
          No revenue data yet
        </p>
      )}
    </motion.div>
  );
}
