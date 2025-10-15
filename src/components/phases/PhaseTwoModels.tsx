import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';
import useTournamentStore, {
  TournamentModelProposal,
  selectSelectedModel
} from '../../store/useTournamentStore';
import { generateModelProposals } from '../../utils/modelGenerator';

// PhaseTwoModels generates smart proposals and enables manual drag & drop adjustments for knockout rounds.

const ROUND_ITEM = 'round-item';

interface RoundToken {
  id: string;
  label: string;
}

const extraRounds: RoundToken[] = [
  { id: 'prequarters', label: 'Precuartos' },
  { id: 'repechage', label: 'Repechaje' },
  { id: 'placement', label: 'Final consolación' }
];

const PhaseTwoModels = () => {
  const setup = useTournamentStore((state) => state.setup);
  const models = useTournamentStore((state) => state.models);
  const setModels = useTournamentStore((state) => state.setModels);
  const selectModel = useTournamentStore((state) => state.selectModel);
  const selectedModel = useTournamentStore(selectSelectedModel);

  const [customRounds, setCustomRounds] = useState<Record<string, RoundToken[]>>({});

  const canGenerate = useMemo(() => {
    return (
      setup.name.trim() &&
      setup.location.trim() &&
      setup.teamCount > 1 &&
      setup.startDate &&
      setup.endDate &&
      setup.startTime &&
      setup.endTime
    );
  }, [setup]);

  useEffect(() => {
    if (!canGenerate) return;
    const proposals = generateModelProposals(setup);
    setModels(proposals);
    setCustomRounds((previous) => {
      const next = { ...previous };
      proposals.forEach((proposal) => {
        if (!next[proposal.id]) {
          next[proposal.id] = [];
        }
      });
      return next;
    });
  }, [canGenerate, setModels, setup]);

  const handleDrop = (modelId: string, token: RoundToken) => {
    setCustomRounds((current) => {
      const existing = current[modelId] ?? [];
      if (existing.some((item) => item.id === token.id)) {
        return current;
      }
      return { ...current, [modelId]: [...existing, token] };
    });
  };

  const handleRemove = (modelId: string, tokenId: string) => {
    setCustomRounds((current) => ({
      ...current,
      [modelId]: current[modelId]?.filter((token) => token.id !== tokenId) ?? []
    }));
  };

  if (!canGenerate) {
    return <p className="rounded-2xl border border-dashed border-white/20 p-6 text-sm text-slate-400">Completa los datos de la Fase 1 para desbloquear propuestas inteligentes.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {models.map((model, index) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModel?.id === model.id}
          onSelect={() => selectModel(model.id)}
          rounds={customRounds[model.id] ?? []}
          onDrop={(token) => handleDrop(model.id, token)}
          onRemove={(tokenId) => handleRemove(model.id, tokenId)}
          index={index}
        />
      ))}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h3 className="text-sm font-semibold text-white">Arrastra rondas adicionales</h3>
        <p className="mt-2 text-xs text-slate-400">
          Personaliza tus modelos arrastrando estas rondas sobre la tarjeta que prefieras.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {extraRounds.map((token) => (
            <RoundDraggable key={token.id} token={token} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ModelCardProps {
  model: TournamentModelProposal;
  isSelected: boolean;
  onSelect: () => void;
  rounds: RoundToken[];
  onDrop: (token: RoundToken) => void;
  onRemove: (tokenId: string) => void;
  index: number;
}

const ModelCard = ({ model, isSelected, onSelect, rounds, onDrop, onRemove, index }: ModelCardProps) => {
  const [{ isOver }, drop] = useDrop<RoundToken, void, { isOver: boolean }>(() => ({
    accept: ROUND_ITEM,
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [onDrop]);

  return (
    <motion.article
      ref={drop}
      layout
      className={`flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 transition ${isOver ? 'border-secondary/80 bg-secondary/10' : ''} ${isSelected ? 'ring-2 ring-secondary/60' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{model.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{model.description}</p>
        </div>
        <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
          {model.groups > 0 ? `${model.groups} grupos` : 'Eliminatorias puras'}
        </span>
      </div>
      <ul className="space-y-2 text-xs text-slate-300">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          {model.teamsPerGroup > 0
            ? `${model.teamsPerGroup} equipos por grupo`
            : 'Distribución directa a cuadro'}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          {model.hasPlayoffs ? 'Incluye eliminatorias finales' : 'Sin fase eliminatoria'}
        </li>
        {model.highlights.map((highlight) => (
          <li key={highlight} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary/60" />
            {highlight}
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-white/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ajustes manuales
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {rounds.length === 0 && (
            <span className="text-xs text-slate-500">Arrastra rondas aquí para personalizar.</span>
          )}
          {rounds.map((token) => (
            <button
              key={token.id}
              onClick={() => onRemove(token.id)}
              className="group inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary transition hover:border-secondary hover:bg-secondary/20"
            >
              {token.label}
              <span className="text-secondary/70 group-hover:text-secondary">×</span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onSelect}
        className="mt-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/30 transition hover:scale-[1.01]"
      >
        {isSelected ? 'Modelo seleccionado' : 'Seleccionar este modelo'}
      </button>
    </motion.article>
  );
};

interface RoundDraggableProps {
  token: RoundToken;
}

const RoundDraggable = ({ token }: RoundDraggableProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ROUND_ITEM,
    item: token,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [token]);

  return (
    <button
      ref={drag}
      className={`cursor-grab rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:border-secondary hover:bg-secondary/20 ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {token.label}
    </button>
  );
};

export default PhaseTwoModels;
