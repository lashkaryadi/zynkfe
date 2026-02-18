import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import DateRangeSelector from '../components/common/DateRangeSelector';
import PlatformFilter from '../components/common/PlatformFilter';
import GrowthChart from '../components/dashboard/GrowthChart';
import PostingHeatmap from '../components/analytics/PostingHeatmap';
import EngagementMeter from '../components/analytics/EngagementMeter';
import BubbleChart from '../components/analytics/BubbleChart';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyticsAPI, insightsAPI, contentAPI } from '../services/api';
import { FiTrendingUp, FiTrendingDown, FiEye, FiUsers } from 'react-icons/fi';

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [platform, setPlatform] = useState(null);
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = { range, ...(platform ? { platform } : {}) };

        if (platform) {
          const res = await analyticsAPI.platformDeepDive(platform, { range });
          setData(res.data);
        } else {
          const res = await analyticsAPI.overview({ range });
          setData(res.data);
        }

        const [heatRes, contentRes] = await Promise.all([
          insightsAPI.postingTimes(params),
          contentAPI.top(params),
        ]);
        setHeatmap(heatRes.data);
        setContent(contentRes.data?.topContent || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [range, platform]);

  if (loading) return <><Header title="Analytics" /><LoadingSpinner /></>;

  const comparison = data?.comparison;
  const platforms = ['youtube', 'instagram', 'tiktok', 'twitter'];

  return (
    <>
      <Header title="Analytics" subtitle={platform ? `${platform} deep dive` : 'All platforms aggregated'} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
        <PlatformFilter platforms={platforms} selected={platform} onChange={setPlatform} />
        <DateRangeSelector range={range} onChange={setRange} />
      </div>

      {comparison && (
        <div className="grid-4" style={{ marginBottom: 40 }}>
          <StatCard label="Views" value={comparison.views?.current || 0} change={comparison.views?.change} icon={FiEye} color="#DD2A7B" />
          <StatCard label="Likes" value={comparison.likes?.current || 0} change={comparison.likes?.change} icon={FiTrendingUp} color="#F58529" />
          <StatCard label="New Followers" value={comparison.followers?.current || 0} change={comparison.followers?.change} icon={FiUsers} color="#8134AF" />
          <StatCard label="Engagement" value={comparison.engagement?.current || 0} change={comparison.engagement?.change} icon={FiTrendingUp} color="#00F2EA" suffix="%" />
        </div>
      )}

      <div className="grid-2">
        <GrowthChart data={data?.dailyData || data?.trends} />
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Engagement Rate</h3>
          <EngagementMeter rate={data?.summary?.avgEngagementRate || data?.account?.currentMetrics?.engagementRate || 0} size={180} />
        </div>
      </div>

      <PostingHeatmap data={heatmap?.heatmap} />

      <BubbleChart content={content} />
    </>
  );
}
