import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { insightsAPI } from '../services/api';
import { FiZap, FiHash, FiAlertTriangle, FiUsers, FiTrendingUp, FiClock, FiHeart } from 'react-icons/fi';

const CARD_STYLE = { padding: 24, display: 'flex', flexDirection: 'column', gap: 12 };

export default function InsightsPage() {
  const [suggestions, setSuggestions] = useState(null);
  const [trending, setTrending] = useState(null);
  const [hashtags, setHashtags] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [collabs, setCollabs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sugRes, trendRes, hashRes, burnRes, collabRes] = await Promise.all([
          insightsAPI.suggestions(),
          insightsAPI.trending(),
          insightsAPI.hashtags({}),
          insightsAPI.burnout(),
          insightsAPI.collaborations(),
        ]);
        setSuggestions(sugRes.data);
        setTrending(trendRes.data);
        setHashtags(hashRes.data);
        setBurnout(burnRes.data);
        setCollabs(collabRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <><Header title="Insights" /><LoadingSpinner /></>;

  const riskColors = { low: '#00d68f', medium: '#ffaa00', high: '#ff3d71' };

  return (
    <>
      <Header title="Insights Engine" subtitle="AI-powered recommendations for your content strategy" />

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Content Suggestions */}
        <div className="card" style={CARD_STYLE}>
          <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiZap color="#F58529" /> Content Suggestions</h3>
          {(suggestions?.suggestions || []).map((s, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
              {typeof s === 'string' ? (
                <p style={{ fontSize: 14 }}>{s}</p>
              ) : (
                <>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{s.type}</p>
                  <p style={{ fontSize: 14 }}>{s.message}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Burnout Prevention */}
        <div className="card" style={CARD_STYLE}>
          <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiAlertTriangle color={riskColors[burnout?.riskLevel] || '#00d68f'} /> Burnout Prevention</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: `${riskColors[burnout?.riskLevel]}15`, border: `1px solid ${riskColors[burnout?.riskLevel]}30` }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: riskColors[burnout?.riskLevel], textTransform: 'capitalize' }}>{burnout?.riskLevel || 'Unknown'}</span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Risk Level</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Posts (30d)</p><p style={{ fontWeight: 700 }}>{burnout?.stats?.recentPosts || 0}</p></div>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Previous (30d)</p><p style={{ fontWeight: 700 }}>{burnout?.stats?.previousPosts || 0}</p></div>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Longest Gap</p><p style={{ fontWeight: 700 }}>{burnout?.stats?.longestGapDays || 0}d</p></div>
          </div>
          {(burnout?.recommendations || []).map((r, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 12, borderLeft: '2px solid var(--border-color)' }}>{r}</p>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Trending Topics */}
        <div className="card" style={CARD_STYLE}>
          <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiTrendingUp color="#DD2A7B" /> Trending Topics</h3>
          {(trending?.trending || []).slice(0, 8).map((t, i) => (
            <div key={t.hashtag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 7 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiHash size={14} color="var(--text-muted)" />
                <span style={{ fontWeight: 500 }}>{t.hashtag}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>{t.avgViews?.toLocaleString()} views</span>
                <span>{t.usageCount}x used</span>
              </div>
            </div>
          ))}
        </div>

        {/* Collaboration Opportunities */}
        <div className="card" style={CARD_STYLE}>
          <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiUsers color="#00F2EA" /> Collaboration Finder</h3>
          {(collabs?.frequentMentions || []).length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>FREQUENTLY MENTIONED</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {collabs.frequentMentions.map((m) => (
                  <span key={m.username} style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(0,242,234,0.1)', border: '1px solid rgba(0,242,234,0.2)', fontSize: 13 }}>
                    @{m.username} ({m.mentionCount})
                  </span>
                ))}
              </div>
            </div>
          )}
          {(collabs?.suggestions || []).map((s, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 12, borderLeft: '2px solid var(--border-color)' }}>{s}</p>
          ))}
        </div>
      </div>

      {/* Hashtag Performance */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiHash color="#8134AF" /> Hashtag Performance</h3>
        {(hashtags?.analysis || []).length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Hashtag</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Posts</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Avg Views</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Avg Likes</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Avg Comments</th>
              </tr></thead>
              <tbody>
                {hashtags.analysis.slice(0, 15).map((h, i) => (
                  <tr key={h.hashtag} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>#{h.hashtag}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{h.posts}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{h.avgViews?.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{h.avgLikes?.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{h.avgComments?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No hashtag data available</p>}
      </div>
    </>
  );
}
