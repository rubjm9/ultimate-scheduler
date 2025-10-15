import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import PhaseContainer from '../components/phases/PhaseContainer';
import PhaseOneSetup from '../components/phases/PhaseOneSetup';
import PhaseTwoModels from '../components/phases/PhaseTwoModels';
import PhaseThreeTeams from '../components/phases/PhaseThreeTeams';
import PhaseFourResults from '../components/phases/PhaseFourResults';
import useTournamentStore from '../store/useTournamentStore';

// BuilderPage orchestrates the phase components inside a shared drag & drop provider.

const BuilderPage = () => {
  const completed = useTournamentStore((state) => state.completedPhases);
  const currentPhase = useTournamentStore((state) => state.currentPhase);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-1 flex-col gap-12 py-12">
        <motion.section
          layout
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/60 p-8 shadow-2xl"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">Planificador</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
            Diseña tu torneo de Ultimate paso a paso
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            Completa cada fase para desbloquear la siguiente. Tus datos se guardan automáticamente y podrás compartir un
            enlace público cuando todo esté listo.
          </p>
        </motion.section>

        <PhaseContainer
          title="Configuración del torneo"
          subtitle="Define la identidad, la sede y los parámetros básicos. Cada bloque se desbloquea al completar el anterior."
          index={1}
          isLocked={false}
          isCompleted={completed.includes(1)}
        >
          <PhaseOneSetup />
        </PhaseContainer>

        <PhaseContainer
          title="Modelos de competición sugeridos"
          subtitle="Analizamos tus parámetros para proponer estructuras equilibradas con ajustes manuales mediante drag & drop."
          index={2}
          isLocked={!completed.includes(1)}
          isCompleted={completed.includes(2)}
        >
          <PhaseTwoModels />
        </PhaseContainer>

        <PhaseContainer
          title="Equipos y programación"
          subtitle="Introduce a los equipos, distribúyelos automáticamente y ajusta el horario arrastrando partidos."
          index={3}
          isLocked={currentPhase < 3}
          isCompleted={completed.includes(3)}
        >
          <PhaseThreeTeams />
        </PhaseContainer>

        <PhaseContainer
          title="Resultados y vista pública"
          subtitle="Registra marcadores y comparte la página pública del torneo con actualizaciones en tiempo real."
          index={4}
          isLocked={currentPhase < 4}
          isCompleted={completed.includes(4)}
        >
          <PhaseFourResults />
        </PhaseContainer>
      </div>
    </DndProvider>
  );
};

export default BuilderPage;
