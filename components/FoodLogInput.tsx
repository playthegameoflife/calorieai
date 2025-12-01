import React, { useState, useRef } from 'react';
import { AppState } from '../types';

interface FoodLogInputProps {
  onLogFood: (text: string) => Promise<void>;
  onLogImage: (base64Data: string, mimeType: string) => Promise<void>;
  appState: AppState;
}

const FoodLogInput: React.FC<FoodLogInputProps> = ({ onLogFood, onLogImage, appState }) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || appState !== AppState.IDLE) return;
    
    await onLogFood(input);
    setInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      await onLogImage(base64String, mimeType);
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isParsing = appState === AppState.PARSING_FOOD;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
      <h3 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Log Food
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type what you ate OR snap a photo..."
            className="w-full p-4 pr-12 pb-12 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
            rows={3}
            disabled={isParsing}
          />
          
          <div className="absolute bottom-3 left-3 flex gap-2">
             <input 
               type="file" 
               accept="image/*" 
               capture="environment"
               ref={fileInputRef}
               className="hidden"
               onChange={handleImageUpload}
               disabled={isParsing}
             />
             <button
               type="button"
               onClick={triggerFileInput}
               disabled={isParsing}
               className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${
                 isParsing 
                   ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                   : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600'
               }`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isParsing ? 'Analyzing...' : 'Snap Photo'}
             </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isParsing}
            className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
              !input.trim() || isParsing 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
            }`}
          >
            {isParsing ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 ml-1">
          Type naturally or upload a photo of your meal.
        </p>
      </form>
    </div>
  );
};

export default FoodLogInput;