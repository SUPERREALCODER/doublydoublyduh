import { GoogleGenAI, Type } from "@google/genai";

let ai: any;
const getAI = () => {
    if (!ai) {
        const apiKey = typeof import.meta !== "undefined" && (import.meta as any).env ? ((import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY) : "";
        ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || "unconfigured_key" });
    }
    return ai;
};

export interface HealthLog {
    type: 'meal' | 'exercise' | 'sleep' | 'water' | 'mood';
    content: any;
}

export const parseHealthInput = async (input: string, currentStats: any) => {
    const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user said: "${input}". 
    Current context: ${JSON.stringify(currentStats)}.
    Extract health tracking data from this input. 
    If it's a meal, calculate calories, macros (P/C/F), fiber, and key micros.
    If it's exercise, estimate calories burned.
    If it's sleep, extract duration and quality.
    If it's water, extract amount in ml.
    If it's mood, extract the mood state.
    
    Return a structured log object.`,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        enum: ['meal', 'exercise', 'sleep', 'water', 'mood', 'unknown'],
                        description: "The type of log entry."
                    },
                    content: {
                        type: Type.OBJECT,
                        description: "The details of the log entry.",
                        properties: {
                            name: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                            fiber: { type: Type.NUMBER },
                            micros: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.NUMBER },
                                        unit: { type: Type.STRING },
                                        dailyValuePct: { type: Type.NUMBER }
                                    }
                                }
                            },
                            durationMinutes: { type: Type.NUMBER },
                            intensity: { type: Type.STRING },
                            quality: { type: Type.NUMBER }, // 1-10
                            amountMl: { type: Type.NUMBER },
                            mood: { type: Type.STRING },
                            explanation: { type: Type.STRING, description: "A brief friendly response from HealthVista AI about this entry." }
                        }
                    },
                    isNewDayRequest: { type: Type.BOOLEAN, description: "True if user wants to start a new day or reset." },
                    isSummaryRequest: { type: Type.BOOLEAN, description: "True if user wants a summary of the day." }
                },
                required: ["type", "content"]
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateDailySummary = async (logs: any[], profile: any) => {
    const response = await getAI().models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a comprehensive HealthVista AI daily summary.
    User Profile: ${JSON.stringify(profile)}
    Daily Logs: ${JSON.stringify(logs)}
    
    Include:
    1. Overall Health Score (0-100)
    2. Sleep analysis
    3. Exercise analysis
    4. Nutrition analysis (macros/micros)
    5. Strengths and Wins
    6. 3 specific improvements for tomorrow
    7. Tomorrow's suggested plan.
    
    Format as a beautiful markdown response.`,
    });

    return response.text;
};
