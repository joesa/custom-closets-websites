import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  AI_TELL_RULES,
  findAiTellPhrases,
  findPlaceholderTells,
  hasEmDashInShortCopy,
  findFormulaicTitles,
} from './humanCopyVoice';

/**
 * CANONICAL HASH of the shared AI-tell rule table. The dashboard pins the exact
 * same literal in closet-dashboard/src/lib/ai/humanCopyVoice.test.ts. If either
 * repo edits its table without mirroring the change, that repo's test fails —
 * same drift-guard pattern as designFingerprint.
 */
export const AI_TELL_CANON_HASH = '75cd4707fcd9c9b3';

function canonHash(): string {
  const canon = JSON.stringify(
    AI_TELL_RULES.map((r) => [r.phrase, ...(r.allowedContexts ?? []).map(String)])
  );
  return createHash('sha256').update(canon).digest('hex').slice(0, 16);
}

describe('humanCopyVoice (renderer mirror)', () => {
  it('matches the canonical cross-repo rule table', () => {
    expect(canonHash()).toBe(AI_TELL_CANON_HASH);
  });

  it('finds banned phrases with word boundaries and trade exemptions', () => {
    expect(findAiTellPhrases('We elevate your space')).toEqual(['elevate']);
    expect(findAiTellPhrases('Seamless gutters installed in a day')).toEqual([]);
    expect(findAiTellPhrases('A seamless experience')).toEqual(['seamless']);
  });

  it('detects placeholder tells', () => {
    expect(findPlaceholderTells('Contact Jane Doe at jane@example.com')).toEqual([
      'Jane Doe',
      'jane@example.com',
    ]);
    expect(findPlaceholderTells('Offering 3 — lorem body')).toContain('Offering 3');
    expect(findPlaceholderTells('We have plenty to do this week')).toEqual([]);
  });

  it('detects em dashes in short chrome copy but not prose', () => {
    expect(hasEmDashInShortCopy('Free estimates — book today')).toBe(true);
    expect(
      hasEmDashInShortCopy(
        'The crew arrived before eight and had the framing squared by lunch — which mattered, because the inspector was booked for two and the drywall delivery was already sitting in the driveway waiting on his sign-off.'
      )
    ).toBe(false);
  });

  it('detects formulaic generator titles', () => {
    expect(findFormulaicTitles('The Summit Method')).toEqual(['The Summit Method']);
    expect(findFormulaicTitles('The Rivera Care Approach')).toEqual([
      'The Rivera Care Approach',
    ]);
    expect(findFormulaicTitles('How we plan your build')).toEqual([]);
  });
});
