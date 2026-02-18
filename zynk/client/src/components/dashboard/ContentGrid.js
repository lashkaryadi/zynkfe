import React from 'react';
import { motion } from 'framer-motion';
import PlatformIcon from '../common/PlatformIcon';
import { FiEye, FiHeart, FiMessageCircle } from 'react-icons/fi';
import './ContentGrid.css';

export default function ContentGrid({ content, title = 'Top Performing Content' }) {
  if (!content || content.length === 0) {
    return null;
  }

  return (
    <div className="content-grid-section">
      <h3 className="section-title">{title}</h3>
      <div className="content-grid">
        {content.slice(0, 8).map((item, i) => (
          <motion.a
            key={item.id || i}
            href={item.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="content-card card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="cc-thumbnail">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.title} />
              ) : (
                <div className="cc-thumb-placeholder">
                  <PlatformIcon platform={item.platform} size={24} />
                </div>
              )}
              <div className="cc-platform-badge">
                <PlatformIcon platform={item.platform} size={14} />
              </div>
              {item.performanceScore > 0 && (
                <div className="cc-score">{item.performanceScore}</div>
              )}
            </div>

            <div className="cc-info">
              <p className="cc-title">{item.title || item.description?.substring(0, 60) || 'Untitled'}</p>
              <div className="cc-metrics">
                <span><FiEye size={12} /> {(item.metrics?.views || 0).toLocaleString()}</span>
                <span><FiHeart size={12} /> {(item.metrics?.likes || 0).toLocaleString()}</span>
                <span><FiMessageCircle size={12} /> {(item.metrics?.comments || 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
