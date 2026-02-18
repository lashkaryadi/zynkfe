import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import PlatformFilter from '../components/common/PlatformFilter';
import ContentGrid from '../components/dashboard/ContentGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlatformIcon, { getPlatformName } from '../components/common/PlatformIcon';
import { contentAPI } from '../services/api';
import { FiEye, FiHeart, FiMessageCircle, FiShare2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ContentPage() {
  const [platform, setPlatform] = useState(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('publishedAt');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = { page, limit: 20, sortBy, ...(platform ? { platform } : {}) };
        const res = await contentAPI.list(params);
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [platform, page, sortBy]);

  if (loading) return <><Header title="Content" /><LoadingSpinner /></>;

  const content = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <>
      <Header title="Content Analysis" subtitle="What's working, what's not" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <PlatformFilter platforms={['youtube', 'instagram', 'tiktok', 'twitter']} selected={platform} onChange={(p) => { setPlatform(p); setPage(1); }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Latest', value: 'publishedAt' },
            { label: 'Most Viewed', value: 'metrics.views' },
            { label: 'Top Rated', value: 'performanceScore' },
          ].map((s) => (
            <button key={s.value} className={`btn ${sortBy === s.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setSortBy(s.value); setPage(1); }}
              style={{ padding: '6px 14px', fontSize: 13 }}>{s.label}</button>
          ))}
        </div>
      </div>

      {content.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {content.map((item) => (
            <a key={item._id} href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="card"
              style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ width: 120, height: 68, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)' }}>
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><PlatformIcon platform={item.platform} size={20} /></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PlatformIcon platform={item.platform} size={14} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.type}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title || item.description?.substring(0, 80) || 'Untitled'}
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(item.publishedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ textAlign: 'center' }}><FiEye size={14} style={{ color: 'var(--text-muted)' }} /><p style={{ fontWeight: 700, fontSize: 14 }}>{(item.metrics?.views || 0).toLocaleString()}</p></div>
                <div style={{ textAlign: 'center' }}><FiHeart size={14} style={{ color: 'var(--text-muted)' }} /><p style={{ fontWeight: 700, fontSize: 14 }}>{(item.metrics?.likes || 0).toLocaleString()}</p></div>
                <div style={{ textAlign: 'center' }}><FiMessageCircle size={14} style={{ color: 'var(--text-muted)' }} /><p style={{ fontWeight: 700, fontSize: 14 }}>{(item.metrics?.comments || 0).toLocaleString()}</p></div>
                <div style={{ textAlign: 'center' }}><FiShare2 size={14} style={{ color: 'var(--text-muted)' }} /><p style={{ fontWeight: 700, fontSize: 14 }}>{(item.metrics?.shares || 0).toLocaleString()}</p></div>
              </div>
              {item.performanceScore > 0 && (
                <div style={{ background: 'var(--gradient-primary)', borderRadius: 8, padding: '4px 12px', fontWeight: 700, fontSize: 13 }}>
                  {item.performanceScore}
                </div>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          No content found. Connect your platforms and sync data.
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button className="btn btn-secondary" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>
            <FiChevronLeft /> Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button className="btn btn-secondary" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </>
  );
}
