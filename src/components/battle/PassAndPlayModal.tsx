/**
 * Monster Master: Evolution TCG RPG - Pass & Play Device Handoff Screen
 */

import React from 'react';
import { Shield, Eye, Smartphone, ArrowRight, User } from 'lucide-react';
import { sound } from '../../utils/audio';

interface PassAndPlayModalProps {
  nextPlayerName: string;
  nextPlayerAvatar: string;
  turnNumber: number;
  onReady: () => void;
}

export const PassAndPlayModal: React.FC<PassAndPlayModalProps> = ({
  nextPlayerName,
  nextPlayerAvatar,
  turnNumber,
  onReady,
}) => {
  const handleReveal = () => {
    sound.playButtonClick();
    onReady();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
        {/* Device pass icon */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
            <Smartphone className="w-10 h-10 animate-bounce" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          Passe o Dispositivo!
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Modo Duelo Pass & Play no mesmo aparelho. A mão do oponente foi ocultada para garantir um duelo justo!
        </p>

        {/* Next Player Card */}
        <div className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-indigo-300 font-bold text-lg">
            {nextPlayerAvatar ? (
              <span className="text-2xl">{nextPlayerAvatar}</span>
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div className="text-left flex-1">
            <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
              Vez de Jogar (Turno {turnNumber})
            </span>
            <div className="text-lg font-bold text-white">{nextPlayerName}</div>
          </div>
        </div>

        {/* Ready Button */}
        <button
          onClick={handleReveal}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-base transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Eye className="w-5 h-5" />
          <span>Estou com o Aparelho (Revelar Minha Vez)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
