import { useState } from 'react';
import { mirrorApi } from '@/lib/api';
import type { MirrorAnalysis } from '@/pages/BehavioralMirror';

export function useMirrorAnalysis() {
  const [analysis, setAnalysis] = useState<MirrorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = forceRefresh
        ? await mirrorApi.refreshAnalysis()
        : await mirrorApi.getAnalysis();
      // The API wrapper returns { success: boolean, data: MirrorAnalysis }
      setAnalysis(res.data as unknown as MirrorAnalysis);
    } catch (err) {
      setError('Could not generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, error, fetchAnalysis };
}
