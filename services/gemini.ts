
import { GoogleGenAI, Type } from "@google/genai";
import { Attendance } from "../types";
import { storageService } from "./storage";

/**
 * Lazy-getter for AI instance. 
 * This prevents the app from crashing on the very first frame 
 * if process.env is temporarily undefined during ESM resolution.
 */
let _aiInstance: any = null;
const getAi = () => {
  if (!_aiInstance) {
    // Falls back to empty string if key is missing to avoid constructor crash
    const apiKey = (window as any).process?.env?.API_KEY || "";
    _aiInstance = new GoogleGenAI({ apiKey });
  }
  return _aiInstance;
};

export const geminiService = {
  /**
   * Verified connectivity to the Apps Script bridge.
   */
  async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.startsWith('http')) {
      return { success: false, message: "Invalid URL format." };
    }
    try {
      await fetch(url, { mode: 'no-cors' });
      return { success: true, message: "Bridge reachable." };
    } catch (err) {
      return { success: false, message: "Connection failed." };
    }
  },

  /**
   * Syncs data to Google Sheets via Gemini formatting.
   */
  async syncToCloud(pendingRecords: Attendance[]): Promise<{ success: boolean; syncedIds: string[]; message: string }> {
    if (pendingRecords.length === 0) return { success: true, syncedIds: [], message: "No records." };

    const config = storageService.getCloudConfig();
    const ai = getAi();

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Format these records for Google Sheets. 
        Records: ${JSON.stringify(pendingRecords)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              syncedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              formattedData: { type: Type.ARRAY, items: { type: Type.OBJECT } }
            },
            required: ["success", "syncedIds", "formattedData"]
          }
        }
      });

      const geminiResult = JSON.parse(response.text);

      if (config.googleSheetUrl && config.googleSheetUrl.startsWith('http')) {
        try {
          await fetch(config.googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify({ records: geminiResult.formattedData })
          });
          
          return { 
            success: true, 
            syncedIds: geminiResult.syncedIds, 
            message: "Cloud sync complete." 
          };
        } catch (fetchErr) {
          return { success: false, syncedIds: [], message: "Network error during sync." };
        }
      }

      return { 
        success: true, 
        syncedIds: geminiResult.syncedIds, 
        message: "Local sync only." 
      };
    } catch (error) {
      console.error("Gemini Sync Error:", error);
      return { success: false, syncedIds: [], message: "AI payload formatting failed." };
    }
  },

  async getAttendanceInsights(records: Attendance[]): Promise<string> {
    if (records.length === 0) return "No data for analysis.";
    const ai = getAi();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize workforce activity: ${JSON.stringify(records)}`,
      });
      return response.text;
    } catch (e) {
      return "Insights currently unavailable.";
    }
  }
};
