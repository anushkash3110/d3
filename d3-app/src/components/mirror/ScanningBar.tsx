import React, { useEffect, useState } from 'react';

interface ScanningBarProps {
  onDone: () => void;
}

const STAGES = [
  "Reading your journal entries...",
  "Correlating mood with screen time...",
  "Detecting behavioral patterns...",
  "Identifying your trigger loops...",
  "Generating your psychological profile..."
];

export const ScanningBar: React.FC<ScanningBarProps> = ({ onDone }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 4 seconds = 4000ms. We want to go from 0 to 100.
    // 4000 / 100 = 40ms per 1% progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        onDone();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [progress, onDone]);

  // Determine stage text
  const stageIndex = Math.min(Math.floor((progress / 100) * STAGES.length), STAGES.length - 1);
  const currentStage = STAGES[stageIndex];

  // SVG ring math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-2xl w-full max-w-lg mx-auto shadow-md">
      
      {/* SVG Progress Ring */}
      <div className="relative flex items-center justify-center w-32 h-32 mb-6">
        <svg className="transform -rotate-90 w-32 h-32">
          {/* Background Ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Animated Ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-100 ease-linear"
          />
        </svg>
        <div className="absolute flex items-center justify-center inset-0 text-xl font-bold text-foreground">
          {progress}%
        </div>
      </div>

      {/* Stage Text */}
      <div className="text-foreground font-medium mb-8 text-center h-6 animate-pulse">
        {currentStage}
      </div>

      {/* Terminal Log */}
      <div className="w-full bg-muted/30 border border-border rounded-xl p-4 font-mono text-xs text-muted-foreground flex flex-col gap-2 overflow-hidden h-40">
        {progress >= 5 && <div>&gt; scanning journals[0..27]</div>}
        {progress >= 15 && <div>&gt; extracting sentiment vectors</div>}
        {progress >= 25 && <div>&gt; cross-referencing screentime.db</div>}
        {progress >= 35 && <div>&gt; running pattern analysis</div>}
        {progress >= 40 && (
          <div>
            &gt; mood_correlation: <span className="text-primary">computing...</span>
            {progress >= 45 && <span className="text-foreground"> -0.72</span>}
          </div>
        )}
        {progress >= 60 && (
          <div>
            &gt; trigger_loop: <span className="text-amber-500">scanning...</span>
            {progress >= 70 && <span className="text-amber-600 dark:text-amber-400 font-bold"> DETECTED</span>}
          </div>
        )}
        {progress >= 90 && (
          <div className="text-green-500">
            &gt; profile_generation: COMPLETE ✓
          </div>
        )}
        <div className="animate-pulse opacity-50">&gt; ▍</div>
      </div>
      
    </div>
  );
};
