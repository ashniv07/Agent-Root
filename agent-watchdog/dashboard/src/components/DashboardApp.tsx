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
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import BubbleChartOutlinedIcon from '@mui/icons-material/BubbleChartOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
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

  const metricVisuals: Record<string, {
    delta: string;
    positive: boolean;
    linePath: string;
    fillPath: string;
    bars: number[];
  }> = {
    'total-requests': {
      delta: '+8.1%',
      positive: true,
      linePath: 'M2 60 C16 52, 24 46, 34 49 C44 52, 53 31, 64 34 C72 36, 82 27, 94 18',
      fillPath: 'M2 60 C16 52, 24 46, 34 49 C44 52, 53 31, 64 34 C72 36, 82 27, 94 18 L94 64 L2 64 Z',
      bars: [18, 26, 38, 44, 52, 66, 72, 80],
    },
    approved: {
      delta: '+5.6%',
      positive: true,
      linePath: 'M2 54 C14 50, 24 43, 34 45 C43 47, 52 27, 64 29 C73 31, 82 18, 94 10',
      fillPath: 'M2 54 C14 50, 24 43, 34 45 C43 47, 52 27, 64 29 C73 31, 82 18, 94 10 L94 64 L2 64 Z',
      bars: [24, 30, 34, 42, 50, 57, 65, 74],
    },
    flagged: {
      delta: '-2.3%',
      positive: false,
      linePath: 'M2 24 C14 27, 24 32, 34 37 C45 41, 55 33, 64 36 C74 39, 84 47, 94 55',
      fillPath: 'M2 24 C14 27, 24 32, 34 37 C45 41, 55 33, 64 36 C74 39, 84 47, 94 55 L94 64 L2 64 Z',
      bars: [70, 64, 58, 49, 46, 40, 33, 28],
    },
    killed: {
      delta: '-1.4%',
      positive: true,
      linePath: 'M2 38 C14 40, 24 44, 34 48 C45 51, 55 37, 64 39 C74 42, 84 31, 94 29',
      fillPath: 'M2 38 C14 40, 24 44, 34 48 C45 51, 55 37, 64 39 C74 42, 84 31, 94 29 L94 64 L2 64 Z',
      bars: [35, 32, 34, 30, 26, 29, 27, 25],
    },
    violations: {
      delta: '+3.2%',
      positive: false,
      linePath: 'M2 22 C14 24, 25 32, 36 35 C47 38, 57 29, 68 31 C79 33, 88 40, 94 45',
      fillPath: 'M2 22 C14 24, 25 32, 36 35 C47 38, 57 29, 68 31 C79 33, 88 40, 94 45 L94 64 L2 64 Z',
      bars: [52, 56, 60, 63, 59, 66, 71, 75],
    },
    agents: {
      delta: '+1.1%',
      positive: true,
      linePath: 'M2 56 C16 48, 25 46, 36 42 C47 38, 57 36, 68 31 C79 26, 88 19, 94 13',
      fillPath: 'M2 56 C16 48, 25 46, 36 42 C47 38, 57 36, 68 31 C79 26, 88 19, 94 13 L94 64 L2 64 Z',
      bars: [20, 26, 35, 41, 50, 57, 62, 70],
    },
  };

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
                    <div className="flex items-start justify-between gap-3">
                      <div className={`min-w-0 ${card.compact ? 'min-h-[170px]' : 'min-h-[176px]'}`}>
                        <p className="text-sm uppercase tracking-[0.08em] text-slate-300">{card.label}</p>
                        <p className={`mt-3 break-words font-semibold leading-tight ${card.compact ? 'text-3xl' : 'text-3xl md:text-4xl'} ${card.tone}`}>{card.value}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${metricVisuals[card.key].positive ? 'border-emerald-300/50 bg-emerald-500/15 text-emerald-200' : 'border-amber-300/50 bg-amber-500/10 text-amber-100'}`}>
                            {metricVisuals[card.key].delta}
                          </span>
                          <span className="text-slate-500">window trend</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/15 text-cyan-200 ${card.compact ? 'h-11 w-11' : 'h-12 w-12'}`}>
                        <card.icon fontSize="medium" />
                      </span>
                    </div>

                    <div className={`mt-3 rounded-xl border border-white/15 bg-slate-950/45 p-2 ${card.compact ? 'h-24' : 'h-20'}`}>
                      {card.compact ? (
                        <svg viewBox="0 0 96 64" className="h-full w-full">
                          <path d={metricVisuals[card.key].fillPath} fill="rgba(148, 163, 184, 0.16)" />
                          <path d={metricVisuals[card.key].linePath} fill="none" stroke="rgba(196, 181, 253, 0.95)" strokeWidth="2.2" />
                          <circle cx="94" cy="18" r="3" fill="rgba(255,255,255,0.9)" />
                        </svg>
                      ) : (
                        <div className="flex h-full items-end gap-1.5">
                          {metricVisuals[card.key].bars.map((height, index) => (
                            <span
                              key={`${card.key}-bar-${index}`}
                              className="w-full rounded-sm bg-gradient-to-t from-cyan-400/25 to-cyan-200/70"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </MagicBentoCard>
                ))}

            
              

            <section className="col-span-12 grid gap-3 lg:grid-cols-12">
              <MagicBentoCard className="col-span-12 lg:col-span-4" title={sectionTitle('Request Decisions', AnalyticsOutlinedIcon)} subtitle="Trends and distribution insights">
                  <InsightsDashboard refreshTrigger={refreshTrigger} view="decisions" hideHeader />
              </MagicBentoCard>

              <MagicBentoCard className="col-span-12 lg:col-span-4" title={sectionTitle('Violation Severity', AnalyticsOutlinedIcon)} subtitle="Distribution by severity">
                <div className="h-[560px] overflow-y-auto pr-1">
                  <InsightsDashboard refreshTrigger={refreshTrigger} view="severity" hideHeader />
                </div>
              </MagicBentoCard>

              <MagicBentoCard className="col-span-12 lg:col-span-4" title={sectionTitle('Live Event Feed', FeedOutlinedIcon)} subtitle="Streaming system activity">
                <div className="h-[560px] overflow-y-auto pr-1">
                  <EventFeed events={events} isConnected={isConnected} />
                </div>
              </MagicBentoCard>

              <MagicBentoCard className="col-span-12" title={sectionTitle('Recent Live Violations', GppBadOutlinedIcon)} subtitle="Latest policy and runtime exceptions">
              {violations.length === 0 ? (
                <div className="py-8 h-[100px] text-center text-slate-400">
                  No live violations received yet.
                </div>
              ) : (
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {violations.map((violation) => (
                    <ViolationCard key={violation.id} violation={violation} />
                  ))}
                </div>
              )}
              </MagicBentoCard>
            </section>
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
