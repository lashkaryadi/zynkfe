import React from 'react';
import { motion } from 'framer-motion';
import PlatformIcon, { getPlatformColor, getPlatformName } from '../common/PlatformIcon';
import { FiTrendingUp, FiEye, FiHeart } from 'react-icons/fi';
import './PlatformCards.css';

export default function PlatformCards({ platforms }) {
  if (!platforms || platforms.length === 0) {
    return (
      <div className="no-platforms card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--text-secondary)' }}>No platforms connected yet.</p>
        <a href="/settings" className="btn btn-primary" style={{ marginTop: 16 }}>Connect Platform</a>
      </div>
    );
  }

  return (
    <div className="platform-cards grid-4">
      {platforms.map((p, i) => (
        <motion.div
          key={p.platform}
          className="platform-card card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{ borderTop: `3px solid ${getPlatformColor(p.platform)}` }}
        >
          <div className="pc-header">
            <PlatformIcon platform={p.platform} size={22} withBg />
            <span className="pc-name">{getPlatformName(p.platform)}</span>
          </div>

          <div className="pc-followers">
            <span className="pc-followers-num">{(p.followers || 0).toLocaleString()}</span>
            <span className="pc-followers-label">followers</span>
          </div>

          <div className="pc-metrics">
            <div className="pc-metric">
              <FiEye size={14} />
              <span>{(p.totalViews || 0).toLocaleString()}</span>
              <span className="pc-metric-label">views</span>
            </div>
            <div className="pc-metric">
              <FiHeart size={14} />
              <span>{(p.totalEngagement || 0).toLocaleString()}</span>
              <span className="pc-metric-label">engage</span>
            </div>
            <div className="pc-metric">
              <FiTrendingUp size={14} />
              <span className={p.followerGrowth >= 0 ? 'change-positive' : 'change-negative'}>
                {p.followerGrowth >= 0 ? '+' : ''}{(p.followerGrowth || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
