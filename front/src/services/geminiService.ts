
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeBatchRisk = async (batchData: any) => {
  const prompt = `Analyze this pharmaceutical production batch for quality risks: ${JSON.stringify(batchData)}. 
  Consider factors like expiry dates, purity levels, and storage conditions. Provide a risk score (0-100) and 3 mitigation steps.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            analysis: { type: Type.STRING },
            mitigationSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["riskScore", "riskLevel", "analysis", "mitigationSteps"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
