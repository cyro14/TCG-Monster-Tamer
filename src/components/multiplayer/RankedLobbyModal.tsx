/**
 * Monster Master: Evolution TCG RPG - Online Ranked Multiplayer Lobby
 */

import React, { useState, useEffect } from 'react';
import { RPGProfile } from '../../types/game';
import { INITIAL_LEADERBOARD, RankedPlayer, getRankTier } from '../../services/multiplayer';
import { sound } from '../../utils/audio';
import {
  X,
  Trophy,
  Swords,
  Globe,
  Users,
  Shield,
  Search,
  CheckCircle,
  Copy,
  Zap,
  Flame,
  Award,
} from 'lucide-react';

interface RankedLobbyModalProps {
  profile: RPGProfile;
  onClose: () => void;
  onStartRankedMatch: (opponent: RankedPlayer, roomId: string) => void;
}

export const RankedLobbyModal: React.FC<RankedLobbyModalProps> = ({
  profile,
  onClose,
  onStartRankedMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'matchmaking' | 'custom_room' | 'leaderboard'>('matchmaking');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [customRoomCreated, setCustomRoomCreated] = useState<string | null>(null);
  const [matchedOpponent, setMatchedOpponent] = useState<RankedPlayer | null>(null);

  // Matchmaking search timer & simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTimer((t) => t + 1);
      }, 1000);

      // Match after 3-5 seconds with a ranked opponent near player's ELO
      const matchTimeout = setTimeout(() => {
        const potentialOpponents = INITIAL_LEADERBOARD.filter(
          (p) => Math.abs(p.elo - profile.rankPoints) < 400
        );
        const opponent =
          potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)] ||
          INITIAL_LEADERBOARD[4];

        sound.playEvolutionFanfare();
        setMatchedOpponent(opponent);
        setIsSearching(false);

        // Auto launch match after brief opponent reveal
        setTimeout(() => {
          onStartRankedMatch(opponent, `RANKED_${Date.now()}`);
        }, 1800);
      }, 3500);

      return () => {
        clearInterval(interval);
        clearTimeout(matchTimeout);
      };
    }
  }, [isSearching, profile.rankPoints, onStartRankedMatch]);

  const handleStartSearch = () => {
    sound.playButtonClick();
    setIsSearching(true);
    setSearchTimer(0);
    setMatchedOpponent(null);
  };

  const handleCancelSearch = () => {
    sound.playButtonClick();
    setIsSearching(false);
    setSearchTimer(0);
  };

  const handleCreateRoom = () => {
    sound.playButtonClick();
    const generated = ['DRGN', 'FIRE', 'VOLT', 'AQUA', 'TITN'][Math.floor(Math.random() * 5)];
    setCustomRoomCreated(generated);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      alert('Digite um código de sala válido!');
      return;
    }
    sound.playButtonClick();
    const guestOpponent: RankedPlayer = {
      rank: 42,
      name: `Duelista_Sala_${roomCode.toUpperCase()}`,
      avatar: '⚔️',
      elo: profile.rankPoints,
      tier: profile.rankTier,
      wins: 18,
      losses: 10,
    };
    onStartRankedMatch(guestOpponent, roomCode.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl w-full bg-slate-900 border-2 border-indigo-500/60 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Arena Ranqueada Online</h2>
              <p className="text-xs text-slate-400">Duelos competitivos em tempo real com sistema ELO e rankings mundiais</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-xs">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">{profile.rankPoints} ELO</span>
              <span className="text-indigo-300 font-semibold">({profile.rankTier})</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 my-4">
          <button
            onClick={() => setActiveTab('matchmaking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'matchmaking'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Fila Rápida Ranqueada</span>
          </button>
          <button
            onClick={() => setActiveTab('custom_room')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom_room'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Salas Privadas (Amigos)</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Ranking & Líderes</span>
          </button>
        </div>

        {/* Tab 1: Matchmaking */}
        {activeTab === 'matchmaking' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            {isSearching ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                  <Globe className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Buscando Oponente Ranqueado...
                  </h3>
                  <p className="text-xs text-slate-400">
                    Procurando duelista com ELO próximo a {profile.rankPoints} ({profile.rankTier})
                  </p>
                  <div className="text-xs font-mono text-amber-400 mt-2">
                    Tempo de busca: {searchTimer}s
                  </div>
                </div>

                <button
                  onClick={handleCancelSearch}
                  className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar Busca
                </button>
              </div>
            ) : matchedOpponent ? (
              <div className="flex flex-col items-center gap-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl">
                  {matchedOpponent.avatar}
                </div>

                <div>
                  <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                    OPONENTE ENCONTRADO!
                  </span>
                  <h3 className="text-2xl font-black text-white">{matchedOpponent.name}</h3>
                  <div className="text-sm font-mono text-slate-300 mt-1">
                    {matchedOpponent.elo} ELO • {matchedOpponent.tier}
                  </div>
                </div>

                <div className="text-xs text-indigo-300 animate-pulse font-semibold">
                  Iniciando duelo competitivo...
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
                  <Swords className="w-10 h-10" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  Duelo Competitivo Ranqueado
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Entre na fila mundial para enfrentar jogadores e bots competitivos. Vitórias garantem +25 ELO e +75 Gold!
                </p>

                <button
                  onClick={handleStartSearch}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>Encontrar Partida Ranqueada</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Custom Rooms */}
        {activeTab === 'custom_room' && (
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Criar Sala Privada</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Gere um código de 4 letras para compartilhar com seu amigo e duelar à distância!
                </p>

                {customRoomCreated ? (
                  <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500 text-center mb-4">
                    <span className="text-xs text-slate-400 block mb-1">Código da sua Sala:</span>
                    <span className="text-3xl font-black font-mono tracking-widest text-amber-400">
                      {customRoomCreated}
                    </span>
                    <span className="text-[11px] text-indigo-300 block mt-2">
                      Aguardando seu amigo conectar...
                    </span>
                  </div>
                ) : null}
              </div>

              {customRoomCreated ? (
                <button
                  onClick={() => {
                    const friendOpponent: RankedPlayer = {
                      rank: 12,
                      name: 'Amigo Conectado',
                      avatar: '🧙‍♂️',
                      elo: profile.rankPoints,
                      tier: profile.rankTier,
                      wins: 20,
                      losses: 12,
                    };
                    onStartRankedMatch(friendOpponent, customRoomCreated);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Iniciar Duelo com Amigo
                </button>
              ) : (
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Gerar Nova Sala Privada
                </button>
              )}
            </div>

            {/* Join Room */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Entrar em uma Sala</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Recebeu um código do seu amigo? Digite abaixo para conectar à partida:
                </p>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="EX: DRGN"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono font-bold text-xl text-amber-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase tracking-widest mb-4"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                Entrar na Sala e Duelar
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Duelista</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">ELO</th>
                  <th className="py-2.5 px-3">V/D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {INITIAL_LEADERBOARD.map((player) => (
                  <tr key={player.rank} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-bold text-amber-400">
                      {player.rank === 1 ? '🥇 1' : player.rank === 2 ? '🥈 2' : player.rank === 3 ? '🥉 3' : player.rank}
                    </td>
                    <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                      <span className="text-base">{player.avatar}</span>
                      <span>{player.name}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{player.tier}</td>
                    <td className="py-2 px-3 font-bold text-indigo-300 tabular-nums">{player.elo}</td>
                    <td className="py-2 px-3 text-slate-400">
                      <span className="text-emerald-400">{player.wins}W</span> /{' '}
                      <span className="text-rose-400">{player.losses}L</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
