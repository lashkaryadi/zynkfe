import React from 'react';
import CountUp from 'react-countup';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import './StatCard.css';

export default function StatCard({ label, value, change, prefix = '', suffix = '', icon: Icon, color }) {
  const isPositive = change >= 0;

  return (
    <div className="stat-card card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon" style={{ background: `${color}18`, color }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-card-value">
        <span className="stat-number">
          {prefix}
          <CountUp end={value} duration={1.5} separator="," decimals={suffix === '%' ? 1 : 0} />
          {suffix}
        </span>
      </div>

      {change !== undefined && (
        <div className={`stat-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
          {isPositive ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          <span className="change-period">vs last period</span>
        </div>
      )}
    </div>
  );
}
