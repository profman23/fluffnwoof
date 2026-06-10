import { Request, Response } from 'express';
import prisma from '../config/database';
import { medicalRecordService } from '../services/medicalRecordService';
import {
  aiDiagnosisService,
  Lang,
  VisitVitals,
  PastVisit,
  AiAnswer,
} from '../services/aiDiagnosisService';

// AI Doctor Assist controller.
// Accepts the current (possibly unsaved) visit vitals from the request body,
// fetches pet signalment + recent history from the DB, calls the AI service,
// and returns the structured suggestion. Result is NOT persisted.

function ageInYears(birthDate: Date | null | undefined): number | undefined {
  if (!birthDate) return undefined;
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = diff / (365.25 * 24 * 60 * 60 * 1000);
  return years >= 0 ? Math.floor(years) : undefined;
}

export const aiDiagnosisController = {
  assess: async (req: Request, res: Response) => {
    try {
      const { petId, lang, visit, answers } = req.body as {
        petId?: string;
        lang?: string;
        visit?: VisitVitals;
        answers?: AiAnswer[];
      };

      if (!petId) {
        return res.status(400).json({ error: 'petId is required' });
      }

      const language: Lang = lang === 'ar' ? 'ar' : 'en';

      // Pet signalment for species-aware reasoning.
      const pet = await prisma.pet.findUnique({
        where: { id: petId },
        select: {
          species: true,
          breed: true,
          gender: true,
          birthDate: true,
          weight: true,
        },
      });

      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }

      // Recent medical history (reuses existing service). Cap to keep the prompt tight.
      const historyResult = await medicalRecordService.findByPetId(petId, 1, 5);
      const pastVisits: PastVisit[] = (historyResult.data ?? []).map((r: any) => ({
        visitDate: r.visitDate ? new Date(r.visitDate).toISOString() : undefined,
        diagnosis: r.diagnosis ?? undefined,
        symptoms: r.symptoms ?? undefined,
        treatment: r.treatment ?? undefined,
      }));

      const result = await aiDiagnosisService.assess({
        lang: language,
        pet: {
          species: pet.species ?? undefined,
          breed: pet.breed ?? undefined,
          gender: pet.gender ?? undefined,
          ageYears: ageInYears(pet.birthDate),
          weight: pet.weight ?? undefined,
        },
        visit: visit ?? {},
        pastVisits,
        answers: Array.isArray(answers) ? answers.filter((a) => a?.answer?.trim()) : undefined,
      });

      if (!result.success) {
        const status = result.errorCode === 'NOT_CONFIGURED' ? 503 : 502;
        return res.status(status).json({ error: result.errorMessage, code: result.errorCode });
      }

      return res.json({ success: true, data: result.data });
    } catch (error: any) {
      console.error('Error in AI diagnosis assess:', error?.message || error);
      return res.status(500).json({ error: 'Failed to generate AI assessment' });
    }
  },
};
