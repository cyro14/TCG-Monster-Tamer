/**
 * Monster Master: Evolution TCG RPG - Card Component
 * Faithful to Monster Master layout with Pokémon evolution badges & stats
 */

import React from 'react';
import { CardDefinition, ElementType } from '../../types/game';
import { Shield, Swords, Sparkles, Clock } from 'lucide-react';
import { CardArt } from './CardArt';

interface CardComponentProps {
  card: CardDefinition;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'field';
  isSelected?: boolean;
  isPlayable?: boolean;
  canAttack?: boolean;
  summonTurnsLeft?: number;
  currentAttack?: number;
  currentDefense?: number;
  onClick?: () => void;
  showHoverDetails?: boolean;
}

export const getElementColors = (element: ElementType) => {
  switch (element) {
    case 'fire':
      return {
        bg: 'bg-gradient-to-b from-red-600 via-rose-950 to-stone-950',
        border: 'border-amber-500',
        borderActive: 'border-orange-400 ring-2 ring-orange-500/80',
        badge: 'bg-red-500/30 text-amber-200 border-amber-500/40',
        accent: '#f97316',
        name: 'Fogo',
        icon: '🔥',
        glow: 'shadow-orange-500/30',
        tagBg: 'bg-gradient-to-r from-red-600 to-orange-500 text-white',
      };
    case 'water':
      return {
        bg: 'bg-gradient-to-b from-sky-600 via-blue-950 to-slate-950',
        border: 'border-cyan-400',
        borderActive: 'border-cyan-300 ring-2 ring-cyan-400/80',
        badge: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40',
        accent: '#06b6d4',
        name: 'Água',
        icon: '💧',
        glow: 'shadow-cyan-500/30',
        tagBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
      };
    case 'electric':
      return {
        bg: 'bg-gradient-to-b from-amber-500 via-yellow-950 to-stone-950',
        border: 'border-yellow-400',
        borderActive: 'border-yellow-300 ring-2 ring-yellow-400/80',
        badge: 'bg-yellow-500/30 text-yellow-200 border-yellow-400/40',
        accent: '#eab308',
        name: 'Elétrico',
        icon: '⚡',
        glow: 'shadow-yellow-500/30',
        tagBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950',
      };
    case 'metal':
      return {
        bg: 'bg-gradient-to-b from-slate-500 via-zinc-800 to-stone-950',
        border: 'border-slate-300',
        borderActive: 'border-white ring-2 ring-slate-300/80',
        badge: 'bg-slate-500/30 text-slate-200 border-slate-300/40',
        accent: '#94a3b8',
        name: 'Metal',
        icon: '⚙️',
        glow: 'shadow-slate-400/30',
        tagBg: 'bg-gradient-to-r from-slate-400 to-zinc-500 text-stone-950',
      };
    case 'dark':
      return {
        bg: 'bg-gradient-to-b from-purple-800 via-indigo-950 to-black',
        border: 'border-purple-500',
        borderActive: 'border-purple-400 ring-2 ring-purple-500/80',
        badge: 'bg-purple-600/30 text-purple-200 border-purple-500/40',
        accent: '#a855f7',
        name: 'Trevas',
        icon: '🌑',
        glow: 'shadow-purple-600/40',
        tagBg: 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white',
      };
    case 'nature':
      return {
        bg: 'bg-gradient-to-b from-emerald-600 via-green-950 to-stone-950',
        border: 'border-emerald-400',
        borderActive: 'border-emerald-300 ring-2 ring-emerald-400/80',
        badge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
        accent: '#10b981',
        name: 'Natureza',
        icon: '🌿',
        glow: 'shadow-emerald-500/30',
        tagBg: 'bg-gradient-to-r from-emerald-600 to-green-500 text-white',
      };
    default:
      return {
        bg: 'bg-gradient-to-b from-stone-600 via-stone-900 to-stone-950',
        border: 'border-stone-400',
        borderActive: 'border-stone-300 ring-2 ring-stone-400/80',
        badge: 'bg-stone-500/30 text-stone-200 border-stone-400/40',
        accent: '#a8a29e',
        name: 'Neutro',
        icon: '⭐',
        glow: 'shadow-stone-400/30',
        tagBg: 'bg-gradient-to-r from-stone-500 to-stone-600 text-white',
      };
  }
};

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  size = 'md',
  isSelected = false,
  isPlayable = false,
  canAttack = false,
  summonTurnsLeft,
  currentAttack,
  currentDefense,
  onClick,
}) => {
  const colors = getElementColors(card.element);
  const atk = currentAttack !== undefined ? currentAttack : card.attack;
  const def = currentDefense !== undefined ? currentDefense : card.defense;

  const isLarge = size === 'lg' || size === 'xl';

  // Sizing definitions
  const dimensions = {
    sm: 'w-24 h-36 text-[10px]',
    md: 'w-32 h-48 text-xs',
    lg: 'w-56 h-80 text-xs',
    xl: 'w-64 sm:w-72 h-[380px] sm:h-[420px] text-sm',
    field: 'w-28 h-40 text-xs',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative select-none rounded-xl border-2 ${colors.bg} ${colors.border} shadow-xl transition-all duration-200 flex flex-col justify-between p-2 cursor-pointer ${dimensions} ${
        isSelected
          ? 'ring-4 ring-amber-400 -translate-y-2 shadow-amber-500/40'
          : isPlayable
          ? 'hover:-translate-y-1.5 ring-2 ring-emerald-400/80 shadow-emerald-500/20'
          : canAttack
          ? 'ring-2 ring-red-500 animate-pulse hover:-translate-y-1'
          : 'hover:-translate-y-1'
      }`}
    >
      {/* Top Header: Name & Summon Turns / Cost */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5 truncate max-w-[75%]">
          <span className={`font-bold tracking-tight text-white truncate ${isLarge ? 'text-sm font-black' : ''}`}>
            {card.name}
          </span>
          {isLarge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 border border-white/20 font-bold uppercase tracking-wider text-slate-300">
              {colors.name}
            </span>
          )}
        </div>

        {card.type === 'monster' ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-amber-300 font-mono text-[10px] font-bold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{card.summonTurns}t</span>
          </div>
        ) : (
          <span className="px-1.5 py-0.5 rounded bg-purple-900/70 text-purple-200 font-bold text-[9px] uppercase tracking-wider border border-purple-500/40">
            Magia
          </span>
        )}
      </div>

      {/* Center Box: Artwork or Elemental Sigil */}
      <div className="relative flex-1 my-1 rounded-lg bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center min-h-[70px]">
        <CardArt card={card} isLarge={isLarge} />

        {/* Pokemon Evolution Badge Indicator */}
        {card.stage > 1 && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] flex items-center gap-1 shadow-md">
            <Sparkles className="w-2.5 h-2.5" />
            <span>ESTÁGIO {card.stage}</span>
          </div>
        )}

        {/* Summon countdown overlay for monster on field */}
        {summonTurnsLeft !== undefined && summonTurnsLeft > 0 && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-1">
            <Clock className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-amber-300 font-bold text-xs mt-1">Carregando</span>
            <span className="text-amber-400 font-mono text-sm font-black">{summonTurnsLeft} turno{summonTurnsLeft > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Description / Ability box */}
      <div className={`p-1.5 bg-black/60 rounded-md border border-white/10 ${isLarge ? 'text-xs max-h-24 overflow-y-auto' : 'text-[9px] line-clamp-2'} text-slate-200 leading-snug`}>
        {card.evolutionAbility ? (
          <div>
            <span className="text-amber-300 font-bold block mb-0.5">⭐ Habilidade:</span>
            <span>{card.evolutionAbility}</span>
          </div>
        ) : (
          <div>{card.description}</div>
        )}
      </div>

      {/* Evolution Info on Large Preview */}
      {isLarge && card.type === 'monster' && (card.evolvesFromId || card.evolvesIntoId) && (
        <div className="mt-1 px-1.5 py-1 bg-black/40 rounded text-[10px] text-slate-300 flex items-center justify-between border border-white/5">
          {card.evolvesFromId ? (
            <span className="text-amber-300">Evolui de estágio anterior</span>
          ) : (
            <span className="text-slate-400">Forma Básica</span>
          )}
          {card.evolvesIntoId && (
            <span className="text-emerald-300 font-semibold">Possui Próxima Evolução ➔</span>
          )}
        </div>
      )}

      {/* Bottom Bar: Stats (Monsters) or Value (Spells) */}
      <div className="mt-1.5 pt-1.5 border-t border-white/15 flex items-center justify-between font-mono">
        {card.type === 'monster' ? (
          <div className="flex items-center justify-between w-full px-1">
            {/* Attack */}
            <div className={`flex items-center gap-1.5 text-rose-400 font-bold ${isLarge ? 'text-base font-black' : 'text-xs'}`}>
              <Swords className={isLarge ? 'w-4 h-4 text-rose-500' : 'w-3 h-3 text-rose-500'} />
              <span>{atk} ATK</span>
            </div>
            {/* Defense */}
            <div className={`flex items-center gap-1.5 text-cyan-400 font-bold ${isLarge ? 'text-base font-black' : 'text-xs'}`}>
              <Shield className={isLarge ? 'w-4 h-4 text-cyan-500' : 'w-3 h-3 text-cyan-500'} />
              <span>{def} DEF</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-xs text-slate-300 px-1 font-semibold">
            <span>Custo: {card.value}g</span>
            <span>Limite: {card.limit}/deck</span>
          </div>
        )}
      </div>
    </div>
  );
};
