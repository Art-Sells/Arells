import {
  FINANCIAL_BENEFITS_WAU_TARGET,
  WEEKLY_UAR_DISPLAY_MAX,
  WEEKLY_UAR_DISPLAY_MIN,
} from '../lib/portfolio/financialBenefits';

export const portfolioCopy = {
  benefitsTitle: 'My Financial Benefits',
  benefitsSublabel: 'of User Ad Revenue',
  shareLead:
    'Sign-up your friends/family to financially benefit from our mission to ensure your investments never lose value by using this link:',
  shareButton: 'share',
  aboutTitle: 'About My Financial Benefits:',
  aboutWauGate: `Your financial benefits will be derived from our advertising revenue once we have ${FINANCIAL_BENEFITS_WAU_TARGET.toLocaleString('en-US')}~ Weekly Active Users (WAU).`,
  aboutRevenueLabel: 'Estimated weekly User Advertising revenue from 100,000~ WAU:',
  aboutRevenueRange: `$${WEEKLY_UAR_DISPLAY_MIN.toLocaleString('en-US')}-$${WEEKLY_UAR_DISPLAY_MAX.toLocaleString('en-US')}`,
  learnMore: 'learn more',
  wauSectionTitle: 'Weekly Active Users',
  usersUntilActivationTitle: 'Users to gain until Financial Benefits activated:',
  addInvestmentsTitle: 'Add Investments',
  viewMyInvestments: 'view my investments',
  verifiedPortfolioCta: 'View portfolio to see how you can financially benefit.',
  backToPortfolio: 'my portfolio',
} as const;

export const financialBenefitsCopy = {
  uarExplainer:
    'Your Financial Benefits will be derived from the 65% of advertising revenue (User Ad Revenue (UAR)) Arells generates, Arells will keep 35%.',
  uarPoolLine: (sharePctLabel: string) =>
    `Out of the 65%, you currently will get ${sharePctLabel} from weekly User Advertising Revenue`,
  uarBandLine: `of $${WEEKLY_UAR_DISPLAY_MIN.toLocaleString('en-US')}-$${WEEKLY_UAR_DISPLAY_MAX.toLocaleString('en-US')} based on 100,000~ WAU (Weekly Active Users)`,
  activeReferralLead:
    'This means the more people you sign up and are active, the more advertising revenue you receive.',
  leaderboardTitle: 'Leaderboard',
  leaderboardColUser: 'User',
  leaderboardColActive: 'Users Signed-up and Active Weekly',
  leaderboardColPct: '% Arells will share from $3k–$7k Weekly Ad Revenue',
} as const;
