import React, { useState, useEffect } from 'react';
import { UserProfile, DailyGoal, Gender, ActivityLevel, GoalType } from '../types';
import { calculateTargets, DEFAULT_PROFILE } from '../utils/calculationUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  onSave: (profile: UserProfile, goals: DailyGoal) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentProfile, onSave }) => {
  const [profile, setProfile] = useState<UserProfile>({ ...DEFAULT_PROFILE, isManual: false });
  const [customGoals, setCustomGoals] = useState<DailyGoal | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentProfile) {
        setProfile(currentProfile);
      } else {
        setProfile({ ...DEFAULT_PROFILE, isManual: false });
      }
    }
  }, [isOpen, currentProfile]);

  // Determine effective goals
  const calculatedGoals = calculateTargets(profile);
  const displayGoals = customGoals || calculatedGoals;

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    if (profile.isManual) return; 
    setProfile(prev => ({ ...prev, [field]: value }));
    setCustomGoals(null); 
  };

  const handleManualToggle = (isManual: boolean) => {
    setProfile(prev => ({ ...prev, isManual }));
    if (isManual && !customGoals) {
      setCustomGoals(calculatedGoals);
    } else if (!isManual) {
      setCustomGoals(null);
    }
  };

  const handleGoalChange = (field: keyof DailyGoal, value: number) => {
    setCustomGoals(prev => ({
      ...(prev || calculatedGoals),
      [field]: value
    }));
  };

  const handleSave = () => {
    const finalProfile = { ...profile, isManual: profile.isManual || !!customGoals };
    onSave(finalProfile, displayGoals);
    onClose();
  };

  // --- UNIT CONVERSION HELPERS ---
  const toFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { ft, inches };
  };

  const handleHeightChange = (ft: number, inches: number) => {
    if (profile.isManual) return;
    const cm = ((ft * 12) + inches) * 2.54;
    handleProfileChange('height', Math.round(cm));
  };

  const { ft, inches } = toFtIn(profile.height);
  const weightLbs = Math.round(profile.weight * 2.20462);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {currentProfile ? 'Settings & Goals' : 'Welcome! Let\'s set you up'}
          </h2>
          {currentProfile && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          
          {/* Mode Switcher */}
          <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-md ${profile.isManual ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                 </svg>
               </div>
               <div>
                 <p className="text-sm font-semibold text-slate-800">Calculation Mode</p>
                 <p className="text-xs text-slate-500">{profile.isManual ? 'Manual Input' : 'Auto-Calculate (Recommended)'}</p>
               </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={profile.isManual} onChange={(e) => handleManualToggle(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Section 1: Biometrics (Disabled if Manual) */}
          <div className={`transition-opacity ${profile.isManual ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Your Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${profile.gender === 'male' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => handleProfileChange('gender', 'male')}
                  >
                    Male
                  </button>
                  <div className="w-px bg-slate-200"></div>
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${profile.gender === 'female' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => handleProfileChange('gender', 'female')}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleProfileChange('age', parseInt(e.target.value) || 0)}
                  className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Height</label>
                <div className="flex gap-2">
                   <div className="relative w-1/2">
                       <input
                           type="number"
                           value={ft}
                           onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0, inches)}
                           className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                           placeholder="ft"
                       />
                       <span className="absolute right-3 top-2 text-xs text-slate-400">ft</span>
                   </div>
                   <div className="relative w-1/2">
                       <input
                           type="number"
                           value={inches}
                           onChange={(e) => handleHeightChange(ft, parseInt(e.target.value) || 0)}
                           className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                           placeholder="in"
                       />
                       <span className="absolute right-3 top-2 text-xs text-slate-400">in</span>
                   </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  value={weightLbs}
                  onChange={(e) => handleProfileChange('weight', (parseInt(e.target.value) || 0) / 2.20462)}
                  className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Activity Level</label>
              <select
                value={profile.activity}
                onChange={(e) => handleProfileChange('activity', e.target.value as ActivityLevel)}
                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="sedentary">Sedentary (Office job, little exercise)</option>
                <option value="light">Lightly Active (1-3 days/week)</option>
                <option value="moderate">Moderately Active (3-5 days/week)</option>
                <option value="heavy">Very Active (6-7 days/week)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Goal</label>
              <select
                value={profile.goal}
                onChange={(e) => handleProfileChange('goal', e.target.value as GoalType)}
                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="lose">Lose Weight (-500 kcal deficit)</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Gain Muscle (+300 kcal surplus)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Targets */}
          <div className={`p-4 rounded-xl border border-slate-200 ${profile.isManual ? 'bg-white shadow-md ring-2 ring-indigo-500/20' : 'bg-slate-50'}`}>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
               <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
               {profile.isManual ? 'Manual Targets' : 'Calculated Targets'}
            </h3>
            
            {!profile.isManual && (
               <p className="text-xs text-slate-500 mb-4">
                 Based on your stats. Switch to Manual Mode above to edit these directly.
               </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="block text-xs font-medium text-slate-700 mb-1">Daily Calories</label>
                 <div className="relative">
                   <input
                    type="number"
                    value={displayGoals.calories}
                    onChange={(e) => handleGoalChange('calories', parseInt(e.target.value) || 0)}
                    disabled={!profile.isManual}
                    className={`w-full p-2 pl-3 pr-10 text-sm font-bold border rounded-lg outline-none transition-colors ${
                       profile.isManual 
                         ? 'text-slate-800 border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white' 
                         : 'text-slate-500 border-slate-200 bg-slate-100 cursor-not-allowed'
                    }`}
                   />
                   <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">kcal</span>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={displayGoals.protein}
                  onChange={(e) => handleGoalChange('protein', parseInt(e.target.value) || 0)}
                  disabled={!profile.isManual}
                  className={`w-full p-2 text-sm border rounded-lg outline-none transition-colors ${
                    profile.isManual 
                      ? 'border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white' 
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={displayGoals.carbs}
                  onChange={(e) => handleGoalChange('carbs', parseInt(e.target.value) || 0)}
                  disabled={!profile.isManual}
                  className={`w-full p-2 text-sm border rounded-lg outline-none transition-colors ${
                    profile.isManual 
                      ? 'border-slate-300 focus:ring-2 focus:ring-amber-500 bg-white' 
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={displayGoals.fat}
                  onChange={(e) => handleGoalChange('fat', parseInt(e.target.value) || 0)}
                  disabled={!profile.isManual}
                  className={`w-full p-2 text-sm border rounded-lg outline-none transition-colors ${
                    profile.isManual 
                      ? 'border-slate-300 focus:ring-2 focus:ring-rose-500 bg-white' 
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="flex items-end">
                 <div className="text-xs text-slate-400">
                    Expected: {Math.round((displayGoals.protein * 4) + (displayGoals.carbs * 4) + (displayGoals.fat * 9))} kcal
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            Save & Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;