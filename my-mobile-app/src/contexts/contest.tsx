import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchContestDetail, type ContestDetail } from '@/lib/contest-api';

type ContestContextValue = {
  contestId: string;
  data: ContestDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (next: ContestDetail | null) => void;
};

const ContestContext = createContext<ContestContextValue | undefined>(undefined);

export function ContestProvider({
  contestId,
  children,
}: {
  contestId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contestId) return;
    setError(null);
    try {
      const detail = await fetchContestDetail(contestId);
      setData(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contest');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ contestId, data, loading, error, refresh, setData }),
    [contestId, data, loading, error, refresh]
  );

  return <ContestContext.Provider value={value}>{children}</ContestContext.Provider>;
}

export function useContest() {
  const ctx = useContext(ContestContext);
  if (!ctx) throw new Error('useContest must be used within ContestProvider');
  return ctx;
}
