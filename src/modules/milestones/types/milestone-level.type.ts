export const MILESTONE_LEVEL_GROUPS = {
  MILEAGE: 'MILEAGE',
  EXPENSES: 'EXPENSES',
  REFUELS: 'REFUELS',
} as const;

export type MilestoneLevelGroup =
  (typeof MILESTONE_LEVEL_GROUPS)[keyof typeof MILESTONE_LEVEL_GROUPS];

export interface MilestoneLevelStep {
  code: string;
  title: string;
  value: number;
}

export interface MilestoneLevel {
  group: MilestoneLevelGroup;
  currentLevel: MilestoneLevelStep | null;
  levelIndex: number;
  totalLevels: number;
  nextLevel: MilestoneLevelStep | null;
  currentValue: number;
  progressPercent: number;
}
