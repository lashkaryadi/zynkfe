import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import DateRangeSelector from '../components/common/DateRangeSelector';
import StatCard from '../components/common/StatCard';
import TotalFollowers from '../components/dashboard/TotalFollowers';
import PlatformCards from '../components/dashboard/PlatformCards';
import GrowthChart from '../components/dashboard/GrowthChart';
import ContentGrid from '../components/dashboard/ContentGrid';
import RevenueTracker from '../components/dashboard/RevenueTracker';
import Platform3DChart from '../components/three/Platform3DChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyticsAPI, revenueAPI } from '../services/api';
import { FiEye, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import './Dashboard.css';

export default function Dashboard() {
  const [range, setRange] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ovRes, revRes] = await Promise.all([
          analyticsAPI.overview({ range }),
          revenueAPI.overview({ range }),
        ]);
        setOverview(ovRes.data);
        setRevenue(revRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
      setLoading(false);
    }
    load();
  }, [range]);

  if (loading) return <><Header title="Dashboard" /><LoadingSpinner /></>;

  const summary = overview?.summary || {};

  return (
    <>
      <Header title="Dashboard" subtitle="Your unified creator analytics" />

      <div className="dashboard-toolbar">
        <DateRangeSelector range={range} onChange={setRange} />
      </div>

      <TotalFollowers
        total={overview?.totalFollowers}
        platforms={overview?.platformBreakdown}
      />

      <div className="grid-4" style={{ marginTop: 40 }}>
        <StatCard label="Total Views" value={summary.totalViews || 0} icon={FiEye} color="#DD2A7B" />
        <StatCard label="Total Likes" value={summary.totalLikes || 0} icon={FiHeart} color="#F58529" />
        <StatCard label="Comments" value={summary.totalComments || 0} icon={FiMessageCircle} color="#8134AF" />
        <StatCard label="Shares" value={summary.totalShares || 0} icon={FiShare2} color="#00F2EA" />
      </div>

      <PlatformCards platforms={overview?.platformBreakdown} />

      <div className="dashboard-charts grid-2" style={{ marginTop: 40 }}>
        <GrowthChart data={overview?.dailyData} />
        <Platform3DChart platforms={overview?.platformBreakdown} />
      </div>

      <ContentGrid content={overview?.topContent} />

      <RevenueTracker totals={revenue?.totals} byPlatform={revenue?.byPlatform} />
    </>
  );
}
