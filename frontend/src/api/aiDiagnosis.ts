import api from './client';

// AI Doctor Assist — request/response types + client.
// Result is transient (display only); nothing is persisted.

export interface AiVisitVitals {
  chiefComplaint?: string;
  history?: string;
  temperature?: number;
  heartRate?: number;
  respirationRate?: number;
  weight?: number;
  crt?: number;
  bodyConditionScore?: number;
  painScore?: number;
  hydration?: string;
  mucousMembranes?: string;
  muscleCondition?: string;
  attitude?: string;
  behaviour?: string;
}

export interface AiAnswer {
  question: string;
  answer: string;
}

export interface AiAssessParams {
  petId: string;
  lang: 'ar' | 'en';
  visit: AiVisitVitals;
  answers?: AiAnswer[];
}

export interface AiDifferential {
  name: string;
  likelihood: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface AiRecommendedTest {
  name: string;
  reason: string;
}

export interface AiDiagnosisResult {
  differentials: AiDifferential[];
  recommendedTests: AiRecommendedTest[];
  questionsForVet: string[];
  missingDataNote: string | null;
  disclaimer: string;
}

export const aiDiagnosisApi = {
  assess: async (params: AiAssessParams): Promise<AiDiagnosisResult> => {
    const response = await api.post('/ai-diagnosis/assess', params);
    return response.data.data;
  },
};
