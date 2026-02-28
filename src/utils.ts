import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MOODS = [
  { label: 'Peaceful', emoji: '🕊️', color: 'bg-blue-50' },
  { label: 'Joyful', emoji: '☀️', color: 'bg-yellow-50' },
  { label: 'Anxious', emoji: '🌪️', color: 'bg-slate-100' },
  { label: 'Sad', emoji: '🌧️', color: 'bg-indigo-50' },
  { label: 'Angry', emoji: '🔥', color: 'bg-red-50' },
  { label: 'Productive', emoji: '🌱', color: 'bg-emerald-50' },
];
