/**
 * Monster Master: Evolution TCG RPG - Trainer Card, Quests & Badges Modal
 */

import React from 'react';
import { RPGProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import {
  X,
  Award,
  CheckCircle2,
  Circle,
  Coins,
  ShieldAlert,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface QuestLogModalProps {
  profile: RPGProfile;
  onClose: () => void;
  onClaimQuestReward?: (questId: string, goldReward: number) => void;
}

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  profile,
  onClose,
  onClaimQuestReward,
}) => {
  const BADGES = [
    { id: 'Insígnia da Névoa', name: 'Insígnia da Névoa', icon: '🌊', color: 'from-cyan-500 to-blue-700', gym: 'Mestra Marina' },
    { id: 'Insígnia das Chamas', name: 'Insígnia das Chamas', icon: '🔥', color: 'from-amber-500 to-rose-700', gym: 'Lorde Ignis' },
    { id: 'Insígnia do Trovão', name: 'Insígnia do Trovão', icon: '⚡', color: 'from-yellow-400 to-amber-600', gym: 'Tenente Raiden' },
    { id: 'Insígnia do Mestre', name: 'Insígnia do Mestre', icon: '👑', color: 'from-purple-500 to-indigo-700', gym: 'Campeão da Liga' },
  ];

  const QUESTS = [
    {
      id: 'quest_starter',
      title: 'Primeiros Passos no TCG',
      desc: 'Fale com o Professor Leo na Vila Inicial para aprender a evoluir monstros.',
      reward: 30,
      completed: true,
    },
    {
      id: 'quest_rival',
      title: 'Desafio do Rival Kael',
      desc: 'Enfrente e derrote o Rival Kael na Rota 1.',
      reward: 60,
      completed: profile.gold > 50,
    },
    {
      id: 'quest_water_gym',
      title: 'Desafiar o Ginásio da Névoa',
      desc: 'Vença a Mestra Marina e conquiste a Insígnia da Névoa.',
      reward: 150,
      completed: profile.badges.includes('Insígnia da Névoa'),
    },
    {
      id: 'quest_fire_gym',
      title: 'O Fogo do Vulcão Rubro',
      desc: 'Vença o Líder Ignis e conquiste a Insígnia das Chamas.',
      reward: 200,
      completed: profile.badges.includes('Insígnia das Chamas'),
    },
    {
      id: 'quest_booster',
      title: 'Colecionador de Cartas',
      desc: 'Compre seu primeiro Pacote Booster no Card Mart.',
      reward: 50,
      completed: profile.inventoryCards.length > 10,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cartão de Treinador & Missões</h2>
              <p className="text-xs text-slate-400">Insígnias de Ginásio e Conquistas de Aventura</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Case (Pokémon Gym Badges) */}
        <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Estojo de Insígnias de Ginásio ({profile.badges.length}/4)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BADGES.map((b) => {
              const hasBadge = profile.badges.includes(b.id);

              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition ${
                    hasBadge
                      ? `bg-gradient-to-br ${b.color} border-white/40 shadow-lg text-white`
                      : 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-60'
                  }`}
                >
                  <span className="text-3xl mb-1 filter drop-shadow">
                    {hasBadge ? b.icon : '🔒'}
                  </span>
                  <span className="text-xs font-bold leading-tight">{b.name}</span>
                  <span className="text-[10px] mt-0.5 opacity-80">{b.gym}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quests List */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Missões Principais da Jornada
          </h3>

          <div className="flex flex-col gap-2">
            {QUESTS.map((quest) => (
              <div
                key={quest.id}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {quest.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{quest.title}</h4>
                    <p className="text-xs text-slate-400">{quest.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{quest.reward}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
