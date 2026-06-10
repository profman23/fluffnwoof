import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { LogoLoader } from '../common/LogoLoader';
import {
  aiDiagnosisApi,
  AiAssessParams,
  AiDiagnosisResult,
} from '../../api/aiDiagnosis';

interface AiDoctorAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: AiAssessParams | null;
}

const likelihoodStyles: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-800',
  medium:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-300 dark:border-gray-700',
};

export const AiDoctorAssistModal: React.FC<AiDoctorAssistModalProps> = ({
  isOpen,
  onClose,
  params,
}) => {
  const { t, i18n } = useTranslation('aiDiagnosis');
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiDiagnosisResult | null>(null);
  // Vet's answers to the current round's questions (keyed by question text).
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const assess = useCallback(
    async (withAnswers?: { question: string; answer: string }[]) => {
      if (!params) return;
      setLoading(true);
      setError(null);
      try {
        const data = await aiDiagnosisApi.assess({
          ...params,
          answers: withAnswers && withAnswers.length > 0 ? withAnswers : undefined,
        });
        setResult(data);
        setAnswers({}); // reset inputs for the new round of questions
      } catch (e: any) {
        const code = e?.response?.data?.code;
        setError(
          code === 'NOT_CONFIGURED' ? t('errors.notConfigured') : t('errors.failed')
        );
      } finally {
        setLoading(false);
      }
    },
    [params, t]
  );

  // Initial assessment when the modal opens.
  useEffect(() => {
    if (!isOpen || !params) return;
    setResult(null);
    setAnswers({});
    assess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, params]);

  const handleRefine = () => {
    if (!result) return;
    const collected = result.questionsForVet
      .map((q) => ({ question: q, answer: (answers[q] || '').trim() }))
      .filter((a) => a.answer);
    if (collected.length === 0) return;
    assess(collected);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🤖 ${t('title')}`} size="xl">
      <div dir={isRTL ? 'rtl' : 'ltr'} className="text-start">
        {loading && (
          <div className="py-10">
            <LogoLoader animation="pulse" text={t('loading')} />
          </div>
        )}

        {!loading && error && (
          <div className="alert-error my-4">{error}</div>
        )}

        {!loading && result && (
          <div className="space-y-6">
            {/* Missing data note */}
            {result.missingDataNote && (
              <div className="alert-info flex items-start gap-2">
                <span>⚠️</span>
                <span>{result.missingDataNote}</span>
              </div>
            )}

            {/* Differentials */}
            <section>
              <h3 className="text-base font-bold text-gray-800 dark:text-[var(--app-text-primary)] mb-3 flex items-center gap-2">
                🎯 {t('sections.differentials')}
              </h3>
              <div className="space-y-2">
                {result.differentials.map((d, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-3 bg-white dark:bg-[var(--app-bg-card)] dark:border-[var(--app-border-default)]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)]">
                        {i + 1}. {d.name}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          likelihoodStyles[d.likelihood] || likelihoodStyles.low
                        }`}
                      >
                        {t(`likelihood.${d.likelihood}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[var(--app-text-secondary)]">
                      {d.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended tests */}
            <section>
              <h3 className="text-base font-bold text-gray-800 dark:text-[var(--app-text-primary)] mb-3 flex items-center gap-2">
                🔬 {t('sections.recommendedTests')}
              </h3>
              <ul className="space-y-2">
                {result.recommendedTests.map((rt, i) => (
                  <li
                    key={i}
                    className="text-sm border-s-2 border-blue-300 dark:border-blue-700 ps-3"
                  >
                    <span className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
                      {rt.name}
                    </span>
                    <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">
                      {' '}
                      — {rt.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Questions for vet — interactive */}
            {result.questionsForVet.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-gray-800 dark:text-[var(--app-text-primary)] mb-1 flex items-center gap-2">
                  ❓ {t('sections.questions')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-[var(--app-text-secondary)] mb-3">
                  {t('questions.hint')}
                </p>
                <div className="space-y-3">
                  {result.questionsForVet.map((q, i) => (
                    <div key={i}>
                      <label className="block text-sm text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                        {i + 1}. {q}
                      </label>
                      <input
                        type="text"
                        value={answers[q] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                        }
                        placeholder={t('questions.answerPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={!Object.values(answers).some((v) => v.trim())}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🔄 {t('questions.refine')}
                </button>
              </section>
            )}

            {/* Disclaimer */}
            <div className="text-xs text-gray-500 dark:text-[var(--app-text-secondary)] border-t border-gray-200 dark:border-[var(--app-border-default)] pt-3 flex items-start gap-2">
              <span>📋</span>
              <span>{result.disclaimer}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
