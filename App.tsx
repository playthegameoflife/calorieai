import React, { useState, useEffect } from 'react';
import { FoodItem, DailyGoal, AppState, MealSuggestion, Macros, UserProfile } from './types';
import { DEFAULT_GOALS, MOCK_USER_ID } from './constants';
import { parseFoodLog, generateAdaptivePlan, analyzeFoodImage } from './services/geminiService';
import { getGreeting } from './utils/timeUtils';
import { DEFAULT_PROFILE } from './utils/calculationUtils';

// Components
import DailySummary from './components/DailySummary';
import FoodLogInput from './components/FoodLogInput';
import LoggedFoodList from './components/LoggedFoodList';
import MealPlanDisplay from './components/MealPlanDisplay';
import SettingsModal from './components/SettingsModal';
import ChatAssistant from './components/ChatAssistant';

const App: React.FC = () => {
  // State
  const [goals, setGoals] = useState<DailyGoal>(DEFAULT_GOALS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loggedFoods, setLoggedFoods] = useState<FoodItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealSuggestion[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derived State: Consumed Macros
  const consumed: Macros = loggedFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remainingCalories = Math.max(0, goals.calories - consumed.calories);

  // Initial Load (Profile & Logs)
  useEffect(() => {
    const loadData = () => {
      // 1. Load Logs
      const today = new Date().toISOString().split('T')[0];
      const logsKey = `meal_log_${MOCK_USER_ID}_${today}`;
      const savedLogs = localStorage.getItem(logsKey);
      if (savedLogs) {
        try {
          setLoggedFoods(JSON.parse(savedLogs));
        } catch (e) { console.error("Failed to parse logs"); }
      }

      // 2. Load Profile & Goals
      const profileKey = `user_profile_${MOCK_USER_ID}`;
      const savedProfile = localStorage.getItem(profileKey);
      
      const goalsKey = `user_goals_${MOCK_USER_ID}`;
      const savedGoals = localStorage.getItem(goalsKey);

      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch (e) { console.error("Failed to parse profile"); }
      } else {
        // First time user? Open onboarding
        setIsSettingsOpen(true);
      }

      if (savedGoals) {
        try {
          setGoals(JSON.parse(savedGoals));
        } catch (e) { console.error("Failed to parse goals"); }
      }
    };

    loadData();
  }, []);

  // Persist Logs
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `meal_log_${MOCK_USER_ID}_${today}`;
    localStorage.setItem(key, JSON.stringify(loggedFoods));
  }, [loggedFoods]);

  // Handle Save Settings
  const handleSaveSettings = (newProfile: UserProfile, newGoals: DailyGoal) => {
    setUserProfile(newProfile);
    setGoals(newGoals);
    
    localStorage.setItem(`user_profile_${MOCK_USER_ID}`, JSON.stringify(newProfile));
    localStorage.setItem(`user_goals_${MOCK_USER_ID}`, JSON.stringify(newGoals));
    
    // Clear current meal plan if goals change significantly
    setMealPlan([]);
  };

  // Handlers
  const handleLogFood = async (text: string) => {
    setAppState(AppState.PARSING_FOOD);
    setErrorMsg(null);
    try {
      const newItems = await parseFoodLog(text);
      setLoggedFoods(prev => [...prev, ...newItems]);
      
      // Clear previous plan as it is now stale
      setMealPlan([]);
      setAppState(AppState.IDLE);
    } catch (err) {
      setErrorMsg("Could not process food log. Try being more specific.");
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const handleLogImage = async (base64Data: string, mimeType: string) => {
    setAppState(AppState.PARSING_FOOD);
    setErrorMsg(null);
    try {
      // Use analyzeFoodImage which calls gemini-3-pro-preview
      const newItems = await analyzeFoodImage(base64Data, mimeType);
      setLoggedFoods(prev => [...prev, ...newItems]);
      
      setMealPlan([]);
      setAppState(AppState.IDLE);
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not analyze image. Please try again.");
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const handleQuickLogMeal = async (meal: MealSuggestion) => {
    // Convert meal suggestion to a logged food item
    const newItem: FoodItem = {
      id: crypto.randomUUID(),
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      timestamp: new Date().toISOString()
    };
    
    setLoggedFoods(prev => [...prev, newItem]);
    
    // Remove the meal from the plan to reflect it's been eaten
    setMealPlan(prev => prev.filter(m => m !== meal));
  };

  const handleDeleteFood = (id: string) => {
    setLoggedFoods(prev => prev.filter(f => f.id !== id));
    setMealPlan([]); // Plan is stale
  };

  const handleGeneratePlan = async (instruction?: string, mealCount?: number) => {
    setAppState(AppState.GENERATING_PLAN);
    setErrorMsg(null);
    try {
      // Small delay to allow UI to update if needed
      await new Promise(r => setTimeout(r, 100));
      const plan = await generateAdaptivePlan(consumed, goals, new Date(), instruction, mealCount);
      setMealPlan(plan);
      setAppState(AppState.IDLE);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate plan. Please check your connection.");
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const handleResetDay = () => {
    if (confirm("Are you sure you want to clear today's log?")) {
      setLoggedFoods([]);
      setMealPlan([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentProfile={userProfile}
        onSave={handleSaveSettings}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{getGreeting()}</p>
            <h1 className="text-xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
              Adaptive Planner
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              onClick={handleResetDay}
              className="text-slate-400 hover:text-red-500 transition-colors p-2"
              title="Reset Day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-5 py-6">
        
        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center">
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             {errorMsg}
          </div>
        )}

        {/* Dashboard */}
        <DailySummary goals={goals} consumed={consumed} />

        {/* Input */}
        <FoodLogInput 
          onLogFood={handleLogFood} 
          onLogImage={handleLogImage}
          appState={appState} 
        />

        {/* Logged List */}
        <LoggedFoodList foods={loggedFoods} onDelete={handleDeleteFood} />

        {/* Generated Plan */}
        <MealPlanDisplay 
          plan={mealPlan} 
          onGenerate={handleGeneratePlan}
          onQuickLog={handleQuickLogMeal}
          appState={appState} 
          remainingCalories={remainingCalories}
        />
        
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Powered by Google Gemini • React • Tailwind</p>
        </div>
      </main>
      
      {/* Chat Interaction */}
      <ChatAssistant 
        onLogFood={handleLogFood} 
        onGeneratePlan={(instruction) => handleGeneratePlan(instruction)}
        currentContext={{ goals, consumed, mealPlan }}
      />
    </div>
  );
};

export default App;