import { TournamentModelProposal, TournamentSetup } from '../store/useTournamentStore';

// generateModelProposals produces lightweight mock structures inspired by real tournament patterns.

const createGroupSuggestion = (teams: number) => {
  if (teams <= 6) return { groups: 1, teamsPerGroup: teams };
  if (teams <= 8) return { groups: 2, teamsPerGroup: Math.ceil(teams / 2) };
  if (teams <= 12) return { groups: 3, teamsPerGroup: Math.ceil(teams / 3) };
  if (teams <= 16) return { groups: 4, teamsPerGroup: Math.ceil(teams / 4) };
  return { groups: 4, teamsPerGroup: Math.ceil(teams / 4) };
};

export const generateModelProposals = (setup: TournamentSetup): TournamentModelProposal[] => {
  const baseId = `${setup.teamCount}-${setup.model}`;
  const surfaceHint = setup.surface === 'playa' ? 'sesiones cortas y frescas' : 'máximo ritmo competitivo';
  const groups = createGroupSuggestion(setup.teamCount);

  const proposals: TournamentModelProposal[] = [
    {
      id: `${baseId}-balanceado`,
      title: 'Modelo balanceado',
      description: `Combina liguilla inicial con eliminatorias equilibradas para ${setup.teamCount} equipos.`,
      groups: groups.groups,
      teamsPerGroup: groups.teamsPerGroup,
      hasPlayoffs: setup.model !== 'solo_liguilla',
      highlights: [
        `Máximo de 4 partidos por equipo el sábado`,
        `Domingo con ${setup.surface === 'playa' ? 'hasta 2' : 'hasta 3'} partidos`,
        `Ritmo ajustado a ${surfaceHint}`
      ]
    }
  ];

  if (setup.teamCount >= 10) {
    proposals.push({
      id: `${baseId}-intenso`,
      title: 'Modelo competitivo',
      description: 'Mayor número de cruces para asegurar clasificación justa y sorpresas.',
      groups: Math.max(groups.groups, 3),
      teamsPerGroup: Math.ceil(setup.teamCount / Math.max(groups.groups, 3)),
      hasPlayoffs: true,
      highlights: [
        'Incluye ronda de repesca antes de cuartos',
        'Garantiza mínimo 5 partidos por equipo',
        'Ideal para sedes con múltiples campos'
      ]
    });
  }

  proposals.push({
    id: `${baseId}-ligero`,
    title: 'Modelo relajado',
    description: 'Pensado para minimizar partidos consecutivos y maximizar descansos.',
    groups: setup.model === 'solo_eliminatorias' ? 0 : groups.groups,
    teamsPerGroup: setup.model === 'solo_eliminatorias' ? 0 : groups.teamsPerGroup,
    hasPlayoffs: true,
    highlights: [
      'Descansos mínimos de 1 slot entre partidos',
      'Domingo con cierre temprano',
      'Compatible con equipos con desplazamientos largos'
    ]
  });

  return proposals;
};
