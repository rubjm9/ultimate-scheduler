import { motion } from 'framer-motion';
import useTournamentStore from '../../store/useTournamentStore';

// ProgressRail renders the phase tracker visible in the sticky header.

const phases = [
  { id: 1, label: 'Configuración' },
  { id: 2, label: 'Modelos' },
  { id: 3, label: 'Equipos y horarios' },
  { id: 4, label: 'Resultados' }
];

const ProgressRail = () => {
  const completed = useTournamentStore((state) => state.completedPhases);
  const current = useTournamentStore((state) => state.currentPhase);

  return (
    <div className="border-t border-white/5 bg-slate-900/30">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 text-xs md:text-sm">
        {phases.map((phase) => {
          const isCompleted = completed.includes(phase.id);
          const isCurrent = current === phase.id;
          return (
            <motion.div
              key={phase.id}
              layout
              className="flex min-w-[150px] items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phase.id * 0.05 }}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[0.65rem] font-semibold ${isCompleted ? 'border-secondary/80 bg-secondary/20 text-secondary-foreground' : 'border-white/20 text-white/60'} ${isCurrent ? 'ring-2 ring-secondary/60' : ''}`}
              >
                {isCompleted ? '✓' : phase.id}
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-white">{phase.label}</span>
                <span className="text-[0.65rem] text-slate-400">
                  {isCurrent ? 'En progreso' : isCompleted ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressRail;
