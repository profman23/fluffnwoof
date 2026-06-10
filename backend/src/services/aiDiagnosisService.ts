import Anthropic from '@anthropic-ai/sdk';
import { anthropic, isAnthropicConfigured, ANTHROPIC_MODEL } from '../config/anthropic';

// ============================================================================
// AI Doctor Assist — clinical decision-support service.
//
// Sends the current visit's vitals + history + chief complaint (plus pet
// context and recent medical history) to Claude and returns a STRUCTURED
// differential-diagnosis suggestion. This is decision SUPPORT only — the vet
// always makes the final call. Result is transient (never persisted).
//
// Mirrors the external-service pattern (smsService/emailService): typed input,
// typed result, graceful error handling, no throwing for "expected" failures.
// ============================================================================

export type Lang = 'ar' | 'en';

export interface PetContext {
  species?: string;
  breed?: string;
  gender?: string;
  ageYears?: number;
  weight?: number;
}

export interface VisitVitals {
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

export interface PastVisit {
  visitDate?: string;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
}

export interface AiAnswer {
  question: string;
  answer: string;
}

export interface AiDiagnosisInput {
  lang: Lang;
  pet: PetContext;
  visit: VisitVitals;
  pastVisits?: PastVisit[];
  /** The vet's answers to questions the AI asked in a previous round. */
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

export interface AiDiagnosisResponse {
  success: boolean;
  data?: AiDiagnosisResult;
  errorCode?: 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'OVERLOADED' | 'API_ERROR';
  errorMessage?: string;
}

// --- Structured-output JSON schema (constrains Claude's response shape) -------
// Note the supported-subset rules: every object needs additionalProperties:false,
// enums are fine, no min/max constraints. The SDK validates the response for us.
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    differentials: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
          reasoning: { type: 'string' },
        },
        required: ['name', 'likelihood', 'reasoning'],
      },
    },
    recommendedTests: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['name', 'reason'],
      },
    },
    questionsForVet: { type: 'array', items: { type: 'string' } },
    missingDataNote: { type: ['string', 'null'] },
    disclaimer: { type: 'string' },
  },
  required: [
    'differentials',
    'recommendedTests',
    'questionsForVet',
    'missingDataNote',
    'disclaimer',
  ],
} as const;

// --- System prompt (STABLE — cached via prompt caching) ----------------------
// Kept byte-stable across requests so the cache prefix holds. All per-request,
// volatile data (the actual pet/visit values) goes in the user message, never here.
const SYSTEM_PROMPT = `You are an experienced veterinary clinical decision-support assistant embedded in a veterinary clinic's medical-record system. A licensed veterinarian uses you while examining a patient.

YOUR ROLE — strictly decision SUPPORT, never a replacement for the vet:
- Suggest a ranked list of differential diagnoses based ONLY on the data provided.
- Recommend diagnostic tests and imaging that would confirm or rule out the top differentials.
- Suggest focused questions the vet should ask the owner to narrow the diagnosis.
- The veterinarian always makes the final clinical decision. Never state a single definitive diagnosis as fact.

QUESTIONS — CRITICAL RULES:
- READ ALL PROVIDED DATA FIRST (chief complaint, history, every vital/exam field, past records, and any prior answers) BEFORE composing questions.
- DO NOT ask about anything whose answer is ALREADY present in the data. For example, if the chief complaint already says the pet is vomiting, do NOT ask "is the pet vomiting?". If temperature is recorded, do NOT ask for it.
- Ask ONLY about genuinely MISSING information that would meaningfully change the differential ranking. If nothing material is missing, return an empty "questionsForVet" array.
- When the vet has answered previous questions, incorporate those answers and refine the differentials accordingly; do not repeat answered questions.

RULES:
- Base reasoning ONLY on the provided vitals, history, chief complaint, signalment, and past records. Do NOT invent data.
- If critical data is missing (e.g. temperature, heart rate, or chief complaint absent), set "missingDataNote" to a short note telling the vet which inputs would improve accuracy. Otherwise set it to null.
- Be species-aware. Consider the patient's species, breed, age, and sex in your reasoning.
- For "recommendedTests", include both laboratory tests and imaging when relevant, each with a one-line reason.
- Do NOT prescribe specific drug dosages. General therapeutic directions only, and only inside reasoning if needed.
- Order "differentials" from most to least likely and set "likelihood" accordingly.
- "disclaimer" must clearly state these are AI-generated supportive suggestions and the final medical decision is the veterinarian's responsibility.

LANGUAGE:
- Respond entirely in the language indicated by the user message's "LANGUAGE" field: "ar" = Arabic, "en" = English.
- When responding in Arabic, you may keep precise medical/drug terms in English within the Arabic text.

Return your answer ONLY in the required structured JSON format.`;

