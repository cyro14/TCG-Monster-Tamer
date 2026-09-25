/**
 * Monster Master: Evolution TCG RPG - Main Application
 */

import React, { useState, useEffect } from 'react';
import {
  BattleState,
  PlayerState,
  RPGProfile,
} from './types/game';
import {
  CARDS_BY_ID,
  MASTER_CARDS,
  STARTER_DECK_FIRE,
  STARTER_DECK_WATER,
  STARTER_DECK_ELECTRIC,
} from './data/cards';
import { PokemonOverworld } from './components/rpg/PokemonOverworld';
import { MonsterBattleArena } from './components/battle/MonsterBattleArena';
import { CardShopModal } from './components/shop/CardShopModal';
import { DeckBuilderModal } from './components/deck/DeckBuilderModal';
import { RankedLobbyModal } from './components/multiplayer/RankedLobbyModal';
import { QuestLogModal } from './components/quest/QuestLogModal';
import { RankedPlayer, getRankTier } from './services/multiplayer';
import { sound } from './utils/audio';
import {
  Sparkles,
  Swords,
  Layers,
  ShoppingBag,
  Trophy,
  Users,
  Compass,
  ArrowRight,
  Flame,
  Droplets,
  Zap,
  RotateCcw,
} from 'lucide-react';

const STORAGE_KEY = 'monster_master_rpg_save_v2';

// Initial default player profile
const DEFAULT_PROFILE: RPGProfile = {
  name: 'Ash_Duelist',
  avatar: '🧙‍♂️',
  gold: 150,
  badges: [],
  unlockedTowns: ['Vila Inicial', 'Rota 1'],
  inventoryCards: MASTER_CARDS.map((c) => ({
    cardId: c.id,
    count: c.limit >= 2 ? 3 : 1,
  })),
  activeDeck: [...STARTER_DECK_FIRE],
  rankPoints: 1200,
  rankTier: 'Prata',
  completedQuests: [],
  playerPosition: { x: 5, y: 7, mapId: 'kanto_overworld', facing: 'down' },
};

