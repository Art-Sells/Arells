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
  /** Three stacked lines in `VerifiedPageClient`: outer lines black, middle accent. */
  missionPhaseIntroLines: {
    line1: 'We are currently in',
    line2: 'Phase One',
    line3: 'of our mission.',
  },
  phaseOneTitle: 'Phase One:',
  phaseOneLead: 'Expand our mission by...',
  phaseOneBullets: [
    'Adding assets we plan on impacting.',
    'Signing up supporters & believers.',
  ] as const,
  phaseTwoTitle: 'Phase Two:',
  phaseTwoLead: 'Implement our mission by...',
  phaseTwoBullets: [
    'Building the infrastructure to support investments never losing value.',
    'Launching the infrastructure.',
  ] as const,
} as const;
