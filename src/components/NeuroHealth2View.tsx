import React, { useState, useEffect, useRef } from 'react';
import {
    Brain, Moon, Activity, Coffee, Heart, Zap, RefreshCw, Send,
    Plus, Calendar, Target, Award, Info, BookOpen, Sun, TrendingUp,
    ShieldCheck, AlertCircle, Sparkles, User, CalendarDays
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiResponse, parseLogData } from '../services/geminiNeuro2';
import { ChatMessage, User as UserType } from '../types';
import Markdown from 'react-markdown';
import { cn } from '../utils';

import * as d3 from 'd3-shape';

export default function NeuroHealth2View() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState<UserType | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showBanner, setShowBanner] = useState(true);

    const [activityHistory, setActivityHistory] = useState<any[]>([]);
    const [moodHistory, setMoodHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const fetchUserData = async () => {
        try {
            const [userRes, historyRes] = await Promise.all([
                fetch('/api/user'),
                fetch('/api/chat-history')
            ]);
            const userData = await userRes.json();
            setUser(userData);

            const historyData = await historyRes.json();
            if (historyData.length > 0) {
                setMessages(historyData.map((h: any) => ({ role: h.role, content: h.content })));
            } else {
                setMessages([{
                    role: 'model',
                    content: "Welcome to NeuroPulse AI. How are your energy levels and focus today? Let's optimize your performance."
                }]);
            }

            const logsRes = await fetch('/api/logs?limit=30');
            const logs = await logsRes.json();
            processLogsForCharts(logs);

        } catch (e) {
            console.error("Failed to fetch user data", e);
        }
    };

    const processLogsForCharts = (logs: any[]) => {
        const activity = logs.filter(l => l.type === 'activity').map(l => ({
            date: new Date(l.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            value: JSON.parse(l.value).duration,
            intensity: JSON.parse(l.value).intensity
        })).reverse();
        setActivityHistory(activity);

        const mood = logs.filter(l => l.type === 'mood').map(l => ({
            date: new Date(l.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: JSON.parse(l.value).score
        })).reverse();
        setMoodHistory(mood);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        try {
            const extractedData = await parseLogData(userMessage);

            if (extractedData?.type && extractedData?.data && user) {
                await fetch('/api/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        type: extractedData.type,
                        value: extractedData.data
                    })
                });
                fetchUserData();
            }

            await fetch('/api/chat-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, role: 'user', content: userMessage })
            });

            const aiResponseText = await getGeminiResponse(userMessage, messages);

            await fetch('/api/chat-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, role: 'model', content: aiResponseText })
            });

            setMessages(prev => [...prev, { role: 'model', content: aiResponseText }]);

            if (extractedData?.type === 'mood' || extractedData?.type === 'activity') {
                fetchUserData();
            }

        } catch (err) {
            console.error("Error chatting:", err);
            setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble processing that right now. Could you try again?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const StatPanel = ({ label, value, subtext, icon: Icon, colorClass }: any) => (
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className={cn("w-24 h-24", colorClass)} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5", colorClass)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-white/50 tracking-wider uppercase">{label}</span>
                </div>
                <div>
                    <span className="text-4xl font-light text-white tracking-tight">{value}</span>
                    <p className="text-sm text-white/40 mt-2 font-medium">{subtext}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-[#0a0a0a] text-white min-h-[800px] font-sans selection:bg-purple-500/30 rounded-[40px] overflow-hidden shadow-2xl relative border border-white/5">

            {/* Preview banner */}
            <AnimatePresence>
              {showBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-2.5 rounded-full bg-purple-950/80 border border-purple-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.15)] text-sm whitespace-nowrap"
                >
                  <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-white/70"><span className="text-purple-400 font-semibold">Preview</span> — Neuro Coach is under development. AI responses are live via Gemini.</span>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="ml-2 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl blur flex items-center justify-center" />
                            <div className="relative w-10 h-10 bg-black rounded-xl border border-white/10 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-blue-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">NeuroPulse AI</h1>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Version 2.0</p>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                        {['Dashboard', 'Coach'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                    activeTab === tab.toLowerCase()
                                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Neural Points</span>
                                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-1">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    {user.neural_points.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-full border border-white/10 flex items-center justify-center">
                                <span className="font-bold text-sm">{user.name.charAt(0)}</span>
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dashboard' ? (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="h-full overflow-y-auto p-8 space-y-8 no-scrollbar"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatPanel
                                        label="Current Streak"
                                        value={`${user?.streak || 0} Days`}
                                        subtext="Consistency is key to neuroplasticity."
                                        icon={Zap}
                                        colorClass="text-amber-400"
                                    />
                                    <StatPanel
                                        label="Avg Mood"
                                        value={(moodHistory.reduce((a, b) => a + b.score, 0) / (moodHistory.length || 1)).toFixed(1) || "-"}
                                        subtext="7-day rolling average."
                                        icon={Sun}
                                        colorClass="text-orange-400"
                                    />
                                    <StatPanel
                                        label="Activity"
                                        value={`${activityHistory.length > 0 ? activityHistory[activityHistory.length - 1].value : '-'} min`}
                                        subtext="Last logged session."
                                        icon={Activity}
                                        colorClass="text-emerald-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Mood Trend Chart */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h3 className="text-lg font-medium text-white mb-1">Emotional Resonance</h3>
                                                <p className="text-sm text-white/40">Mood scoring over recent logs</p>
                                            </div>
                                            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                                                <Heart className="w-6 h-6 text-orange-400" />
                                            </div>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            {moodHistory.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={moodHistory}>
                                                        <defs>
                                                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis domain={[1, 10]} stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                                        <RechartsTooltip
                                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '16px' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                        <Area type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center flex-col text-white/30">
                                                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-sm">Log mood to see trends</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Bar Chart */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h3 className="text-lg font-medium text-white mb-1">Physical Output</h3>
                                                <p className="text-sm text-white/40">Exercise duration in minutes</p>
                                            </div>
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                                <Activity className="w-6 h-6 text-emerald-400" />
                                            </div>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            {activityHistory.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={activityHistory}>
                                                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                                        <RechartsTooltip
                                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', color: '#fff' }}
                                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        />
                                                        <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                                                            {activityHistory.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.intensity === 'high' ? '#34d399' : '#059669'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center flex-col text-white/30">
                                                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-sm">Log activity to see trends</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="coach"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col max-w-4xl mx-auto px-4 sm:px-8"
                            >
                                <div className="flex-1 overflow-y-auto py-8 space-y-8 no-scrollbar pr-4">
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={idx}
                                            className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                                        >
                                            <div className={cn(
                                                "max-w-[85%] rounded-[2rem] px-6 py-4 relative group",
                                                msg.role === 'user'
                                                    ? "bg-white text-black rounded-tr-sm"
                                                    : "bg-white/5 border border-white/10 text-white rounded-tl-sm backdrop-blur-md"
                                            )}>
                                                {msg.role === 'model' && (
                                                    <div className="absolute -left-10 top-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 p-[1px]">
                                                        <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                                                            <Sparkles className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "prose prose-sm max-w-none leading-relaxed",
                                                    msg.role === 'user'
                                                        ? "prose-p:text-black font-medium"
                                                        : "prose-invert prose-p:text-white/80 prose-strong:text-white prose-li:text-white/80 prose-headings:text-white prose-a:text-blue-400"
                                                )}>
                                                    {msg.role === 'model' ? <Markdown>{msg.content}</Markdown> : <p>{msg.content}</p>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="flex justify-start ml-12"
                                        >
                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] rounded-tl-sm px-6 py-5 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="py-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent sticky bottom-0">
                                    <form onSubmit={handleSend} className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-[2.5rem] opacity-50" />
                                        <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-[2rem] p-2 backdrop-blur-xl focus-within:border-white/30 focus-within:bg-white/10 transition-all duration-300">
                                            <textarea
                                                value={input}
                                                onChange={(e) => {
                                                    setInput(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                                                }}
                                                placeholder="Log sleep, mood, workout, or ask for insights..."
                                                className="w-full bg-transparent border-none text-white placeholder-white/30 focus:ring-0 resize-none py-4 px-6 max-h-[150px] min-h-[60px] outline-none text-sm placeholder:font-light"
                                                rows={1}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend(e);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!input.trim() || isTyping}
                                                className="w-12 h-12 shrink-0 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 transition-all hover:scale-105 active:scale-95 mb-1 mr-1"
                                            >
                                                <Send className="w-5 h-5 ml-1" />
                                            </button>
                                        </div>
                                    </form>
                                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                                        {["I slept 7 hours and feel rested", "My mood is 8/10", "Did 45min HIIT workout"].map(suggestion => (
                                            <button
                                                key={suggestion}
                                                onClick={() => setInput(suggestion)}
                                                className="px-4 py-2 rounded-full border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
