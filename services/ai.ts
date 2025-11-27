import { GoogleGenAI, Type } from "@google/genai";
import { Lead, InteractionLog } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';
let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            console.error("Gemini API key is missing. AI features will be disabled.");
            return null;
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const AIService = {
  getLeadScore: async (lead: Lead): Promise<{ score: number; justification: string }> => {
    const genAI = getAi();
    if (!genAI) throw new Error("AI Service not initialized.");

    const prompt = `
      Analyze the following sales lead and provide a score from 1-100 indicating its quality and a short, one-sentence justification.
      A higher score means a better lead.
      Consider factors like industry, stated service needs, and potential value (GMV).

      Lead Data:
      - Industry: ${lead.industry || 'Not specified'}
      - Service Needed: ${lead.serviceNeeded || 'Not specified'}
      - Expected GMV: ${lead.gmv || 'Not specified'}
      - Lead Source: ${lead.leadSource || 'Not specified'}
      - Remarks: ${lead.remarks || 'None'}

      Return a single JSON object with two keys: "score" (a number) and "justification" (a string).
    `;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        justification: { type: Type.STRING },
                    },
                    required: ["score", "justification"],
                }
            }
        });
        
        const text = response.text.trim();
        const result = JSON.parse(text);

        return {
            score: result.score || 0,
            justification: result.justification || "Could not generate justification."
        };

    } catch (error) {
        console.error("Error getting lead score:", error);
        throw new Error("Failed to get AI analysis. The model may be unavailable.");
    }
  },

  summarizeInteractions: async (logs: InteractionLog[]): Promise<string> => {
    const genAI = getAi();
    if (!genAI) throw new Error("AI Service not initialized.");
    
    if (logs.length === 0) return "No interactions to summarize.";

    const conversation = logs.map(log => `${log.createdBy} (${log.type}): ${log.content}`).join('\n');

    const prompt = `
      Summarize the following interaction log into a few concise bullet points.
      Highlight key customer needs, objections, important decisions, and next steps.

      Log:
      ${conversation}
    `;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing interactions:", error);
        throw new Error("Failed to generate summary.");
    }
  },

  draftFollowUp: async (lead: Lead): Promise<string> => {
    const genAI = getAi();
    if (!genAI) throw new Error("AI Service not initialized.");

    const conversationHistory = (lead.interactionLog || [])
      .slice(-3) // Get last 3 interactions for context
      .map(log => `${log.createdBy} said: ${log.content}`)
      .join('\n');

    const prompt = `
      Based on the following lead information and recent conversation history, draft a brief, professional follow-up message.
      The goal is to move the conversation forward. If a meeting was discussed, suggest it. If a question was asked, answer it concisely if possible or suggest a call.
      Keep it short, like an SMS or a quick note. Do not add a sign-off like "Best regards".

      Lead Name: ${lead.ownerName}
      Service Needed: ${lead.serviceNeeded}
      Last few interactions:
      ${conversationHistory || "No recent interactions."}
    `;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error drafting follow-up:", error);
        throw new Error("Failed to draft reply.");
    }
  },
};