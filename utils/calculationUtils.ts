import { DailyGoal, UserProfile } from '../types';

export const calculateTargets = (profile: UserProfile): DailyGoal => {
  // 1. Calculate BMR (Mifflin-St Jeor Equation)
  // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
  bmr += profile.gender === 'male' ? 5 : -161;

  // 2. Calculate TDEE based on Activity Level
  const multipliers: Record<string, number> = {
    sedentary: 1.2,    // Little or no exercise
    light: 1.375,      // Light exercise 1-3 days/week
    moderate: 1.55,    // Moderate exercise 3-5 days/week
    heavy: 1.725       // Hard exercise 6-7 days/week
  };

  const activityMultiplier = multipliers[profile.activity] || 1.2;
  let tdee = bmr * activityMultiplier;

  // 3. Adjust for Goal
  // Lose: -500 kcal, Gain: +300 kcal
  if (profile.goal === 'lose') {
    tdee -= 500;
  } else if (profile.goal === 'gain') {
    tdee += 300;
  }

  // Ensure reasonable minimums (safety)
  const targetCalories = Math.max(1200, Math.round(tdee));

  // 4. Split Macros
  let protein = 0;
  let fat = 0;
  let carbs = 0;

  if (profile.goal === 'gain') {
    // Muscle Gain: Higher carb, moderate protein
    // Protein: ~2g/kg
    protein = profile.weight * 2.0; 
    // Fat: 25% of calories
    const fatCals = targetCalories * 0.25;
    fat = fatCals / 9;
    // Carbs: Remainder
    const proteinCals = protein * 4;
    const remainingCals = targetCalories - fatCals - proteinCals;
    carbs = Math.max(0, remainingCals / 4);

  } else if (profile.goal === 'lose') {
    // Fat Loss: High protein to spare muscle
    // Protein: ~2.2g/kg
    protein = profile.weight * 2.2;
    // Fat: 30% of calories (satiety)
    const fatCals = targetCalories * 0.30;
    fat = fatCals / 9;
    // Carbs: Remainder
    const proteinCals = protein * 4;
    const remainingCals = targetCalories - fatCals - proteinCals;
    carbs = Math.max(0, remainingCals / 4);

  } else {
    // Maintain: Balanced
    // Protein: ~1.6g/kg
    protein = profile.weight * 1.6;
    // Fat: 30% of calories
    const fatCals = targetCalories * 0.30;
    fat = fatCals / 9;
    // Carbs: Remainder
    const proteinCals = protein * 4;
    const remainingCals = targetCalories - fatCals - proteinCals;
    carbs = Math.max(0, remainingCals / 4);
  }

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
};

export const getRecommendedMealCount = (caloriesLeft: number): number => {
  if (caloriesLeft < 400) return 1;
  if (caloriesLeft < 900) return 2;
  return 3;
};

export const DEFAULT_PROFILE: UserProfile = {
  gender: 'male',
  age: 30,
  height: 175,
  weight: 75,
  activity: 'moderate',
  goal: 'maintain',
  isManual: false,
};