import React, { useEffect, useState } from 'react';
import type { MirrorAnalysis } from '@/pages/BehavioralMirror';
import { Card, CardContent } from '@/component/ui/card';
import { Smartphone, TrendingUp, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';

interface PatternCardProps {
  pattern: MirrorAnalysis['patterns'][0];
  delay: number;
}

const getIcon = (title: string, type: string) => {
  const t = title.toLowerCase();
  if (t.includes('distraction')) return <Smartphone className="h-5 w-5" />;
  if (t.includes('trend') || t.includes('recovery')) return <TrendingUp className="h-5 w-5" />;
  if (t.includes('intervention')) return <CheckCircle className="h-5 w-5" />;
  if (t.includes('awareness') || t.includes('journal')) return <BookOpen className="h-5 w-5" />;
  return type === 'warning' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />;
};

export const PatternCard: React.FC<PatternCardProps> = ({ pattern, delay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const isWarning = pattern.type === 'warning';
  const IconComponent = getIcon(pattern.title, pattern.type);

  return (
    <Card
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${
        isWarning
          ? 'border-amber-400/40 bg-amber-50/20'
          : 'border-green-400/40 bg-green-50/20'
      }`}
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`text-xl font-semibold flex items-center gap-2 ${isWarning ? 'text-amber-500' : 'text-green-500'}`}>
            {IconComponent}
            <span className="text-foreground">{pattern.title}</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold tracking-wider uppercase ${
              isWarning
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-green-500/20 text-green-600 dark:text-green-400'
            }`}
          >
            {isWarning ? 'PATTERN' : 'STRENGTH'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-grow">
          {pattern.body}
        </p>
        <div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {pattern.stat}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {pattern.statLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
