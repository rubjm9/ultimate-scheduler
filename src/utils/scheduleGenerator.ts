import {
  ScheduleMatch,
  ScheduleProposal,
  TournamentModelProposal,
  TournamentSetup
} from '../store/useTournamentStore';
import { serpentineDistribution } from './teamDistribution';

// generateScheduleProposals creates three mock schedules with slight strategic variations.

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const fromMinutes = (value: number) => {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const enumerateDays = (startDate: string, endDate: string) => {
  const result: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    result.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return result;
};

const roundRobinMatches = (group: string[], groupLabel: string): ScheduleMatch[] => {
  const matches: ScheduleMatch[] = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      matches.push({
        id: `${groupLabel}-${i}-${j}`,
        group: groupLabel,
        teams: [group[i], group[j]],
        field: 0,
        start: '',
        end: ''
      });
    }
  }
  return matches;
};

const assignMatches = (
  matches: ScheduleMatch[],
  setup: TournamentSetup,
  modifier: number
): ScheduleMatch[] => {
  const startMinutes = toMinutes(setup.startTime) + modifier * 10;
  const endMinutes = toMinutes(setup.endTime);
  const duration = setup.matchDuration;
  const days = enumerateDays(setup.startDate, setup.endDate);
  const fields = setup.fieldCount;

  const slotsPerDay = Math.floor((endMinutes - startMinutes) / duration);
  const calendar: { day: string; slot: number; field: number; start: number }[] = [];
  days.forEach((day) => {
    for (let slot = 0; slot < slotsPerDay; slot++) {
      for (let field = 1; field <= fields; field++) {
        calendar.push({
          day,
          slot,
          field,
          start: startMinutes + slot * duration
        });
      }
    }
  });

  const scheduled: ScheduleMatch[] = [];
  const teamLastSlot = new Map<string, number>();

  calendar.forEach((slotInfo, index) => {
    const available = matches.filter((match) => !scheduled.find((m) => m.id === match.id));
    for (const match of available) {
      const teamA = match.teams[0];
      const teamB = match.teams[1];
      const lastA = teamLastSlot.get(teamA) ?? -2;
      const lastB = teamLastSlot.get(teamB) ?? -2;
      if (index - lastA <= 1 || index - lastB <= 1) {
        continue;
      }
      scheduled.push({
        ...match,
        field: slotInfo.field,
        start: `${slotInfo.day}T${fromMinutes(slotInfo.start)}`,
        end: `${slotInfo.day}T${fromMinutes(slotInfo.start + duration)}`
      });
      teamLastSlot.set(teamA, index);
      teamLastSlot.set(teamB, index);
      break;
    }
  });

  return scheduled;
};

export const generateScheduleProposals = (
  setup: TournamentSetup,
  model: TournamentModelProposal,
  teams: string[]
): ScheduleProposal[] => {
  const cleanTeams = teams.filter((team) => team.trim());
  const groupCount = Math.max(model.groups, 1);
  const groups = serpentineDistribution(cleanTeams, groupCount);
  const groupMatches = groups.flatMap((group, index) =>
    roundRobinMatches(group, `Grupo ${String.fromCharCode(65 + index)}`)
  );

  const baseMatches = groupMatches;

  const proposals: ScheduleProposal[] = [0, 1, 2].map((modifier) => {
    const scheduled = assignMatches(baseMatches, setup, modifier * 5);
    return {
      id: `${model.id}-proposal-${modifier}`,
      label: modifier === 0 ? 'Balanceado' : modifier === 1 ? 'Descansos largos' : 'Mañanas intensas',
      rationale:
        modifier === 0
          ? 'Mantiene franjas regulares para todos los equipos.'
          : modifier === 1
          ? 'Prioriza descansos adicionales entre partidos.'
          : 'Compacta los partidos en las primeras franjas para liberar tardes.',
      matches: scheduled
    };
  });

  return proposals;
};
