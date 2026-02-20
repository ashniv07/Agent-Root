import { useEffect, useMemo, useState } from 'react';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

interface Request {
  id: string;
  agentId: string;
  action: string;
  target: string;
  status: string;
  decision?: string;
  createdAt: string;
  processedAt?: string;
}

interface RequestListProps {
  onSelectRequest?: (request: Request) => void;
  refreshTrigger?: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-600',
  processing: 'bg-blue-600 animate-pulse',
  approved: 'bg-green-600',
  flagged: 'bg-yellow-600',
  killed: 'bg-red-600',
};

const decisionLabels: Record<string, string> = {
  APPROVE: 'PASS',
  FLAG: 'WARN',
  KILL: 'FAIL',
};

type SortKey = 'newest' | 'oldest' | 'agent' | 'status';

const sortLabels: Record<SortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  agent: 'Agent',
  status: 'Status',
};

export function RequestList({ onSelectRequest, refreshTrigger }: RequestListProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [starredIds, setStarredIds] = useState<Record<string, true>>({});
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests?limit=50');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data.requests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      const matchesSearch =
        query.length === 0 ||
        request.id.toLowerCase().includes(query) ||
        request.agentId.toLowerCase().includes(query) ||
        request.action.toLowerCase().includes(query) ||
        request.target.toLowerCase().includes(query) ||
        request.status.toLowerCase().includes(query) ||
        (request.decision || '').toLowerCase().includes(query);

      const matchesStarred = !showStarredOnly || Boolean(starredIds[request.id]);
      return matchesSearch && matchesStarred;
    });

    return [...filtered].sort((a, b) => {
      if (starredIds[a.id] && !starredIds[b.id]) return -1;
      if (!starredIds[a.id] && starredIds[b.id]) return 1;

      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'agent') {
        return a.agentId.localeCompare(b.agentId);
      }
      return a.status.localeCompare(b.status);
    });
  }, [requests, search, showStarredOnly, sortBy, starredIds]);

  const toggleStar = (requestId: string) => {
    setStarredIds((prev) => {
      if (prev[requestId]) {
        const next = { ...prev };
        delete next[requestId];
        return next;
      }
      return { ...prev, [requestId]: true };
    });
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
        Error: {error}
        <button
          onClick={fetchRequests}
          className="ml-4 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No requests yet. Submit a request to see it here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
        <div className="relative min-w-[220px] h-[] flex-1">
          <SearchOutlinedIcon
            className="pointer-events-none absolute left-3  top-1/2 -translate-y-1/2 text-slate-400"
            fontSize="medium"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search agent, action, target, status..."
            className="w-full rounded-lg border border-slate-600 bg-slate-950/70 py-2.5 pl-12 pr-3 text-[20px] text-slate-100 outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
          <SortRoundedIcon fontSize="small" className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="bg-transparent text-sm text-slate-200 outline-none"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((option) => (
              <option key={option} value={option} className="bg-slate-900 text-slate-100">
                {sortLabels[option]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowStarredOnly((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
            showStarredOnly
              ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
              : 'border-slate-600 bg-slate-950/70 text-slate-200'
          }`}
        >
          {showStarredOnly ? <StarRoundedIcon fontSize="small" /> : <StarBorderRoundedIcon fontSize="small" />}
          Starred
        </button>
      </div>

      {visibleRequests.length === 0 ? (
        <div className="py-8 text-center text-slate-400">No requests match your filters.</div>
      ) : (
        <div className="max-h-[620px] overflow-y-auto pr-1">
          {visibleRequests.map((request, index) => (
            <div
              key={request.id}
              onClick={() => onSelectRequest?.(request)}
              className="grid cursor-pointer grid-cols-12 border-b border-slate-700/80 py-2 transition-colors hover:bg-slate-900/30"
            >
              <div
                className={`col-span-12 mb-2 flex items-center gap-2 border-r border-slate-700 px-2 py-1 sm:col-span-4 sm:mb-0 ${
                  index % 2 === 0 ? 'bg-slate-900/70' : 'bg-slate-800/55'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${statusColors[request.status]}`}></span>
                <span className="rounded-full border border-slate-600 bg-slate-950/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  {request.status}
                </span>
                <span className="truncate font-mono text-xs text-slate-300">{request.agentId}</span>
              </div>

              <div className="col-span-12 flex items-center justify-between gap-3 px-3 sm:col-span-8">
                <div className="flex min-w-0 items-center gap-1 text-sm">
                  <span className="text-cyan-300">{request.action}</span>
                  <span className="text-slate-500">to</span>
                  <span className="truncate text-slate-300">{request.target}</span>
                </div>

                <div className="flex items-center gap-2">
                  {request.decision && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        request.decision === 'APPROVE'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : request.decision === 'FLAG'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {decisionLabels[request.decision] ?? request.decision}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(request.createdAt).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleStar(request.id);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-700/70"
                    aria-label={starredIds[request.id] ? 'Unstar request' : 'Star request'}
                    title={starredIds[request.id] ? 'Unstar' : 'Star'}
                  >
                    {starredIds[request.id] ? (
                      <StarRoundedIcon fontSize="small" className="text-amber-300" />
                    ) : (
                      <StarBorderRoundedIcon fontSize="small" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
