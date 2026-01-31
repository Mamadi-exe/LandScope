
export enum ToxicityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type VisualizationMode = 'GRID' | 'HISTORY';

export type ContaminantType = 'White Phosphorus' | 'Heavy Metals (Pb/Hg)' | 'Unexploded Ordnance Residue' | 'Fuel/VOC Leak' | 'Nitrate Overload';

export interface RestrictedZone {
  id: string;
  name: string;
  dangerLevel: 'EXTREME' | 'HIGH';
  coordinates: [number, number][];
}

export interface FarmAlert {
  id: string;
  sectorId: string;
  lat: number;
  lng: number;
  toxicity: ToxicityLevel;
  contaminant: ContaminantType;
  persistenceMonths: number;
  currentPersistenceMonths: number; 
  remediationCode: string;
  timestamp: number;
  affectedRadius: number;
  progress: number; 
  remediationLogs: RemediationLog[];
  completedStepIndices: number[];
  dangerStatus?: 'SAFE' | 'WARNING' | 'DANGER';
  waterSource?: string;
  healthRisks?: string[];
}

export interface AgriculturalInsight {
  location: [number, number];
  soilType: string;
  sedimentationLevel: string;
  primaryCrops: string[];
  preferredStrategicCrops: string[]; 
  salinityRisk: 'Low' | 'Moderate' | 'High';
  remediationAdvice: string;
  satelliteNotes: string;
  arabicSummary: string;
  dangerLevel: 'SAFE' | 'CAUTION' | 'RESTRICTED';
  waterSource?: string;
  potentialDiseases?: string[];
  climateOutlook?: string;
  seasonalImpact?: string;
}

export interface ContaminationGuide {
  hazardExplanation: string;
  phytoStrategy: string;
  plantingSteps: string[];
  recommendedSeeds: string[];
  safetyProtocol: string;
  arabicGuide: string;
  riskBadges?: string[];
}

export interface RemediationLog {
  id: string;
  timestamp: number;
  action: string;
  notes: string;
  imageUrl?: string;
  stepIndex: number;
}

export interface NutritionalReport {
  sectorId: string;
  currentCropMix: string[];
  missingNutrients: string[];
  diversityScore: number; 
  aiRecommendation: string;
  arabicRecommendation: string;
}

export interface GISPlume {
  id: string;
  coordinates: [number, number][];
  intensity: number;
}

export interface SeedListing {
  id: string;
  cropType: string;
  quantityKg: number;
  sectorId: string;
  timestamp: number;
}

export interface CrisisAnalysis {
  overallAssessment: string;
  immediateActions: string[];
  riskFactors: string[];
  timelineForecast: string;
  resourceNeeds: string[];
  coordinationNotes: string;
  arabicSummary: string;
}
