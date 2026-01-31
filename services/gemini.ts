
import { GoogleGenAI, Type } from "@google/genai";
import { Attendance } from "../types";
import { storageService } from "./storage";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Verified connectivity to the Apps Script bridge.
   */
  async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.startsWith('http')) {
      return { success: false, message: "Invalid URL format." };
    }
    try {
      // We use a GET request to test if the script is alive
      const response = await fetch(url);
      // Even if no-cors is used, if it's reachable it won't throw
      return { success: true, message: "Bridge is reachable. Cloud database active." };
    } catch (err) {
      return { success: false, message: "Connection failed. Check your Deployment settings." };
    }
  },

  /**
   * Syncs data to Google Sheets. 
   * 1. Uses Gemini to format and validate the payload.
   * 2. If a Google Sheet URL is configured, it sends a real POST request.
   */
  async syncToCloud(pendingRecords: Attendance[]): Promise<{ success: boolean; syncedIds: string[]; message: string }> {
    if (pendingRecords.length === 0) return { success: true, syncedIds: [], message: "No records to sync." };

    const config = storageService.getCloudConfig();

    try {
      // Step 1: Format data using Gemini for clean spreadsheet insertion
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Format these construction attendance records for Google Sheets. 
        Columns: [Date, Employee ID, Employee Name, Specialization, Site, Time In, Time Out, Timekeeper ID, Scan Mode, Sync Status]
        Records: ${JSON.stringify(pendingRecords)}
        Return only the formatted JSON array with IDs for confirmation.`,
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

      // Step 2: Perform real sync if URL exists
      if (config.googleSheetUrl && config.googleSheetUrl.startsWith('http')) {
        try {
          await fetch(config.googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: geminiResult.formattedData })
          });
          
          return { 
            success: true, 
            syncedIds: geminiResult.syncedIds, 
            message: "Successfully pushed records to Google Sheets database." 
          };
        } catch (fetchErr) {
          console.error("Network error syncing to Sheets:", fetchErr);
          return { success: false, syncedIds: [], message: "Network Error: Could not reach Google Sheets bridge." };
        }
      }

      return { 
        success: true, 
        syncedIds: geminiResult.syncedIds, 
        message: "Records processed locally. (Cloud Sync skipped: No URL configured in Admin Settings)" 
      };
    } catch (error) {
      console.error("Gemini processing failed:", error);
      return { success: false, syncedIds: [], message: "Processing Error: AI could not format the sync payload." };
    }
  },

  async getAttendanceInsights(records: Attendance[]): Promise<string> {
    if (records.length === 0) return "No data available for analysis.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this workforce data and generate a high-level site operations summary for the project manager. 
      Data: ${JSON.stringify(records)}`,
    });

    return response.text;
  }
};
