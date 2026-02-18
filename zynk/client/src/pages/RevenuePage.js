import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import DateRangeSelector from '../components/common/DateRangeSelector';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { revenueAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { FiDollarSign } from 'react-icons/fi';

const SOURCE_COLORS = { adRevenue: '#FF0000', sponsorships: '#F58529', tips: '#00F2EA', memberships: '#8134AF', merchandise: '#1DA1F2', affiliates: '#DD2A7B', other: '#6b6b82' };

export default function RevenuePage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await revenueAPI.overview({ range });
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [range]);

  if (loading) return <><Header title="Revenue" /><LoadingSpinner /></>;

  const totals = data?.totals || {};
  const byPlatform = data?.byPlatform || {};
  const dailyTrend = data?.dailyTrend || [];

  const sources = Object.entries(totals)
    .filter(([k]) => k !== 'total')
    .map(([k, v]) => ({ name: k.replace(/([A-Z])/g, ' $1').trim(), value: v, color: SOURCE_COLORS[k] }))
    .filter((s) => s.value > 0);

  const platformData = Object.entries(byPlatform).map(([k, v]) => ({ platform: k, revenue: v }));

  return (
    <>
      <Header title="Revenue" subtitle="Track earnings across all platforms" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiDollarSign size={24} style={{ color: '#00d68f' }} />
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Revenue</p>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800 }}>${(totals.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <DateRangeSelector range={range} onChange={setRange} />
      </div>

      <div className="grid-2">
        {/* Revenue by Source (Waterfall-style) */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Revenue by Source</h3>
          {sources.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sources}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {sources.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No revenue data yet</p>}
        </div>

        {/* Revenue by Platform */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Revenue by Platform</h3>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={platformData} dataKey="revenue" nameKey="platform" cx="50%" cy="50%" outerRadius={100} innerRadius={60} label={({ platform, revenue }) => `${platform}: $${revenue}`}>
                  {platformData.map((_, i) => <Cell key={i} fill={Object.values(SOURCE_COLORS)[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No platform revenue data</p>}
        </div>
      </div>

      {/* Daily Trend */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Daily Revenue Trend</h3>
        {dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyTrend.map((d) => ({ date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }), revenue: d.revenue }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Line type="monotone" dataKey="revenue" stroke="#00d68f" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No daily revenue data</p>}
      </div>
    </>
  );
}
