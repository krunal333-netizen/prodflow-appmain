
import { GoogleGenAI, Type } from "@google/genai";
import { Shoot, Model, Firm, BankDetails } from "../types";

// Initialize GoogleGenAI inside functions to ensure it uses the latest environment state.

export const analyzeBudget = async (shoot: Shoot, models: Model[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    Please provide a structured analysis of the budget risks and feasibility.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            estimatedHiddenCosts: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: { type: Type.STRING }
          },
          required: ["riskLevel", "estimatedHiddenCosts", "suggestions", "analysis"],
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      riskLevel: "Unknown",
      estimatedHiddenCosts: 0,
      suggestions: ["Could not connect to AI service."],
      analysis: "AI analysis unavailable."
    };
  }
};

export const extractFirmDetailsFromImage = async (base64Data: string, mimeType: string): Promise<Partial<Firm>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Extract business information from this ${mimeType === 'application/pdf' ? 'PDF' : 'Image'}. 
    Look for: Legal Entity Name, Display/Store Name, Full Physical Address, Phone Number, and GSTIN.
    RULES:
    - If a field is not found, return null.
    - Do not guess or use placeholders like "N/A".
    - Return a clean JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1], mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            storeName: { type: Type.STRING },
            address: { type: Type.STRING },
            phone: { type: Type.STRING },
            gstin: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Data Extraction Error:", error);
    throw error;
  }
};

export const extractModelDetailsFromImage = async (base64Data: string, mimeType: string): Promise<Partial<Model> & { bankDetails?: Partial<BankDetails> }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze this ${mimeType === 'application/pdf' ? 'PDF' : 'Image'} to extract talent profile data.
    This could be a PAN card, ID card, Bank Cheque, Passbook, or handwritten measurement note.

    TARGET FIELDS:
    1. name: Legal Name
    2. phone: Contact number
    3. address: Full residential address
    4. pan: Permanent Account Number (Format: ABCDE1234F)
    5. bankDetails: { bankName, accountNumber, ifscCode, branchName }
    6. measurements: Physical stats (Height, Bust, Waist, Hips, etc.)

    CRITICAL INSTRUCTIONS:
    - If you are scanning a CHEQUE, prioritize accountNumber and ifscCode.
    - If you are scanning a PAN CARD, prioritize name and pan.
    - If a specific field is not clearly visible or present, you MUST return null for that field.
    - DO NOT return empty strings, "N/A", or "Unknown".
    - Return a clean JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1], mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, nullable: true },
            phone: { type: Type.STRING, nullable: true },
            address: { type: Type.STRING, nullable: true },
            pan: { type: Type.STRING, nullable: true },
            measurements: { type: Type.STRING, nullable: true },
            bankDetails: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                bankName: { type: Type.STRING, nullable: true },
                accountNumber: { type: Type.STRING, nullable: true },
                ifscCode: { type: Type.STRING, nullable: true },
                branchName: { type: Type.STRING, nullable: true }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Model Extraction Error:", error);
    throw error;
  }
};
