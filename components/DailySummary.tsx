import React from 'react';
import { DailyGoal, Macros } from '../types';
import ProgressBar from './ProgressBar';

interface DailySummaryProps {
  goals: DailyGoal;
  consumed: Macros;
}

const DailySummary: React.FC<DailySummaryProps> = ({ goals, consumed }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Daily Nutrition Tracker</h2>
      
      <ProgressBar 
        label="Calories" 
        current={consumed.calories} 
        total={goals.calories} 
        unit="kcal"
        colorClass="bg-indigo-500"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 mt-4">
        <ProgressBar 
          label="Protein" 
          current={consumed.protein} 
          total={goals.protein} 
          unit="g"
          colorClass="bg-emerald-500"
        />
        <ProgressBar 
          label="Carbs" 
          current={consumed.carbs} 
          total={goals.carbs} 
          unit="g"
          colorClass="bg-amber-400"
        />
        <ProgressBar 
          label="Fat" 
          current={consumed.fat} 
          total={goals.fat} 
          unit="g"
          colorClass="bg-rose-400"
        />
      </div>
    </div>
  );
};

export default DailySummary;