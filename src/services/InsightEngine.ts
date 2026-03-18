/**
 * InsightEngine.ts
 *
 * A deterministic, rules-based engine that takes the user's current
 * daily state and returns one specific, actionable directive string.
 *
 * Rules are evaluated in priority order — the first match wins.
 * To add a new rule: insert a new object into the RULES array at the
 * appropriate priority position.
 */

export interface DailyState {
  /** Total sleep hours for the most recent night */
  sleepHours: number;

  /** Absolute difference in minutes between today's wake time and the
   *  average wake time over the prior 3 days */
  wakeTimeVarianceMinutes: number;

  /** Current or most recently logged mood */
  mood: string;

  /** How many consecutive days the user has logged a negative mood */
  consecutiveNegativeMoodDays: number;

  /** Word count of today's journal entry */
  journalWordCount: number;

  /** How many targets were marked complete today */
  targetsCompletedToday: number;

  /** How many days have elapsed since the last completed target */
  daysSinceLastCompletedTarget: number;

  /** Current wall-clock time, used to detect late-day consumption traps */
  currentTime: Date | string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NEGATIVE_MOODS = new Set(['Anxious', 'Sad', 'Angry', 'Tired', 'Meh']);

function isNegativeMood(mood: string): boolean {
  return NEGATIVE_MOODS.has(mood);
}

/** Returns the hour (0-23) from a Date or a "HH:MM" / "HH:MM:SS" string */
function getHour(currentTime: Date | string): number {
  if (currentTime instanceof Date) return currentTime.getHours();
  const parts = currentTime.split(':');
  return parseInt(parts[0], 10);
}

// ---------------------------------------------------------------------------
// Rule definition type
// ---------------------------------------------------------------------------

interface Rule {
  id: string;
  condition: (state: DailyState) => boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Rules — ordered by priority (first match wins)
// ---------------------------------------------------------------------------

export const RULES: Rule[] = [
  {
    id: 'OVER_REFLECTION',
    condition: (s) =>
      s.journalWordCount > 100 &&
      s.targetsCompletedToday === 0 &&
      (s.mood === 'Anxious' || s.mood === 'Sad'),
    message:
      "You are spending more energy analyzing than executing. Close the journal and immediately start a focused deep work block.",
  },
  {
    id: 'VELOCITY_ALERT',
    condition: (s) => s.daysSinceLastCompletedTarget >= 2,
    message:
      "You are losing execution velocity. Every zero-day compounds the daily run-rate required to hit your July 31st targets. Complete one micro-bounty milestone right now to reset momentum.",
  },
  {
    id: 'FALSE_FATIGUE',
    condition: (s) =>
      s.sleepHours >= 8 && (s.mood === 'Sad' || s.mood === 'Anxious'),
    message:
      "You are fully rested. The resistance you feel isn't physical exhaustion; it's likely avoidance of a specific pending task.",
  },
  {
    id: 'CONSUMPTION_TRAP',
    condition: (s) =>
      getHour(s.currentTime) >= 17 && s.targetsCompletedToday === 0,
    message:
      "You claimed the day but lost the execution phase. Beware of slipping into passive consumption tonight. Shut down the screens and protect your focus for tomorrow.",
  },
  {
    id: 'CIRCADIAN_DRIFT',
    condition: (s) => s.wakeTimeVarianceMinutes > 90,
    message:
      "Your sleep schedule is drifting. This inconsistency is likely causing brain fog. Anchor tomorrow's wake time.",
  },
  {
    id: 'ACTION_OVER_ATTACHMENT',
    condition: (s) =>
      s.mood === 'Anxious' &&
      s.journalWordCount > 50 &&
      s.targetsCompletedToday === 0,
    message:
      "You are attached to the friction of the outcome. Drop the grand expectations for the next hour. Act without obsessing over the result and write just one line of code.",
  },
  {
    id: 'STATE_BREAKER',
    condition: (s) => s.consecutiveNegativeMoodDays >= 3,
    message:
      "Psychological friction is high. Step away from the screen and force a physical reset before returning to work.",
  },
];

// ---------------------------------------------------------------------------
// Core engine function
// ---------------------------------------------------------------------------

const FALLBACK_MESSAGE = "Data logged. Tap into your next focus block.";

/**
 * Evaluates the provided daily state against all rules and returns the
 * first matching directive, or the fallback if no rules match.
 *
 * @example
 * import { runInsightEngine } from './services/InsightEngine';
 *
 * const directive = runInsightEngine({
 *   sleepHours: 7.5,
 *   wakeTimeVarianceMinutes: 20,
 *   mood: 'Anxious',
 *   consecutiveNegativeMoodDays: 1,
 *   journalWordCount: 130,
 *   targetsCompletedToday: 0,
 *   daysSinceLastCompletedTarget: 1,
 *   currentTime: new Date(),
 * });
 *
 * console.log(directive); // "You are spending more energy analyzing..."
 */
export function runInsightEngine(state: DailyState): string {
  for (const rule of RULES) {
    if (rule.condition(state)) {
      return rule.message;
    }
  }
  return FALLBACK_MESSAGE;
}
