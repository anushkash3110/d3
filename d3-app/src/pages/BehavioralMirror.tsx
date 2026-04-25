import React, { useState, useEffect } from 'react';
import { useMirrorAnalysis } from '@/hooks/useMirrorAnalysis';
import { ScanningBar } from '@/components/mirror/ScanningBar';
import { TypingText } from '@/components/mirror/TypingText';
import { PatternCard } from '@/components/mirror/PatternCard';
import { Button } from '@/component/ui/button';
import { Card, CardContent } from '@/component/ui/card';
import { toast } from 'sonner';
import { Brain, Target, Lightbulb, Leaf, Wind } from 'lucide-react';

const PROTOCOL_ICONS = [Lightbulb, Leaf, Brain, Wind];

export interface MirrorAnalysis {
  coreTrigger: {
    label: string;
    headline: string;
    body: string;
    icon: string;
    severity: string;
  };
  patterns: Array<{
    icon: string;
    title: string;
    body: string;
    stat: string;
    statLabel: string;
    type: 'warning' | 'positive';
  }>;
  prescription: {
    headline: string;
    items: Array<{ icon: string; text: string }>;
  };
  closingLine: string;
  meta: {
    avgDailyMinutes: number;
    goalMetRate: number;
    hoursReclaimed: number;
    scoreImprovement: number;
    moodTrend: string;
    topApps: Array<{ appName: string; totalMinutes: number }>;
    dataPoints: { journals: number; days: number; interventions: number };
  };
}

type Phase = 'idle' | 'scanning' | 'reveal';

