import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';
import useTournamentStore, {
  ScheduleMatch,
  selectSelectedModel,
  selectSelectedSchedule
} from '../../store/useTournamentStore';
import type { ScheduleProposal } from '../../store/useTournamentStore';
import { serpentineDistribution } from '../../utils/teamDistribution';
import { generateScheduleProposals } from '../../utils/scheduleGenerator';

// PhaseThreeTeams captures seeding, performs automatic distribution and allows drag & drop schedule tweaking.

const TEAM_ITEM = 'team-item';
const MATCH_ITEM = 'match-item';

const PhaseThreeTeams = () => {
  const setup = useTournamentStore((state) => state.setup);
  const teams = useTournamentStore((state) => state.teams);
  const setTeams = useTournamentStore((state) => state.setTeams);
  const scheduleProposals = useTournamentStore((state) => state.scheduleProposals);
  const setScheduleProposals = useTournamentStore((state) => state.setScheduleProposals);
  const selectSchedule = useTournamentStore((state) => state.selectSchedule);
  const selectedModel = useTournamentStore(selectSelectedModel);
  const selectedSchedule = useTournamentStore(selectSelectedSchedule);

  const [customMatches, setCustomMatches] = useState<ScheduleMatch[]>([]);

  useEffect(() => {
    if (selectedSchedule) {
      setCustomMatches(selectedSchedule.matches);
    }
  }, [selectedSchedule]);

  const groupDistribution = useMemo(() => {
    if (!selectedModel) return [];
    return serpentineDistribution(teams.filter(Boolean), Math.max(selectedModel.groups, 1));
  }, [selectedModel, teams]);

  const allTeamsNamed = teams.every((team) => team.trim().length > 0);

  const handleGenerateSchedules = () => {
    if (!selectedModel) return;
    const proposals = generateScheduleProposals(setup, selectedModel, teams);
    setScheduleProposals(proposals);
  };

  const handleTeamRename = (index: number, name: string) => {
    const updated = [...teams];
    updated[index] = name;
    setTeams(updated);
  };

  const handleTeamReorder = (dragIndex: number, hoverIndex: number) => {
    const updated = [...teams];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    setTeams(updated);
  };

  const handleMatchReorder = (dragIndex: number, hoverIndex: number) => {
    setCustomMatches((current) => {
      const updated = [...current];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      return updated.map((match, index) => ({
        ...match,
        start: match.start || `${setup.startDate}T${setup.startTime}`,
        end: match.end || `${setup.startDate}T${setup.endTime}`
      }));
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white">Introduce los equipos</h3>
        <p className="mt-1 text-sm text-slate-400">
          Ordena por ranking inicial. Puedes arrastrar filas para reorganizar.
        </p>
        <div className="mt-4 grid gap-3">
          {teams.map((team, index) => (
            <TeamRow
              key={index}
              index={index}
              name={team}
              onChange={(value) => handleTeamRename(index, value)}
              onMove={handleTeamReorder}
            />
          ))}
        </div>
      </div>

      {selectedModel && allTeamsNamed && (
        <motion.div layout className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h4 className="text-sm font-semibold text-white">Distribución serpentina</h4>
          <p className="mt-1 text-xs text-slate-400">
            Los equipos se reparten automáticamente para equilibrar la fase de grupos.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {groupDistribution.map((group, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-secondary">
                  Grupo {String.fromCharCode(65 + index)}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {group.map((teamName) => (
                    <li key={teamName} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                      {teamName}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedModel && allTeamsNamed && (
        <div className="space-y-4">
          <button
            onClick={handleGenerateSchedules}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-secondary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/30 transition hover:scale-[1.01]"
          >
            Generar propuestas de horario
          </button>
          {scheduleProposals.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {scheduleProposals.map((proposal) => (
                <ScheduleCard
                  key={proposal.id}
                  proposal={proposal}
                  isSelected={proposal.id === selectedSchedule?.id}
                  onSelect={() => {
                    selectSchedule(proposal.id);
                    setCustomMatches(proposal.matches);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSchedule && (
        <motion.div layout className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Ajusta el orden de los partidos</h4>
              <p className="text-xs text-slate-400">
                Arrastra partidos para reordenarlos. El sistema recalcula horarios automáticamente.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {customMatches.length} partidos programados
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {customMatches.map((match, index) => (
              <MatchRow
                key={match.id}
                match={match}
                index={index}
                onMove={handleMatchReorder}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface TeamRowProps {
  index: number;
  name: string;
  onChange: (value: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const TeamRow = ({ index, name, onChange, onMove }: TeamRowProps) => {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: TEAM_ITEM,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [index]);

  const [, drop] = useDrop<{ index: number }>({
    accept: TEAM_ITEM,
    hover: (item) => {
      if (item.index === index) return;
      onMove(item.index, index);
      item.index = index;
    }
  });

  return (
    <div ref={(node) => drag(drop(node))} className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white transition ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <span ref={preview} className="text-xs font-semibold uppercase text-secondary">
        #{index + 1}
      </span>
      <input
        value={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Equipo ${index + 1}`}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
      />
      <span className="text-[0.7rem] text-slate-500">Arrastra</span>
    </div>
  );
};

interface ScheduleCardProps {
  proposal: ScheduleProposal;
  isSelected: boolean;
  onSelect: () => void;
}

const ScheduleCard = ({ proposal, isSelected, onSelect }: ScheduleCardProps) => {
  return (
    <motion.article
      layout
      className={`rounded-3xl border border-white/10 bg-slate-900/60 p-5 transition ${isSelected ? 'ring-2 ring-secondary/60' : ''}`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-white">{proposal.label}</h5>
          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
            {proposal.matches.length} partidos
          </span>
        </div>
        <p className="text-xs text-slate-400">{proposal.rationale}</p>
        <button
          onClick={onSelect}
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-secondary/30 px-3 py-2 text-xs font-semibold text-secondary transition hover:border-secondary hover:bg-secondary/10"
        >
          {isSelected ? 'Horario activo' : 'Seleccionar' }
        </button>
      </div>
    </motion.article>
  );
};

interface MatchRowProps {
  match: ScheduleMatch;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const MatchRow = ({ match, index, onMove }: MatchRowProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: MATCH_ITEM,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [index]);

  const [, drop] = useDrop<{ index: number }>({
    accept: MATCH_ITEM,
    hover: (item) => {
      if (item.index === index) return;
      onMove(item.index, index);
      item.index = index;
    }
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="rounded-full border border-white/10 px-2 py-1 text-[0.7rem] uppercase tracking-wide text-secondary">
        {match.group}
      </span>
      <p className="font-medium text-white">
        {match.teams[0]} vs {match.teams[1]}
      </p>
      <span className="text-xs text-slate-400">
        Campo {match.field || '—'} · {match.start ? new Date(match.start).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Pendiente'}
      </span>
      <span className="ml-auto text-[0.65rem] uppercase tracking-wide text-slate-500">Arrastra</span>
    </div>
  );
};

export default PhaseThreeTeams;
