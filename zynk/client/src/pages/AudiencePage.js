import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import PlatformFilter from '../components/common/PlatformFilter';
import AudienceGlobe from '../components/three/AudienceGlobe';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { audienceAPI } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#DD2A7B', '#F58529', '#8134AF', '#00F2EA', '#1DA1F2', '#FF0000', '#ffaa00'];

export default function AudiencePage() {
  const [platform, setPlatform] = useState(null);
  const [data, setData] = useState(null);
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = platform ? { platform } : {};
        const [demoRes, geoRes] = await Promise.all([
          audienceAPI.overview(params),
          audienceAPI.geographic(params),
        ]);
        setData(demoRes.data);
        setGeo(geoRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [platform]);

  if (loading) return <><Header title="Audience" /><LoadingSpinner /></>;

  const demographics = data?.demographics || data?.aggregated;
  const ageGroups = demographics?.ageGroups || [];
  const genderDist = demographics?.genderDistribution || [];
  const countries = geo?.countries || [];

  return (
    <>
      <Header title="Audience" subtitle="Understand your audience demographics" />

      <div style={{ marginBottom: 24 }}>
        <PlatformFilter platforms={['youtube', 'instagram', 'tiktok', 'twitter']} selected={platform} onChange={setPlatform} />
      </div>

      <AudienceGlobe />

      <div className="grid-2" style={{ marginTop: 24 }}>
        {/* Age Distribution */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Age Distribution</h3>
          {ageGroups.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ageGroups.map((a) => ({ name: a.range, value: a.percentage || a.count }))} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value.toFixed(0)}%`} labelLine={false}>
                  {ageGroups.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No age data available</p>}
        </div>

        {/* Gender Distribution */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Gender Distribution</h3>
          {genderDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={genderDist.map((g) => ({ name: g.gender, value: g.percentage || g.count }))} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value">
                  {genderDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No gender data available</p>}
        </div>
      </div>

      {/* Top Countries */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Top Countries</h3>
        {countries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {countries.slice(0, 10).map((c, i) => (
              <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 24, fontWeight: 600, color: 'var(--text-muted)', fontSize: 13 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{c.name || c.code}</span>
                <div style={{ width: 200, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ width: `${c.percentage || 0}%`, height: '100%', borderRadius: 4, background: COLORS[i % COLORS.length] }} />
                </div>
                <span style={{ width: 50, textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>{c.percentage || 0}%</span>
              </div>
            ))}
          </div>
        ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No geographic data available</p>}
      </div>
    </>
  );
}
