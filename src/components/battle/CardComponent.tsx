/**
 * Monster Master: Evolution TCG RPG - Card Component
 * Faithful to Monster Master layout with Pokémon evolution badges & stats
 */

import React from 'react';
import { CardDefinition, ElementType } from '../../types/game';
import { Shield, Swords, Sparkles, Clock, Flame, Droplets, Zap, ShieldCheck } from 'lucide-react';

interface CardComponentProps {
  card: CardDefinition;
  size?: 'sm' | 'md' | 'lg' | 'field';
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
        bg: 'bg-gradient-to-b from-amber-700 via-rose-900 to-stone-950',
        border: 'border-amber-500',
        badge: 'bg-amber-600/30 text-amber-300 border-amber-500/40',
        accent: '#f59e0b',
      };
    case 'water':
      return {
        bg: 'bg-gradient-to-b from-cyan-800 via-blue-950 to-slate-950',
        border: 'border-cyan-400',
        badge: 'bg-cyan-600/30 text-cyan-300 border-cyan-400/40',
        accent: '#06b6d4',
      };
    case 'electric':
      return {
        bg: 'bg-gradient-to-b from-yellow-700 via-amber-950 to-stone-950',
        border: 'border-yellow-400',
        badge: 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
        accent: '#eab308',
      };
    case 'metal':
      return {
        bg: 'bg-gradient-to-b from-slate-700 via-stone-800 to-stone-950',
        border: 'border-slate-300',
        badge: 'bg-slate-600/30 text-slate-200 border-slate-400/40',
        accent: '#cbd5e1',
      };
    case 'dark':
      return {
        bg: 'bg-gradient-to-b from-purple-900 via-indigo-950 to-black',
        border: 'border-purple-500',
        badge: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
        accent: '#a855f7',
      };
    case 'nature':
      return {
        bg: 'bg-gradient-to-b from-emerald-800 via-green-950 to-stone-950',
        border: 'border-emerald-400',
        badge: 'bg-emerald-600/30 text-emerald-300 border-emerald-400/40',
        accent: '#10b981',
      };
    default:
      return {
        bg: 'bg-gradient-to-b from-stone-700 via-stone-900 to-stone-950',
        border: 'border-stone-400',
        badge: 'bg-stone-600/30 text-stone-200 border-stone-400/40',
        accent: '#a8a29e',
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

  // Sizing definitions
  const dimensions = {
    sm: 'w-24 h-36 text-[10px]',
    md: 'w-32 h-48 text-xs',
    lg: 'w-44 h-64 text-sm',
    field: 'w-28 h-40 text-xs',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative select-none rounded-lg border-2 ${colors.bg} ${colors.border} shadow-lg transition-all duration-200 flex flex-col justify-between p-1.5 cursor-pointer ${dimensions} ${
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
        <span className="font-bold tracking-tight text-white truncate max-w-[70%]">
          {card.name}
        </span>

        {card.type === 'monster' ? (
          <div className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/60 text-amber-300 font-mono text-[10px]">
            <Clock className="w-2.5 h-2.5" />
            <span>{card.summonTurns}t</span>
          </div>
        ) : (
          <span className="px-1 py-0.2 rounded bg-purple-900/60 text-purple-200 font-medium text-[9px] uppercase tracking-wider">
            Magia
          </span>
        )}
      </div>

      {/* Center Box: Artwork or Elemental Sigil */}
      <div className="relative flex-1 my-1 rounded bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            {card.element === 'fire' && <Flame className="w-6 h-6 text-amber-400 animate-pulse" />}
            {card.element === 'water' && <Droplets className="w-6 h-6 text-cyan-400" />}
            {card.element === 'electric' && <Zap className="w-6 h-6 text-yellow-400" />}
            {card.element === 'metal' && <ShieldCheck className="w-6 h-6 text-slate-300" />}
            {card.type === 'spell' && <Sparkles className="w-6 h-6 text-purple-400" />}
            <span className="text-[9px] text-slate-300 mt-1 line-clamp-2 px-1">
              {card.type === 'monster' ? `Estágio ${card.stage}` : 'Feitiço'}
            </span>
          </div>
        )}

        {/* Pokemon Evolution Badge Indicator */}
        {card.stage > 1 && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 font-bold text-[9px] flex items-center gap-0.5 shadow">
            <Sparkles className="w-2 h-2" />
            <span>Estágio {card.stage}</span>
          </div>
        )}

        {/* Summon countdown overlay for monster on field */}
        {summonTurnsLeft !== undefined && summonTurnsLeft > 0 && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-1">
            <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-amber-300 font-bold text-xs mt-1">Carregando</span>
            <span className="text-amber-400 font-mono text-sm font-black">{summonTurnsLeft} turno{summonTurnsLeft > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Description / Ability box */}
      <div className="px-1 py-0.5 bg-black/40 rounded text-[9px] text-slate-200 line-clamp-2 leading-tight">
        {card.evolutionAbility ? (
          <span className="text-amber-300 font-semibold">{card.evolutionAbility}</span>
        ) : (
          card.description
        )}
      </div>

      {/* Bottom Bar: Stats (Monsters) or Value (Spells) */}
      <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between font-mono">
        {card.type === 'monster' ? (
          <div className="flex items-center justify-between w-full px-0.5">
            {/* Attack */}
            <div className="flex items-center gap-1 text-rose-400 font-bold">
              <Swords className="w-3 h-3 text-rose-500" />
              <span>{atk}</span>
            </div>
            {/* Defense */}
            <div className="flex items-center gap-1 text-cyan-400 font-bold">
              <Shield className="w-3 h-3 text-cyan-500" />
              <span>{def}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[10px] text-slate-300 px-0.5">
            <span>Val: {card.value}g</span>
            <span>Lim: {card.limit}</span>
          </div>
        )}
      </div>
    </div>
  );
};
