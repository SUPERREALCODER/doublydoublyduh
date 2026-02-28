import React, { useState } from 'react';
import {
    Activity, Brain, Moon, Zap, TrendingUp, Sparkles, Plus, Heart, AlertCircle, ChevronRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays } from 'date-fns';
import { getNeuroInsights } from '../services/geminiNeuro1';
import { UserData } from '../types';
import { cn } from '../utils';

const MOCK_HISTORY = Array.from({ length: 7 }).map((_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'MMM dd'),
    mood: Math.floor(Math.random() * 4) + 6,
    stress: Math.floor(Math.random() * 5) + 3,
    brainScore: Math.floor(Math.random() * 20) + 70,
    hrv: Math.floor(Math.random() * 40) + 40,
}));

const BRAIN_WAVE_DATA = Array.from({ length: 50 }).map((_, i) => ({
    time: i,
    alpha: Math.sin(i * 0.2) * 10 + 20 + Math.random() * 5,
    beta: Math.sin(i * 0.5) * 5 + 15 + Math.random() * 3,
    theta: Math.sin(i * 0.1) * 15 + 10 + Math.random() * 7,
}));

const StatCard = ({ title, value, unit, icon: Icon, trend, color }: any) => (
    <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
                <Icon className={cn("w-5 h-5", color.replace('bg-', 'text-'))} />
            </div>
            {trend && (
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full",
                    trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className="text-zinc-400 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-zinc-500 text-xs">{unit}</span>
        </div>
    </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="w-6 h-6 text-indigo-400" />}
        <div>
            <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-zinc-500 text-sm">{subtitle}</p>}
        </div>
    </div>
);

export default function NeuroHealth1View() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState<any>(null);
    const [showCheckIn, setShowCheckIn] = useState(false);

    const [formData, setFormData] = useState<UserData>({
        mood: 7,
        stress: 4,
        sleepHours: 7.5,
        activityMinutes: 45,
        dietQuality: 8,
        journalEntry: "",
        hrv: 55
    });

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await getNeuroInsights(formData);
        setInsights(result);
        setLoading(false);
        setShowCheckIn(false);
    };

    return (
        <div className="bg-black text-zinc-100 font-sans selection:bg-indigo-500/30 rounded-[40px] overflow-hidden shadow-2xl min-h-[800px] relative border border-white/10">
            <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">NeuroHealth <span className="text-indigo-500">1.0</span></span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {['Dashboard', 'Science'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={cn(
                                "text-sm font-medium transition-colors",
                                activeTab === tab.toLowerCase() ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowCheckIn(true)}
                    className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Check-in
                </button>
            </nav>

            <main className="p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Neuro Score" value={insights?.brainScore || 84} unit="/100" icon={Brain} trend={3} color="bg-indigo-500" />
                                <StatCard title="Stress Level" value={formData.stress} unit="Low" icon={Zap} trend={-12} color="bg-amber-500" />
                                <StatCard title="Sleep Quality" value={formData.sleepHours} unit="hrs" icon={Moon} trend={8} color="bg-blue-500" />
                                <StatCard title="HRV (ANS State)" value={formData.hrv} unit="ms" icon={Heart} trend={5} color="bg-rose-500" />
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                                        <SectionHeader title="Cognitive Performance Trend" subtitle="Correlation between mood, stress, and brain score" icon={TrendingUp} />
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={MOCK_HISTORY}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                                    <Area type="monotone" dataKey="brainScore" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                                                    <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} dot={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                                        <SectionHeader title="Brain Wave Proxy" subtitle="Estimated neural oscillations" icon={Activity} />
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={BRAIN_WAVE_DATA}>
                                                    <Line type="monotone" dataKey="alpha" stroke="#6366f1" strokeWidth={1} dot={false} />
                                                    <Line type="monotone" dataKey="beta" stroke="#f59e0b" strokeWidth={1} dot={false} />
                                                    <Line type="monotone" dataKey="theta" stroke="#3b82f6" strokeWidth={1} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Sparkles className="w-24 h-24 text-indigo-500" />
                                        </div>
                                        <SectionHeader title="AI Neuro-Insights" subtitle="Personalized analysis" icon={Sparkles} />

                                        {loading ? (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                                                <div className="h-4 bg-zinc-800 rounded w-full" />
                                                <div className="h-4 bg-zinc-800 rounded w-5/6" />
                                            </div>
                                        ) : insights ? (
                                            <div className="space-y-4">
                                                <p className="text-zinc-300 text-sm leading-relaxed italic">"{insights.stateDescription}"</p>
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Recommendations</h4>
                                                    <ul className="space-y-2">
                                                        {insights.recommendations.map((rec: string, i: number) => (
                                                            <li key={i} className="flex gap-2 text-sm text-zinc-400">
                                                                <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />
                                                                {rec}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="pt-4 border-t border-zinc-800">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Cognitive Outlook</h4>
                                                    <p className="text-sm text-zinc-400">{insights.cognitiveOutlook}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                                <p className="text-zinc-500 text-sm">Complete a check-in to generate AI insights.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'science' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                            <div className="grid lg:grid-cols-2 gap-8">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-4">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                                        <Heart className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <h3 className="text-xl font-bold">HRV & The Vagus Nerve</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Heart Rate Variability (HRV) is a validated proxy for the Autonomic Nervous System (ANS).
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {showCheckIn && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckIn(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold">Daily Neuro Check-in</h2>
                                <button onClick={() => setShowCheckIn(false)} className="text-zinc-500 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
                            </div>
                            <form onSubmit={handleCheckIn} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Mood (1-10)</label>
                                        <input type="number" min="1" max="10" value={formData.mood} onChange={(e) => setFormData({ ...formData, mood: parseInt(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Stress (1-10)</label>
                                        <input type="number" min="1" max="10" value={formData.stress} onChange={(e) => setFormData({ ...formData, stress: parseInt(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="w-5 h-5" /> Generate Insights</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
