import { useEffect, useState } from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import { DashboardApp } from './components/DashboardApp';
import { AgentFlow } from './components/AgentFlow';
import { SpotlightCard } from './components/SpotlightCard';
import botIcon from './styles/icons/bot-icon.png';

const typedTexts = [
  'Monitor every request through a multi-agent security pipeline.',
  'Classify risk, detect violations, and trigger kill-switch controls instantly.',
  'Audit every decision with traceable reasoning and live event streams.',
];

function App() {
  const [started, setStarted] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (started) return;

    const fullText = typedTexts[textIndex % typedTexts.length];
    const pauseMs = 1200;
    const typingSpeed = 42;
    const deletingSpeed = 28;

    if (!isDeleting && display === fullText) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), pauseMs);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && display === '') {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % typedTexts.length);
      return;
    }

    const nextValue = isDeleting
      ? fullText.slice(0, Math.max(0, display.length - 1))
      : fullText.slice(0, Math.min(fullText.length, display.length + 1));

    const timer = setTimeout(
      () => setDisplay(nextValue),
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timer);
  }, [display, isDeleting, started, textIndex]);

  if (started) {
    return <DashboardApp />;
  }

  const highlights = [
    {
      icon: <AccountTreeOutlinedIcon fontSize="small" />,
      title: 'Pipeline Intelligence',
      description:
        'Requests flow through orchestrator, monitoring, error analysis, severity classification, and decisioning.',
    },
    {
      icon: <GppBadOutlinedIcon fontSize="small" />,
      title: 'Violation Visibility',
      description:
        'Track policy breaches by severity with filtered views, evidence snapshots, and actionable remediation context.',
    },
    {
      icon: <FactCheckOutlinedIcon fontSize="small" />,
      title: 'Audit Assurance',
      description:
        'Each decision is logged with reasoning and processing path so governance teams can review complete history.',
    },
    {
      icon: <PowerSettingsNewOutlinedIcon fontSize="small" />,
      title: 'Kill-Switch Control',
      description:
        'Trigger targeted or emergency agent blocks, then restore safely with clear operational status in real time.',
    },
  ];

  const demoProcessingPath = [
    'orchestrator',
    'workerMonitor',
    'errorAnalyzer',
    'severityClassifier',
    'fixProposer',
    'decisionEngine',
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#101010_45%,_#050505_100%)] text-slate-100">
      <div className="flex min-h-screen w-full flex-col px-4 py-6 sm:px-5 md:px-10 md:py-10 lg:px-14">
        <header className="mb-5 flex items-center gap-3 text-cyan-300 sm:mb-6">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/35 bg-cyan-400/10 text-base font-bold">
            <img src={botIcon} alt="Agent Watchdog" className="h-5 w-5 object-contain" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-100">Agent Watchdog</p>
           
          </div>
        </header>

        <section className="relative w-full overflow-hidden ">
          <header className="relative flex min-h-[62vh] items-center justify-center px-2 py-10 text-center sm:min-h-[66vh] sm:py-14 md:px-8">
            <div className="relative z-10 max-w-5xl ">
              <h1 className="mb-5 text-3xl font-semibold text-slate-200 leading-[1.08] sm:text-4xl md:mb-10 md:text-6xl lg:text-7xl ">
                Custom governance
                <br />
                for AI agent workflows
              </h1>
              <div className="mx-auto max-w-2xl text-xs italic text-slate-300 sm:text-sm md:text-base mb-7">
              <span className="inline-flex items-center">
              <span>{display}</span>
              <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-cyan-300" />
              </span>
              </div>

              <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 md:mt-5 md:text-base">
                Deliver secure AI operations with clear controls, live insights, and complete auditability.
              </p>
              <div className="mt-8 flex justify-center md:mt-10">
                <button onClick={() => setStarted(true)} className="magic-button">
                  Enter Dashboard
                </button>
              </div>
            </div>
          </header>
        </section>
         <section className="mt-8 w-full md:mt-5 mb-8">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-semibold text-slate-200 sm:text-2xl md:text-4xl">Platform Highlights</h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base md:mt-3 md:text-lg m">Core capabilities at a glance</p>
          </div>

          <div className="marquee-container">
            <div className="marquee-track">
              {[...highlights, ...highlights].map((item, index) => (
                <div key={`${item.title}-${index}`} className="marquee-item">
                  <SpotlightCard title={item.title} description={item.description} icon={item.icon}>
                    <p className="mt-5 text-xs uppercase tracking-[0.16em] text-cyan-300/80">
                      Agent Watchdog
                    </p>
                  </SpotlightCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 w-full md:mt-10">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl md:text-4xl">AI Flow Diagram</h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base md:mt-3 md:text-lg">Governance pipeline overview</p>
          </div>
          <div className="w-full">
            <AgentFlow processingPath={demoProcessingPath} />
          </div>
        </section>

       

        <footer className="mt-auto pt-8 text-center text-sm text-slate-500">copyright (cp) 2026 . Agent Watchdog</footer>
      </div>
    </div>
  );
}

export default App;

