
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Simulates a "Sync to Google Sheets" by asking Gemini to format 
   * and validate the payload. In a real app, this would be a direct API call.
   */
  async syncToCloud(pendingRecords: AttendanceRecord[]): Promise<{ success: boolean; syncedIds: string[] }> {
    if (pendingRecords.length === 0) return { success: true, syncedIds: [] };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Process these attendance records for Google Sheets integration. 
        Validate the data format and return a confirmation.
        Records: ${JSON.stringify(pendingRecords)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              syncedCount: { type: Type.NUMBER },
              message: { type: Type.STRING }
            },
            required: ["success", "syncedCount"]
          }
        }
      });

      const result = JSON.parse(response.text);
      if (result.success) {
        return { success: true, syncedIds: pendingRecords.map(r => r.id) };
      }
      return { success: false, syncedIds: [] };
    } catch (error) {
      console.error("Cloud sync simulation failed:", error);
      return { success: false, syncedIds: [] };
    }
  },

  async getAttendanceInsights(records: AttendanceRecord[]): Promise<string> {
    if (records.length === 0) return "No data available for analysis.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this construction site attendance data and provide a brief summary of site activity today. 
      Data: ${JSON.stringify(records)}`,
    });

    return response.text;
  }
};
