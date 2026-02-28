export interface Entry {
  id?: number;
  date: string;
  journal_text: string;
  mood: string;
  sleep_start: string;
  sleep_end: string;
  reflection_json: string;
  image_data?: string;
}

export interface Target {
  id?: number;
  type: 'daily' | 'weekly' | 'monthly';
  title: string;
  completed: boolean;
  period_key: string;
}

export interface Task {
  id?: number;
  date: string;
  title: string;
  completed: boolean;
}

export interface RoutineTemplate {
  id: number;
  name: string;
  tasks: { id: number; title: string }[];
}

export interface ReflectionAnswers {
  worries: string;
  sadness: string;
  annoyance: string;
  bodyNeeds: string;
  loveliness: string;
}

// HealthVista-AI Types
export interface Profile {
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  conditions: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

export interface LogEntry {
  id?: number;
  date: string;
  type: 'meal' | 'exercise' | 'sleep' | 'water' | 'mood';
  content: any;
  created_at?: string;
}

export interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  exerciseMinutes: number;
  sleepMinutes: number;
}

// neuro-health2.0 (and 1.0) Types
export interface User {
  id: number;
  email: string;
  name: string;
  neural_points: number;
  streak: number;
  last_log_date: string;
}

export interface Log {
  id: number;
  user_id: number;
  type: 'mood' | 'sleep' | 'activity' | 'eating' | 'brain_waves' | 'routine';
  value: string; // JSON string
  logged_at: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface BrainWaveData {
  alpha: number;
  beta: number;
  theta: number;
  gamma: number;
}

export interface SleepData {
  hours: number;
  quality: number; // 1-10
}

export interface MoodData {
  score: number; // 1-10
  emotion: string;
}

export interface UserData {
  mood: number; // 1-10
  stress: number; // 1-10
  sleepHours: number;
  activityMinutes: number;
  dietQuality: number; // 1-10
  journalEntry: string;
  hrv: number; // Heart Rate Variability (ms)
}
