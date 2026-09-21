/**
 * Email verified success screen — copy above the Bitcoin CTA.
 * Edit this file to change wording (styling is in Home.css: `.auth-verified-welcome*`).
 */
export const emailVerifiedWelcomeCopy = {
  headline: 'Welcome',
  paragraphs: ['You are now part of a mission to ensure investments never lose value.'],
} as const;

/** Shared Phase One mission copy (verified, About, My Investments). */
export const emailVerifiedWelcomePhaseCopy = {
  missionPhaseIntroLines: {
    line1: 'We are currently in',
    line2: 'Phase One',
    line3: 'of our mission.',
  },
  /** ≥750px My Investments intro (single line). */
  missionPhaseIntroDesktop: 'We are currently in Phase One of our mission.',
  bitcoinAlienRaceButton: {
    label: 'The Bitcoin Alien Race',
    href: '/thebitcoinalienrace',
  },
  /** Nested Phase One detail — verified stacked lines. */
  verifiedPhaseOneDetail: {
    title: 'Phase One:',
    lines: [
      'Entertain and educate',
      'you on how we plan',
      'to achieve our mission',
      'by releasing',
      'Episodic Content',
      'based on each asset',
      'starting with',
    ] as const,
    accentLines: ['Episodic Content'] as const,
  },
  /** ≥750px My Investments Phase One body (fewer line breaks). */
  myInvPhaseOneDetailDesktop: {
    title: 'Phase One:',
    lines: [
      'Entertain and educate you on how we plan to achieve our mission by releasing',
      'Episodic Content based on each asset starting with',
    ] as const,
    accentPhrases: ['Episodic Content'] as const,
  },
  /** &lt;750px My Investments Phase One body. */
  myInvPhaseOneDetailMobile: {
    title: 'Phase One:',
    lines: [
      'Entertain and educate',
      'you on how we plan',
      'to achieve our mission',
      'by releasing',
      'Episodic Content',
      'based on each asset',
      'starting with',
    ] as const,
    accentLines: ['Episodic Content'] as const,
  },
  portfolioBenefitLine: 'view Bitcoin to continue',
  portfolioCtaLabel: 'view Bitcoin',
  portfolioCtaLoadingLabel: 'Loading Bitcoin',
  phaseOneTitle: 'Phase One:',
  /** About page Phase One body (stacked lines). */
  aboutPhaseOneLines: [
    'Entertain and educate',
    'supporters and believers',
    'on how we plan',
    'to achieve our mission',
    'by releasing',
    'Episodic Content',
    'based on each asset.',
  ] as const,
  aboutPhaseOneAccentLines: ['Episodic Content'] as const,
  phaseTwoTitle: 'Phase Two:',
  phaseTwoLead: 'Implement our mission by...',
  phaseTwoBullets: [
    'Building the infrastructure to support investments never losing value.',
    'Launching the infrastructure.',
    'Sharing infrastructure revenue with phase one supporters & believers.',
  ] as const,
} as const;
