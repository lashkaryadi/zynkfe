import { useState, useEffect, useCallback } from 'react';

export function useApi(apiFn, params = null, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams || params);
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn, params]);

  useEffect(() => {
    if (immediate) execute();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute };
}

export function useDateRange() {
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  const params = { range };
  if (range === 'custom') {
    params.startDate = customStart;
    params.endDate = customEnd;
  }

  return { range, setRange, customStart, setCustomStart, customEnd, setCustomEnd, params };
}

export function usePlatformFilter() {
  const [platform, setPlatform] = useState(null);
  return { platform, setPlatform, params: platform ? { platform } : {} };
}
