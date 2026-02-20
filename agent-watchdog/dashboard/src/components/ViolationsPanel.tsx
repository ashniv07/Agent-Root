import { useEffect, useMemo, useState } from 'react';
import { ViolationCard } from './ViolationCard';

interface Violation {
  id: string;
  requestId: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence?: string;
  suggestedFix?: string;
  detectedAt: string;
}

interface ViolationsPanelProps {
  refreshTrigger?: number;
}

const filters: Array<Violation['severity'] | 'ALL'> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function ViolationsPanel({ refreshTrigger = 0 }: ViolationsPanelProps) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<Violation['severity'] | 'ALL'>('ALL');

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await fetch('/api/audit/violations/all?limit=120');
        if (!response.ok) throw new Error('Failed to fetch violations');
        const data = (await response.json()) as { violations: Violation[] };
        setViolations(data.violations || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    void fetchViolations();
  }, [refreshTrigger]);

  const filtered = useMemo(() => {
    if (selectedSeverity === 'ALL') return violations;
    return violations.filter((item) => item.severity === selectedSeverity);
  }, [selectedSeverity, violations]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedSeverity(filter)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              selectedSeverity === filter
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading && <div className="py-8 text-center text-slate-400">Loading violations...</div>}
      {!loading && filtered.length === 0 && (
        <div className="py-8 text-center text-slate-400">No violations found for this filter.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
          {filtered.map((violation) => (
            <ViolationCard key={violation.id} violation={violation} />
          ))}
        </div>
      )}
    </div>
  );
}
