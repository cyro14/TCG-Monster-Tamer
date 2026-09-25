/**
 * Monster Master: Evolution TCG RPG - Pokémon-Style RPG World Exploration
 */

import React, { useState, useEffect, useRef } from 'react';
import { RPGProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import {
  Compass,
  ShoppingBag,
  Sparkles,
  Swords,
  Layers,
  Award,
  MessageSquare,
  X,
  ChevronRight,
  Flame,
  Droplets,
  Zap,
} from 'lucide-react';

interface NPC {
  id: string;
  name: string;
  role: 'professor' | 'rival' | 'gym_leader' | 'trader' | 'villager';
  x: number;
  y: number;
  avatar: string;
  dialogue: string[];
  deckTheme: 'starter' | 'fire' | 'water' | 'electric';
  canBattle: boolean;
  rewardGold: number;
  badge?: string;
}

interface PokemonOverworldProps {
  profile: RPGProfile;
  onStartDuel: (opponentName: string, opponentAvatar: string, theme: string, rewardGold: number, badge?: string) => void;
  onOpenShop: () => void;
  onOpenDeckBuilder: () => void;
  onOpenQuests: () => void;
  onUpdateProfile: (updater: (prev: RPGProfile) => RPGProfile) => void;
}

const WORLD_WIDTH = 24;
const WORLD_HEIGHT = 18;
const TILE_SIZE = 36; // px per tile

// Overworld NPCs
const OVERWORLD_NPCS: NPC[] = [
  {
    id: 'prof_leo',
    name: 'Professor Leo',
    role: 'professor',
    x: 4,
    y: 3,
    avatar: '👨‍🔬',
    dialogue: [
      'Olá, jovem Duelista! Bem-vindo ao mundo de Monster Master!',
      'Neste mundo, os monstros não são apenas cartas estáticas — eles evoluem em batalha!',
      'Se você colocar um Pyrowolf sobre seu Emberpup, ele evoluirá instantaneamente curando-se e usando habilidades elementais!',
      'Explore as rotas, compre pacotes na loja e derrote os Líderes de Ginásio!',
    ],
    deckTheme: 'starter',
    canBattle: false,
    rewardGold: 0,
  },
  {
    id: 'rival_kael',
    name: 'Rival Kael',
    role: 'rival',
    x: 9,
    y: 6,
    avatar: '🧢',
    dialogue: [
      'Ei, você aí! Acha que seu deck consegue encarar o meu?',
      'Eu acabei de aprimorar meu deck com monstros elétricos de Estágio 2!',
      'Prepare-se para um duelo!',
    ],
    deckTheme: 'electric',
    canBattle: true,
    rewardGold: 60,
  },
  {
    id: 'shopkeeper',
    name: 'Vendedora Maya',
    role: 'trader',
    x: 16,
    y: 4,
    avatar: '🛍️',
    dialogue: [
      'Boas-vindas ao Card Mart de Monster Master!',
      'Temos novos Pacotes de Booster com cartas raras de Estágio 3 e Pedras da Evolução!',
      'Abra a loja pelo menu para reforçar sua coleção!',
    ],
    deckTheme: 'starter',
    canBattle: false,
    rewardGold: 0,
  },
  {
    id: 'gym_marina',
    name: 'Mestra Marina (Líder Água)',
    role: 'gym_leader',
    x: 19,
    y: 11,
    avatar: '🌊',
    dialogue: [
      'Eu sou Marina, guardiã das águas e líder do Ginásio da Névoa!',
      'Meu Leviathorn de Estágio 3 congela qualquer criatura que ouse se aproximar!',
      'Se me derrotar, receberá a Insígnia da Névoa e 150 moedas de ouro!',
    ],
    deckTheme: 'water',
    canBattle: true,
    rewardGold: 150,
    badge: 'Insígnia da Névoa',
  },
  {
    id: 'gym_ignis',
    name: 'Líder Ignis (Lorde do Fogo)',
    role: 'gym_leader',
    x: 6,
    y: 14,
    avatar: '🔥',
    dialogue: [
      'Queime com a fúria do Vulcão Rubro!',
      'Você é capaz de suportar a Explosão de Meteoro do meu Ignis Drake?',
      'Aceite meu desafio pelo título do Fogo!',
    ],
    deckTheme: 'fire',
    canBattle: true,
    rewardGold: 200,
    badge: 'Insígnia das Chamas',
  },
];

export const PokemonOverworld: React.FC<PokemonOverworldProps> = ({
  profile,
  onStartDuel,
  onOpenShop,
  onOpenDeckBuilder,
  onOpenQuests,
  onUpdateProfile,
}) => {
  const [playerPos, setPlayerPos] = useState({ x: 5, y: 7 });
  const [facing, setFacing] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [activeDialogue, setActiveDialogue] = useState<{
    npc: NPC;
    page: number;
  } | null>(null);
  const [encounterFlash, setEncounterFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check collision with world borders, buildings, trees
  const isWalkable = (x: number, y: number): boolean => {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;

    // Obstacle map:
    // Lab: x: 3-5, y: 1-2
    if (x >= 3 && x <= 5 && y >= 1 && y <= 2) return false;
    // Mart: x: 15-17, y: 2-3
    if (x >= 15 && x <= 17 && y >= 2 && y <= 3) return false;
    // Water Gym: x: 18-20, y: 9-10
    if (x >= 18 && x <= 20 && y >= 9 && y <= 10) return false;
    // Fire Gym: x: 5-7, y: 12-13
    if (x >= 5 && x <= 7 && y >= 12 && y <= 13) return false;

    // NPCs check
    const isNpc = OVERWORLD_NPCS.some((n) => n.x === x && n.y === y);
    if (isNpc) return false;

    return true;
  };

  // Movement handler
  const handleMove = (dx: number, dy: number, dir: 'up' | 'down' | 'left' | 'right') => {
    if (activeDialogue || encounterFlash) return;

    setFacing(dir);
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (isWalkable(newX, newY)) {
      setPlayerPos({ x: newX, y: newY });
      sound.playButtonClick();

      // Check tall grass (y between 6 and 9, x between 10 and 14)
      const isGrass = newX >= 10 && newX <= 14 && newY >= 6 && newY <= 9;
      if (isGrass) {
        // 15% chance of wild card duelist encounter!
        if (Math.random() < 0.15) {
          triggerWildEncounter();
        }
      }
    }
  };

  // Trigger wild card battle
  const triggerWildEncounter = () => {
    sound.playEvolutionFanfare();
    setEncounterFlash(true);

    setTimeout(() => {
      setEncounterFlash(false);
      onStartDuel(
        'Duelista Selvagem da Rota 1',
        '🦊',
        'starter',
        40
      );
    }, 1200);
  };

  // Action button [A] (Interact / Talk)
  const handleInteract = () => {
    if (activeDialogue) {
      // Advance dialogue page
      if (activeDialogue.page < activeDialogue.npc.dialogue.length - 1) {
        sound.playButtonClick();
        setActiveDialogue({
          ...activeDialogue,
          page: activeDialogue.page + 1,
        });
      } else {
        // If NPC can battle and has finished talking
        if (activeDialogue.npc.canBattle) {
          const npc = activeDialogue.npc;
          setActiveDialogue(null);
          onStartDuel(npc.name, npc.avatar, npc.deckTheme, npc.rewardGold, npc.badge);
        } else if (activeDialogue.npc.role === 'trader') {
          setActiveDialogue(null);
          onOpenShop();
        } else {
          setActiveDialogue(null);
        }
      }
      return;
    }

    // Find adjacent NPC
    let targetX = playerPos.x;
    let targetY = playerPos.y;
    if (facing === 'up') targetY -= 1;
    if (facing === 'down') targetY += 1;
    if (facing === 'left') targetX -= 1;
    if (facing === 'right') targetX += 1;

    const adjacentNpc = OVERWORLD_NPCS.find(
      (n) => n.x === targetX && n.y === targetY
    );

    if (adjacentNpc) {
      sound.playButtonClick();
      setActiveDialogue({ npc: adjacentNpc, page: 0 });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') handleMove(0, -1, 'up');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleMove(0, 1, 'down');
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleMove(-1, 0, 'left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleMove(1, 0, 'right');
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') handleInteract();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, facing, activeDialogue, encounterFlash]);

  // Render overworld canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw base terrain grid
    for (let x = 0; x < WORLD_WIDTH; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Sand / Path
        const isPath =
          (x >= 4 && x <= 6 && y >= 3 && y <= 15) ||
          (y >= 6 && y <= 7 && x >= 4 && x <= 20) ||
          (x >= 15 && x <= 17 && y >= 4 && y <= 12);

        // Tall Grass (Wild encounter area)
        const isGrass = x >= 10 && x <= 14 && y >= 6 && y <= 9;

        // Water pond (near Water gym)
        const isWater = x >= 17 && x <= 22 && y >= 13 && y <= 16;

        // Volcanic rock (near Fire gym)
        const isLava = x >= 2 && x <= 8 && y >= 14 && y <= 16;

        if (isWater) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Water ripple
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + 6, py + 8, 8, 2);
        } else if (isLava) {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(px + 4, py + 4, 6, 6);
        } else if (isPath) {
          ctx.fillStyle = '#e2d4b7';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (isGrass) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Grass tufts
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px + 4, py + 6, 4, 12);
          ctx.fillRect(px + 14, py + 10, 4, 10);
        } else {
          // Standard Green Field
          ctx.fillStyle = '#166534';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#14532d';
          ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }

    // 2. Draw Buildings
    // Professor Lab (x: 3, y: 1)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(3 * TILE_SIZE, 1 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#ef4444'; // Red roof
    ctx.fillRect(3 * TILE_SIZE, 1 * TILE_SIZE, 3 * TILE_SIZE, 12);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('LABORATÓRIO', 3 * TILE_SIZE + 4, 2 * TILE_SIZE - 4);

    // Card Mart / Shop (x: 15, y: 2)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(15 * TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#0284c7'; // Blue roof
    ctx.fillRect(15 * TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('CARD MART', 15 * TILE_SIZE + 8, 3 * TILE_SIZE + 10);

    // Water Gym (x: 18, y: 9)
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(18 * TILE_SIZE, 9 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('GINÁSIO NÉVOA', 18 * TILE_SIZE + 2, 10 * TILE_SIZE + 8);

    // Fire Gym (x: 5, y: 12)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(5 * TILE_SIZE, 12 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#f97316';
    ctx.fillText('GINÁSIO CHAMA', 5 * TILE_SIZE + 2, 13 * TILE_SIZE + 8);

    // 3. Draw NPCs
    OVERWORLD_NPCS.forEach((npc) => {
      const npx = npc.x * TILE_SIZE;
      const npy = npc.y * TILE_SIZE;

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.avatar, npx + TILE_SIZE / 2, npy + TILE_SIZE / 2 + 8);

      // Exclamation alert over battle / quest NPCs
      if (npc.canBattle || npc.role === 'professor') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('!', npx + TILE_SIZE / 2, npy - 2);
      }
    });

    // 4. Draw Player Character
    const ppx = playerPos.x * TILE_SIZE;
    const ppy = playerPos.y * TILE_SIZE;

    // Glowing aura under player
    ctx.beginPath();
    ctx.ellipse(ppx + TILE_SIZE / 2, ppy + TILE_SIZE - 4, 12, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fill();

    // Player Avatar
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧙‍♂️', ppx + TILE_SIZE / 2, ppy + TILE_SIZE / 2 + 8);
  }, [playerPos, facing]);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Screen flash on battle encounter */}
      {encounterFlash && (
        <div className="fixed inset-0 z-50 bg-white animate-ping" />
      )}

      {/* Top HUD Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl">
            {profile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">{profile.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                {profile.rankTier} ({profile.rankPoints} ELO)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="text-amber-400 font-bold">🪙 {profile.gold} Gold</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold">🏆 {profile.badges.length}/4 Insígnias</span>
            </div>
          </div>
        </div>

        {/* Quick Menu Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDeckBuilder}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deck Builder</span>
          </button>
          <button
            onClick={onOpenShop}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Loja de Cartas</span>
          </button>
          <button
            onClick={onOpenQuests}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Missões</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-2 overflow-auto bg-slate-950">
        <div className="relative rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden bg-emerald-950">
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH * TILE_SIZE}
            height={WORLD_HEIGHT * TILE_SIZE}
            className="block"
          />

          {/* Location Overlay Badge */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Região de Kanto TCG • Vila Inicial & Rota 1</span>
          </div>
        </div>
      </div>

      {/* Dialogue Box (Pokémon RPG Style) */}
      {activeDialogue && (
        <div className="fixed bottom-24 left-4 right-4 max-w-2xl mx-auto z-40 bg-slate-900/95 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeDialogue.npc.avatar}</span>
              <span className="font-bold text-amber-400 text-base">
                {activeDialogue.npc.name}
              </span>
            </div>
            <button
              onClick={() => setActiveDialogue(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed min-h-[48px]">
            {activeDialogue.npc.dialogue[activeDialogue.page]}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Pressione [A] ou clique para avançar ({activeDialogue.page + 1}/{activeDialogue.npc.dialogue.length})
            </span>

            <button
              onClick={handleInteract}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              {activeDialogue.page < activeDialogue.npc.dialogue.length - 1 ? (
                <>
                  <span>Próximo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              ) : activeDialogue.npc.canBattle ? (
                <>
                  <Swords className="w-3.5 h-3.5" />
                  <span>Duelo de Monstros!</span>
                </>
              ) : activeDialogue.npc.role === 'trader' ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Abrir Loja</span>
                </>
              ) : (
                <span>Fechar</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Virtual D-Pad & Controls for Mobile / Touch Devices */}
      <div className="relative z-20 p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between max-w-2xl mx-auto w-full">
        {/* Directional Pad */}
        <div className="grid grid-cols-3 gap-1 w-32 h-28">
          <div />
          <button
            onClick={() => handleMove(0, -1, 'up')}
            className="w-10 h-10 rounded-lg bg-slate-800 active:bg-amber-500 text-white font-bold flex items-center justify-center shadow cursor-pointer border border-slate-700"
          >
            ▲
          </button>
          <div />

          <button
            onClick={() => handleMove(-1, 0, 'left')}
            className="w-10 h-10 rounded-lg bg-slate-800 active:bg-amber-500 text-white font-bold flex items-center justify-center shadow cursor-pointer border border-slate-700"
          >
            ◀
          </button>
          <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-[10px] text-slate-500">
            D-PAD
          </div>
          <button
            onClick={() => handleMove(1, 0, 'right')}
            className="w-10 h-10 rounded-lg bg-slate-800 active:bg-amber-500 text-white font-bold flex items-center justify-center shadow cursor-pointer border border-slate-700"
          >
            ▶
          </button>

          <div />
          <button
            onClick={() => handleMove(0, 1, 'down')}
            className="w-10 h-10 rounded-lg bg-slate-800 active:bg-amber-500 text-white font-bold flex items-center justify-center shadow cursor-pointer border border-slate-700"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Info hints */}
        <div className="hidden sm:flex flex-col text-center text-[11px] text-slate-400">
          <span className="font-semibold text-white">Controles:</span>
          <span>Setas ou [W, A, S, D] para andar</span>
          <span>[Enter] ou [Espaço] para interagir</span>
        </div>

        {/* Action Buttons [A] & [B] */}
        <div className="flex items-center gap-3">
          <button
            onClick={triggerWildEncounter}
            className="w-14 h-14 rounded-full bg-slate-800 active:bg-slate-700 border-2 border-slate-600 text-slate-200 font-black text-sm flex flex-col items-center justify-center shadow cursor-pointer"
            title="Procurar Duelo Rápido"
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span className="text-[9px]">Lutar</span>
          </button>
          <button
            onClick={handleInteract}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 active:scale-95 border-2 border-amber-300 text-slate-950 font-black text-lg flex flex-col items-center justify-center shadow-lg shadow-amber-500/20 cursor-pointer"
            title="Interagir com NPC / Falar"
          >
            <span>A</span>
            <span className="text-[8px] font-bold uppercase">Falar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