export default function App() {
  const [profile, setProfile] = useState<RPGProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PROFILE;
  });

  // Current view state
  const [currentView, setCurrentView] = useState<'menu' | 'rpg' | 'battle'>('menu');
  const [activeBattle, setActiveBattle] = useState<BattleState | null>(null);

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showRankedLobby, setShowRankedLobby] = useState(false);
  const [showQuests, setShowQuests] = useState(false);

  // Pending reward after battle
  const [currentBattleReward, setCurrentBattleReward] = useState<{
    gold: number;
    badge?: string;
  } | null>(null);

  // Save profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Helper to construct player state from card IDs (with Pokémon TCG Pocket mechanic)
  const createPlayerState = (
    id: string,
    name: string,
    avatar: string,
    deckCardIds: string[],
    isAi = false
  ): PlayerState => {
    const deck = deckCardIds
      .map((cid) => CARDS_BY_ID.get(cid))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);

    // Shuffle deck
    let shuffled = [...deck].sort(() => Math.random() - 0.5);

    // Pokémon TCG Pocket mechanic:
    // Guarantee 100% chance of at least one Stage 1 basic monster in the starting hand!
    // Check if the first 4 cards already have a Stage 1 monster:
    const stage1InFirst4 = shuffled.slice(0, 4).some(
      (c) => c.type === 'monster' && c.stage === 1
    );

    if (!stage1InFirst4) {
      // Find the first Stage 1 monster in the rest of the deck and swap it into the hand
      const stage1Index = shuffled.findIndex(
        (c) => c.type === 'monster' && c.stage === 1
      );
      if (stage1Index !== -1) {
        // Swap into slot 0 of initial hand
        const temp = shuffled[0];
        shuffled[0] = shuffled[stage1Index];
        shuffled[stage1Index] = temp;
      }
    }

    // Draw initial 4 cards (guaranteed to include a basic Stage 1 monster if present in deck)
    const hand = shuffled.slice(0, 4);
    const remainingDeck = shuffled.slice(4);

    return {
      id,
      name,
      avatar,
      hp: 25,
      maxHp: 25,
      deck: remainingDeck,
      hand,
      graveyard: [],
      field: [null, null, null, null, null],
      isAi,
    };
  };

  // Launch Story RPG Mode
  const handleLaunchRPG = () => {
    sound.playButtonClick();
    setCurrentView('rpg');
  };

  // Launch Local Pass & Play Mode (Hotseat on same device)
  const handleLaunchPassAndPlay = () => {
    sound.playButtonClick();

    const p1 = createPlayerState('p1', 'Jogador 1', '🧙‍♂️', profile.activeDeck, false);
    const p2 = createPlayerState('p2', 'Jogador 2', '🧝‍♀️', STARTER_DECK_WATER, false);

    const battle: BattleState = {
      id: `LOCAL_${Date.now()}`,
      mode: 'pass_and_play',
      turnNumber: 1,
      currentTurn: 'player1',
      player1: p1,
      player2: p2,
      winner: null,
      combatLog: ['🎮 Início do Duelo Pass & Play no mesmo aparelho!'],
      selectedCardIndex: null,
      selectedFieldSlot: null,
      waitingForPassHandover: false,
    };

    setActiveBattle(battle);
    setCurrentBattleReward(null);
    setCurrentView('battle');
  };

  // Launch Online Ranked Match from Lobby
  const handleStartRankedMatch = (opponent: RankedPlayer, roomId: string) => {
    setShowRankedLobby(false);
    sound.playEvolutionFanfare();

    const p1 = createPlayerState('p1', profile.name, profile.avatar, profile.activeDeck, false);
    // Opponent deck based on tier
    const oppDeck =
      opponent.tier === 'Mestre dos Monstros'
        ? STARTER_DECK_FIRE
        : opponent.tier === 'Platina'
        ? STARTER_DECK_WATER
        : STARTER_DECK_ELECTRIC;

    const p2 = createPlayerState('p2', opponent.name, opponent.avatar, oppDeck, true);

    const battle: BattleState = {
      id: roomId,
      mode: 'online_ranked',
      turnNumber: 1,
      currentTurn: 'player1',
      player1: p1,
      player2: p2,
      winner: null,
      combatLog: [
        `🌐 Duelo Ranqueado Online conectado! Sala: ${roomId}`,
        `⚔️ Enfrentando ${opponent.name} (${opponent.elo} ELO)!`,
      ],
      selectedCardIndex: null,
      selectedFieldSlot: null,
      waitingForPassHandover: false,
      roomId,
    };

    setActiveBattle(battle);
    setCurrentBattleReward({ gold: 75 });
    setCurrentView('battle');
  };

  // Launch Duel from RPG Overworld
  const handleStartRPGDuel = (
    opponentName: string,
    opponentAvatar: string,
    theme: string,
    rewardGold: number,
    badge?: string
  ) => {
    sound.playEvolutionFanfare();

    const p1 = createPlayerState('p1', profile.name, profile.avatar, profile.activeDeck, false);

    let oppDeck = STARTER_DECK_FIRE;
    if (theme === 'water') oppDeck = STARTER_DECK_WATER;
    if (theme === 'electric') oppDeck = STARTER_DECK_ELECTRIC;

    const p2 = createPlayerState('p2', opponentName, opponentAvatar, oppDeck, true);

    const battle: BattleState = {
      id: `RPG_DUEL_${Date.now()}`,
      mode: 'story',
      turnNumber: 1,
      currentTurn: 'player1',
      player1: p1,
      player2: p2,
      winner: null,
      combatLog: [`🔥 O desafio começou contra ${opponentName}!`],
      selectedCardIndex: null,
      selectedFieldSlot: null,
      waitingForPassHandover: false,
    };

    setActiveBattle(battle);
    setCurrentBattleReward({ gold: rewardGold, badge });
    setCurrentView('battle');
  };

  // When battle ends with victory
  const handleBattleWon = (goldReward: number) => {
    setProfile((prev) => {
      const finalGold = currentBattleReward ? currentBattleReward.gold : goldReward;
      const nextGold = prev.gold + finalGold;
      const nextBadges =
        currentBattleReward?.badge && !prev.badges.includes(currentBattleReward.badge)
          ? [...prev.badges, currentBattleReward.badge]
          : prev.badges;

      let nextElo = prev.rankPoints;
      if (activeBattle?.mode === 'online_ranked') {
        nextElo += 25;
      }

      return {
        ...prev,
        gold: nextGold,
        badges: nextBadges,
        rankPoints: nextElo,
        rankTier: getRankTier(nextElo),
      };
    });
  };

  // When battle ends with defeat
  const handleBattleLost = () => {
    if (activeBattle?.mode === 'online_ranked') {
      setProfile((prev) => {
        const nextElo = Math.max(800, prev.rankPoints - 15);
        return {
          ...prev,
          rankPoints: nextElo,
          rankTier: getRankTier(nextElo),
        };
      });
    }
  };

  // Exit battle arena
  const handleExitBattle = () => {
    sound.playButtonClick();
    setActiveBattle(null);
    setCurrentBattleReward(null);
    // If was story, return to RPG, otherwise menu
    if (activeBattle?.mode === 'story') {
      setCurrentView('rpg');
    } else {
      setCurrentView('menu');
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. MAIN TITLE MENU VIEW */}
      {/* ========================================================================= */}
      {currentView === 'menu' && (
        <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-8 overflow-hidden">
          {/* Visual Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-xs pointer-events-none"
            style={{ backgroundImage: `url('/src/assets/images/monster_arena_bg_1790341379169.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/90 pointer-events-none" />

          {/* Top Bar */}
          <header className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-400" />
                MONSTER MASTER : EVOLUTION
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                🪙 {profile.gold} Gold
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
                🏆 {profile.rankPoints} ELO ({profile.rankTier})
              </div>
            </div>
          </header>

          {/* Hero Banner with Game Modes */}
          <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
                O Card Game de Batalha com <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  Evolução Pokémon & Monster Master
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                Explore o mundo RPG, compre boosters para reforçar seu deck de 30 cartas, evolua monstros em combate com efeitos devastadores e dispute partidas ranqueadas!
              </p>
            </div>

            {/* 3 Main Game Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mode 1: RPG Story Mode */}
              <div
                onClick={handleLaunchRPG}
                className="group relative rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 to-slate-900 p-6 flex flex-col justify-between hover:border-emerald-400 hover:-translate-y-1.5 transition-all shadow-xl shadow-emerald-950/20 cursor-pointer"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition">
                    <Compass className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Modo História RPG
                  </span>
                  <h3 className="text-xl font-black text-white mt-1 mb-2">
                    Aventura Pokémon
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Explore o mapa estilo Pokémon, converse com NPCs, compre boosters no Card Mart, enfrente o Rival e conquiste as 4 Insígnias de Ginásio!
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-emerald-500/20 text-emerald-400 font-bold text-xs">
                  <span>Explorar o Mundo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Mode 2: Local Pass & Play Hotseat */}
              <div
                onClick={handleLaunchPassAndPlay}
                className="group relative rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-slate-900 p-6 flex flex-col justify-between hover:border-amber-400 hover:-translate-y-1.5 transition-all shadow-xl shadow-amber-950/20 cursor-pointer"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    2 Jogadores Local
                  </span>
                  <h3 className="text-xl font-black text-white mt-1 mb-2">
                    Duelo Pass & Play
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jogue sua vez e passe o celular ou PC para o seu amigo com tela de privacidade blindada contra espiadas. Duelo 100% justo e presencial!
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-amber-500/20 text-amber-400 font-bold text-xs">
                  <span>Iniciar Duelo Amistoso</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Mode 3: Online Ranked Multiplayer */}
              <div
                onClick={() => {
                  sound.playButtonClick();
                  setShowRankedLobby(true);
                }}
                className="group relative rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 to-slate-900 p-6 flex flex-col justify-between hover:border-indigo-400 hover:-translate-y-1.5 transition-all shadow-xl shadow-indigo-950/20 cursor-pointer"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                    Competitivo Online
                  </span>
                  <h3 className="text-xl font-black text-white mt-1 mb-2">
                    Multiplayer Ranqueado
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fila matchmaking global com pontuação ELO, salas com código privado para amigos e ranking com os 10 melhores duelistas mundiais!
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-indigo-500/20 text-indigo-400 font-bold text-xs">
                  <span>Entrar no Ranqueado</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

            {/* Quick Actions (Deck Builder, Card Mart, Quests) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setShowDeckBuilder(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-2 shadow cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Deck Builder ({profile.activeDeck.length} cartas)</span>
              </button>

              <button
                onClick={() => {
                  sound.playButtonClick();
                  setShowShop(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-2 shadow cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Card Mart & Boosters</span>
              </button>

              <button
                onClick={() => {
                  sound.playButtonClick();
                  setShowQuests(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-2 shadow cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Insígnias & Missões ({profile.badges.length}/4)</span>
              </button>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 text-center text-xs text-slate-500 pt-4 border-t border-slate-900">
            Monster Master TCG RPG • Mecânicas autênticas de Monster Master, Yu-Gi-Oh & Evolução Pokémon
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. POKÉMON RPG OVERWORLD VIEW */}
      {/* ========================================================================= */}
      {currentView === 'rpg' && (
        <div className="relative w-full h-full flex flex-col flex-1">
          <PokemonOverworld
            profile={profile}
            onStartDuel={handleStartRPGDuel}
            onOpenShop={() => setShowShop(true)}
            onOpenDeckBuilder={() => setShowDeckBuilder(true)}
            onOpenQuests={() => setShowQuests(true)}
            onUpdateProfile={setProfile}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BATTLE ARENA VIEW */}
      {/* ========================================================================= */}
      {currentView === 'battle' && activeBattle && (
        <MonsterBattleArena
          initialBattle={activeBattle}
          onExit={handleExitBattle}
          onBattleWon={handleBattleWon}
          onBattleLost={handleBattleLost}
        />
      )}

      {/* ========================================================================= */}
      {/* GLOBAL MODALS */}
      {/* ========================================================================= */}
      {showShop && (
        <CardShopModal
          profile={profile}
          onClose={() => setShowShop(false)}
          onUpdateProfile={setProfile}
        />
      )}

      {showDeckBuilder && (
        <DeckBuilderModal
          profile={profile}
          onClose={() => setShowDeckBuilder(false)}
          onSaveDeck={(newDeck) => {
            setProfile((prev) => ({ ...prev, activeDeck: newDeck }));
          }}
        />
      )}

      {showRankedLobby && (
        <RankedLobbyModal
          profile={profile}
          onClose={() => setShowRankedLobby(false)}
          onStartRankedMatch={handleStartRankedMatch}
        />
      )}

      {showQuests && (
        <QuestLogModal
          profile={profile}
          onClose={() => setShowQuests(false)}
        />
      )}
    </div>
  );
}
