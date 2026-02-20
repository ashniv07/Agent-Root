import { useEffect, useMemo, useState } from 'react';

interface StatsData {
  totalRequests: number;
  approvedRequests: number;
  flaggedRequests: number;
  killedRequests: number;
  totalViolations: number;
  criticalViolations: number;
  activeAgents: number;
  blockedAgents: number;
}

interface Violation {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface Request {
  decision?: 'APPROVE' | 'FLAG' | 'KILL';
}

interface InsightsDashboardProps {
  refreshTrigger?: number;
  view?: 'all' | 'decisions' | 'severity';
  hideHeader?: boolean;
}

const severityOrder: Array<Violation['severity']> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const severityColors: Record<Violation['severity'], string> = {
  LOW: '#16a34a',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#dc2626',
};

export function InsightsDashboard({ refreshTrigger = 0, view = 'all', hideHeader = false }: InsightsDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, violationsRes, requestsRes] = await Promise.all([
          fetch('/api/audit/stats/summary'),
          fetch('/api/audit/violations/all?limit=150'),
          fetch('/api/requests?limit=150'),
        ]);

        if (!statsRes.ok || !violationsRes.ok || !requestsRes.ok) {
          throw new Error('Failed to load dashboard insights');
        }

        const statsData = (await statsRes.json()) as StatsData;
        const violationsData = (await violationsRes.json()) as { violations: Violation[] };
        const requestsData = (await requestsRes.json()) as { requests: Request[] };

        setStats(statsData);
        setViolations(violationsData.violations || []);
        setRequests(requestsData.requests || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    void load();
  }, [refreshTrigger]);

  const severityCounts = useMemo(() => {
    const counts: Record<Violation['severity'], number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    for (const violation of violations) {
      counts[violation.severity] += 1;
    }
    return counts;
  }, [violations]);

  const decisionDistribution = useMemo(() => {
    const counts = {
      APPROVE: 0,
      FLAG: 0,
      KILL: 0,
      PENDING: 0,
    };
    for (const request of requests) {
      if (!request.decision) {
        counts.PENDING += 1;
      } else {
        counts[request.decision] += 1;
      }
    }
    const total = Math.max(1, requests.length);
    const approvePercent = (counts.APPROVE / total) * 100;
    const flagPercent = (counts.FLAG / total) * 100;
    const killPercent = (counts.KILL / total) * 100;
    const pendingPercent = (counts.PENDING / total) * 100;

    const chartStyle = {
      background: `conic-gradient(
        #16a34a 0% ${approvePercent}%,
        #eab308 ${approvePercent}% ${approvePercent + flagPercent}%,
        #dc2626 ${approvePercent + flagPercent}% ${approvePercent + flagPercent + killPercent}%,
        #475569 ${approvePercent + flagPercent + killPercent}% ${approvePercent + flagPercent + killPercent + pendingPercent}%
      )`,
    };

    return { counts, chartStyle };
  }, [requests]);

  if (loading || !stats) {
    if (view === 'decisions' || view === 'severity') {
      return <div className="h-56 animate-pulse border border-slate-700/70 bg-slate-900/30" />;
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2 lg:divide-x lg:divide-slate-700/70">
        <div className="h-56 animate-pulse border-b border-slate-800/80 pb-4 lg:border-b-0 lg:pb-0 lg:pr-5" />
        <div className="h-56 animate-pulse lg:pl-5" />
      </div>
    );
  }

  const totalViolations = Math.max(1, stats.totalViolations);

  if (view === 'decisions') {
    return (
      <section>
        {!hideHeader && (
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Request Decisions</h3>
            <span className="text-xs text-slate-400">Recent {requests.length} requests</span>
          </div>
        )}
        <div className="flex items-center gap-6">
          <div className="relative h-36 w-36 rounded-full" style={decisionDistribution.chartStyle}>
            <div className="absolute inset-5 rounded-full bg-slate-900/95" />
          </div>
          <div className="w-full divide-y divide-slate-800/80 text-sm">
            <p className="text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
              APPROVE: {decisionDistribution.counts.APPROVE}
            </p>
            <p className="pt-2 text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
              FLAG: {decisionDistribution.counts.FLAG}
            </p>
            <p className="pt-2 text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
              KILL: {decisionDistribution.counts.KILL}
            </p>
            <p className="pt-2 text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-slate-500" />
              PENDING: {decisionDistribution.counts.PENDING}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (view === 'severity') {
    return (
      <section>
        {!hideHeader && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Violation Severity</h3>
            <span className="text-xs text-slate-400">{stats.totalViolations} total</span>
          </div>
        )}
        <div className="divide-y divide-slate-800/80">
          {severityOrder.map((severity) => {
            const count = severityCounts[severity];
            const width = `${(count / totalViolations) * 100}%`;
            return (
              <div key={severity} className="py-2 first:pt-0">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{severity}</span>
                  <span className="text-slate-400">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ width, backgroundColor: severityColors[severity] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:divide-x lg:divide-slate-700/70">
      <section className="border-b border-slate-800/80 pb-5 lg:border-b-0 lg:pb-0 lg:pr-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Request Decisions</h3>
          <span className="text-xs text-slate-400">Recent {requests.length} requests</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative h-36 w-36 rounded-full" style={decisionDistribution.chartStyle}>
            <div className="absolute inset-5 rounded-full bg-slate-900/95" />
          </div>
          <div className="w-full divide-y divide-slate-800/80 text-sm">
            <p className="text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
              APPROVE: {decisionDistribution.counts.APPROVE}
            </p>
            <p className="pt-2 text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
              FLAG: {decisionDistribution.counts.FLAG}
            </p>
            <p className="pt-2 text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
              KILL: {decisionDistribution.counts.KILL}
            </p>
            <p className="pt-2 text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-slate-500" />
              PENDING: {decisionDistribution.counts.PENDING}
            </p>
          </div>
        </div>
      </section>

      <section className="lg:pl-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Violation Severity</h3>
          <span className="text-xs text-slate-400">{stats.totalViolations} total</span>
        </div>
        <div className="divide-y divide-slate-800/80">
          {severityOrder.map((severity) => {
            const count = severityCounts[severity];
            const width = `${(count / totalViolations) * 100}%`;
            return (
              <div key={severity} className="py-2 first:pt-0">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{severity}</span>
                  <span className="text-slate-400">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ width, backgroundColor: severityColors[severity] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
