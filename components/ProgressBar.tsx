import React from 'react';

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  unit: string;
  colorClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, total, unit, colorClass }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const remaining = Math.max(0, total - current);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-800">{Math.round(current)}</span> / {total}{unit}
          <span className="ml-1 text-slate-400">({Math.round(remaining)} left)</span>
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;