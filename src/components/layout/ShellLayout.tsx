import { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import ProgressRail from '../progress/ProgressRail';
import useTournamentStore from '../../store/useTournamentStore';

// ShellLayout provides the global chrome with branding, navigation and the animated page container.

const ShellLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const phase = useTournamentStore((state) => state.currentPhase);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary" />
            <div className="text-left">
              <p>Ultimate Scheduler</p>
              <p className="text-xs text-slate-400">Diseña torneos con fluidez</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <Link
              to="/"
              className={clsx('transition hover:text-white', location.pathname === '/' && 'text-white')}
            >
              Constructor
            </Link>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
              Fase actual: {phase}
            </span>
          </nav>
        </div>
        <ProgressRail />
      </header>
      <motion.main
        key={location.pathname}
        className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl flex-col px-4 pb-16"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ShellLayout;
