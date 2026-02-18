import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import PlatformFilter from '../components/common/PlatformFilter';
import PlatformIcon, { getPlatformName } from '../components/common/PlatformIcon';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { competitorsAPI } from '../services/api';
import { FiPlus, FiTrash2, FiUsers, FiBarChart2 } from 'react-icons/fi';

export default function CompetitorsPage() {
  const [platform, setPlatform] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPlatform, setNewPlatform] = useState('youtube');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = platform ? { platform } : {};
      const [compRes, cmpRes] = await Promise.all([
        competitorsAPI.list(params),
        competitorsAPI.compare(params),
      ]);
      setCompetitors(compRes.data.competitors || []);
      setComparison(cmpRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [platform]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    try {
      await competitorsAPI.add({ platform: newPlatform, username: newUsername });
      setNewUsername('');
      load();
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (id) => {
    try {
      await competitorsAPI.remove(id);
      load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <><Header title="Competitors" /><LoadingSpinner /></>;

  return (
    <>
      <Header title="Competitor Benchmarking" subtitle="See how you stack up" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <PlatformFilter platforms={['youtube', 'instagram', 'tiktok', 'twitter']} selected={platform} onChange={setPlatform} />
      </div>

      {/* Add Competitor */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14 }}>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">Twitter</option>
          </select>
          <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter competitor username" style={{ flex: 1, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }} />
          <button type="submit" className="btn btn-primary"><FiPlus /> Add</button>
        </form>
      </div>

      {/* Competitor Cards */}
      {competitors.length > 0 ? (
        <div className="grid-3">
          {competitors.map((comp) => (
            <div key={comp._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <PlatformIcon platform={comp.platform} size={18} withBg />
                  <div>
                    <p style={{ fontWeight: 600 }}>@{comp.competitorUsername}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getPlatformName(comp.platform)}</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(comp._id)} style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}><FiTrash2 size={16} /></button>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
                <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Followers</p><p style={{ fontWeight: 700, fontSize: 16 }}>{(comp.currentMetrics?.followers || 0).toLocaleString()}</p></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Engagement</p><p style={{ fontWeight: 700, fontSize: 16 }}>{(comp.currentMetrics?.engagementRate || 0).toFixed(1)}%</p></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Posts</p><p style={{ fontWeight: 700, fontSize: 16 }}>{(comp.currentMetrics?.totalPosts || 0).toLocaleString()}</p></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <FiBarChart2 size={32} style={{ marginBottom: 12 }} />
          <p>No competitors tracked yet. Add one above.</p>
        </div>
      )}

      {/* Comparison Table */}
      {comparison && Object.keys(comparison).length > 0 && (
        <div className="card" style={{ padding: 24, marginTop: 24, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Side-by-Side Comparison</h3>
          {Object.entries(comparison).map(([plat, data]) => (
            <div key={plat} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <PlatformIcon platform={plat} size={16} />
                <span style={{ fontWeight: 600 }}>{getPlatformName(plat)}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Creator</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Followers</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Engagement</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Avg Views</th>
                </tr></thead>
                <tbody>
                  <tr style={{ background: 'rgba(221,42,123,0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>You ({data.you.username})</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{(data.you.followers || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{(data.you.engagementRate || 0).toFixed(1)}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{(data.you.avgViewsPerPost || 0).toLocaleString()}</td>
                  </tr>
                  {(data.competitors || []).map((c) => (
                    <tr key={c.username} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px' }}>@{c.username}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{(c.followers || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{(c.engagementRate || 0).toFixed(1)}%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{(c.avgViewsPerPost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
