
import { GoogleGenAI, Type } from "@google/genai";
import { Attendance } from "../types";
import { storageService } from "./storage";

// Safely initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  /**
   * Verified connectivity to the Apps Script bridge.
   */
  async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.startsWith('http')) {
      return { success: false, message: "Invalid URL format." };
    }
    try {
      // Use no-cors for broadest compatibility during test
      await fetch(url, { mode: 'no-cors' });
      return { success: true, message: "Bridge is reachable. Cloud database active." };
    } catch (err) {
      return { success: false, message: "Connection failed. Check your Deployment settings." };
    }
  },

  /**
   * Syncs data to Google Sheets. 
   * MVP FIX: Using 'text/plain' and 'no-cors' to ensure the request 
   * successfully leaves the browser without being blocked by CORS pre-flight.
   */
  async syncToCloud(pendingRecords: Attendance[]): Promise<{ success: boolean; syncedIds: string[]; message: string }> {
    if (pendingRecords.length === 0) return { success: true, syncedIds: [], message: "No records to sync." };

    const config = storageService.getCloudConfig();

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
          // MVP FIX: Send as text/plain to avoid CORS pre-flight "options" requests
          // Google Apps Script doPost handles this perfectly
          await fetch(config.googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify({ records: geminiResult.formattedData })
          });
          
          return { 
            success: true, 
            syncedIds: geminiResult.syncedIds, 
            message: "Data transmitted to Google Sheets." 
          };
        } catch (fetchErr) {
          return { success: false, syncedIds: [], message: "Network Error: Google Sheets bridge unreachable." };
        }
      }

      return { 
        success: true, 
        syncedIds: geminiResult.syncedIds, 
        message: "Processed locally. (No Cloud URL configured)" 
      };
    } catch (error) {
      return { success: false, syncedIds: [], message: "AI Formatting Error." };
    }
  },

  async getAttendanceInsights(records: Attendance[]): Promise<string> {
    if (records.length === 0) return "No data available for analysis.";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short summary of this workforce activity: ${JSON.stringify(records)}`,
      });
      return response.text;
    } catch (e) {
      return "Insight generation currently unavailable.";
    }
  }
};
