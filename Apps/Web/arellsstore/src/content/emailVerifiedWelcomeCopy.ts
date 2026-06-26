/**
 * Email verified success screen — copy above “View Portfolio”.
 * Edit this file to change wording (styling is in Home.css: `.auth-verified-welcome*`).
 */
export const emailVerifiedWelcomeCopy = {
  headline: 'Welcome',
  paragraphs: ['You are now part of a mission to ensure investments never lose value.'],
} as const;

/** Rendered below the paragraph above; nested borders in `VerifiedPageClient` + `.auth-verified-welcome-phases--stacked`. */
export const emailVerifiedWelcomePhaseCopy = {
  missionPhaseIntroLines: {
    line1: 'We are currently in',
    line2: 'Phase One',
    line3: 'of our mission.',
  },
  portfolioBenefitLine: 'view portfolio to see how you can earn money weekly',
  phaseOneTitle: 'Phase One:',
  phaseOneLead: 'Expand our mission by...',
  phaseOneBullets: [
    'Adding assets we plan on impacting.',
    'Signing up supporters & believers.',
    'Sharing advertising revenue with supporters & believers.',
  ] as const,
  phaseTwoTitle: 'Phase Two:',
  phaseTwoLead: 'Implement our mission by...',
  phaseTwoBullets: [
    'Building the infrastructure to support investments never losing value.',
    'Launching the infrastructure.',
    'Sharing infrastructure revenue with phase one supporters & believers.',
  ] as const,
} as const;
