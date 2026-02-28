import React, { useState, useEffect, useRef } from 'react';
import {
    Activity,
    Moon,
    Utensils,
    Droplets,
    Smile,
    Send,
    User as UserIcon,
    LayoutDashboard,
    MessageSquare,
    RefreshCw,
    ChevronRight,
    TrendingUp,
    Award,
    AlertCircle,
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { parseHealthInput, generateDailySummary } from '../services/geminiHealthVista';
import { Profile, LogEntry, DailyStats } from '../types';
import Markdown from 'react-markdown';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function HealthVistaView() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'profile'>('dashboard');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const fetchData = async () => {
        try {
            const [profileRes, logsRes] = await Promise.all([
                fetch('/api/profile'),
                fetch('/api/healthvista-logs')
            ]);
            const profileData = await profileRes.json();
            const logsData = await logsRes.json();
            setProfile(profileData);
            setLogs(logsData);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (): DailyStats => {
        const stats: DailyStats = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            water: 0,
            exerciseMinutes: 0,
            sleepMinutes: 0
        };

        logs.forEach(log => {
            const c = log.content;
            if (log.type === 'meal') {
                stats.calories += c.calories || 0;
                stats.protein += c.protein || 0;
                stats.carbs += c.carbs || 0;
                stats.fat += c.fat || 0;
            } else if (log.type === 'exercise') {
                stats.exerciseMinutes += c.durationMinutes || 0;
            } else if (log.type === 'sleep') {
                stats.sleepMinutes += c.durationMinutes || 0;
            } else if (log.type === 'water') {
                stats.water += c.amountMl || 0;
            }
        });

        return stats;
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isProcessing) return;

        const userMsg = input;
        setInput('');
        setIsProcessing(true);

        try {
            const stats = calculateStats();
            const result = await parseHealthInput(userMsg, { stats, profile });

            if (result.isNewDayRequest) {
                await fetch('/api/reset-day', { method: 'POST' });
                await fetchData();
                setSummary(null);
            } else if (result.isSummaryRequest) {
                const summaryText = await generateDailySummary(logs, profile);
                setSummary(summaryText);
                setActiveTab('dashboard');
            } else if (result.type !== 'unknown') {
                await fetch('/api/healthvista-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: result.type, content: result.content })
                });
                await fetchData();
            }
        } catch (err) {
            console.error("Error processing message:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const newProfile = {
            age: Number(data.age),
            gender: data.gender as string,
            weight: Number(data.weight),
            height: Number(data.height),
            goal: data.goal as string,
            conditions: data.conditions as string,
            target_calories: Number(data.target_calories),
            target_protein: Number(data.target_protein),
            target_carbs: Number(data.target_carbs),
            target_fat: Number(data.target_fat),
        };

        await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfile)
        });

        setProfile(newProfile);
        setActiveTab('dashboard');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!profile && activeTab !== 'profile') {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center py-24">
                <div className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to HealthVista AI</h1>
                    <p className="text-gray-500 mb-8">Let's set up your profile to start your personalized health journey.</p>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        );
    }

    const stats = calculateStats();
    const macroData = [
        { name: 'Protein', value: stats.protein },
        { name: 'Carbs', value: stats.carbs },
        { name: 'Fat', value: stats.fat },
    ];

    return (
        <div className="bg-[#f5f5f5] text-black pb-24 rounded-[40px] overflow-hidden shadow-2xl relative min-h-[800px]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-none">HealthVista AI</h1>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Personal Coach</span>
                    </div>
                </div>
                {profile && (
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-medium uppercase">Current Goal</p>
                            <p className="text-xs font-bold text-gray-900">{profile.goal}</p>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                )}
            </header>

            <main className="px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    icon={<Activity className="w-5 h-5 text-orange-500" />}
                                    label="Calories"
                                    value={stats.calories}
                                    target={profile?.target_calories || 2000}
                                    unit="kcal"
                                    color="bg-orange-50"
                                />
                                <StatCard
                                    icon={<Moon className="w-5 h-5 text-indigo-500" />}
                                    label="Sleep"
                                    value={Math.round(stats.sleepMinutes / 60 * 10) / 10}
                                    target={8}
                                    unit="hrs"
                                    color="bg-indigo-50"
                                />
                                <StatCard
                                    icon={<Droplets className="w-5 h-5 text-blue-500" />}
                                    label="Water"
                                    value={stats.water}
                                    target={2500}
                                    unit="ml"
                                    color="bg-blue-50"
                                />
                                <StatCard
                                    icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                                    label="Exercise"
                                    value={stats.exerciseMinutes}
                                    target={45}
                                    unit="min"
                                    color="bg-emerald-50"
                                />
                            </div>

                            {/* Main Dashboard Content */}
                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Summary Section */}
                                    {summary && (
                                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-emerald-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4">
                                                <Award className="w-8 h-8 text-emerald-500 opacity-20" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                Daily Insight
                                            </h2>
                                            <div className="prose prose-sm max-w-none text-gray-600">
                                                <Markdown>{summary}</Markdown>
                                            </div>
                                            <button
                                                onClick={() => setSummary(null)}
                                                className="mt-6 text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:gap-2 transition-all"
                                            >
                                                Dismiss <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Recent Activity */}
                                    <div className="bg-white p-8 rounded-[32px] shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                                            <button
                                                onClick={() => setActiveTab('chat')}
                                                className="text-sm font-semibold text-emerald-600 flex items-center gap-1"
                                            >
                                                Log New <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {logs.length === 0 ? (
                                                <div className="text-center py-12 text-gray-400">
                                                    <p>No activity logged yet today.</p>
                                                </div>
                                            ) : (
                                                logs.map((log, i) => (
                                                    <ActivityItem key={log.id || i} log={log} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Stats */}
                                <div className="space-y-8">
                                    <div className="bg-white p-6 rounded-[32px] shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Macros</h3>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={macroData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {macroData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-3 mt-4">
                                            <MacroRow label="Protein" value={stats.protein} target={profile?.target_protein || 150} color="bg-emerald-500" />
                                            <MacroRow label="Carbs" value={stats.carbs} target={profile?.target_carbs || 200} color="bg-blue-500" />
                                            <MacroRow label="Fat" value={stats.fat} target={profile?.target_fat || 60} color="bg-amber-500" />
                                        </div>
                                    </div>

                                    <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-lg shadow-emerald-200">
                                        <h3 className="font-bold mb-2">Ready for a summary?</h3>
                                        <p className="text-emerald-100 text-sm mb-6">Get a deep dive into your health metrics and a plan for tomorrow.</p>
                                        <button
                                            onClick={async () => {
                                                setIsProcessing(true);
                                                const summaryText = await generateDailySummary(logs, profile);
                                                setSummary(summaryText);
                                                setIsProcessing(false);
                                            }}
                                            disabled={isProcessing}
                                            className="w-full bg-white text-emerald-600 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate Summary'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-[32px] shadow-sm overflow-hidden flex flex-col h-[600px]"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="font-bold text-gray-900">HealthVista Assistant</h2>
                                <p className="text-xs text-gray-500">Log meals, workouts, sleep, and more using natural language.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {logs.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 text-sm">Start by saying something like:<br />"I ate 2 eggs and a toast for breakfast"</p>
                                    </div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={log.id || i} className="flex flex-col gap-2">
                                        <div className="self-end bg-emerald-600 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-sm">
                                            {log.content.name || log.type}
                                        </div>
                                        <div className="self-start bg-gray-100 text-gray-700 px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                                            {log.content.explanation || `Logged ${log.type} successfully.`}
                                        </div>
                                    </div>
                                ))}
                                {isProcessing && (
                                    <div className="flex gap-2">
                                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-100">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Describe your meal, workout, or sleep..."
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm text-black"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isProcessing}
                                        className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white p-8 rounded-[32px] shadow-sm"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">User Profile</h2>
                            <form onSubmit={handleProfileSubmit} className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Basics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Age" name="age" type="number" defaultValue={profile?.age} required />
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                                            <select name="gender" defaultValue={profile?.gender} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-black" required>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Weight (kg)" name="weight" type="number" step="0.1" defaultValue={profile?.weight} required />
                                        <Input label="Height (cm)" name="height" type="number" defaultValue={profile?.height} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Main Goal</label>
                                        <select name="goal" defaultValue={profile?.goal} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-black" required>
                                            <option value="Weight Loss">Weight Loss</option>
                                            <option value="Muscle Gain">Muscle Gain</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Athletic Performance">Athletic Performance</option>
                                            <option value="General Wellness">General Wellness</option>
                                        </select>
                                    </div>
                                    <Input label="Medical Conditions / Allergies" name="conditions" defaultValue={profile?.conditions} />
                                </div>

                                <div className="space-y-6">
                                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Targets</h3>
                                    <Input label="Daily Calories (kcal)" name="target_calories" type="number" defaultValue={profile?.target_calories || 2000} required />
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="Protein (g)" name="target_protein" type="number" defaultValue={profile?.target_protein || 150} required />
                                        <Input label="Carbs (g)" name="target_carbs" type="number" defaultValue={profile?.target_carbs || 200} required />
                                        <Input label="Fat (g)" name="target_fat" type="number" defaultValue={profile?.target_fat || 60} required />
                                    </div>
                                    <div className="pt-8">
                                        <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                                            Save Profile
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Navigation Bar */}
            <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-2 flex items-center gap-2 z-50">
                <NavButton
                    active={activeTab === 'dashboard'}
                    onClick={() => setActiveTab('dashboard')}
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    label="Home"
                />
                <NavButton
                    active={activeTab === 'chat'}
                    onClick={() => setActiveTab('chat')}
                    icon={<MessageSquare className="w-5 h-5" />}
                    label="Log"
                />
                <NavButton
                    active={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                    icon={<UserIcon className="w-5 h-5" />}
                    label="Profile"
                />
            </nav>
        </div>
    );
}

function StatCard({ icon, label, value, target, unit, color }: any) {
    const pct = Math.min(100, (value / target) * 100);
    return (
        <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-50">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl font-bold text-gray-900">{value}</span>
                <span className="text-[10px] text-gray-500 font-medium">{unit}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className={`h-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-gray-400'}`}
                />
            </div>
        </div>
    );
}

function ActivityItem({ log }: { log: LogEntry }) {
    const icons = {
        meal: <Utensils className="w-4 h-4 text-orange-500" />,
        exercise: <Activity className="w-4 h-4 text-emerald-500" />,
        sleep: <Moon className="w-4 h-4 text-indigo-500" />,
        water: <Droplets className="w-4 h-4 text-blue-500" />,
        mood: <Smile className="w-4 h-4 text-amber-500" />
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100/50 hover:bg-gray-100 transition-colors cursor-default">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                {icons[log.type]}
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{log.content.name || log.type.charAt(0).toUpperCase() + log.type.slice(1)}</h4>
                <p className="text-xs text-gray-500">
                    {log.type === 'meal' && `${log.content.calories} kcal • P:${log.content.protein}g C:${log.content.carbs}g F:${log.content.fat}g`}
                    {log.type === 'exercise' && `${log.content.durationMinutes} min • ${log.content.intensity || 'Moderate'}`}
                    {log.type === 'sleep' && `${Math.round(log.content.durationMinutes / 60 * 10) / 10} hrs • Quality: ${log.content.quality}/10`}
                    {log.type === 'water' && `${log.content.amountMl} ml`}
                    {log.type === 'mood' && log.content.mood}
                </p>
            </div>
            <div className="text-[10px] font-medium text-gray-400 uppercase">
                {new Date(log.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
}

function MacroRow({ label, value, target, color }: any) {
    const pct = Math.min(100, (value / target) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900">{value} / {target}g</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function NavButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
        >
            {icon}
            {active && <span className="text-sm font-bold">{label}</span>}
        </button>
    );
}

function Input({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
            <input
                {...props}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black"
            />
        </div>
    );
}
