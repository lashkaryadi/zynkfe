import React from 'react';
import { FiYoutube } from 'react-icons/fi';
import { FaYoutube, FaInstagram, FaTiktok, FaTwitter } from 'react-icons/fa';

const icons = {
  youtube: FaYoutube,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  twitter: FaTwitter,
};

const colors = {
  youtube: '#FF0000',
  instagram: '#DD2A7B',
  tiktok: '#00F2EA',
  twitter: '#1DA1F2',
};

export default function PlatformIcon({ platform, size = 20, withBg = false }) {
  const Icon = icons[platform] || FiYoutube;
  const color = colors[platform] || '#fff';

  if (withBg) {
    return (
      <div style={{
        width: size + 16,
        height: size + 16,
        borderRadius: 10,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={size} color={color} />
      </div>
    );
  }

  return <Icon size={size} color={color} />;
}

export function getPlatformColor(platform) {
  return colors[platform] || '#fff';
}

export function getPlatformName(platform) {
  const names = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', twitter: 'Twitter/X' };
  return names[platform] || platform;
}
