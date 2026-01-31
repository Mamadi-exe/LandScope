
import { GoogleGenAI, Type } from "@google/genai";
import { AgriculturalInsight, ContaminationGuide, FarmAlert, CrisisAnalysis } from "../types";
import { checkRestrictedDanger } from "./gisService";

// Helper to get agricultural insights using Gemini
export const getAgriculturalInsights = async (lat: number, lng: number): Promise<AgriculturalInsight | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const dangerInfo = checkRestrictedDanger(lat, lng);
  const isGaza = lat > 31.1 && lat < 31.7 && lng > 34.1 && lng < 34.7;
  if (!isGaza) return null;

  const prompt = `GIS TACTICAL ANALYSIS - TIMELINE: 2025-2028.
  Location: Lat ${lat}, Lng ${lng}.
  Synthesize simulated multi-spectral satellite imagery, historical climate data, and soil maps for the Gaza Strip.
  Required Analysis:
  1. Soil Classification: Specific texture (e.g., Silty Alluvial vs Sandy Regosol).
  2. 2026-2028 Forecast: Impact of debris sedimentation and projected soil health.
  3. Weather-Aware Crisis Crops: Identify 3 strategic crops (IN ENGLISH) suited for Mediterranean seasons AND specific salinity/toxicity at this coordinate. Consider rainfall vs humidity.
  4. Potential Water Source: Estimate most likely available source (IN ENGLISH).
  5. Health Risks: Identify potential endemic diseases related to soil/water quality (IN ENGLISH).
  6. Climate Outlook: Briefly describe seasonal impact (Mediterranean winter rains vs summer heat) on remediation progress (IN ENGLISH).
  7. Access Status: ${dangerInfo.danger === 'RESTRICTED' ? 'DANGER - MILITARY ZONE' : 'SAFE ACCESS'}.
  
  Format: Strict JSON. Only the 'arabicSummary' field should be in Arabic. All other fields must be ENGLISH.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          soilType: { type: Type.STRING },
          sedimentationLevel: { type: Type.STRING },
          primaryCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
          preferredStrategicCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
          salinityRisk: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
          remediationAdvice: { type: Type.STRING },
          satelliteNotes: { type: Type.STRING },
          arabicSummary: { type: Type.STRING },
          waterSource: { type: Type.STRING },
          potentialDiseases: { type: Type.ARRAY, items: { type: Type.STRING } },
          climateOutlook: { type: Type.STRING },
          seasonalImpact: { type: Type.STRING }
        },
        required: ['soilType', 'sedimentationLevel', 'primaryCrops', 'preferredStrategicCrops', 'salinityRisk', 'remediationAdvice', 'satelliteNotes', 'arabicSummary', 'climateOutlook', 'seasonalImpact']
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return { location: [lat, lng], ...data, dangerLevel: dangerInfo.danger };
  } catch (e) { return null; }
};

// Helper to get detailed contamination remediation guide
export const getContaminationGuide = async (alert: FarmAlert): Promise<ContaminationGuide> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const prompt = `SOIL TOXICOLOGY & CRISIS AGRONOMY REPORT (2025-2027).
  Farm Location: [${alert.lat}, ${alert.lng}].
  Contaminant: ${alert.contaminant}.
  Toxicity: ${alert.toxicity}.
  
  Provide:
  1. Hazard Explanation: Science of this specific contaminant in Gaza soil.
  2. Phyto-extraction Strategy: Specific plants (Sunflowers, Mustard, etc.) to use for toxin removal, considering seasonal Mediterranean conditions.
  3. Safety Protocol: Immediate steps to protect field agents from UXO or chemical residue.
  4. 5-Step Remediation Checklist: Practical, field-executable steps.
  5. Potential Health Risks: List 2-3 specific risks (IN ENGLISH) as short badges.
  6. Full Arabic Translation (AR) of the checklist only.
  
  Format: JSON. All fields except 'arabicGuide' MUST BE ENGLISH.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hazardExplanation: { type: Type.STRING },
          phytoStrategy: { type: Type.STRING },
          plantingSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedSeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
          safetyProtocol: { type: Type.STRING },
          arabicGuide: { type: Type.STRING },
          riskBadges: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['hazardExplanation', 'phytoStrategy', 'plantingSteps', 'recommendedSeeds', 'safetyProtocol', 'arabicGuide']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      hazardExplanation: 'Error retrieving analysis.',
      phytoStrategy: 'Strategy not found.',
      plantingSteps: ['Contact central NGO support'],
      recommendedSeeds: [],
      safetyProtocol: 'Exercise extreme caution in the field.',
      arabicGuide: 'حدث خطأ في استرداد البيانات.',
      riskBadges: []
    };
  }
};

// Helper to get comprehensive crisis analysis combining all sector data
export const getCrisisAnalysis = async (
  alert: FarmAlert,
  guide: ContaminationGuide | null,
  insight: AgriculturalInsight | null
): Promise<CrisisAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const alertSummary = `Alert: ${alert.contaminant} at Sector ${alert.sectorId}, Toxicity: ${alert.toxicity}, Persistence: ${alert.persistenceMonths}M`;
  const guideSummary = guide ? `Safety Protocol: ${guide.safetyProtocol}. Remediation Steps: ${guide.plantingSteps.join(' | ')}` : 'No remediation guide available.';
  const insightSummary = insight ? `Soil: ${insight.soilType}, Recommended Crops: ${insight.preferredStrategicCrops.join(', ')}, Seasonal: ${insight.seasonalImpact}` : 'No soil insights available.';
  
  const prompt = `CRISIS ANALYSIS & COORDINATION REPORT - GAZA TERRITORY 2025-2027
  
  Sector Alert: ${alertSummary}
  Remediation Plan: ${guideSummary}
  Agricultural Context: ${insightSummary}
  
  Provide a comprehensive crisis analysis:
  1. Overall Assessment: Synthesize the urgency, scope, and feasibility of remediation.
  2. Immediate Actions (3-5 bullet points): Urgent steps for field teams in the next 72 hours.
  3. Risk Factors (3-4 main risks): Identify blockers, environmental hazards, and constraints.
  4. Timeline Forecast: Realistic timeline for remediation based on contaminant type and persistence.
  5. Resource Needs: Specific equipment, personnel, seeds, or support required.
  6. Coordination Notes: How this sector fits into larger territorial recovery strategy.
  
  Format: JSON. All fields except 'arabicSummary' MUST BE ENGLISH.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallAssessment: { type: Type.STRING },
          immediateActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          timelineForecast: { type: Type.STRING },
          resourceNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
          coordinationNotes: { type: Type.STRING },
          arabicSummary: { type: Type.STRING }
        },
        required: ['overallAssessment', 'immediateActions', 'riskFactors', 'timelineForecast', 'resourceNeeds', 'coordinationNotes', 'arabicSummary']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      overallAssessment: 'Error retrieving crisis analysis.',
      immediateActions: ['Contact central coordination'],
      riskFactors: ['Analysis unavailable'],
      timelineForecast: 'Unable to forecast timeline.',
      resourceNeeds: ['Comprehensive assessment needed'],
      coordinationNotes: 'Escalate to regional command.',
      arabicSummary: 'حدث خطأ في تحليل الأزمة.'
    };
  }
};
