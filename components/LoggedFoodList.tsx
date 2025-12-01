import React from 'react';
import { FoodItem } from '../types';

interface LoggedFoodListProps {
  foods: FoodItem[];
  onDelete: (id: string) => void;
}

const LoggedFoodList: React.FC<LoggedFoodListProps> = ({ foods, onDelete }) => {
  if (foods.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700">Today's Logs</h3>
        <span className="text-xs text-slate-500">{foods.length} entries</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {foods.map((food) => (
          <li key={food.id} className="px-5 py-3 flex items-center justify-between group hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-slate-800 font-medium capitalize">{food.name}</p>
              <p className="text-xs text-slate-500">
                {Math.round(food.calories)} kcal • P: {Math.round(food.protein)}g • C: {Math.round(food.carbs)}g • F: {Math.round(food.fat)}g
              </p>
            </div>
            <button
              onClick={() => onDelete(food.id)}
              className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Remove item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LoggedFoodList;