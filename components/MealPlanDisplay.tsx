import React, { useState } from 'react';
import { MealSuggestion, AppState } from '../types';

interface MealPlanDisplayProps {
  plan: MealSuggestion[];
  onGenerate: (instruction?: string) => void;
  appState: AppState;
}

const MealPlanDisplay: React.FC<MealPlanDisplayProps> = ({ plan, onGenerate, appState }) => {
  const [tweakInput, setTweakInput] = useState('');
  const isGenerating = appState === AppState.GENERATING_PLAN;

  const handleTweakSubmit = () => {
    if (!tweakInput.trim()) return;
    onGenerate(tweakInput);
    setTweakInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTweakSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Adaptive Plan
        </h3>
        
        {plan.length === 0 && (
          <button
            onClick={() => onGenerate()}
            disabled={isGenerating}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              isGenerating 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            Generate Remaining Meals
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-100 animate-pulse">
           <div className="flex justify-center mb-4">
            <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce mr-1"></div>
            <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
           </div>
           <p className="text-sm text-slate-500">Calculating macros & portion sizes...</p>
        </div>
      )}

      {!isGenerating && plan.length === 0 && (
         <div className="p-8 text-center bg-white/50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-sm text-slate-400">Log your food, then tap Generate to see your adaptive plan for the rest of the day.</p>
         </div>
      )}

      {!isGenerating && plan.length > 0 && (
        <div className="grid gap-6">
          {plan.map((meal, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                  {meal.mealType}
                </span>
                <span className="text-xs font-medium text-slate-500">{meal.calories} kcal</span>
              </div>
              
              <div className="p-5">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-1">{meal.name}</h4>
                  <p className="text-sm text-slate-600 italic">{meal.description}</p>
                </div>
                
                {/* Meal Totals */}
                <div className="grid grid-cols-4 gap-2 mb-6 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-center">
                    <span className="block font-bold text-indigo-600 text-sm">{Math.round(meal.calories)}</span>
                    <span className="text-slate-500">Kcal</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-emerald-600 text-sm">{Math.round(meal.protein)}g</span>
                    <span className="text-slate-500">Prot</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-amber-500 text-sm">{Math.round(meal.carbs)}g</span>
                    <span className="text-slate-500">Carb</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-rose-500 text-sm">{Math.round(meal.fat)}g</span>
                    <span className="text-slate-500">Fat</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 uppercase mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Ingredients & Portions
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400">
                            <th className="pb-1 font-medium">Item</th>
                            <th className="pb-1 font-medium text-right">Qty</th>
                            <th className="pb-1 font-medium text-right">P</th>
                            <th className="pb-1 font-medium text-right">C</th>
                            <th className="pb-1 font-medium text-right">F</th>
                            <th className="pb-1 font-medium text-right">Kcal</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600">
                          {meal.ingredients.map((ing, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                              <td className="py-2 font-medium text-slate-800">{ing.name}</td>
                              <td className="py-2 text-right font-bold text-indigo-600">{ing.grams}g</td>
                              <td className="py-2 text-right">{ing.protein}</td>
                              <td className="py-2 text-right">{ing.carbs}</td>
                              <td className="py-2 text-right">{ing.fat}</td>
                              <td className="py-2 text-right">{ing.calories}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 uppercase mb-2">Instructions</h5>
                    <ol className="text-sm text-slate-700 list-decimal list-inside space-y-1">
                      {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 mt-2 bg-indigo-50/30 -mx-5 px-5 py-3 -mb-5">
                     <p className="text-sm text-slate-600">
                       <span className="font-semibold text-indigo-600">Quick Option:</span> {meal.alternative}
                     </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* AI Tweaker Chat Box */}
          <div className="bg-slate-800 rounded-xl p-4 shadow-lg ring-1 ring-slate-900/5 mt-4">
             <div className="flex items-center gap-2 mb-3">
               <span className="material-symbols-rounded text-indigo-400">magic_button</span>
               <h4 className="text-white text-sm font-semibold">Tweak this plan</h4>
             </div>
             <p className="text-slate-400 text-xs mb-3">
               Don't like something? Tell the AI to adjust the ingredients or meals.
             </p>
             <div className="flex gap-2">
               <input
                 type="text"
                 value={tweakInput}
                 onChange={(e) => setTweakInput(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="e.g. 'Swap chicken for tofu', 'I want something spicy', 'Remove the snack'"
                 className="flex-1 bg-slate-700 text-white placeholder-slate-400 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-600"
               />
               <button
                 onClick={handleTweakSubmit}
                 disabled={isGenerating || !tweakInput.trim()}
                 className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isGenerating || !tweakInput.trim()
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                 }`}
               >
                 {isGenerating ? '...' : 'Update'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanDisplay;