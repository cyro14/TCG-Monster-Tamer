/**
 * Monster Master: Evolution TCG RPG - Types & Interfaces
 */

export type ElementType = 'fire' | 'water' | 'nature' | 'electric' | 'metal' | 'dark' | 'neutral';

export type CardType = 'monster' | 'spell';

export type MonsterStage = 1 | 2 | 3;

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  element: ElementType;
  cost?: number; // Summon turns needed or energy
  summonTurns: number; // 0 = instant, 1 = 1 turn charge, 2 = 2 turns (Monster Master mechanic)
  attack: number;
  defense: number;
  maxDefense: number;
  value: number; // Gold cost in shop
  limit: number; // Max copies allowed in deck (default 3, 1 for legendaries)
  description: string;
  image?: string;
  
  // Pokemon Evolution System
  stage: MonsterStage;
  evolvesFromId?: string; // ID of card it evolves from
  evolvesIntoId?: string; // ID of card it can evolve into
  evolutionAbility?: string; // Special effect triggered when evolved!
  
  // Spell effect type
  spellEffect?: 
    | 'fire_sword' 
    | 'ice_shield' 
    | 'sword' 
    | 'shield' 
    | 'heal' 
    | 'cleanse' 
    | 'antidote' 
    | 'charge' 
    | 'summon' 
    | 'sacrifice' 
    | 'fireball' 
    | 'lightning' 
    | 'poison' 
    | 'curse' 
    | 'black_hole' 
    | 'restore'
    | 'evolution_stone';
  spellPower?: number;
}

export interface BoardMonster {
  instanceId: string;
  card: CardDefinition;
  currentAttack: number;
  currentDefense: number;
  maxDefense: number;
  summonTurnsLeft: number; // Decrements each turn; when 0, ready to attack
  isReady: boolean; // Ready to act
  hasAttacked: boolean;
  statusEffects: {
    poisoned?: number; // damage per turn
    cursed?: boolean; // stat debuff
    frozen?: boolean; // cannot attack for 1 turn
  };
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  hp: number;
  maxHp: number;
  deck: CardDefinition[];
  hand: CardDefinition[];
  graveyard: CardDefinition[];
  field: (BoardMonster | null)[]; // 5 monster slots on field
  isAi?: boolean;
}

export type BattleMode = 'story' | 'pass_and_play' | 'online_ranked';

export interface BattleState {
  id: string;
  mode: BattleMode;
  turnNumber: number;
  currentTurn: 'player1' | 'player2';
  player1: PlayerState;
  player2: PlayerState;
  winner: 'player1' | 'player2' | null;
  combatLog: string[];
  selectedCardIndex: number | null; // Selected hand card
  selectedFieldSlot: number | null; // Selected monster to attack with
  waitingForPassHandover: boolean;
  isOnlineOpponentTurn?: boolean;
  roomId?: string;
}

export interface RPGQuest {
  id: string;
  title: string;
  description: string;
  rewardGold: number;
  rewardCardId?: string;
  isCompleted: boolean;
}

export interface RPGProfile {
  name: string;
  avatar: string;
  gold: number;
  badges: string[]; // Badge names: 'Névoa', 'Chamas', 'Trovão', 'Campeão'
  unlockedTowns: string[];
  inventoryCards: { cardId: string; count: number }[];
  activeDeck: string[]; // List of card IDs (20-30 cards)
  rankPoints: number; // Online ELO (starts at 1000)
  rankTier: string; // 'Bronze', 'Prata', 'Ouro', 'Platina', 'Mestre'
  completedQuests: string[];
  playerPosition: { x: number; y: number; mapId: string; facing: 'up' | 'down' | 'left' | 'right' };
}
