export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem extends Macros {
  id: string;
  name: string;
  timestamp: string; // ISO string
}

export interface IngredientDetails {
  name: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export interface MealSuggestion extends Macros {
  name: string;
  mealType: string; // Breakfast, Lunch, Snack, etc.
  description: string;
  ingredients: IngredientDetails[];
  instructions: string[];
  alternative: string;
}

export interface DailyGoal extends Macros {}

export enum AppState {
  IDLE,
  PARSING_FOOD,
  GENERATING_PLAN,
  ERROR,
}

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy';
export type GoalType = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  activity: ActivityLevel;
  goal: GoalType;
  isManual: boolean; // New: tracks if user prefers manual entry
}