function buildUserMessage(input: AiDiagnosisInput): string {
  // All volatile, per-request data lives here (after the cached system prefix).
  const { lang, pet, visit, pastVisits, answers } = input;
  const lines: string[] = [];
  lines.push(`LANGUAGE: ${lang}`);
  lines.push('');
  lines.push('PATIENT (signalment):');
  lines.push(`- Species: ${pet.species ?? 'unknown'}`);
  lines.push(`- Breed: ${pet.breed ?? 'unknown'}`);
  lines.push(`- Sex: ${pet.gender ?? 'unknown'}`);
  lines.push(`- Age (years): ${pet.ageYears ?? 'unknown'}`);
  lines.push(`- Weight (kg): ${pet.weight ?? visit.weight ?? 'unknown'}`);
  lines.push('');
  lines.push('CURRENT VISIT:');
  lines.push(`- Chief complaint: ${visit.chiefComplaint ?? '(none recorded)'}`);
  lines.push(`- History: ${visit.history ?? '(none recorded)'}`);
  lines.push('- Vitals / physical exam:');
  lines.push(`  - Temperature (C): ${fmt(visit.temperature)}`);
  lines.push(`  - Heart rate (bpm): ${fmt(visit.heartRate)}`);
  lines.push(`  - Respiration rate (/min): ${fmt(visit.respirationRate)}`);
  lines.push(`  - CRT (sec): ${fmt(visit.crt)}`);
  lines.push(`  - Body condition score (1-9): ${fmt(visit.bodyConditionScore)}`);
  lines.push(`  - Pain score (0-10): ${fmt(visit.painScore)}`);
  lines.push(`  - Hydration: ${visit.hydration ?? 'unknown'}`);
  lines.push(`  - Mucous membranes: ${visit.mucousMembranes ?? 'unknown'}`);
  lines.push(`  - Muscle condition: ${visit.muscleCondition ?? 'unknown'}`);
  lines.push(`  - Attitude: ${visit.attitude ?? 'unknown'}`);
  lines.push(`  - Behaviour: ${visit.behaviour ?? 'unknown'}`);

  if (pastVisits && pastVisits.length > 0) {
    lines.push('');
    lines.push('RECENT MEDICAL HISTORY (most recent first):');
    for (const v of pastVisits) {
      const date = v.visitDate ? v.visitDate.slice(0, 10) : 'unknown date';
      lines.push(
        `- [${date}] Dx: ${v.diagnosis ?? '-'} | Sx: ${v.symptoms ?? '-'} | Tx: ${v.treatment ?? '-'}`
      );
    }
  }

  const isFinalRound = !!(answers && answers.length > 0);

  if (isFinalRound) {
    lines.push('');
    lines.push("VET'S ANSWERS TO PREVIOUS QUESTIONS (incorporate these and refine):");
    for (const a of answers!) {
      lines.push(`- Q: ${a.question}`);
      lines.push(`  A: ${a.answer}`);
    }
    lines.push('');
    lines.push(
      'THIS IS THE FINAL ROUND. Incorporate the answers above and produce your refined final assessment. Return an EMPTY "questionsForVet" array — do NOT ask any further questions.'
    );
  }

  lines.push('');
  lines.push(
    isFinalRound
      ? 'Provide your refined structured differential diagnosis and recommended tests. "questionsForVet" MUST be an empty array.'
      : 'Provide your structured differential diagnosis, recommended tests, and questions for the vet. Remember: do NOT ask about anything already present in the data.'
  );
  return lines.join('\n');
}

function fmt(n: number | undefined | null): string {
  return n === undefined || n === null ? 'not recorded' : String(n);
}

export const aiDiagnosisService = {
  async assess(input: AiDiagnosisInput): Promise<AiDiagnosisResponse> {
    if (!isAnthropicConfigured || !anthropic) {
      return {
        success: false,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'AI service is not configured (missing ANTHROPIC_API_KEY).',
      };
    }

    try {
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 8192,
        thinking: { type: 'adaptive' },
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            // Cache the stable system prompt — same bytes every request, so the
            // prefix is reused and we pay ~0.1x on it after the first call.
            cache_control: { type: 'ephemeral' },
          },
        ],
        output_config: {
          format: {
            type: 'json_schema',
            schema: RESULT_SCHEMA as unknown as Record<string, unknown>,
          },
        },
        messages: [{ role: 'user', content: buildUserMessage(input) }],
      });

      // With output_config.format the model returns JSON text in a text block.
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        return {
          success: false,
          errorCode: 'API_ERROR',
          errorMessage: 'AI returned no parseable content.',
        };
      }

      const data = JSON.parse(textBlock.text) as AiDiagnosisResult;
      return { success: true, data };
    } catch (error) {
      // Typed exception handling — most specific first.
      if (error instanceof Anthropic.RateLimitError) {
        return { success: false, errorCode: 'RATE_LIMITED', errorMessage: 'AI service is busy, please try again shortly.' };
      }
      if (error instanceof Anthropic.InternalServerError) {
        return { success: false, errorCode: 'OVERLOADED', errorMessage: 'AI service is temporarily overloaded.' };
      }
      const message = error instanceof Anthropic.APIError ? error.message : 'Unexpected AI error.';
      console.error('[AI Diagnosis] error:', message);
      return { success: false, errorCode: 'API_ERROR', errorMessage: message };
    }
  },
};
