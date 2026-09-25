/**
 * Monster Master: Evolution TCG RPG - Deck Builder
 * Faithful to Monster Master deck builder screen with `< 0 >` quantity arrows and limits
 */

import React, { useState } from 'react';
import { CARDS_BY_ID, MASTER_CARDS } from '../../data/cards';
import { CardDefinition, RPGProfile } from '../../types/game';
import { CardComponent } from '../battle/CardComponent';
import { sound } from '../../utils/audio';
import {
  X,
  Layers,
  Check,
  AlertCircle,
  Filter,
  ArrowLeft,
  ArrowRight,
  Shield,
  Swords,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DeckBuilderModalProps {
  profile: RPGProfile;
  onClose: () => void;
  onSaveDeck: (newDeckCardIds: string[]) => void;
}

export const DeckBuilderModal: React.FC<DeckBuilderModalProps> = ({
  profile,
  onClose,
  onSaveDeck,
}) => {
  // Count how many copies of each card are in current deck
  const initialDeckCounts: Record<string, number> = {};
  profile.activeDeck.forEach((id) => {
    initialDeckCounts[id] = (initialDeckCounts[id] || 0) + 1;
  });

  const [deckCounts, setDeckCounts] = useState<Record<string, number>>(initialDeckCounts);
  const [filterType, setFilterType] = useState<'all' | 'monster' | 'spell'>('all');
  const [filterElement, setFilterElement] = useState<string>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Total cards in deck
  const totalDeckCards = Object.values(deckCounts).reduce((acc, c) => acc + c, 0);

  // Increment copy of card in deck
  const handleIncrement = (card: CardDefinition) => {
    sound.playButtonClick();
    const currentInDeck = deckCounts[card.id] || 0;
    const owned = profile.inventoryCards.find((c) => c.cardId === card.id)?.count || 0;

    // Check limit on card (Monster Master limit rule)
    if (currentInDeck >= card.limit) {
      alert(`Limite máximo atingido! Você só pode ter até ${card.limit} cópias de ${card.name} no deck.`);
      return;
    }

    // Check owned inventory
    if (currentInDeck >= owned) {
      alert(`Você só possui ${owned} cópia(s) desta carta. Compre mais na Loja!`);
      return;
    }

    if (totalDeckCards >= 30) {
      alert('Seu deck já atingiu o tamanho máximo de 30 cartas!');
      return;
    }

    setDeckCounts((prev) => ({
      ...prev,
      [card.id]: currentInDeck + 1,
    }));
  };

  // Decrement copy of card in deck
  const handleDecrement = (card: CardDefinition) => {
    sound.playButtonClick();
    const currentInDeck = deckCounts[card.id] || 0;
    if (currentInDeck <= 0) return;

    setDeckCounts((prev) => ({
      ...prev,
      [card.id]: currentInDeck - 1,
    }));
  };

  // Save deck
  const handleSave = () => {
    if (totalDeckCards < 15) {
      alert('Seu deck precisa de pelo menos 15 cartas para poder duelar!');
      return;
    }

    sound.playCardPlay();

    const flattenedDeck: string[] = [];
    Object.entries(deckCounts).forEach(([cardId, count]) => {
      for (let i = 0; i < count; i++) {
        flattenedDeck.push(cardId);
      }
    });

    onSaveDeck(flattenedDeck);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  // Filtered card list
  const filteredCards = MASTER_CARDS.filter((card) => {
    if (filterType !== 'all' && card.type !== filterType) return false;
    if (filterElement !== 'all' && card.element !== filterElement) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-5xl w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deck Builder (Monster Master)</h2>
              <p className="text-xs text-slate-400">Configure suas 15–30 cartas com limites estratégicos e evoluções</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Tamanho do Deck:</span>
              <span
                className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${
                  totalDeckCards >= 15 && totalDeckCards <= 30
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {totalDeckCards}/30 Cartas
              </span>
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Deck</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 my-3">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('monster')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filterType === 'monster' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Monstros
            </button>
            <button
              onClick={() => setFilterType('spell')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filterType === 'spell' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Magias
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            {['all', 'fire', 'water', 'electric', 'metal', 'dark'].map((elem) => (
              <button
                key={elem}
                onClick={() => setFilterElement(elem)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                  filterElement === elem ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                {elem}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid (Faithful to Image 2 with stepper controls `< 0 >`) */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => {
              const countInDeck = deckCounts[card.id] || 0;
              const owned = profile.inventoryCards.find((c) => c.cardId === card.id)?.count || 0;

              return (
                <div
                  key={card.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-between gap-1.5 shadow"
                >
                  <CardComponent card={card} size="sm" />

                  {/* Card metadata (Value, Limit) */}
                  <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                    <span>Possui: {owned}</span>
                    <span>Lim: {card.limit}</span>
                  </div>

                  {/* The classic Monster Master numeric stepper: < [count] > with orange arrows */}
                  <div className="flex items-center justify-center gap-2 bg-slate-950/80 border border-slate-700 rounded-lg p-1 w-full">
                    <button
                      onClick={() => handleDecrement(card)}
                      disabled={countInDeck <= 0}
                      className="w-7 h-7 rounded bg-amber-600/30 hover:bg-amber-600 active:scale-95 disabled:opacity-20 text-amber-300 font-bold flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      title="Diminuir cópias no deck"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <span className="font-mono font-bold text-sm text-white w-6 text-center tabular-nums">
                      {countInDeck}
                    </span>

                    <button
                      onClick={() => handleIncrement(card)}
                      disabled={countInDeck >= card.limit || countInDeck >= owned}
                      className="w-7 h-7 rounded bg-amber-600/30 hover:bg-amber-600 active:scale-95 disabled:opacity-20 text-amber-300 font-bold flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      title="Aumentar cópias no deck"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
