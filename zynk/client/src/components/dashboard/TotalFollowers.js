import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import PlatformIcon from '../common/PlatformIcon';
import './TotalFollowers.css';

export default function TotalFollowers({ total, platforms }) {
  return (
    <motion.div
      className="total-followers card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="tf-content">
        <p className="tf-label">Total Followers Across All Platforms</p>
        <h1 className="tf-number">
          <CountUp end={total || 0} duration={2} separator="," />
        </h1>
        <div className="tf-platforms">
          {(platforms || []).map((p) => (
            <div key={p.platform} className="tf-platform-chip">
              <PlatformIcon platform={p.platform} size={16} />
              <span>{(p.followers || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tf-glow" />
    </motion.div>
  );
}
