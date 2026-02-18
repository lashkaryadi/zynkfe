import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import PlatformFilter from '../components/common/PlatformFilter';
import PostingHeatmap from '../components/analytics/PostingHeatmap';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { insightsAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { FiTarget, FiCalendar, FiTrendingUp, FiAward } from 'react-icons/fi';

export default function PredictionsPage() {
  const [platform, setPlatform] = useState(null);
  const [followerPred, setFollowerPred] = useState(null);
  const [contentPred, setContentPred] = useState(null);
  const [postingTimes, setPostingTimes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = platform ? { platform } : {};
        const [fRes, cRes, pRes] = await Promise.all([
          insightsAPI.followerPredictions({ ...params, days: 30 }),
          insightsAPI.contentPredictions(params),
          insightsAPI.postingTimes(params),
        ]);
        setFollowerPred(fRes.data);
        setContentPred(cRes.data);
        setPostingTimes(pRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [platform]);

  if (loading) return <><Header title="Predictions" /><LoadingSpinner /></>;

  const predictions = followerPred?.predictions || [];
  const milestones = followerPred?.milestones || [];
  const model = followerPred?.model;
  const bestTimes = postingTimes?.bestTimes || [];
  const typePerf = contentPred?.typePerformance || {};

  return (
    <>
      <Header title="AI Predictions" subtitle="Data-driven forecasts for your growth" />

      <div style={{ marginBottom: 24 }}>
        <PlatformFilter platforms={['youtube', 'instagram', 'tiktok', 'twitter']} selected={platform} onChange={setPlatform} />
      </div>

      {/* Follower Growth Forecast */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Follower Growth Forecast (30 Days)</h3>
        {model && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Avg. daily growth: <strong style={{ color: 'var(--accent-green)' }}>+{model.avgDailyGrowth}</strong> | Model confidence: {(model.rSquared * 100).toFixed(0)}%</p>}
        {predictions.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictions.map((p) => ({ date: new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }), followers: p.predictedFollowers, confidence: p.confidence * 100 }))}>
              <defs>
                <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DD2A7B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#DD2A7B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="followers" stroke="#DD2A7B" strokeWidth={2} fill="url(#followerGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>{followerPred?.error || 'Not enough data for predictions'}</p>}
      </div>

      {/* Milestones & Best Times */}
      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiAward /> Predicted Milestones</h3>
          {milestones.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {milestones.map((m) => (
                <div key={m.milestone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 20 }}>{m.milestone.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>followers</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.daysToReach} days</span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.estimatedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-secondary)' }}>No milestone predictions available</p>}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiCalendar /> Best Posting Times</h3>
          {bestTimes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bestTimes.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: i === 0 ? 'rgba(221,42,123,0.1)' : 'transparent', border: i === 0 ? '1px solid rgba(221,42,123,0.2)' : '1px solid transparent' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{t.dayName} at {t.hour}:00</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>~{t.avgEngagement.toLocaleString()} eng</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-secondary)' }}>Not enough data to analyze posting times</p>}
        </div>
      </div>

      {/* Content Type Performance */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Content Type Performance</h3>
        {Object.keys(typePerf).length > 0 ? (
          <div className="grid-3">
            {Object.entries(typePerf).map(([type, perf]) => (
              <div key={type} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize', marginBottom: 12 }}>{type}s</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Avg Views: <strong style={{ color: 'var(--text-primary)' }}>{perf.avgViews?.toLocaleString()}</strong></p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Avg Likes: <strong style={{ color: 'var(--text-primary)' }}>{perf.avgLikes?.toLocaleString()}</strong></p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Posts: <strong style={{ color: 'var(--text-primary)' }}>{perf.count}</strong></p>
                {contentPred?.bestContentType === type && (
                  <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 6, background: 'var(--gradient-primary)', fontSize: 11, fontWeight: 700 }}>Best Performer</span>
                )}
              </div>
            ))}
          </div>
        ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Not enough data</p>}
      </div>

      <PostingHeatmap data={postingTimes?.heatmap} title="Engagement Heatmap by Posting Time" />
    </>
  );
}
