import { GoogleGenAI } from "@google/genai";
import { Shoot, Model } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  return new GoogleGenAI({ apiKey });
};

export const analyzeBudget = async (shoot: Shoot, models: Model[]) => {
  const ai = getClient();
  
  const modelNames = models.filter(m => shoot.modelIds.includes(m.id)).map(m => m.name).join(', ');
  const crewCount = shoot.crew.length;
  
  const prompt = `
    Analyze the budget risks for this production shoot:
    Title: ${shoot.title}
    Type: ${shoot.type}
    Location: ${shoot.locationType} (${shoot.locationName})
    Floors/Categories: ${shoot.floors.join(', ')}
    Models: ${modelNames}
    Crew Size: ${crewCount}
    Current Budget Allocation: ${shoot.budget}

    Please provide a JSON response with the following structure:
    {
      "riskLevel": "Low" | "Medium" | "High",
      "estimatedHiddenCosts": number,
      "suggestions": ["suggestion 1", "suggestion 2"],
      "analysis": "Short paragraph analyzing the feasibility."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback mock response if API fails or key is missing
    return {
      riskLevel: "Unknown",
      estimatedHiddenCosts: 0,
      suggestions: ["Could not connect to AI service. Check API Key."],
      analysis: "AI analysis unavailable."
    };
  }
};

export const extractDataFromImage = async (base64DataUrl: string, type: 'MEASUREMENTS'): Promise<string> => {
  const ai = getClient();
  
  // Extract mimeType and base64 data from the Data URL
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    console.error("Invalid base64 format");
    return "";
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];

  let prompt = "Describe this image.";
  if (type === 'MEASUREMENTS') {
    prompt = "Extract all body measurements, physical stats (height, weight, shoe size, etc.), and clothing sizes visible in this image. Return them as a clean, concise list (e.g., 'Height: 5ft 8in, Waist: 28'). Do not include any introductory text.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "";
  }
};