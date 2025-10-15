import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { slugify } from '../utils/slugify';

// Global store glues phases together, persists to localStorage and exposes handy selectors.

export type SurfaceType = 'césped' | 'playa';
export type CompetitionModel = 'liguilla_eliminatorias' | 'solo_liguilla' | 'solo_eliminatorias';

export interface TournamentSetup {
  name: string;
  surface: SurfaceType;
  teamCount: number;
  model: CompetitionModel;
  fieldCount: number;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  matchDuration: number;
}

export interface TournamentModelProposal {
  id: string;
  title: string;
  description: string;
  groups: number;
  teamsPerGroup: number;
  hasPlayoffs: boolean;
  highlights: string[];
}

export interface ScheduleMatch {
  id: string;
  group: string;
  teams: [string, string];
  field: number;
  start: string;
  end: string;
}

export interface ScheduleProposal {
  id: string;
  label: string;
  rationale: string;
  matches: ScheduleMatch[];
}

export interface ResultEntry {
  matchId: string;
  scoreA: number;
  scoreB: number;
}

interface TournamentState {
  setup: TournamentSetup;
  models: TournamentModelProposal[];
  selectedModelId?: string;
  teams: string[];
  scheduleProposals: ScheduleProposal[];
  selectedScheduleId?: string;
  results: Record<string, ResultEntry>;
  currentPhase: number;
  completedPhases: number[];
  updateSetup: (partial: Partial<TournamentSetup>) => void;
  setModels: (models: TournamentModelProposal[]) => void;
  selectModel: (id: string) => void;
  setTeams: (teams: string[]) => void;
  setScheduleProposals: (proposals: ScheduleProposal[]) => void;
  selectSchedule: (id: string) => void;
  setResult: (entry: ResultEntry) => void;
  reset: () => void;
}

const defaultSetup: TournamentSetup = {
  name: '',
  surface: 'césped',
  teamCount: 8,
  model: 'liguilla_eliminatorias',
  fieldCount: 2,
  location: '',
  startDate: '',
  endDate: '',
  startTime: '09:00',
  endTime: '19:00',
  matchDuration: 90
};

const evaluateCompletion = (state: TournamentState): number[] => {
  const completed: number[] = [];
  const { setup, selectedModelId, teams, selectedScheduleId } = state;

  const setupCompleted =
    setup.name.trim() &&
    setup.surface &&
    setup.teamCount > 1 &&
    setup.fieldCount > 0 &&
    setup.location.trim() &&
    setup.startDate &&
    setup.endDate &&
    setup.startTime &&
    setup.endTime &&
    setup.matchDuration > 0;

  if (setupCompleted) {
    completed.push(1);
  }

  if (setupCompleted && selectedModelId) {
    completed.push(2);
  }

  if (setupCompleted && selectedModelId && teams.every((team) => team.trim())) {
    completed.push(3);
  }

  if (setupCompleted && selectedModelId && selectedScheduleId) {
    completed.push(4);
  }

  return completed;
};

const computePhase = (completed: number[]): number => {
  if (!completed.includes(1)) return 1;
  if (!completed.includes(2)) return 2;
  if (!completed.includes(3)) return 3;
  if (!completed.includes(4)) return 4;
  return 4;
};

const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      setup: defaultSetup,
      models: [],
      selectedModelId: undefined,
      teams: Array.from({ length: defaultSetup.teamCount }, () => ''),
      scheduleProposals: [],
      selectedScheduleId: undefined,
      results: {},
      currentPhase: 1,
      completedPhases: [],
      updateSetup: (partial) => {
        set(
          produce<TournamentState>((draft) => {
            draft.setup = { ...draft.setup, ...partial };
            if (partial.teamCount && partial.teamCount !== draft.teams.length) {
              draft.teams = Array.from({ length: partial.teamCount }, (_, idx) => draft.teams[idx] ?? '');
            }
          })
        );
        const updated = get();
        const completed = evaluateCompletion(updated);
        set({ completedPhases: completed, currentPhase: computePhase(completed) });
      },
      setModels: (models) => {
        set({ models });
      },
      selectModel: (id) => {
        set({ selectedModelId: id });
        const updated = get();
        const completed = evaluateCompletion(updated);
        set({ completedPhases: completed, currentPhase: computePhase(completed) });
      },
      setTeams: (teams) => {
        set({ teams });
        const updated = get();
        const completed = evaluateCompletion(updated);
        set({ completedPhases: completed, currentPhase: computePhase(completed) });
      },
      setScheduleProposals: (proposals) => {
        set({ scheduleProposals: proposals });
      },
      selectSchedule: (id) => {
        set({ selectedScheduleId: id });
        const updated = get();
        const completed = evaluateCompletion(updated);
        set({ completedPhases: completed, currentPhase: computePhase(completed) });
      },
      setResult: (entry) => {
        set(
          produce<TournamentState>((draft) => {
            draft.results[entry.matchId] = entry;
          })
        );
      },
      reset: () => {
        set({
          setup: defaultSetup,
          models: [],
          selectedModelId: undefined,
          teams: Array.from({ length: defaultSetup.teamCount }, () => ''),
          scheduleProposals: [],
          selectedScheduleId: undefined,
          results: {},
          currentPhase: 1,
          completedPhases: []
        });
      }
    }),
    {
      name: 'ultimate-scheduler',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined
          } as Storage;
        }
        return window.localStorage;
      }),
      version: 1,
      partialize: ({ results, ...state }) => state
    }
  )
);

export const selectSelectedModel = (state: TournamentState) =>
  state.models.find((model) => model.id === state.selectedModelId);

export const selectSelectedSchedule = (state: TournamentState) =>
  state.scheduleProposals.find((proposal) => proposal.id === state.selectedScheduleId);

export const selectSlug = (state: TournamentState) => slugify(state.setup.name || 'torneo');

export default useTournamentStore;
