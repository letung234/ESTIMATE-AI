import type { Clarification } from '@/lib/mockApi';

/** Highest score clarification confidence can reach (never 100%). */
export const CLARIFICATION_CONFIDENCE_MAX = 90;

/**
 * Confidence from clarification coverage: pending questions keep the score low;
 * when all linked questions are answered, confidence reaches the cap.
 */
export const getClarificationGroupConfidence = (clarifications: Clarification[]) => {
  const totalClarifications = clarifications.length;

  if (totalClarifications === 0) {
    return CLARIFICATION_CONFIDENCE_MAX;
  }

  const answeredCount = clarifications.filter((c) => c.status === 'answered').length;
  const pendingCount = totalClarifications - answeredCount;

  if (pendingCount > 0) {
    const answeredRatio = answeredCount / totalClarifications;
    const baseConfidence = 40 + Math.round(answeredRatio * 30);

    return Math.max(40, Math.min(70, baseConfidence));
  }

  return CLARIFICATION_CONFIDENCE_MAX;
};

export const getConfidenceToneClass = (confidence: number) => {
  if (confidence >= 80) {
    return 'text-green-600';
  }

  if (confidence >= 60) {
    return 'text-orange-600';
  }

  return 'text-red-600';
};
