import { GoogleGenAI, Type } from "@google/genai";
import { UserData } from "../types";

let ai: any;
const getAI = () => {
    if (!ai) {
        const apiKey = typeof import.meta !== "undefined" && (import.meta as any).env ? ((import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY) : "";
        ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || "unconfigured_key" });
    }
    return ai;
};

export const getNeuroInsights = async (data: UserData) => {
    try {
        const response = await getAI().models.generateContent({
            model: "gemini-2.0-flash-exp", // Using a stable flash model for quick insights
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Analyze this neuro-health data and provide personalized insights. 
              Data: ${JSON.stringify(data)}
              
              Provide the response in JSON format with the following structure:
              {
                "brainScore": number (0-100),
                "stateDescription": "string",
                "recommendations": ["string"],
                "cognitiveOutlook": "string",
                "scientificContext": "string"
              }`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brainScore: { type: Type.NUMBER },
                        stateDescription: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        cognitiveOutlook: { type: Type.STRING },
                        scientificContext: { type: Type.STRING }
                    },
                    required: ["brainScore", "stateDescription", "recommendations", "cognitiveOutlook", "scientificContext"]
                }
            }
        });

        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Error fetching neuro insights:", error);
        return null;
    }
};
