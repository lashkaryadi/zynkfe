import React, { useState } from 'react';
import Header from '../components/common/Header';
import PlatformIcon, { getPlatformName } from '../components/common/PlatformIcon';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiLink, FiXCircle, FiUser, FiBell, FiGlobe } from 'react-icons/fi';

const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'twitter'];

export default function SettingsPage() {
  const { user, platforms, loadProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleConnect = async (platform) => {
    try {
      const { data } = await authAPI.connectPlatform(platform);
      window.location.href = data.authUrl;
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Disconnect ${getPlatformName(platform)}?`)) return;
    try {
      await authAPI.disconnectPlatform(platform);
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const connectedNames = platforms.map((p) => p.platform);

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and platform connections" />

      {/* Profile */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><FiUser /> Profile</h3>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user?.email}</p>
            <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 6, background: 'rgba(221,42,123,0.1)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
              {user?.subscription?.plan || 'free'} plan
            </span>
          </div>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><FiLink /> Platform Connections</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PLATFORMS.map((p) => {
            const connected = connectedNames.includes(p);
            const platformData = platforms.find((pl) => pl.platform === p);

            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <PlatformIcon platform={p} size={24} withBg />
                  <div>
                    <p style={{ fontWeight: 600 }}>{getPlatformName(p)}</p>
                    {connected && platformData && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        @{platformData.username} — {(platformData.followers || 0).toLocaleString()} followers
                      </p>
                    )}
                  </div>
                </div>
                {connected ? (
                  <button className="btn btn-secondary" onClick={() => handleDisconnect(p)} style={{ color: 'var(--accent-red)' }}>
                    <FiXCircle /> Disconnect
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => handleConnect(p)}>
                    <FiLink /> Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><FiBell /> Notification Preferences</h3>
        {['Email notifications', 'Milestone alerts', 'Threshold alerts', 'Weekly report'].map((label) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 14 }}>{label}</span>
            <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, background: 'var(--accent-green)', borderRadius: 12, transition: '0.3s' }} />
              <span style={{ position: 'absolute', top: 3, left: 3, width: 18, height: 18, background: 'white', borderRadius: 9, transition: '0.3s' }} />
            </label>
          </div>
        ))}
      </div>
    </>
  );
}