export const BehavioralMirror: React.FC = () => {
  const { analysis, loading, error, fetchAnalysis } = useMirrorAnalysis();

  const [phase, setPhase] = useState<Phase>('idle');
  
  // Scanning sync flags
  const [animationDone, setAnimationDone] = useState(false);
  const [apiDone, setApiDone] = useState(false);

  // Reveal cascade states
  const [headlineDone, setHeadlineDone] = useState(false);
  const [bodyDone, setBodyDone] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showClosing, setShowClosing] = useState(false);

  // Trigger scanning
  const handleAnalyzeClick = () => {
    setPhase('scanning');
    setAnimationDone(false);
    setApiDone(false);
    
    // Reset reveal states
    setHeadlineDone(false);
    setBodyDone(false);
    setShowPatterns(false);
    setShowPrescription(false);
    setShowClosing(false);

    fetchAnalysis().then(() => {
      setApiDone(true);
    });
  };

  const handleRefreshClick = () => {
    setPhase('idle');
    setAnimationDone(false);
    setApiDone(false);
    setHeadlineDone(false);
    setBodyDone(false);
    setShowPatterns(false);
    setShowPrescription(false);
    setShowClosing(false);
    
    // Force refresh in the background
    fetchAnalysis(true);
  };

  // Sync animation and API
  useEffect(() => {
    if (phase === 'scanning' && animationDone && apiDone && analysis) {
      setPhase('reveal');
    }
  }, [phase, animationDone, apiDone, analysis]);

  // Reveal cascade timeouts
  useEffect(() => {
    if (phase !== 'reveal') return;

    if (headlineDone && !bodyDone) {
      const t = setTimeout(() => setBodyDone(true), 800);
      return () => clearTimeout(t);
    }
  }, [phase, headlineDone, bodyDone]);

  useEffect(() => {
    if (phase !== 'reveal') return;

    if (bodyDone && !showPatterns) {
      const t = setTimeout(() => setShowPatterns(true), 500);
      return () => clearTimeout(t);
    }
  }, [phase, bodyDone, showPatterns]);

  useEffect(() => {
    if (phase !== 'reveal') return;

    if (showPatterns && !showPrescription) {
      const t = setTimeout(() => setShowPrescription(true), 2200);
      return () => clearTimeout(t);
    }
  }, [phase, showPatterns, showPrescription]);

  useEffect(() => {
    if (phase !== 'reveal') return;

    if (showPrescription && !showClosing) {
      const t = setTimeout(() => setShowClosing(true), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, showPrescription, showClosing]);

  const handleShare = () => {
    if (analysis?.closingLine) {
      navigator.clipboard.writeText(analysis.closingLine);
      toast.success('Copied!');
    }
  };

  const dataPoints = analysis?.meta?.dataPoints || {
    journals: 12,
    days: 30,
    interventions: 8,
  };
  const avgMinutes = analysis?.meta?.avgDailyMinutes || 145;

  return (
    <div className="container mx-auto max-w-5xl py-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* IDLE PHASE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-700">
            <Card className="w-full text-center shadow-md border-border">
              <CardContent className="p-10 md:p-14">
                <div className="flex justify-center mb-6 text-primary">
                  <Brain size={64} strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
                  Your Behavioral Mirror
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                  We'll analyze your journal entries, screen time history, and mood correlations over the last 30 days to reveal your hidden psychological patterns.
                </p>

                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  <span className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground">
                    {dataPoints.journals} journal entries
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground">
                    {avgMinutes} avg min/day
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground">
                    {dataPoints.interventions} interventions
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground">
                    30-day history
                  </span>
                </div>

                {error && <div className="text-destructive mb-4">{error}</div>}

                <Button
                  size="lg"
                  onClick={handleAnalyzeClick}
                  className="rounded-full px-10 py-6 text-lg hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Analyze My Patterns →
                </Button>
                
                <div className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <span>Uses your real data</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SCANNING PHASE */}
        {phase === 'scanning' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
            <ScanningBar onDone={() => setAnimationDone(true)} />
            
            {animationDone && !apiDone && (
              <div className="mt-8 text-primary animate-pulse">
                Almost there... finalizing insights.
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {phase === 'reveal' && analysis && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            
            {/* Core Trigger Card */}
            <Card className="border-primary/30 shadow-md relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <CardContent className="p-8 md:p-10 relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/20 flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    Core Trigger Identified
                  </span>
                  <span className="text-muted-foreground text-sm">{analysis.coreTrigger.label}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:items-start">
                  <div className="shrink-0 text-primary">
                    <Target className="w-16 h-16" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold text-foreground mb-4 leading-tight">
                      <TypingText
                        text={analysis.coreTrigger.headline}
                        speed={40}
                        onDone={() => setHeadlineDone(true)}
                      />
                    </h2>
                    
                    {headlineDone && (
                      <div className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                        <TypingText
                          text={analysis.coreTrigger.body}
                          speed={20}
                          onDone={() => setBodyDone(true)} // Note: wait 500ms before showPatterns via useEffect
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patterns Section */}
            {showPatterns && (
              <div className="pt-6 animate-in fade-in duration-700 space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px bg-border flex-1"></div>
                  <h3 className="text-muted-foreground font-medium tracking-widest uppercase text-sm">Your Patterns</h3>
                  <div className="h-px bg-border flex-1"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {analysis.patterns.map((pattern, idx) => (
                    <PatternCard
                      key={idx}
                      pattern={pattern}
                      delay={idx * 300} // stagger
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Prescription Section */}
            {showPrescription && (
              <Card className="border-green-500/30 mt-12 shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Lightbulb className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-semibold text-foreground">Your Personalized Protocol</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {analysis.prescription.items.map((item, idx) => {
                      const Icon = PROTOCOL_ICONS[idx % PROTOCOL_ICONS.length];
                      return (
                        <div
                          key={idx}
                          className="bg-muted/30 border border-border p-6 rounded-2xl flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'backwards' }}
                        >
                          <div className="shrink-0 text-primary">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="text-foreground text-sm leading-relaxed pt-1">
                            {item.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Closing Quote */}
            {showClosing && (
              <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Card className="bg-muted/50 border-border shadow-sm">
                  <CardContent className="p-8 text-center italic text-lg text-foreground">
                    "{analysis.closingLine}"
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleRefreshClick}
                    className="w-full sm:w-auto rounded-full"
                  >
                    ↺ Refresh Analysis
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleShare}
                    className="w-full sm:w-auto rounded-full"
                  >
                    Share Insight
                  </Button>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};
