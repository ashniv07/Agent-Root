import { useState, useEffect, useCallback } from 'react';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import OutlinedFlagOutlinedIcon from '@mui/icons-material/OutlinedFlagOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { RequestList } from './RequestList';
import { AuditLog } from './AuditLog';
import { ViolationCard } from './ViolationCard';
import { KillSwitch } from './KillSwitch';
import { EventFeed } from './EventFeed';
import { InsightsDashboard } from './InsightsDashboard';
import { ViolationsPanel } from './ViolationsPanel';
import { MagicBento, MagicBentoCard } from './MagicBento';
import { useWebSocket } from '../hooks/useWebSocket';
import botIcon from '../styles/icons/bot-icon.png';

interface Violation {
  id: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence?: string;
  suggestedFix?: string;
  detectedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface HomeStatsSummary {
  totalRequests: number;
  approvedRequests: number;
  flaggedRequests: number;
  killedRequests: number;
  totalViolations: number;
  blockedAgents: number;
  activeAgents: number;
}

type TabKey = 'home' | 'requests' | 'audits' | 'violations' | 'control' | 'chat';

export function DashboardApp() {
  const { isConnected, events, lastEvent } = useWebSocket();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [homeStats, setHomeStats] = useState<HomeStatsSummary | null>(null);
  const [homeStatsLoading, setHomeStatsLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Agent Watchdog assistant is ready. Ask for stats, requests, violations, or blocked agents.',
      timestamp: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.type === 'request:processed' ||
      lastEvent.type === 'killswitch:triggered'
    ) {
      setRefreshTrigger((prev) => prev + 1);
    }

    if (lastEvent.type === 'violation:detected') {
      const data = lastEvent.data as { violation?: Partial<Violation> };
      const incoming = data.violation;
      if (incoming?.type && incoming.description && incoming.severity) {
        const normalized: Violation = {
          id: crypto.randomUUID(),
          type: incoming.type,
          description: incoming.description,
          severity: incoming.severity,
          evidence: incoming.evidence,
          suggestedFix: incoming.suggestedFix,
          detectedAt: new Date().toISOString(),
        };
        setViolations((prev) => [normalized, ...prev].slice(0, 8));
      }
    }

  }, [lastEvent]);

  useEffect(() => {
    const loadHomeStats = async () => {
      try {
        const response = await fetch('/api/audit/stats/summary');
        if (!response.ok) throw new Error('Failed to load home stats');
        const data = (await response.json()) as HomeStatsSummary;
        setHomeStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setHomeStatsLoading(false);
      }
    };

    setHomeStatsLoading(true);
    void loadHomeStats();
  }, [refreshTrigger]);

  const handleKillSwitch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const tabs: Array<{ key: TabKey; label: string; description: string }> = [
    { key: 'home', label: 'Home', description: 'Pipeline and analytics' },
    { key: 'requests', label: 'Requests', description: 'Incoming and processed requests' },
    { key: 'audits', label: 'Audits', description: 'Decision trail and reasoning' },
    { key: 'violations', label: 'Violations', description: 'Policy violations and details' },
    { key: 'control', label: 'Control', description: 'Kill switch and live events' },
    { key: 'chat', label: 'Chatbot', description: 'Ask questions about system status' },
  ];

  const metricCards = homeStats
    ? [
        {
          key: 'total-requests',
          label: 'Total Requests',
          value: homeStats.totalRequests.toLocaleString(),
          icon: ReceiptLongOutlinedIcon,
          tone: 'text-slate-100',
          className: 'col-span-12 sm:col-span-6 lg:col-span-3',
          compact: true,
        },
        {
          key: 'approved',
          label: 'Approved',
          value: homeStats.approvedRequests.toLocaleString(),
          icon: CheckCircleOutlineOutlinedIcon,
          tone: 'text-emerald-300',
          className: 'col-span-12 sm:col-span-6 lg:col-span-3',
          compact: true,
        },
        {
          key: 'flagged',
          label: 'Flagged',
          value: homeStats.flaggedRequests.toLocaleString(),
          icon: OutlinedFlagOutlinedIcon,
          tone: 'text-amber-300',
          className: 'col-span-12 sm:col-span-6 lg:col-span-3',
          compact: true,
        },
        {
          key: 'killed',
          label: 'Killed',
          value: homeStats.killedRequests.toLocaleString(),
          icon: BlockOutlinedIcon,
          tone: 'text-rose-300',
          className: 'col-span-12 sm:col-span-6 lg:col-span-3',
          compact: true,
        },
        {
          key: 'violations',
          label: 'Total Violations',
          value: homeStats.totalViolations.toLocaleString(),
          icon: ReportProblemOutlinedIcon,
          tone: 'text-orange-300',
          className: 'col-span-12 lg:col-span-6',
          compact: false,
        },
        {
          key: 'agents',
          label: 'Active Agents',
          value: `${homeStats.activeAgents.toLocaleString()} (${homeStats.blockedAgents.toLocaleString()} blocked)`,
          icon: SmartToyOutlinedIcon,
          tone: 'text-cyan-300',
          className: 'col-span-12 lg:col-span-6',
          compact: false,
        },
      ]
    : [];

  const sectionTitle = (label: string, Icon: typeof AnalyticsOutlinedIcon) => (
    <span className="inline-flex items-center gap-2 text-slate-100">
      <Icon fontSize="small" className="text-cyan-300" />
      <span>{label}</span>
    </span>
  );

  const generateAssistantReply = useCallback(async (input: string): Promise<string> => {
    const query = input.toLowerCase();

    if (query.includes('stat')) {
      const response = await fetch('/api/audit/stats/summary');
      if (!response.ok) throw new Error('Unable to fetch stats');
      const stats = await response.json() as {
        totalRequests: number;
        approvedRequests: number;
        flaggedRequests: number;
        killedRequests: number;
        blockedAgents: number;
      };
      return `Stats snapshot: total=${stats.totalRequests}, approved=${stats.approvedRequests}, flagged=${stats.flaggedRequests}, killed=${stats.killedRequests}, blockedAgents=${stats.blockedAgents}.`;
    }

    if (query.includes('blocked') || query.includes('kill')) {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Unable to fetch agents');
      const data = await response.json() as { agents: Array<{ agentId: string; isActive: boolean }> };
      const blocked = data.agents.filter((agent) => !agent.isActive);
      if (blocked.length === 0) return 'No blocked agents right now.';
      return `Blocked agents (${blocked.length}): ${blocked.map((agent) => agent.agentId).join(', ')}.`;
    }

    if (query.includes('request')) {
      const response = await fetch('/api/requests?limit=5');
      if (!response.ok) throw new Error('Unable to fetch requests');
      const data = await response.json() as { requests: Array<{ agentId: string; action: string; decision?: string }> };
      if (!data.requests.length) return 'No requests found yet.';
      const summary = data.requests
        .map((request) => `${request.agentId}:${request.action}:${request.decision ?? 'PENDING'}`)
        .join(' | ');
      return `Recent requests: ${summary}.`;
    }

    if (query.includes('violation')) {
      const response = await fetch('/api/audit/violations/all?limit=5');
      if (!response.ok) throw new Error('Unable to fetch violations');
      const data = await response.json() as { violations: Array<{ type: string; severity: string }> };
      if (!data.violations.length) return 'No violations found.';
      const summary = data.violations
        .map((violation) => `${violation.type} (${violation.severity})`)
        .join(', ');
      return `Recent violations: ${summary}.`;
    }

    return 'Try asking: "stats", "recent requests", "violations", or "blocked agents".';
  }, []);

  const sendMessage = useCallback(async () => {
    const input = chatInput.trim();
    if (!input || chatLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const responseText = await generateAssistantReply(input);
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `Chatbot error: ${error instanceof Error ? error.message : 'unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, generateAssistantReply]);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,_#1c1c1c_0%,_#101010_44%,_#050505_100%)] text-slate-100">
      <aside className="w-72 border-r border-slate-700/70 bg-slate-950/75 px-4 py-5">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-sm font-semibold text-cyan-300">
            <img src={botIcon} alt="Agent Watchdog" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Agent Watchdog</h1>
            <p className="text-xs text-slate-400">Security Operations Console</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/70 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Live Connection' : 'Offline'}</span>
          </div>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                activeTab === tab.key
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                  : 'border-slate-700/70 bg-slate-900/65 text-slate-300 hover:bg-slate-800'
              }`}
              title={tab.description}
            >
              <p className="text-sm font-semibold">{tab.label}</p>
              <p className="text-xs text-slate-400">{tab.description}</p>
            </button>
          ))}
        </nav>

        <footer className="mt-8 text-center text-xs text-slate-500">© Agent Watchdog</footer>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-6">
        {activeTab === 'home' && (
          <MagicBento>
            {homeStatsLoading
              ? [...Array(6)].map((_, index) => (
                  <MagicBentoCard key={`stats-skeleton-${index}`} className={index < 4 ? 'col-span-12 sm:col-span-6 lg:col-span-3' : 'col-span-12 lg:col-span-6'}>
                    <div className="h-24  animate-pulse rounded-xl border border-slate-700 bg-slate-900/60" />
                  </MagicBentoCard>
                ))
              : metricCards.map((card) => (
                  <MagicBentoCard key={card.key} className={card.className}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 h-[100px]">
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{card.label}</p>
                        <p className={`mt-2 font-semibold ${card.compact ? 'text-xl' : 'text-2xl'} ${card.tone}`}>{card.value}</p>
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 ${card.compact ? 'h-8 w-8' : 'h-9 w-9'}`}>
                        <card.icon fontSize="small" />
                      </span>
                    </div>
                  </MagicBentoCard>
                ))}

            <section className="col-span-12">
              <header className="mb-3">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-100">
                  <AnalyticsOutlinedIcon fontSize="small" className="text-cyan-300" />
                  <span>Visualization Dashboard</span>
                </h2>
                <p className="text-sm text-slate-400">Trends and distribution insights</p>
              </header>
              <InsightsDashboard refreshTrigger={refreshTrigger} />
            </section>

            <MagicBentoCard className="col-span-12 lg:col-span-6" title={sectionTitle('Recent Live Violations', GppBadOutlinedIcon)} subtitle="Latest policy and runtime exceptions">
              {violations.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No live violations received yet.
                </div>
              ) : (
                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {violations.map((violation) => (
                    <ViolationCard key={violation.id} violation={violation} />
                  ))}
                </div>
              )}
            </MagicBentoCard>

            <MagicBentoCard className="col-span-12 lg:col-span-6" title={sectionTitle('Live Event Feed', FeedOutlinedIcon)} subtitle="Streaming system activity">
              <EventFeed events={events} isConnected={isConnected} />
            </MagicBentoCard>
          </MagicBento>
        )}

        {activeTab === 'requests' && (
          <MagicBentoCard title="Requests" subtitle="Incoming and processed request queue">
            <RequestList refreshTrigger={refreshTrigger} />
          </MagicBentoCard>
        )}

        {activeTab === 'audits' && (
          <MagicBentoCard title="Audit Trail" subtitle="Decision chain and reasoning history">
            <AuditLog refreshTrigger={refreshTrigger} />
          </MagicBentoCard>
        )}

        {activeTab === 'violations' && (
          <MagicBentoCard title="Violations" subtitle="Filter by severity and inspect evidence">
            <ViolationsPanel refreshTrigger={refreshTrigger} />
          </MagicBentoCard>
        )}

        {activeTab === 'control' && (
          <MagicBento>
            <MagicBentoCard className="col-span-12 lg:col-span-7" title="Kill Switch Controls">
              <KillSwitch onKillSwitch={handleKillSwitch} refreshTrigger={refreshTrigger} />
            </MagicBentoCard>
            <MagicBentoCard className="col-span-12 lg:col-span-5" title="Live Event Feed">
              <EventFeed events={events} isConnected={isConnected} />
            </MagicBentoCard>
          </MagicBento>
        )}

        {activeTab === 'chat' && (
          <MagicBentoCard title="Chatbot" subtitle="Ask operational questions about your watchdog data">
            <div className="flex h-[620px] flex-col gap-3">
              <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-cyan-500/20 text-cyan-100'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void sendMessage();
                  }}
                  placeholder='Ask: "stats", "recent requests", "violations", "blocked agents"...'
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={chatLoading}
                  className="rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-60"
                >
                  {chatLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </MagicBentoCard>
        )}
      </main>
    </div>
  );
}
