import { ChangeEvent, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useTournamentStore, { CompetitionModel, SurfaceType, TournamentSetup } from '../../store/useTournamentStore';

// PhaseOneSetup implements the progressive onboarding form for the tournament configuration.

interface SectionConfig {
  id: string;
  label: string;
  description: string;
  fields: (keyof TournamentSetup)[];
}

const sections: SectionConfig[] = [
  {
    id: 'general',
    label: 'Identidad del torneo',
    description: 'Define cómo se llamará el torneo y dónde se celebrará.',
    fields: ['name', 'location']
  },
  {
    id: 'surface',
    label: 'Superficie y duración',
    description: 'Selecciona la superficie para ajustar la duración recomendada de los partidos.',
    fields: ['surface', 'matchDuration']
  },
  {
    id: 'structure',
    label: 'Participantes y estructura',
    description: 'Número de equipos, campos disponibles y formato deseado.',
    fields: ['teamCount', 'fieldCount', 'model']
  },
  {
    id: 'calendar',
    label: 'Fechas y horarios',
    description: 'Indica el rango de fechas y las franjas horarias diarias.',
    fields: ['startDate', 'endDate', 'startTime', 'endTime']
  }
];

const defaultDurations: Record<SurfaceType, number> = {
  césped: 90,
  playa: 60
};

const PhaseOneSetup = () => {
  const setup = useTournamentStore((state) => state.setup);
  const updateSetup = useTournamentStore((state) => state.updateSetup);
  const [localStatus, setLocalStatus] = useState<'guardando' | 'guardado'>('guardado');

  useEffect(() => {
    setLocalStatus('guardando');
    const timeout = setTimeout(() => setLocalStatus('guardado'), 600);
    return () => clearTimeout(timeout);
  }, [setup]);

  const sectionAvailability = useMemo(() => {
    const availability: Record<string, boolean> = {};
    let previousCompleted = true;

    sections.forEach((section) => {
      const isCompleted = section.fields.every((field) => {
        const value = setup[field];
        if (typeof value === 'number') {
          return value > 0;
        }
        return Boolean(value);
      });

      availability[section.id] = previousCompleted;
      previousCompleted = previousCompleted && isCompleted;
    });

    return availability;
  }, [setup]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === 'teamCount' || name === 'fieldCount' || name === 'matchDuration') {
      updateSetup({ [name]: Number(value) } as Partial<TournamentSetup>);
    } else {
      updateSetup({ [name]: value } as Partial<TournamentSetup>);
    }
  };

  const handleSurfaceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const surface = event.target.value as SurfaceType;
    const recommended = defaultDurations[surface];
    updateSetup({ surface, matchDuration: setup.matchDuration || recommended });
  };

  const handleModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const model = event.target.value as CompetitionModel;
    updateSetup({ model });
  };

  return (
    <div className="space-y-10">
      {sections.map((section, index) => {
        const enabled = sectionAvailability[section.id];
        return (
          <div key={section.id} className={enabled ? 'opacity-100' : 'pointer-events-none opacity-40'}>
            <div className="flex flex-col gap-3 pb-4">
              <h3 className="text-lg font-semibold text-white md:text-xl">{index + 1}. {section.label}</h3>
              <p className="text-sm text-slate-300 md:text-base">{section.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((field) => {
                switch (field) {
                  case 'name':
                    return (
                      <FieldCard key={field} label="Nombre del torneo">
                        <input
                          name="name"
                          value={setup.name}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                          placeholder="Ej. Open Costa Brava 2025"
                        />
                      </FieldCard>
                    );
                  case 'location':
                    return (
                      <FieldCard key={field} label="Lugar de celebración">
                        <input
                          name="location"
                          value={setup.location}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                          placeholder="Ciudad, instalación o club"
                        />
                      </FieldCard>
                    );
                  case 'surface':
                    return (
                      <FieldCard key={field} label="Superficie principal">
                        <select
                          name="surface"
                          value={setup.surface}
                          onChange={handleSurfaceChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        >
                          <option value="césped">Césped</option>
                          <option value="playa">Playa</option>
                        </select>
                      </FieldCard>
                    );
                  case 'matchDuration':
                    return (
                      <FieldCard key={field} label="Duración de partidos (min)">
                        <input
                          name="matchDuration"
                          type="number"
                          min={30}
                          max={120}
                          value={setup.matchDuration}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          Recomendado: {defaultDurations[setup.surface]} min para {setup.surface}
                        </p>
                      </FieldCard>
                    );
                  case 'teamCount':
                    return (
                      <FieldCard key={field} label="Número de equipos">
                        <input
                          name="teamCount"
                          type="number"
                          min={4}
                          max={32}
                          value={setup.teamCount}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                      </FieldCard>
                    );
                  case 'fieldCount':
                    return (
                      <FieldCard key={field} label="Número de campos disponibles">
                        <input
                          name="fieldCount"
                          type="number"
                          min={1}
                          max={12}
                          value={setup.fieldCount}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                      </FieldCard>
                    );
                  case 'model':
                    return (
                      <FieldCard key={field} label="Modelo de competición">
                        <select
                          name="model"
                          value={setup.model}
                          onChange={handleModelChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        >
                          <option value="liguilla_eliminatorias">Liguilla + eliminatorias</option>
                          <option value="solo_liguilla">Solo liguilla</option>
                          <option value="solo_eliminatorias">Solo eliminatorias</option>
                        </select>
                      </FieldCard>
                    );
                  case 'startDate':
                    return (
                      <FieldCard key={field} label="Fecha de inicio">
                        <input
                          name="startDate"
                          type="date"
                          value={setup.startDate}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                      </FieldCard>
                    );
                  case 'endDate':
                    return (
                      <FieldCard key={field} label="Fecha de fin">
                        <input
                          name="endDate"
                          type="date"
                          value={setup.endDate}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                      </FieldCard>
                    );
                  case 'startTime':
                    return (
                      <FieldCard key={field} label="Hora de inicio diaria">
                        <input
                          name="startTime"
                          type="time"
                          value={setup.startTime}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                      </FieldCard>
                    );
                  case 'endTime':
                    return (
                      <FieldCard key={field} label="Hora de fin diaria">
                        <input
                          name="endTime"
                          type="time"
                          value={setup.endTime}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                        />
                      </FieldCard>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        );
      })}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 text-xs text-slate-400"
      >
        <span className="h-2 w-2 rounded-full bg-secondary" />
        {localStatus === 'guardado' ? 'Cambios guardados automáticamente' : 'Guardando cambios...'}
      </motion.div>
    </div>
  );
};

interface FieldCardProps {
  label: string;
  children: React.ReactNode;
}

const FieldCard = ({ label, children }: FieldCardProps) => {
  return (
    <motion.label
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-inner shadow-black/20"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
    </motion.label>
  );
};

export default PhaseOneSetup;
