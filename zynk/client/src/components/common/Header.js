import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiBell, FiSearch } from 'react-icons/fi';
import './Header.css';

export default function Header({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-right">
        <div className="header-search">
          <FiSearch size={16} />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="header-icon-btn">
          <FiBell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="header-profile">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="header-name">{user?.name || 'Creator'}</span>
        </div>
      </div>
    </header>
  );
}
