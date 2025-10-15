import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useTournamentStore, { ResultEntry, selectSelectedSchedule, selectSlug } from '../../store/useTournamentStore';

// PhaseFourResults surfaces the live scoring tools and the public sharing module.

interface StandingsRow {
  team: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
}

const PhaseFourResults = () => {
  const results = useTournamentStore((state) => state.results);
  const setResult = useTournamentStore((state) => state.setResult);
  const schedule = useTournamentStore(selectSelectedSchedule);
  const slug = useTournamentStore(selectSlug);
  const setup = useTournamentStore((state) => state.setup);

  const standings = useMemo(() => {
    if (!schedule) return {} as Record<string, StandingsRow[]>;
    const table: Record<string, StandingsRow[]> = {};

    schedule.matches.forEach((match) => {
      const [teamA, teamB] = match.teams;
      table[match.group] = table[match.group] ?? [];
      const group = table[match.group];

      const ensureTeam = (team: string) => {
        let entry = group.find((row) => row.team === team);
        if (!entry) {
          entry = { team, played: 0, wins: 0, losses: 0, points: 0 };
          group.push(entry);
        }
        return entry;
      };

      const result = results[match.id];
      const entryA = ensureTeam(teamA);
      const entryB = ensureTeam(teamB);

      if (!result) return;

      entryA.played += 1;
      entryB.played += 1;

      if (result.scoreA > result.scoreB) {
        entryA.wins += 1;
        entryA.points += 2;
        entryB.losses += 1;
        entryB.points += 1;
      } else if (result.scoreB > result.scoreA) {
        entryB.wins += 1;
        entryB.points += 2;
        entryA.losses += 1;
        entryA.points += 1;
      }
    });

    Object.keys(table).forEach((group) => {
      table[group] = table[group]
        .filter((row) => row.played > 0)
        .sort((a, b) => b.points - a.points || b.wins - a.wins);
    });

    return table;
  }, [results, schedule]);

  if (!schedule) {
    return <p className="rounded-2xl border border-dashed border-white/20 p-6 text-sm text-slate-400">Selecciona un horario en la Fase 3 para activar el panel público.</p>;
  }

  const handleScoreChange = (matchId: string, field: 'scoreA' | 'scoreB', value: number) => {
    const entry: ResultEntry = {
      matchId,
      scoreA: field === 'scoreA' ? value : results[matchId]?.scoreA ?? 0,
      scoreB: field === 'scoreB' ? value : results[matchId]?.scoreB ?? 0
    };
    setResult(entry);
  };

  const publicUrl = `/torneo/${slug}`;

  return (
    <div className="space-y-8">
      <motion.div layout className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white">Panel público</h3>
        <p className="mt-1 text-sm text-slate-400">
          Comparte la página pública con tus equipos una vez que el horario esté confirmado.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white">
            {setup.name || 'Tu torneo'}
          </span>
          <a
            href={publicUrl}
            className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-secondary transition hover:border-secondary hover:bg-secondary/20"
          >
            Ver vista pública
          </a>
          <button
            onClick={() => {
              if (typeof window === 'undefined') return;
              const origin = window.location?.origin ?? '';
              if (navigator?.clipboard) {
                navigator.clipboard
                  .writeText(`${origin}${publicUrl}`)
                  .catch(() => undefined);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-secondary hover:text-secondary"
          >
            Copiar enlace
          </button>
        </div>
      </motion.div>

      <motion.div layout className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h4 className="text-sm font-semibold text-white">Resultados en directo</h4>
        <p className="mt-1 text-xs text-slate-400">
          Introduce marcadores finales y observa cómo se actualiza la clasificación y el bracket.
        </p>
        <div className="mt-4 space-y-3">
          {schedule.matches.map((match) => (
            <div
              key={match.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100"
            >
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-secondary">{match.group}</span>
                <span className="font-semibold text-white">
                  {match.teams[0]} vs {match.teams[1]}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(match.start).toLocaleString('es-ES', {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}{' '}
                  · Campo {match.field || '—'}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ScoreInput
                  value={results[match.id]?.scoreA ?? 0}
                  onChange={(value) => handleScoreChange(match.id, 'scoreA', value)}
                />
                <span className="text-xs text-slate-400">-</span>
                <ScoreInput
                  value={results[match.id]?.scoreB ?? 0}
                  onChange={(value) => handleScoreChange(match.id, 'scoreB', value)}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div layout className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h4 className="text-sm font-semibold text-white">Clasificación en vivo</h4>
        {Object.keys(standings).length === 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Añade resultados para calcular la clasificación de los grupos.
          </p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(standings).map(([group, rows]) => (
            <div key={group} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-secondary">{group}</p>
              <table className="mt-3 w-full text-left text-xs text-slate-200">
                <thead>
                  <tr className="text-[0.65rem] uppercase tracking-wide text-slate-400">
                    <th className="py-2">Equipo</th>
                    <th className="py-2 text-center">PJ</th>
                    <th className="py-2 text-center">PG</th>
                    <th className="py-2 text-center">PP</th>
                    <th className="py-2 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.team} className="border-t border-white/10">
                      <td className="py-1 font-semibold text-white">{row.team}</td>
                      <td className="py-1 text-center">{row.played}</td>
                      <td className="py-1 text-center">{row.wins}</td>
                      <td className="py-1 text-center">{row.losses}</td>
                      <td className="py-1 text-center font-semibold text-secondary">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
}

const ScoreInput = ({ value, onChange }: ScoreInputProps) => {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-16 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-center text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
    />
  );
};

export default PhaseFourResults;
