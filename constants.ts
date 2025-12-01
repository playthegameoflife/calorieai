import { DailyGoal } from './types';

export const DEFAULT_GOALS: DailyGoal = {
  calories: 2200,
  protein: 150,
  carbs: 200,
  fat: 70,
};

export const MOCK_USER_ID = "user_v1_demo";

// Helper to format numbers cleanly
export const formatNumber = (num: number): string => Math.round(num).toLocaleString();