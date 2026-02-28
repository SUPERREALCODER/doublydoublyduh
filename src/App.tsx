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
  Camera,
  ClipboardList,
  Layout,
  Heart,
  Brain,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, MOODS } from './utils';
import { Entry, Target, Task, ReflectionAnswers, RoutineTemplate } from './types';
import { generateDailyImage, analyzePatterns } from './services/gemini';
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
import HealthVistaView from './components/HealthVistaView';
import NeuroHealth1View from './components/NeuroHealth1View';
import NeuroHealth2View from './components/NeuroHealth2View';

export default function App() {
  console.log("APP COMPONENT IS MOUNTING");
  const [activeTab, setActiveTab] = useState<'daily' | 'targets' | 'insights' | 'templates' | 'health' | 'neuro1' | 'neuro2'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState<Entry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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
    fetchTemplates();
  }, [selectedDate]);

  const fetchTemplates = async () => {
    const res = await fetch('/api/routine-templates');
    const data = await res.json();
    setTemplates(data);
  };

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

  const handleGenerateImage = async () => {
    if (!entry?.journal_text) return;
    setIsGeneratingImage(true);
    const completedTasks = tasks.filter(t => t.completed).map(t => t.title);
    const imageData = await generateDailyImage(entry.journal_text, entry.mood, completedTasks);
    if (imageData) {
      await saveEntry({ image_data: imageData });
    }
    setIsGeneratingImage(false);
  };

  const applyTemplate = async (templateId: number) => {
    await fetch('/api/apply-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, templateId })
    });
    fetchDailyData();
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
          <NavButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} icon={<Layout size={18} />} label="Templates" />
          <NavButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={18} />} label="Insights" />
          <NavButton active={activeTab === 'health'} onClick={() => setActiveTab('health')} icon={<Activity size={18} />} label="Health Body" />
          <NavButton active={activeTab === 'neuro1'} onClick={() => setActiveTab('neuro1')} icon={<Heart size={18} />} label="Neuro Core" />
          <NavButton active={activeTab === 'neuro2'} onClick={() => setActiveTab('neuro2')} icon={<Brain size={18} />} label="Neuro Coach" />
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
                      {templates.length > 0 && (
                        <div className="relative group/menu">
                          <button className="text-[10px] uppercase tracking-widest font-bold text-accent/40 hover:text-accent flex items-center gap-1">
                            <Plus size={10} /> Apply Template
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-black/5 shadow-xl rounded-xl p-2 z-10 min-w-[160px]">
                            {templates.map(t => (
                              <button
                                key={t.id}
                                onClick={() => applyTemplate(t.id)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 rounded-lg transition-colors"
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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

                  {/* Daily Image */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Visual Essence</label>
                    <div className="aspect-square bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative group">
                      {entry?.image_data ? (
                        <img src={entry.image_data} alt="Daily essence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-accent/30 p-6 text-center">
                          <Camera size={32} className="mb-2" />
                          <p className="text-[10px] uppercase tracking-widest font-bold">No image generated</p>
                        </div>
                      )}
                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !entry?.journal_text}
                        className="absolute bottom-4 right-4 p-3 bg-white/10 backdrop-blur shadow-lg rounded-full text-accent hover:scale-110 transition-all disabled:opacity-50 border border-white/20"
                      >
                        {isGeneratingImage ? <Sparkles className="animate-spin" size={20} /> : <Sparkles size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'targets' && (
            <TargetsView />
          )}

          {activeTab === 'templates' && (
            <TemplatesView templates={templates} onUpdate={fetchTemplates} />
          )}

          {activeTab === 'insights' && (
            <InsightsView />
          )}

          {activeTab === 'health' && (
            <HealthVistaView />
          )}

          {activeTab === 'neuro1' && (
            <NeuroHealth1View />
          )}

          {activeTab === 'neuro2' && (
            <NeuroHealth2View />
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
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getPeriodKey = () => {
    const now = new Date();
    if (type === 'daily') return format(now, 'yyyy-MM-dd');
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
        {(['daily', 'weekly', 'monthly'] as const).map(t => (
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

function TemplatesView({ templates, onUpdate }: { templates: RoutineTemplate[], onUpdate: () => void }) {
  const [newName, setNewName] = useState('');
  const [newTasks, setNewTasks] = useState<string[]>(['']);

  const handleAddTaskField = () => setNewTasks([...newTasks, '']);
  const handleTaskChange = (index: number, val: string) => {
    const updated = [...newTasks];
    updated[index] = val;
    setNewTasks(updated);
  };

  const handleSave = async () => {
    if (!newName || newTasks.filter(t => t.trim()).length === 0) return;
    await fetch('/api/routine-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, tasks: newTasks.filter(t => t.trim()) })
    });
    setNewName('');
    setNewTasks(['']);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/routine-templates/${id}`, { method: 'DELETE' });
    onUpdate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 relative z-10"
    >
      <section className="space-y-6">
        <h2 className="text-3xl font-serif italic text-white">Routine Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(template => (
            <div key={template.id} className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-sm space-y-4 relative group">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-serif text-white">{template.name}</h3>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <ul className="space-y-2">
                {template.tasks.map(task => (
                  <li key={task.id} className="text-sm text-white/60 flex items-center gap-2">
                    <Circle size={12} className="text-accent/40" />
                    {task.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* New Template Form */}
          <div className="p-6 bg-white/5 border border-dashed border-white/20 rounded-3xl space-y-4">
            <input
              type="text"
              placeholder="Template Name (e.g. Morning Routine)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 font-serif text-xl focus:outline-none focus:border-accent py-1 text-white placeholder:text-white/20"
            />
            <div className="space-y-2">
              {newTasks.map((task, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Task ${i + 1}`}
                  value={task}
                  onChange={(e) => handleTaskChange(i, e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 text-sm focus:outline-none focus:border-accent py-1 text-white placeholder:text-white/20"
                />
              ))}
              <button
                onClick={handleAddTaskField}
                className="text-[10px] uppercase tracking-widest font-bold text-accent/60 hover:text-accent flex items-center gap-1 pt-2"
              >
                <Plus size={12} /> Add Task
              </button>
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-accent/20 border border-accent/40 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-accent/30 transition-all"
            >
              Save Template
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function InsightsView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [analysis, setAnalysis] = useState<{ analysis: string, inquiryQuestions: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetch('/api/entries').then(res => res.json()).then(setEntries);
  }, []);

  const handleAnalyze = async () => {
    if (entries.length < 3) return;
    setIsAnalyzing(true);
    const result = await analyzePatterns(entries);
    setAnalysis(result);
    setIsAnalyzing(false);
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest font-semibold text-accent/70">Pattern Analysis & Self-Inquiry</label>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || entries.length < 3}
            className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent/30 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />}
            Analyze Patterns
          </button>
        </div>

        {analysis ? (
          <div className="space-y-8">
            <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-sm">
              <h3 className="text-xl font-serif italic mb-4 text-white">Objective Observations</h3>
              <p className="text-white/80 leading-relaxed font-serif text-lg">{analysis.analysis}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.inquiryQuestions.map((q, i) => (
                <div key={i} className="p-6 bg-accent/10 border border-accent/20 rounded-2xl">
                  <p className="text-lg font-serif italic text-accent leading-snug">"{q}"</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-white/20 font-serif italic">
              {entries.length < 3
                ? "Record at least 3 days of journaling to unlock pattern analysis."
                : "Tap 'Analyze Patterns' to begin your self-inquiry."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
