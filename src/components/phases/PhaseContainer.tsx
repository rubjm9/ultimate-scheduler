import { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// PhaseContainer encapsulates the styling and availability logic shared by each phase card.

interface PhaseContainerProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  index: number;
  isLocked: boolean;
  isCompleted: boolean;
}

const PhaseContainer = ({
  title,
  subtitle,
  index,
  isLocked,
  isCompleted,
  children
}: PhaseContainerProps) => {
  return (
    <motion.section
      layout
      className={clsx(
        'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-900/40 backdrop-blur md:p-10',
        isLocked && 'opacity-50 grayscale'
      )}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-secondary">Fase {index}</p>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">{subtitle}</p>
        </div>
        <span className="inline-flex h-10 items-center rounded-full border border-white/10 px-4 text-xs font-semibold uppercase tracking-wide text-slate-300">
          {isCompleted ? 'Completado' : isLocked ? 'Bloqueado' : 'Disponible'}
        </span>
      </header>
      <div className={clsx('space-y-6 transition duration-300', isLocked && 'pointer-events-none select-none')}>
        {children}
      </div>
    </motion.section>
  );
};

export default PhaseContainer;
