import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useTournamentStore, { selectSelectedSchedule } from '../store/useTournamentStore';

// PublicViewerPage exposes a simplified read-only dashboard for participants.

const PublicViewerPage = () => {
  const { slug } = useParams();
  const setup = useTournamentStore((state) => state.setup);
  const schedule = useTournamentStore(selectSelectedSchedule);
  const results = useTournamentStore((state) => state.results);

  const standings = useMemo(() => {
    if (!schedule) return {} as Record<string, { team: string; points: number }[]>;
    const table: Record<string, { team: string; points: number }[]> = {};

    schedule.matches.forEach((match) => {
      const group = (table[match.group] = table[match.group] ?? []);
      match.teams.forEach((team) => {
        if (!group.find((entry) => entry.team === team)) {
          group.push({ team, points: 0 });
        }
      });
      const result = results[match.id];
      if (!result) return;
      if (result.scoreA > result.scoreB) {
        const winner = group.find((entry) => entry.team === match.teams[0]);
        if (winner) winner.points += 2;
      } else if (result.scoreB > result.scoreA) {
        const winner = group.find((entry) => entry.team === match.teams[1]);
        if (winner) winner.points += 2;
      }
    });

    Object.keys(table).forEach((group) => {
      table[group] = table[group].sort((a, b) => b.points - a.points);
    });

    return table;
  }, [results, schedule]);

  return (
    <div className="flex flex-1 flex-col gap-10 py-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-secondary">Vista pública</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">{setup.name || 'Torneo Ultimate'}</h1>
        <p className="text-sm text-slate-300">
          {setup.location ? `${setup.location} · ` : ''}
          {setup.startDate && setup.endDate ? `${setup.startDate} – ${setup.endDate}` : 'Fechas por confirmar'}
        </p>
        <span className="text-xs text-slate-500">URL amigable: /torneo/{slug}</span>
        <Link
          to="/"
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:border-secondary hover:text-secondary"
        >
          Volver al constructor
        </Link>
      </header>

      {!schedule ? (
        <p className="rounded-3xl border border-dashed border-white/20 p-6 text-center text-sm text-slate-400">
          Aún no se ha confirmado un horario para mostrar.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.section
            layout
            className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-semibold text-white">Próximos partidos</h2>
            <p className="mt-1 text-xs text-slate-400">
              Horarios en hora local. Actualización automática cada vez que se registran resultados.
            </p>
            <div className="mt-4 space-y-3">
              {schedule.matches.map((match) => (
                <div key={match.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-wide text-secondary">
                      {match.group}
                    </span>
                    <p className="font-semibold">
                      {match.teams[0]} vs {match.teams[1]}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(match.start).toLocaleString('es-ES', {
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}{' '}
                      · Campo {match.field || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            layout
            className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-semibold text-white">Clasificación</h2>
            <div className="mt-4 space-y-4">
              {Object.entries(standings).map(([group, rows]) => (
                <div key={group} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-secondary">{group}</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {rows.map((row) => (
                      <li key={row.team} className="flex items-center justify-between">
                        <span>{row.team}</span>
                        <span className="text-secondary">{row.points} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      )}
    </div>
  );
};

export default PublicViewerPage;
