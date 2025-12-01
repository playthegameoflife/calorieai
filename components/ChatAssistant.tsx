import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Schema } from "@google/genai";
import { DailyGoal, Macros, MealSuggestion } from '../types';

interface ChatAssistantProps {
  onLogFood: (text: string) => Promise<void>;
  onGeneratePlan: (instruction?: string) => Promise<void>;
  currentContext: {
    goals: DailyGoal;
    consumed: Macros;
    mealPlan: MealSuggestion[];
  };
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onLogFood, onGeneratePlan, currentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Tools Definition
  const tools: FunctionDeclaration[] = [
    {
      name: 'log_food',
      description: 'Log a food item or meal that the user just ate.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          food_description: {
            type: Type.STRING,
            description: 'The description of the food (e.g., "2 eggs and toast").',
          },
        },
        required: ['food_description'],
      },
    },
    {
      name: 'generate_plan',
      description: 'Generate or regenerate the remaining meal plan. Use this if the user asks for a plan OR wants to change/tweak the current plan.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          modifications: {
            type: Type.STRING,
            description: 'Specific user requests to modify the plan (e.g., "no eggs", "more chicken", "add a snack").',
          },
        },
      },
    },
    {
      name: 'get_status',
      description: 'Get the current nutrition status (calories/macros remaining).',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    }
  ];

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        You are a helpful nutrition assistant.
        Current Status:
        - Eaten: ${Math.round(currentContext.consumed.calories)} / ${currentContext.goals.calories} kcal
        - Remaining: ${Math.round(currentContext.goals.calories - currentContext.consumed.calories)} kcal
        
        Current Generated Meal Plan:
        ${currentContext.mealPlan.length > 0 ? JSON.stringify(currentContext.mealPlan) : "None generated yet."}

        If the user wants to log food, use the log_food tool.
        If the user wants a meal plan, use the generate_plan tool.
        If the user wants to CHANGE the current plan (e.g. "I don't like eggs"), use generate_plan with the 'modifications' argument.
        
        Keep responses concise and friendly.
      `;

      // Construct history for context
      const contents = [
        { role: 'user', parts: [{ text: userText }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: tools }],
        },
      });

      const candidate = response.candidates?.[0];
      const modelParts = candidate?.content?.parts || [];
      let responseText = "";

      // Handle Tool Calls
      const functionCalls = modelParts.filter(p => p.functionCall).map(p => p.functionCall);
      const textParts = modelParts.filter(p => p.text).map(p => p.text);
      
      if (textParts.length > 0) {
        responseText = textParts.join(' ');
      }

      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          if (!fc) continue;
          
          if (fc.name === 'log_food') {
             const desc = (fc.args as any).food_description;
             await onLogFood(desc);
             responseText = responseText ? responseText + " Food logged." : "I've logged that for you.";
          } else if (fc.name === 'generate_plan') {
             const mods = (fc.args as any).modifications;
             await onGeneratePlan(mods);
             responseText = responseText ? responseText + " Plan updated." : (mods ? "I've updated the plan based on your request." : "I've generated a new plan for your remaining calories.");
          } else if (fc.name === 'get_status') {
             const remaining = Math.round(currentContext.goals.calories - currentContext.consumed.calories);
             responseText = `You have ${remaining} calories left today.`;
          }
        }
      }

      if (!responseText) {
        responseText = "Done.";
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen 
            ? 'bg-slate-800 text-white rotate-90' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
        }`}
      >
        {isOpen ? (
          <span className="material-symbols-rounded">close</span>
        ) : (
          <span className="material-symbols-rounded">chat_bubble</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200" style={{ height: '500px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <span className="material-symbols-rounded text-white text-sm">smart_toy</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">AI Nutrition Assistant</h3>
              <p className="text-indigo-100 text-xs">Ask to log food or plan meals</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center mt-10 text-slate-400 text-sm">
                <p>👋 Hi! Try saying:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>"I ate a turkey sandwich"</li>
                  <li>"Plan my dinner"</li>
                  <li>"How many calories left?"</li>
                </ul>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-rounded">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;