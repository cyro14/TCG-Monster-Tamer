/**
 * Monster Master: Evolution TCG RPG - Online Multiplayer Service & Ranked Ladder
 */

export interface RankedPlayer {
  rank: number;
  name: string;
  avatar: string;
  elo: number;
  tier: string;
  wins: number;
  losses: number;
}

export const INITIAL_LEADERBOARD: RankedPlayer[] = [
  { rank: 1, name: 'Red_Master', avatar: '🧢', elo: 2150, tier: 'Mestre dos Monstros', wins: 84, losses: 12 },
  { rank: 2, name: 'Cynthia_Garchomp', avatar: '👑', elo: 2080, tier: 'Mestre dos Monstros', wins: 76, losses: 14 },
  { rank: 3, name: 'Seto_Dragon', avatar: '🐉', elo: 1990, tier: 'Mestre dos Monstros', wins: 69, losses: 18 },
  { rank: 4, name: 'Steven_Stone', avatar: '💎', elo: 1850, tier: 'Mestre dos Monstros', wins: 58, losses: 15 },
  { rank: 5, name: 'Leon_Charizard', avatar: '🔥', elo: 1780, tier: 'Platina', wins: 51, losses: 20 },
  { rank: 6, name: 'Joey_Wheeler', avatar: '🐺', elo: 1640, tier: 'Platina', wins: 45, losses: 22 },
  { rank: 7, name: 'Misty_Cascade', avatar: '🌊', elo: 1530, tier: 'Ouro', wins: 38, losses: 19 },
  { rank: 8, name: 'Lt_Surge', avatar: '⚡', elo: 1420, tier: 'Ouro', wins: 32, losses: 21 },
  { rank: 9, name: 'Brock_Pewter', avatar: '🪨', elo: 1310, tier: 'Prata', wins: 28, losses: 24 },
  { rank: 10, name: 'Bug_Catcher', avatar: '🐛', elo: 1150, tier: 'Bronze', wins: 15, losses: 25 },
];

export function getRankTier(elo: number): string {
  if (elo >= 1800) return 'Mestre dos Monstros';
  if (elo >= 1600) return 'Platina';
  if (elo >= 1400) return 'Ouro';
  if (elo >= 1200) return 'Prata';
  return 'Bronze';
}
