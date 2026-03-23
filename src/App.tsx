import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import {
  Book,
  Target as TargetIcon,
  BarChart3,
  Moon,
  Sun,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, MOODS } from './utils';
import { Entry, Target, Task, ReflectionAnswers } from './types';
import { analyzePatterns } from './services/gemini';
import { runInsightEngine, DailyState } from './services/InsightEngine';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';

import NeuroHealth1View from './components/NeuroHealth1View';

export default function App() {
  console.log("APP COMPONENT IS MOUNTING");
  const [activeTab, setActiveTab] = useState<'daily' | 'targets' | 'insights' | 'neuro1'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState<Entry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState<{ id: number, top: string, left: string, size: string, duration: string }[]>([]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    // Generate static stars
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const [entryRes, tasksRes] = await Promise.all([
        fetch(`/api/entries/${dateStr}`).then(res => res.json()),
        fetch(`/api/tasks/${dateStr}`).then(res => res.json())
      ]);
      setEntry(entryRes || {
        date: dateStr,
        journal_text: '',
        mood: '',
        sleep_start: '22:00',
        sleep_end: '07:00',
        reflection_json: JSON.stringify({
          worries: '',
          sadness: '',
          annoyance: '',
          bodyNeeds: '',
          loveliness: ''
        })
      });
      setTasks(tasksRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (updatedEntry: Partial<Entry>) => {
    const newEntry = { ...entry, ...updatedEntry } as Entry;
    setEntry(newEntry);
    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    });
  };



  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-8 relative">
      <div className="stars-container">
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              '--duration': star.duration
            } as any}
          />
        ))}
      </div>

      <header className="flex justify-between items-center mb-12 relative z-10">
        <div>
          <h1 className="text-5xl font-serif tracking-tight mb-1 text-white">Aham</h1>
          <p className="text-sm uppercase tracking-widest text-accent/80 font-medium">Cosmic Self-Inquiry</p>
        </div>
        <nav className="flex gap-2 bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/10 flex-wrap justify-center">
          <NavButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Book size={18} />} label="Daily" />
          <NavButton active={activeTab === 'targets'} onClick={() => setActiveTab('targets')} icon={<TargetIcon size={18} />} label="Targets" />
          <NavButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={18} />} label="Insights" />
          <NavButton active={activeTab === 'neuro1'} onClick={() => setActiveTab('neuro1')} icon={<Heart size={18} />} label="Neuro Core" />
        </nav>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <section className="flex items-center justify-between">
                <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-3xl font-serif italic">{format(selectedDate, 'MMMM do, yyyy')}</h2>
                <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronRight size={24} />
                </button>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="md:col-span-2 space-y-8">
                  {/* Journal */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Journal Entry</label>
                    <textarea
                      value={entry?.journal_text || ''}
                      onChange={(e) => saveEntry({ journal_text: e.target.value })}
                      placeholder="What is moving through you today?"
                      className="w-full h-64 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl focus:outline-none focus:ring-1 focus:ring-accent/40 font-serif text-lg resize-none text-white placeholder:text-white/20"
                    />
                  </div>

                  {/* Reflection Questions */}
                  <div className="space-y-6">
                    <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Evening Reflection</label>
                    <div className="space-y-4">
                      <ReflectionField
                        label="What am I worried about?"
                        value={JSON.parse(entry?.reflection_json || '{}').worries}
                        onChange={(val) => {
                          const ref = JSON.parse(entry?.reflection_json || '{}');
                          saveEntry({ reflection_json: JSON.stringify({ ...ref, worries: val }) });
                        }}
                      />
                      <ReflectionField
                        label="What am I presently sad about?"
                        value={JSON.parse(entry?.reflection_json || '{}').sadness}
                        onChange={(val) => {
                          const ref = JSON.parse(entry?.reflection_json || '{}');
                          saveEntry({ reflection_json: JSON.stringify({ ...ref, sadness: val }) });
                        }}
                      />
                      <ReflectionField
                        label="Who has annoyed me and how?"
                        value={JSON.parse(entry?.reflection_json || '{}').annoyance}
                        onChange={(val) => {
                          const ref = JSON.parse(entry?.reflection_json || '{}');
                          saveEntry({ reflection_json: JSON.stringify({ ...ref, annoyance: val }) });
                        }}
                      />
                      <ReflectionField
                        label="What does my body want?"
                        value={JSON.parse(entry?.reflection_json || '{}').bodyNeeds}
                        onChange={(val) => {
                          const ref = JSON.parse(entry?.reflection_json || '{}');
                          saveEntry({ reflection_json: JSON.stringify({ ...ref, bodyNeeds: val }) });
                        }}
                      />
                      <ReflectionField
                        label="What is still lovely?"
                        value={JSON.parse(entry?.reflection_json || '{}').loveliness}
                        onChange={(val) => {
                          const ref = JSON.parse(entry?.reflection_json || '{}');
                          saveEntry({ reflection_json: JSON.stringify({ ...ref, loveliness: val }) });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Mood */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Current Mood</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MOODS.map(m => (
                        <button
                          key={m.label}
                          onClick={() => saveEntry({ mood: m.label })}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-2xl border transition-all backdrop-blur-md",
                            entry?.mood === m.label ? "border-accent bg-accent/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:border-accent/40"
                          )}
                        >
                          <span className="text-xl mb-1">{m.emoji}</span>
                          <span className="text-[10px] uppercase font-bold tracking-tighter">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Sleep Cycle</label>
                    <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-accent/80">
                          <Moon size={16} />
                          <span className="text-xs font-medium">Slept at</span>
                        </div>
                        <input
                          type="time"
                          value={entry?.sleep_start || ''}
                          onChange={(e) => saveEntry({ sleep_start: e.target.value })}
                          className="text-sm font-mono focus:outline-none bg-transparent text-white"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-accent/80">
                          <Sun size={16} />
                          <span className="text-xs font-medium">Woke at</span>
                        </div>
                        <input
                          type="time"
                          value={entry?.sleep_end || ''}
                          onChange={(e) => saveEntry({ sleep_end: e.target.value })}
                          className="text-sm font-mono focus:outline-none bg-transparent text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Daily Routine</label>
                    </div>
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 group">
                          <button
                            onClick={async () => {
                              await fetch(`/api/tasks/${task.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ completed: !task.completed })
                              });
                              fetchDailyData();
                            }}
                            className="text-accent/40 hover:text-accent transition-colors"
                          >
                            {task.completed ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
                          </button>
                          <span className={cn("flex-1 text-sm", task.completed && "line-through text-accent/40")}>{task.title}</span>
                          <button
                            onClick={async () => {
                              await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
                              fetchDailyData();
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Add task..."
                          className="flex-1 bg-transparent border-b border-black/10 text-sm py-1 focus:outline-none focus:border-accent"
                          onKeyDown={async (e) => {
                            const input = e.currentTarget;
                            if (e.key === 'Enter' && input.value) {
                              const title = input.value;
                              input.value = '';
                              await fetch('/api/tasks', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ date: dateStr, title })
                              });
                              fetchDailyData();
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'targets' && (
            <TargetsView />
          )}

          {activeTab === 'insights' && (
            <InsightsView />
          )}

          {activeTab === 'neuro1' && (
            <NeuroHealth1View />
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
        active ? "bg-white/10 text-white shadow-inner" : "text-white/40 hover:text-white/60"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ReflectionField({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-serif italic text-accent/80">{label}</p>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-white/10 py-1 focus:outline-none focus:border-accent text-sm text-white"
      />
    </div>
  );
}

function TargetsView() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [type, setType] = useState<'weekly' | 'monthly'>('weekly');

  const getPeriodKey = () => {
    const now = new Date();
    if (type === 'weekly') return format(startOfWeek(now), 'yyyy-ww');
    return format(now, 'yyyy-MM');
  };

  const fetchTargets = async () => {
    const res = await fetch(`/api/targets/${getPeriodKey()}`);
    const data = await res.json();
    setTargets(data.filter((t: Target) => t.type === type));
  };

  useEffect(() => {
    fetchTargets();
  }, [type]);

  const addTarget = async (title: string) => {
    await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, period_key: getPeriodKey() })
    });
    fetchTargets();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative z-10"
    >
      <div className="flex gap-4 border-b border-white/10">
        {(['weekly', 'monthly'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "pb-2 px-1 text-sm font-medium uppercase tracking-widest transition-all",
              type === t ? "border-b-2 border-accent text-white" : "text-white/30"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {targets.map(target => (
          <div key={target.id} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl group">
            <button
              onClick={async () => {
                await fetch(`/api/targets/${target.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ completed: !target.completed })
                });
                fetchTargets();
              }}
              className="text-accent/40 hover:text-accent transition-colors"
            >
              {target.completed ? <CheckCircle2 size={24} className="text-emerald-400" /> : <Circle size={24} />}
            </button>
            <span className={cn("flex-1 text-lg font-serif text-white", target.completed && "line-through text-white/30")}>{target.title}</span>
            <button
              onClick={async () => {
                await fetch(`/api/targets/${target.id}`, { method: 'DELETE' });
                fetchTargets();
              }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-4 p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl">
          <Plus size={24} className="text-accent/40" />
          <input
            type="text"
            placeholder={`Add ${type} target...`}
            className="flex-1 bg-transparent focus:outline-none font-serif text-lg text-white placeholder:text-white/20"
            onKeyDown={(e) => {
              const input = e.currentTarget;
              if (e.key === 'Enter' && input.value) {
                addTarget(input.value);
                input.value = '';
              }
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}


function InsightsView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [insightResult, setInsightResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetch('/api/entries').then(res => res.json()).then(setEntries);
  }, []);

  /** Derive DailyState metrics from the loaded journal entries */
  const buildDailyState = (): DailyState => {
    const today = entries[0];
    const recent = entries.slice(0, 4);

    // Sleep hours for the most recent night
    const sleepHours = (() => {
      if (!today?.sleep_start || !today?.sleep_end) return 7;
      const start = new Date(`2000-01-01T${today.sleep_start}`);
      const end = new Date(`2000-01-01T${today.sleep_end}`);
      if (end < start) end.setDate(end.getDate() + 1);
      return (end.getTime() - start.getTime()) / 3_600_000;
    })();

    // Wake-time variance vs prior 3 days (minutes)
    const wakeTimeVarianceMinutes = (() => {
      const wakeMinutes = (e: Entry) => {
        const [h, m] = (e.sleep_end || '07:00').split(':').map(Number);
        return h * 60 + m;
      };
      if (recent.length < 2) return 0;
      const todayWake = wakeMinutes(recent[0]);
      const avg = recent.slice(1).reduce((s, e) => s + wakeMinutes(e), 0) / (recent.length - 1);
      return Math.abs(todayWake - avg);
    })();

    // Consecutive negative mood days
    const NEGATIVE = new Set(['Anxious', 'Sad', 'Angry', 'Tired', 'Meh']);
    let consecutiveNegativeMoodDays = 0;
    for (const e of entries) {
      if (NEGATIVE.has(e.mood)) consecutiveNegativeMoodDays++;
      else break;
    }

    // Journal word count for today
    const journalWordCount = today?.journal_text
      ? today.journal_text.trim().split(/\s+/).length
      : 0;

    return {
      sleepHours,
      wakeTimeVarianceMinutes,
      mood: today?.mood || 'Peaceful',
      consecutiveNegativeMoodDays,
      journalWordCount,
      targetsCompletedToday: 0,       // targets not available in entries; extend later
      daysSinceLastCompletedTarget: 0, // same — hook up from targets API later
      currentTime: new Date(),
    };
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setInsightResult(null);
    // 600ms UX delay for a sense of calculation
    await new Promise(r => setTimeout(r, 600));
    const state = buildDailyState();
    const result = runInsightEngine(state);
    setInsightResult(result);
    setIsAnalyzing(false);
  };

  const handleAcknowledge = () => {
    console.log('[Aham Insight] Acknowledged:', insightResult);
    setInsightResult(null);
  };

  const handleAddToRoutine = () => {
    console.log('[Aham Insight] Add to Routine:', insightResult);
    // TODO: wire to task creation API
  };

  const moodData = entries.slice(0, 7).reverse().map(e => ({
    date: format(new Date(e.date), 'MMM d'),
    moodScore: MOODS.findIndex(m => m.label === e.mood) + 1
  }));

  const sleepData = entries.slice(0, 7).reverse().map(e => {
    const start = new Date(`2000-01-01T${e.sleep_start}`);
    const end = new Date(`2000-01-01T${e.sleep_end}`);
    if (end < start) end.setDate(end.getDate() + 1);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return {
      date: format(new Date(e.date), 'MMM d'),
      hours: parseFloat(hours.toFixed(1))
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 relative z-10"
    >
      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Mood Trajectory</label>
          <div className="h-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0a0ff' }} />
                <YAxis hide domain={[0, 6]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#050508', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                />
                <Line type="monotone" dataKey="moodScore" stroke="#a0a0ff" strokeWidth={2} dot={{ r: 4, fill: '#a0a0ff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Sleep Patterns (Hours)</label>
          <div className="h-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a0a0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a0a0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0a0ff' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0a0ff' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#050508', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#a0a0ff" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Insight Engine ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Insight Engine</label>
          <button
            id="analyze-patterns-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing || entries.length < 1}
            className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent/30 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} />
            Analyze Patterns
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Loading state ── */}
          {isAnalyzing && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center gap-4 rounded-3xl"
              style={{
                border: '1px solid rgba(160,160,255,0.15)',
                background: 'rgba(160,160,255,0.03)',
                animation: 'insightPulse 1.8s ease-in-out infinite',
              }}
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border border-accent/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-accent/60" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent/50 font-semibold">
                Scanning patterns&hellip;
              </p>
            </motion.div>
          )}

          {/* ── Result card ── */}
          {!isAnalyzing && insightResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-8 bg-white/5 backdrop-blur-xl border border-accent/25 rounded-3xl shadow-[0_0_40px_rgba(160,160,255,0.07)] space-y-6"
            >
              {/* Cosmic accent line */}
              <div className="w-8 h-px bg-gradient-to-r from-accent/60 to-transparent" />

              <p className="text-white/90 leading-relaxed font-serif text-xl">
                {insightResult}
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  id="insight-acknowledge-btn"
                  onClick={handleAcknowledge}
                  className="px-5 py-2 rounded-full border border-white/15 text-white/60 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/80 transition-all"
                >
                  Acknowledge
                </button>
                <button
                  id="insight-add-routine-btn"
                  onClick={handleAddToRoutine}
                  className="px-5 py-2 rounded-full bg-accent/20 border border-accent/40 text-white text-xs font-bold uppercase tracking-widest hover:bg-accent/30 transition-all"
                >
                  Add to Routine
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Empty / prompt state ── */}
          {!isAnalyzing && !insightResult && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center border-2 border-dashed border-white/10 rounded-3xl"
            >
              <p className="text-white/20 font-serif italic">
                {entries.length < 1
                  ? "Log your first entry to unlock the Insight Engine."
                  : "Tap \u2018Analyze Patterns\u2019 to begin your self-inquiry."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
