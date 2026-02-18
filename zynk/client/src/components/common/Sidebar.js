import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiBarChart2, FiUsers, FiGrid, FiTrendingUp, FiDollarSign, FiTarget, FiZap, FiSettings } from 'react-icons/fi';
// import { useSound } from '../../hooks/useSound';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: FiHome, label: 'Overview' },
  { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
  { path: '/content', icon: FiGrid, label: 'Content' },
  { path: '/audience', icon: FiUsers, label: 'Audience' },
  { path: '/predictions', icon: FiTrendingUp, label: 'Predictions' },
  { path: '/revenue', icon: FiDollarSign, label: 'Revenue' },
  { path: '/competitors', icon: FiTarget, label: 'Competitors' },
  { path: '/insights', icon: FiZap, label: 'Insights' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  // const { playHover, playClick } = useSound(); // Sounds removed per request

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="ZYNK" className="logo-image" style={{ height: 40, width: 40, objectFit: 'contain' }} />
        <span className="logo-text">ZYNK</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            // onClick={playClick}
            // onMouseEnter={playHover}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {location.pathname === item.path && <div className="nav-indicator" />}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="upgrade-card">
          <FiZap size={20} />
          <p>Upgrade to Pro</p>
          <span>Unlock all features</span>
        </div>
      </div>
    </aside>
  );
}
