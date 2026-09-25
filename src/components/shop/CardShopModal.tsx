/**
 * Monster Master: Evolution TCG RPG - Card Shop & Booster Pack Opening
 */

import React, { useState } from 'react';
import { BOOSTER_PACKS, BoosterPack, CARDS_BY_ID, MASTER_CARDS } from '../../data/cards';
import { CardDefinition, RPGProfile } from '../../types/game';
import { CardComponent } from '../battle/CardComponent';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  X,
  ShoppingBag,
  Sparkles,
  Package,
  Layers,
  Check,
  Coins,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface CardShopModalProps {
  profile: RPGProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: RPGProfile) => RPGProfile) => void;
}

export const CardShopModal: React.FC<CardShopModalProps> = ({
  profile,
  onClose,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'packs' | 'singles'>('packs');
  const [openedPack, setOpenedPack] = useState<{
    pack: BoosterPack;
    cards: CardDefinition[];
    revealedIndices: boolean[];
  } | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  // Buy & Open Booster Pack
  const handleBuyPack = (pack: BoosterPack) => {
    if (profile.gold < pack.price) {
      sound.playDefeat();
      alert('Ouro insuficiente! Vença mais duelos ou complete missões para obter moedas.');
      return;
    }

    sound.playCardPlay();

    // Deduct gold
    onUpdateProfile((prev) => ({
      ...prev,
      gold: prev.gold - pack.price,
    }));

    // Generate 4 cards from pool
    const pulledCards: CardDefinition[] = [];
    for (let i = 0; i < 4; i++) {
      const randomCardId = pack.cardPool[Math.floor(Math.random() * pack.cardPool.length)];
      const card = CARDS_BY_ID.get(randomCardId) || MASTER_CARDS[0];
      pulledCards.push(card);

      // Add to inventory
      onUpdateProfile((prev) => {
        const existing = prev.inventoryCards.find((c) => c.cardId === card.id);
        if (existing) {
          return {
            ...prev,
            inventoryCards: prev.inventoryCards.map((c) =>
              c.cardId === card.id ? { ...c, count: c.count + 1 } : c
            ),
          };
        } else {
          return {
            ...prev,
            inventoryCards: [...prev.inventoryCards, { cardId: card.id, count: 1 }],
          };
        }
      });
    }

    setOpenedPack({
      pack,
      cards: pulledCards,
      revealedIndices: [false, false, false, false],
    });
  };

  // Flip individual card in opened pack
  const handleFlipCard = (index: number) => {
    if (!openedPack || openedPack.revealedIndices[index]) return;

    sound.playEvolutionFanfare();
    const newRevealed = [...openedPack.revealedIndices];
    newRevealed[index] = true;

    setOpenedPack({
      ...openedPack,
      revealedIndices: newRevealed,
    });

    // If all cards revealed, celebrate
    if (newRevealed.every(Boolean)) {
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Safe fallback
      }
    }
  };

  // Buy single card
  const handleBuySingle = (card: CardDefinition) => {
    if (profile.gold < card.value) {
      sound.playDefeat();
      alert('Ouro insuficiente para comprar esta carta!');
      return;
    }

    sound.playCardPlay();

    onUpdateProfile((prev) => {
      const existing = prev.inventoryCards.find((c) => c.cardId === card.id);
      const updatedInventory = existing
        ? prev.inventoryCards.map((c) =>
            c.cardId === card.id ? { ...c, count: c.count + 1 } : c
          )
        : [...prev.inventoryCards, { cardId: card.id, count: 1 }];

      return {
        ...prev,
        gold: prev.gold - card.value,
        inventoryCards: updatedInventory,
      };
    });

    setPurchaseSuccessMessage(`Você comprou 1x ${card.name}!`);
    setTimeout(() => setPurchaseSuccessMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Card Mart Pokémon & Monster Master</h2>
              <p className="text-xs text-slate-400">Adquira boosters e cartas exclusivas para fortalecer seu deck</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{profile.gold} Gold</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-2 my-4">
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'packs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Pacotes de Booster</span>
          </button>
          <button
            onClick={() => setActiveTab('singles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'singles'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mercado de Cartas Avulsas</span>
          </button>
        </div>

        {/* Success toast */}
        {purchaseSuccessMessage && (
          <div className="mb-3 p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{purchaseSuccessMessage}</span>
          </div>
        )}

        {/* Tab 1: Booster Packs */}
        {activeTab === 'packs' && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BOOSTER_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl border-2 border-slate-700 bg-slate-800/80 p-5 flex flex-col justify-between hover:border-amber-400/60 transition shadow-lg"
                >
                  <div>
                    {/* Pack Visual Foil Wrapper */}
                    <div
                      className={`h-36 rounded-xl bg-gradient-to-br ${pack.bannerColor} border border-white/20 p-4 flex flex-col justify-between shadow-inner relative overflow-hidden mb-4`}
                    >
                      <div className="flex items-center justify-between text-white">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span className="text-[10px] font-mono uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                          4 Cartas
                        </span>
                      </div>
                      <div className="text-center font-black text-white text-base tracking-wide drop-shadow">
                        {pack.name}
                      </div>
                      <div className="text-right text-[10px] text-amber-300 font-bold">
                        Monster Master TCG
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-base mb-1">{pack.name}</h3>
                    <p className="text-xs text-slate-400 mb-4">{pack.description}</p>
                  </div>

                  <button
                    onClick={() => handleBuyPack(pack)}
                    disabled={profile.gold < pack.price}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Comprar Booster por {pack.price} Gold</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Singles */}
        {activeTab === 'singles' && (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {MASTER_CARDS.map((card) => {
                const owned = profile.inventoryCards.find((c) => c.cardId === card.id)?.count || 0;

                return (
                  <div
                    key={card.id}
                    className="bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-between gap-2"
                  >
                    <CardComponent card={card} size="sm" />

                    <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                      <span>Possui: {owned}x</span>
                      <span className="text-amber-400 font-bold">{card.value}g</span>
                    </div>

                    <button
                      onClick={() => handleBuySingle(card)}
                      disabled={profile.gold < card.value}
                      className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Comprar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Booster Opening Modal Overlay */}
        {openedPack && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 text-center flex flex-col items-center">
              <h2 className="text-2xl font-black text-white mb-1">
                Abrindo {openedPack.pack.name}!
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Clique nas cartas para revelá-las e ver quais monstros e magias você tirou!
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {openedPack.cards.map((card, idx) => {
                  const isRevealed = openedPack.revealedIndices[idx];

                  return (
                    <div
                      key={idx}
                      onClick={() => handleFlipCard(idx)}
                      className={`cursor-pointer transition-transform duration-300 ${
                        !isRevealed ? 'hover:scale-105 animate-pulse' : ''
                      }`}
                    >
                      {isRevealed ? (
                        <div className="flex flex-col items-center gap-1">
                          <CardComponent card={card} size="sm" />
                          <span className="text-[10px] font-bold text-amber-300">
                            {card.stage > 1 ? `Estágio ${card.stage}!` : 'Carta Obtida'}
                          </span>
                        </div>
                      ) : (
                        <div className="w-24 h-36 rounded-lg bg-gradient-to-br from-indigo-900 via-purple-950 to-black border-2 border-indigo-500 shadow-xl flex flex-col items-center justify-center p-2 text-indigo-300">
                          <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
                          <span className="font-bold text-xs text-white">REVELAR</span>
                          <span className="text-[8px] text-slate-400 mt-1">Toque aqui</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {openedPack.revealedIndices.every(Boolean) ? (
                <button
                  onClick={() => setOpenedPack(null)}
                  className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Guardar Cartas na Mochila
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playEvolutionFanfare();
                    setOpenedPack({
                      ...openedPack,
                      revealedIndices: [true, true, true, true],
                    });
                  }}
                  className="py-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Revelar Todas as Cartas
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
