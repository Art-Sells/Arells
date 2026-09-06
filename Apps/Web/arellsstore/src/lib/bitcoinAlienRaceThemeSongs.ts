export type AlienRaceThemeSong = {
  id: string;
  title: string;
  src: string;
};

const THEME_SONGS_BASE = '/images/banners/assets/crypto/Bitcoin/ThemeSongs';

export const ALIEN_RACE_THEME_SONGS: AlienRaceThemeSong[] = [
  {
    id: 'alien-race',
    title: '♫ The Bitcoin Alien Race',
    src: `${THEME_SONGS_BASE}/TheBitcoinAlienRaceTheme.mp3`,
  },
  {
    id: 'daughters-father',
    title: "♫ The Daughter's Father",
    src: `${THEME_SONGS_BASE}/TheDaughtersFatherTheme.mp3`,
  },
];
