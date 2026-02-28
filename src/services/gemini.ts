import { GoogleGenAI, Type } from "@google/genai";

let ai: any;
const getAI = () => {
  if (!ai) {
    const apiKey = typeof import.meta !== "undefined" && (import.meta as any).env ? ((import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY) : "";
    // Natively fallback to a dummy key to prevent synchronous crash during module load
    ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || "unconfigured_key" });
  }
  return ai;
};

export const generateDailyImage = async (summary: string, mood: string, tasks: string[]) => {
  try {
    const taskSummary = tasks.length > 0 ? `Completed tasks: ${tasks.join(', ')}.` : '';
    const moodContext = mood ? `The overall mood was ${mood}.` : '';
    const prompt = `A minimalist, atmospheric, and symbolic artistic representation of a day. 
    Journal Summary: ${summary}. 
    ${moodContext}
    ${taskSummary}
    Style: Abstract, warm organic, fine art photography or soft painting. Focus on the emotional essence and visual metaphors.`;

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
  return null;
};

export const analyzePatterns = async (entries: any[]) => {
  const history = entries.map(e => ({
    date: e.date,
    mood: e.mood,
    journal: e.journal_text,
    reflections: JSON.parse(e.reflection_json || "{}")
  }));

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze the following journal history and provide deep insights into patterns of thought, emotional loops, and cycles. 
      Instead of giving direct answers, provide 3-5 profound self-inquiry questions that direct the user to look deeper into their own nature.
      
      History: ${JSON.stringify(history)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "A brief objective analysis of patterns." },
            inquiryQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Profound questions for self-inquiry."
            }
          },
          required: ["analysis", "inquiryQuestions"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing patterns:", error);
    return null;
  }
};
