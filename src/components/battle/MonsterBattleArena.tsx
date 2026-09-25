/**
 * Monster Master: Evolution TCG RPG - Battle Arena Component
 * Faithful adaptation of the classic Monster Master arena with Pokémon Evolution mechanics
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BattleState,
  BoardMonster,
  CardDefinition,
} from '../../types/game';
import { CARDS_BY_ID } from '../../data/cards';
import { CardComponent, getElementColors } from './CardComponent';
import { CardArt } from './CardArt';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCw,
  Trophy,
  Volume2,
  VolumeX,
  Swords,
  Shield,
  Zap,
  Flame,
  Info,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { PassAndPlayModal } from './PassAndPlayModal';

interface MonsterBattleArenaProps {
  initialBattle: BattleState;
  onExit: () => void;
  onBattleWon?: (goldReward: number) => void;
  onBattleLost?: () => void;
}

export const MonsterBattleArena: React.FC<MonsterBattleArenaProps> = ({
  initialBattle,
  onExit,
  onBattleWon,
  onBattleLost,
}) => {
  const [battle, setBattle] = useState<BattleState>(initialBattle);
  const [targetMode, setTargetMode] = useState<{
    type: 'monster_attack' | 'spell_friendly' | 'spell_enemy';
    sourceSlot?: number;
    spellCard?: CardDefinition;
  } | null>(null);
  const [animatingEvolution, setAnimatingEvolution] = useState<string | null>(null);
  const [floatingNotification, setFloatingNotification] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [inspectedCard, setInspectedCard] = useState<CardDefinition | null>(null);
  const [hoveredCard, setHoveredCard] = useState<CardDefinition | null>(null);

  // Floating combat text (damage, heals, destruction notices)
  const [floatingTexts, setFloatingTexts] = useState<
    Array<{ id: string; targetKey: string; text: string; color: string }>
  >([]);

  // Combat animations: lunging attacking slot and shaking/struck target
  const [attackingSlotKey, setAttackingSlotKey] = useState<string | null>(null);
  const [hitTargetKey, setHitTargetKey] = useState<string | null>(null);

  // Long press timer for mobile cards (only zoom when holding pressed)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  const startLongPress = (card: CardDefinition) => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      sound.playButtonClick();
      setInspectedCard(card);
    }, 400); // 400ms hold to zoom on mobile
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const showFloatingText = (targetKey: string, text: string, color: string) => {
    const id = `ftext_${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev, { id, targetKey, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1300);
  };

  const triggerCombatDamage = (
    sourceKey: string,
    targetKey: string,
    damageAmount: number,
    isDestroyed = false,
    isDirect = false
  ) => {
    setAttackingSlotKey(sourceKey);
    setTimeout(() => {
      setAttackingSlotKey(null);
      setHitTargetKey(targetKey);
      const text = isDirect ? `💥 -${damageAmount} HP` : `-${damageAmount} 🛡️`;
      const color = isDirect ? 'text-amber-400 font-black' : 'text-rose-400 font-bold';
      showFloatingText(targetKey, text, color);

      if (isDestroyed) {
        setTimeout(() => {
          showFloatingText(targetKey, '💀 DESTRUÍDO!', 'text-red-500 font-black');
        }, 220);
      }
    }, 180);

    setTimeout(() => {
      setHitTargetKey((prev) => (prev === targetKey ? null : prev));
    }, 550);
  };

  const triggerHeal = (targetKey: string, amount: number) => {
    showFloatingText(targetKey, `+${amount} HP ✨`, 'text-emerald-400 font-bold');
  };

  // Show floating text banner
  const triggerNotification = (text: string) => {
    setFloatingNotification(text);
    setTimeout(() => {
      setFloatingNotification((prev) => (prev === text ? null : prev));
    }, 2400);
  };

  // Toggle audio
  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Check victory / defeat
  useEffect(() => {
    if (battle.winner) return;

    if (battle.player2.hp <= 0) {
      sound.playVictory();
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Safe fallback
      }
      setBattle((prev) => ({
        ...prev,
        winner: 'player1',
        combatLog: [`🏆 ${prev.player1.name} VENCEU O DUELO!`, ...prev.combatLog],
      }));
      if (onBattleWon) onBattleWon(50);
    } else if (battle.player1.hp <= 0) {
      sound.playDefeat();
      setBattle((prev) => ({
        ...prev,
        winner: 'player2',
        combatLog: [`💀 ${prev.player2.name} VENCEU O DUELO!`, ...prev.combatLog],
      }));
      if (onBattleLost) onBattleLost();
    }
  }, [battle.player1.hp, battle.player2.hp, battle.winner, battle.player1.name, battle.player2.name, onBattleWon, onBattleLost]);

  // Current active player and perspective definition
  const isPassAndPlay = battle.mode === 'pass_and_play';
  // In Pass & Play (same device duel), bottom player is whoever's turn it is so the friend holding the phone sees their hand!
  // In Story / Ranked, bottom player is always player1 (the human player).
  const bottomPlayerKey: 'player1' | 'player2' = isPassAndPlay ? battle.currentTurn : 'player1';
  const topPlayerKey: 'player1' | 'player2' = bottomPlayerKey === 'player1' ? 'player2' : 'player1';

  const bottomPlayer = battle[bottomPlayerKey];
  const topPlayer = battle[topPlayerKey];
  const activePlayer = battle[battle.currentTurn];
  const defendingPlayer = battle[battle.currentTurn === 'player1' ? 'player2' : 'player1'];

  // Handle clicking a card in bottom player's hand
  const handleHandCardClick = (cardIndex: number) => {
    if (battle.winner) return;
    if (battle.currentTurn !== bottomPlayerKey) {
      triggerNotification('Espere a sua vez de jogar!');
      return;
    }
    sound.playButtonClick();

    const card = bottomPlayer.hand[cardIndex];
    if (!card) return;

    // Check if player clicked already selected card to deselect
    if (battle.selectedCardIndex === cardIndex) {
      setBattle((prev) => ({ ...prev, selectedCardIndex: null }));
      setTargetMode(null);
      return;
    }

    setBattle((prev) => ({ ...prev, selectedCardIndex: cardIndex, selectedFieldSlot: null }));

    if (card.type === 'monster') {
      // Check if this monster is an evolution stage 2 or 3
      if (card.stage > 1 && card.evolvesFromId) {
        triggerNotification(`Selecione um ${CARDS_BY_ID.get(card.evolvesFromId)?.name || 'monstro'} no seu campo para EVOLUIR!`);
        setTargetMode({ type: 'spell_friendly', spellCard: card });
      } else {
        // Basic monster (Stage 1) - Can be summoned to an empty slot or first available slot
        setTargetMode(null);
        triggerNotification(`Clique em um espaço vazio do seu campo para invocar ${card.name}!`);
      }
    } else {
      // Spell card
      if (card.spellEffect === 'black_hole') {
        // Global spell: triggers immediately
        applyBlackHole(cardIndex);
      } else if (card.spellEffect === 'tsunami') {
        // Global enemy AoE spell
        applyTsunami(cardIndex);
      } else if (card.spellEffect === 'arcane_barrier') {
        // Global ally shield spell
        applyArcaneBarrier(cardIndex);
      } else if (card.spellEffect === 'restore') {
        // Direct player heal
        applyPlayerRestore(cardIndex, card.spellPower || 2);
      } else if (
        card.spellEffect === 'fireball' ||
        card.spellEffect === 'lightning' ||
        card.spellEffect === 'poison' ||
        card.spellEffect === 'curse' ||
        card.spellEffect === 'earthquake'
      ) {
        // Target enemy monster
        setTargetMode({ type: 'spell_enemy', spellCard: card });
        triggerNotification(`Escolha um monstro inimigo para lançar ${card.name}!`);
      } else {
        // Friendly monster spell (Sword, Shield, Fire Sword, Ice Shield, Heal, Cleanse, Antidote, Charge, Summon, Sacrifice, Evolution Stone)
        setTargetMode({ type: 'spell_friendly', spellCard: card });
        triggerNotification(`Escolha um monstro aliado para aplicar ${card.name}!`);
      }
    }
  };

  // Summon basic monster onto field slot
  const handleSummonMonster = (slotIndex: number) => {
    if (battle.selectedCardIndex === null) return;
    const card = bottomPlayer.hand[battle.selectedCardIndex];
    if (!card || card.type !== 'monster' || card.stage > 1) return;

    // Check if slot is occupied
    if (bottomPlayer.field[slotIndex]) {
      triggerNotification('Esse espaço já está ocupado por outro monstro!');
      return;
    }

    sound.playCardPlay();

    const newMonster: BoardMonster = {
      instanceId: `${card.id}_${Date.now()}_${Math.random()}`,
      card,
      currentAttack: card.attack,
      currentDefense: card.defense || card.maxDefense || 2,
      maxDefense: card.maxDefense || card.defense || 2,
      summonTurnsLeft: card.summonTurns,
      isReady: card.summonTurns === 0,
      hasAttacked: true, // Cannot attack in the same turn it enters (summoning sickness)
      statusEffects: {},
    };

    setBattle((prev) => {
      const pKey = bottomPlayerKey;
      const newHand = prev[pKey].hand.filter((_, idx) => idx !== prev.selectedCardIndex);
      const newField = [...prev[pKey].field];
      newField[slotIndex] = newMonster;

      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
          field: newField,
        },
        selectedCardIndex: null,
        combatLog: [
          `⚔️ ${prev[pKey].name} invocou ${card.name} (${card.summonTurns}t de espera)!`,
          ...prev.combatLog,
        ],
      };
    });

    setTargetMode(null);
  };

  // Apply Pokémon Evolution to a friendly monster
  const handleEvolveMonster = (slotIndex: number, evoCard: CardDefinition) => {
    const targetMonster = bottomPlayer.field[slotIndex];
    if (!targetMonster) return;

    // Check compatibility: either normal evolution chain or Evolution Stone
    const isEvoStone = evoCard.spellEffect === 'evolution_stone';
    const isMatch = targetMonster.card.id === evoCard.evolvesFromId;

    if (!isMatch && !isEvoStone) {
      const requiredName = evoCard.evolvesFromId ? CARDS_BY_ID.get(evoCard.evolvesFromId)?.name : 'Monstro compatível';
      triggerNotification(`Incompatível! ${evoCard.name} só pode evoluir sobre ${requiredName}!`);
      return;
    }

    // Determine target evolved card definition
    let evolvedCardDef: CardDefinition | undefined = evoCard;
    if (isEvoStone) {
      if (!targetMonster.card.evolvesIntoId) {
        triggerNotification('Este monstro não possui mais evoluções disponíveis!');
        return;
      }
      evolvedCardDef = CARDS_BY_ID.get(targetMonster.card.evolvesIntoId);
      if (!evolvedCardDef) return;
    }

    // Play fanfare & animate
    sound.playEvolutionFanfare();
    setAnimatingEvolution(targetMonster.instanceId);
    setTimeout(() => setAnimatingEvolution(null), 1800);

    // Create evolved board monster
    const evolvedMonster: BoardMonster = {
      ...targetMonster,
      card: evolvedCardDef,
      currentAttack: evolvedCardDef.attack,
      currentDefense: evolvedCardDef.maxDefense,
      maxDefense: evolvedCardDef.maxDefense,
      summonTurnsLeft: 0, // Evolutions enter ready immediately!
      isReady: true,
      hasAttacked: false,
    };

    setBattle((prev) => {
      const pKey = bottomPlayerKey;
      const otherKey = topPlayerKey;
      const newField = [...prev[pKey].field];
      newField[slotIndex] = evolvedMonster;
      const newHand = prev[pKey].hand.filter((_, idx) => idx !== prev.selectedCardIndex);

      let abilityLog = '';
      const defField = [...prev[otherKey].field];
      let defHp = prev[otherKey].hp;

      if (evolvedCardDef.id === 'fire_stage3') {
        // Ignis Drake: 3 damage to all enemies!
        for (let i = 0; i < defField.length; i++) {
          const mon = defField[i];
          if (mon) {
            mon.currentDefense -= 3;
            if (mon.currentDefense <= 0) {
              defField[i] = null;
            }
          }
        }
        abilityLog = `🔥 Explosão de Meteoro do ${evolvedCardDef.name} causou 3 de dano a todas as criaturas inimigas!`;
      } else if (evolvedCardDef.id === 'water_stage3') {
        // Leviathorn: Freeze enemy
        for (let i = 0; i < defField.length; i++) {
          const mon = defField[i];
          if (mon) {
            mon.statusEffects.frozen = true;
            break;
          }
        }
        abilityLog = `🌊 Onda Glacial do ${evolvedCardDef.name} congelou a criatura inimiga por 1 turno!`;
      } else if (evolvedCardDef.id === 'elec_stage3') {
        // Raijin: Direct zap
        defHp = Math.max(0, defHp - 3);
        abilityLog = `⚡ Tempestade de Raios atingiu ${prev[otherKey].name} diretamente com 3 de dano!`;
      } else if (evolvedCardDef.id === 'mech_stage3') {
        // Titanmech: +2 defense to all friendly monsters
        newField.forEach((mon) => {
          if (mon) {
            mon.currentDefense += 2;
            mon.maxDefense += 2;
          }
        });
        abilityLog = `🛡️ Blindagem de Ferro reforçou todo o exército aliado com +2 de Defesa!`;
      } else if (evolvedCardDef.id === 'fire_phoenix') {
        // Phoenix: heal 3 HP to player and 2 damage to all enemies
        prev[pKey].hp = Math.min(prev[pKey].maxHp, prev[pKey].hp + 3);
        triggerHeal('bottom-player', 3);
        for (let i = 0; i < defField.length; i++) {
          const mon = defField[i];
          if (mon) {
            mon.currentDefense -= 2;
            if (mon.currentDefense <= 0) defField[i] = null;
          }
        }
        abilityLog = `🔥 Renascimento Flamejante curou 3 HP do duelista e causou 2 de dano aos inimigos!`;
      } else if (evolvedCardDef.id === 'water_beast') {
        // Kraken: -1 ATK to all enemy monsters
        defField.forEach((mon) => {
          if (mon) mon.currentAttack = Math.max(0, mon.currentAttack - 1);
        });
        abilityLog = `🌊 Redemoinho do Abismo reduziu o ataque de todos os monstros oponentes em 1!`;
      } else if (evolvedCardDef.id === 'mech_behemoth') {
        // Behemoth: +3 DEF to itself
        evolvedMonster.currentDefense += 3;
        evolvedMonster.maxDefense += 3;
        abilityLog = `⚙️ Muralha Mecânica fortaleceu o Colosso com +3 de Defesa!`;
      } else if (evolvedCardDef.id === 'elec_storm_dragon') {
        // Storm Dragon: 3 direct damage
        defHp = Math.max(0, defHp - 3);
        abilityLog = `⚡ Sobrecarga de Trovão atingiu o duelista oponente causando 3 de dano direto!`;
      } else if (evolvedCardDef.id === 'nature_stage2') {
        // Silvanor: +2 DEF to all allies
        newField.forEach((mon) => {
          if (mon) {
            mon.currentDefense += 2;
            mon.maxDefense += 2;
          }
        });
        abilityLog = `🌿 Bênção Verdejante concedeu +2 de Defesa a todos os monstros aliados!`;
      } else if (evolvedCardDef.id === 'nature_stage3') {
        // Gaia Colossus: +3 DEF heal to allies, 2 dmg to enemies
        newField.forEach((mon) => {
          if (mon) mon.currentDefense = Math.min(mon.maxDefense, mon.currentDefense + 3);
        });
        for (let i = 0; i < defField.length; i++) {
          const mon = defField[i];
          if (mon) {
            mon.currentDefense -= 2;
            if (mon.currentDefense <= 0) defField[i] = null;
          }
        }
        abilityLog = `🌱 Raízes Vivas curou 3 de Defesa dos aliados e causou 2 de dano a todas as criaturas inimigas!`;
      } else if (evolvedCardDef.id === 'dark_stage2') {
        // Espectro: drain 1 ATK from enemy
        for (let i = 0; i < defField.length; i++) {
          const mon = defField[i];
          if (mon && mon.currentAttack > 0) {
            mon.currentAttack = Math.max(0, mon.currentAttack - 1);
            evolvedMonster.currentAttack += 1;
            break;
          }
        }
        abilityLog = `🌑 Toque do Vazio drenou 1 de ataque de uma criatura inimiga!`;
      } else if (evolvedCardDef.id === 'dark_stage3') {
        // Void Lord: 3 damage to enemy player, heal 3 HP to own player
        defHp = Math.max(0, defHp - 3);
        prev[pKey].hp = Math.min(prev[pKey].maxHp, prev[pKey].hp + 3);
        triggerHeal('bottom-player', 3);
        abilityLog = `💀 Colheita Sombria causou 3 de dano ao oponente e restaurou 3 de HP do duelista!`;
      }

      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
          field: newField,
        },
        [otherKey]: {
          ...prev[otherKey],
          field: defField,
          hp: defHp,
        },
        selectedCardIndex: null,
        combatLog: [
          `🌟 EVOLUÇÃO: ${targetMonster.card.name} evoluiu para ${evolvedCardDef!.name}!`,
          ...(abilityLog ? [abilityLog] : []),
          ...prev.combatLog,
        ],
      };
    });

    triggerNotification(`✨ EVOLUÇÃO POKÉMON! ${targetMonster.card.name} evoluiu para ${evolvedCardDef.name}!`);
    setTargetMode(null);
  };

  // Apply spells to friendly monster
  const handleApplySpellFriendly = (slotIndex: number) => {
    if (battle.selectedCardIndex === null || !targetMode?.spellCard) return;
    const card = targetMode.spellCard;
    const targetMonster = bottomPlayer.field[slotIndex];

    if (!targetMonster) return;

    // Check if it's an evolution card or stone
    if (card.stage > 1 || card.spellEffect === 'evolution_stone') {
      handleEvolveMonster(slotIndex, card);
      return;
    }

    sound.playSpellCast();
    const updatedMonster = { ...targetMonster };
    let logMsg = '';

    switch (card.spellEffect) {
      case 'fire_sword':
        updatedMonster.currentAttack += 4;
        logMsg = `🔥 Fire Sword aumentou o ataque de ${targetMonster.card.name} para ${updatedMonster.currentAttack}!`;
        break;
      case 'ice_shield':
        updatedMonster.currentDefense += 4;
        updatedMonster.maxDefense += 4;
        logMsg = `❄️ Ice Shield concedeu +4 de defesa a ${targetMonster.card.name}!`;
        break;
      case 'sword':
        updatedMonster.currentAttack += 2;
        logMsg = `⚔️ Sword aumentou o ataque de ${targetMonster.card.name} para ${updatedMonster.currentAttack}!`;
        break;
      case 'shield':
        updatedMonster.currentDefense += 2;
        updatedMonster.maxDefense += 2;
        logMsg = `🛡️ Shield deu +2 de defesa a ${targetMonster.card.name}!`;
        break;
      case 'heal':
        updatedMonster.currentDefense = Math.min(
          updatedMonster.maxDefense,
          updatedMonster.currentDefense + 4
        );
        logMsg = `💚 Heal restaurou a defesa de ${targetMonster.card.name}!`;
        break;
      case 'cleanse':
      case 'antidote':
        updatedMonster.statusEffects = {};
        logMsg = `✨ ${card.name} purificou todos os efeitos de ${targetMonster.card.name}!`;
        break;
      case 'charge':
        updatedMonster.hasAttacked = false;
        updatedMonster.isReady = true;
        logMsg = `⚡ Charge! concedeu um ataque adicional a ${targetMonster.card.name}!`;
        break;
      case 'berserk':
        updatedMonster.currentAttack += 4;
        logMsg = `💢 Fúria Berserker concedeu +4 de ataque a ${targetMonster.card.name}!`;
        break;
      case 'thorns':
        updatedMonster.currentDefense += 3;
        updatedMonster.maxDefense += 3;
        logMsg = `🌿 Armadura de Espinhos concedeu +3 de defesa a ${targetMonster.card.name}!`;
        break;
      case 'summon':
        updatedMonster.summonTurnsLeft = 0;
        updatedMonster.isReady = true;
        logMsg = `⏳ Summon Fast despertou ${targetMonster.card.name} instantaneamente!`;
        break;
      case 'sacrifice':
        {
          const newField = [...bottomPlayer.field];
          newField[slotIndex] = null;
          const newHp = Math.min(bottomPlayer.maxHp, bottomPlayer.hp + 6);
          const newHand = bottomPlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

          setBattle((prev) => {
            const pKey = bottomPlayerKey;
            return {
              ...prev,
              [pKey]: {
                ...prev[pKey],
                hand: newHand,
                field: newField,
                hp: newHp,
              },
              selectedCardIndex: null,
              combatLog: [
                `🩸 ${targetMonster.card.name} foi sacrificado para curar 6 de HP de ${prev[pKey].name}!`,
                ...prev.combatLog,
              ],
            };
          });
          setTargetMode(null);
          return;
        }
      default:
        break;
    }

    const newField = [...bottomPlayer.field];
    newField[slotIndex] = updatedMonster;
    const newHand = bottomPlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

    setBattle((prev) => {
      const pKey = bottomPlayerKey;
      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
          field: newField,
        },
        selectedCardIndex: null,
        combatLog: [logMsg, ...prev.combatLog],
      };
    });

    setTargetMode(null);
  };

  // Apply spells to enemy monster
  const handleApplySpellEnemy = (slotIndex: number) => {
    if (battle.selectedCardIndex === null || !targetMode?.spellCard) return;
    const card = targetMode.spellCard;
    const targetMonster = topPlayer.field[slotIndex];

    if (!targetMonster) return;

    sound.playSpellCast();
    const updatedMonster = { ...targetMonster };
    let logMsg = '';
    let isDestroyed = false;

    switch (card.spellEffect) {
      case 'fireball':
        updatedMonster.currentDefense -= 3;
        logMsg = `🔥 Fireball causou 3 de dano em ${targetMonster.card.name}!`;
        break;
      case 'lightning':
        updatedMonster.currentDefense -= 2;
        logMsg = `⚡ Lightning atingiu ${targetMonster.card.name} causando 2 de dano!`;
        break;
      case 'poison':
        updatedMonster.statusEffects.poisoned = (updatedMonster.statusEffects.poisoned || 0) + 1;
        logMsg = `🧪 Poison envenenou ${targetMonster.card.name} (1 de dano por turno)!`;
        break;
      case 'curse':
        updatedMonster.currentAttack = Math.max(0, updatedMonster.currentAttack - 2);
        updatedMonster.currentDefense -= 2;
        logMsg = `🔮 Curse reduziu em 2 o ataque e defesa de ${targetMonster.card.name}!`;
        break;
      case 'earthquake':
        updatedMonster.currentDefense -= 3;
        updatedMonster.currentAttack = Math.max(0, updatedMonster.currentAttack - 1);
        logMsg = `🌋 Terremoto causou 3 de dano e reduziu o ataque de ${targetMonster.card.name}!`;
        break;
      default:
        break;
    }

    if (updatedMonster.currentDefense <= 0) {
      isDestroyed = true;
      logMsg += ` 💀 ${targetMonster.card.name} foi destruído!`;
    }

    const newEnemyField = [...topPlayer.field];
    newEnemyField[slotIndex] = isDestroyed ? null : updatedMonster;

    const newHand = bottomPlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

    setBattle((prev) => {
      const pKey = bottomPlayerKey;
      const otherKey = topPlayerKey;
      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
        },
        [otherKey]: {
          ...prev[otherKey],
          field: newEnemyField,
        },
        selectedCardIndex: null,
        combatLog: [logMsg, ...prev.combatLog],
      };
    });

    setTargetMode(null);
  };

  // Tsunami wave wipe on enemy field
  const applyTsunami = (cardIndex: number) => {
    sound.playSpellCast();
    const newHand = bottomPlayer.hand.filter((_, idx) => idx !== cardIndex);

    setBattle((prev) => {
      const otherKey = topPlayerKey;
      const pKey = bottomPlayerKey;
      const updatedField = prev[otherKey].field.map((mon) => {
        if (!mon) return null;
        const newDef = mon.currentDefense - 2;
        if (newDef <= 0) return null;
        return { ...mon, currentDefense: newDef };
      });

      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
        },
        [otherKey]: {
          ...prev[otherKey],
          field: updatedField,
        },
        selectedCardIndex: null,
        combatLog: [
          `🌊 TSUNAMI ANCESTRAL! Uma onda gigante varreu o campo inimigo causando 2 de dano em todas as criaturas!`,
          ...prev.combatLog,
        ],
      };
    });
  };

  // Arcane Barrier on ally field
  const applyArcaneBarrier = (cardIndex: number) => {
    sound.playSpellCast();
    const newHand = bottomPlayer.hand.filter((_, idx) => idx !== cardIndex);

    setBattle((prev) => {
      const pKey = bottomPlayerKey;
      const updatedField = prev[pKey].field.map((mon) => {
        if (!mon) return null;
        return {
          ...mon,
          currentDefense: mon.currentDefense + 2,
          maxDefense: mon.maxDefense + 2,
        };
      });

      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
          field: updatedField,
        },
        selectedCardIndex: null,
        combatLog: [
          `🛡️ BARREIRA ARCANA! Um domo de força protegeu todos os seus monstros aliados com +2 de Defesa!`,
          ...prev.combatLog,
        ],
      };
    });
  };

  // Black Hole wipe
  const applyBlackHole = (cardIndex: number) => {
    sound.playAttackHit();
    const newHand = bottomPlayer.hand.filter((_, idx) => idx !== cardIndex);

    setBattle((prev) => ({
      ...prev,
      player1: {
        ...prev.player1,
        field: [null, null, null, null, null],
        hand: prev.currentTurn === 'player1' ? newHand : prev.player1.hand,
      },
      player2: {
        ...prev.player2,
        field: [null, null, null, null, null],
        hand: prev.currentTurn === 'player2' ? newHand : prev.player2.hand,
      },
      selectedCardIndex: null,
      combatLog: [
        `🌌 BURACO NEGRO! Todos os monstros da mesa foram sugados para a destruição!`,
        ...prev.combatLog,
      ],
    }));
  };

  // Player restore heal
  const applyPlayerRestore = (cardIndex: number, amount: number) => {
    sound.playSpellCast();
    triggerHeal('bottom-player', amount);
    const newHand = bottomPlayer.hand.filter((_, idx) => idx !== cardIndex);
    const newHp = Math.min(bottomPlayer.maxHp, bottomPlayer.hp + amount);

    setBattle((prev) => {
      const pKey = bottomPlayerKey;
      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
          hp: newHp,
        },
        selectedCardIndex: null,
        combatLog: [
          `✨ ${prev[pKey].name} usou Restore e recuperou ${amount} pontos de vida!`,
          ...prev.combatLog,
        ],
      };
    });
  };

  // Select friendly monster on board to initiate an attack
  const handleSelectAttackingMonster = (slotIndex: number) => {
    if (battle.winner) return;
    if (battle.currentTurn !== bottomPlayerKey) {
      triggerNotification('Espere a sua vez de jogar!');
      return;
    }
    const monster = bottomPlayer.field[slotIndex];
    if (!monster) return;

    if (monster.summonTurnsLeft > 0) {
      triggerNotification(`Este monstro ainda está carregando a invocação (${monster.summonTurnsLeft} turnos restantes)!`);
      return;
    }

    if (monster.hasAttacked) {
      triggerNotification(`${monster.card.name} já realizou seu ataque neste turno!`);
      return;
    }

    if (monster.statusEffects.frozen) {
      triggerNotification(`${monster.card.name} está congelado e não pode atacar neste turno!`);
      return;
    }

    sound.playButtonClick();

    if (battle.selectedFieldSlot === slotIndex) {
      // Deselect
      setBattle((prev) => ({ ...prev, selectedFieldSlot: null }));
      setTargetMode(null);
    } else {
      setBattle((prev) => ({ ...prev, selectedFieldSlot: slotIndex, selectedCardIndex: null }));
      setTargetMode({ type: 'monster_attack', sourceSlot: slotIndex });

      // Check if enemy has monsters on field
      const enemyHasMonsters = topPlayer.field.some((m) => m !== null);
      if (enemyHasMonsters) {
        triggerNotification(`Escolha qual monstro inimigo atacar com ${monster.card.name}!`);
      } else {
        triggerNotification(`Campo inimigo livre! Ataque o duelista ${topPlayer.name} diretamente!`);
      }
    }
  };

  // Execute attack against an enemy monster (Attacker deals damage, offensive initiative)
  const handleAttackEnemyMonster = (targetSlot: number) => {
    if (battle.selectedFieldSlot === null || targetMode?.type !== 'monster_attack') return;
    const attacker = bottomPlayer.field[battle.selectedFieldSlot];
    const defender = topPlayer.field[targetSlot];

    if (!attacker || !defender) return;

    sound.playAttackHit();

    // Damage calculation: Attacker deals ATK to Defender's DEF
    const newDefenderDef = defender.currentDefense - attacker.currentAttack;
    let log = `⚔️ ${attacker.card.name} atacou ${defender.card.name} causando ${attacker.currentAttack} de dano!`;

    // Trigger visual lunge and floating numbers
    const sourceKey = `bottom-slot-${battle.selectedFieldSlot}`;
    const targetKey = `top-slot-${targetSlot}`;
    triggerCombatDamage(sourceKey, targetKey, attacker.currentAttack, newDefenderDef <= 0, false);

    const updatedDefender = { ...defender, currentDefense: newDefenderDef };
    const updatedAttacker = { ...attacker, hasAttacked: true };

    const newDefendingField = [...topPlayer.field];
    const newActiveField = [...bottomPlayer.field];

    if (newDefenderDef <= 0) {
      newDefendingField[targetSlot] = null;
      log += ` 💀 ${defender.card.name} foi eliminado!`;
    } else {
      newDefendingField[targetSlot] = updatedDefender;
    }

    newActiveField[battle.selectedFieldSlot] = updatedAttacker;

    setBattle((prev) => ({
      ...prev,
      [bottomPlayerKey]: {
        ...prev[bottomPlayerKey],
        field: newActiveField,
      },
      [topPlayerKey]: {
        ...prev[topPlayerKey],
        field: newDefendingField,
      },
      selectedFieldSlot: null,
      targetMode: null,
      combatLog: [log, ...prev.combatLog],
    }));
  };

  // Execute direct attack on enemy player (when field is open)
  const handleDirectAttackPlayer = () => {
    if (battle.selectedFieldSlot === null || targetMode?.type !== 'monster_attack') return;
    const attacker = bottomPlayer.field[battle.selectedFieldSlot];
    if (!attacker) return;

    // Check if enemy has monsters blocking
    const enemyHasMonsters = topPlayer.field.some((m) => m !== null);
    if (enemyHasMonsters) {
      triggerNotification('Você precisa destruir os monstros inimigos antes de atacar o duelista diretamente!');
      return;
    }

    sound.playAttackHit();

    const damage = attacker.currentAttack;
    const sourceKey = `bottom-slot-${battle.selectedFieldSlot}`;
    const targetKey = 'top-player';
    triggerCombatDamage(sourceKey, targetKey, damage, false, true);

    const newEnemyHp = Math.max(0, topPlayer.hp - damage);

    const newActiveField = [...bottomPlayer.field];
    newActiveField[battle.selectedFieldSlot] = { ...attacker, hasAttacked: true };

    const log = `💥 ATAQUE DIRETO! ${attacker.card.name} atacou ${topPlayer.name} diretamente causando ${damage} de dano!`;

    setBattle((prev) => ({
      ...prev,
      [bottomPlayerKey]: {
        ...prev[bottomPlayerKey],
        field: newActiveField,
      },
      [topPlayerKey]: {
        ...prev[topPlayerKey],
        hp: newEnemyHp,
      },
      selectedFieldSlot: null,
      targetMode: null,
      combatLog: [log, ...prev.combatLog],
    }));
  };

  // Classic Monster Master Turn Spinner End Turn Handler
  const handleEndTurn = () => {
    if (battle.winner) return;

    sound.playTurnEnd();
    setTargetMode(null);

    setBattle((prev) => {
      const nextTurn = prev.currentTurn === 'player1' ? 'player2' : 'player1';
      const outgoingKey = prev.currentTurn;
      const incomingKey = nextTurn;

      const incomingPlayer = prev[incomingKey];
      const outgoingPlayer = prev[outgoingKey];

      // 1. Process upkeep ONLY for incoming player:
      const updatedIncomingField = incomingPlayer.field.map((mon) => {
        if (!mon) return null;
        let st = mon.summonTurnsLeft;
        let ready = mon.isReady;

        if (st > 0) {
          st -= 1;
          if (st === 0) {
            ready = true;
          }
        }

        let def = mon.currentDefense;
        if (mon.statusEffects?.poisoned && mon.statusEffects.poisoned > 0) {
          def -= mon.statusEffects.poisoned;
          if (def <= 0) return null;
        }

        return {
          ...mon,
          summonTurnsLeft: st,
          isReady: ready,
          hasAttacked: false, // Ready to attack on their turn!
          currentDefense: def,
          statusEffects: {
            ...mon.statusEffects,
            frozen: false,
          },
        };
      });

      // Reset hasAttacked flags for outgoing player as well so state stays clean
      const updatedOutgoingField = outgoingPlayer.field.map((mon) => {
        if (!mon) return null;
        return {
          ...mon,
          hasAttacked: false,
        };
      });

      // 2. Draw card for incoming player
      let nextHand = [...incomingPlayer.hand];
      let nextDeck = [...incomingPlayer.deck];

      if (nextDeck.length > 0 && nextHand.length < 6) {
        sound.playCardDraw();
        const drawnCard = nextDeck[0];
        nextDeck = nextDeck.slice(1);
        nextHand.push(drawnCard);
      }

      const isPassAndPlay = prev.mode === 'pass_and_play';

      return {
        ...prev,
        turnNumber: nextTurn === 'player1' ? prev.turnNumber + 1 : prev.turnNumber,
        currentTurn: nextTurn,
        [incomingKey]: {
          ...incomingPlayer,
          hand: nextHand,
          deck: nextDeck,
          field: updatedIncomingField,
        },
        [outgoingKey]: {
          ...outgoingPlayer,
          field: updatedOutgoingField,
        },
        selectedCardIndex: null,
        selectedFieldSlot: null,
        waitingForPassHandover: isPassAndPlay,
        combatLog: [
          `🔄 Turno ${nextTurn === 'player1' ? prev.turnNumber + 1 : prev.turnNumber}: Vez de ${incomingPlayer.name}!`,
          ...prev.combatLog,
        ],
      };
    });
  };

  // Automated trigger for AI opponents (runs for both story and online_ranked against AI opponents)
  useEffect(() => {
    if (battle.winner) return;

    if (battle.currentTurn === 'player2' && (battle.mode === 'story' || battle.mode === 'online_ranked')) {
      const timer = setTimeout(() => {
        executeAiTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [battle.currentTurn, battle.winner, battle.mode]);

  // Robust Smart AI Turn Engine for AI opponents
  const executeAiTurn = () => {
    setBattle((currentBattle) => {
      if (currentBattle.winner || currentBattle.currentTurn !== 'player2') return currentBattle;

      const ai = currentBattle.player2;
      const human = currentBattle.player1;

      let newAiHand = [...ai.hand];
      let newAiField = [...ai.field];
      let newHumanField = [...human.field];
      let newHumanHp = human.hp;
      const logs: string[] = [];

      // 1. AI plays cards: try Evolution first, then basic Monsters, then Spells
      // Try evolution
      for (let hIdx = newAiHand.length - 1; hIdx >= 0; hIdx--) {
        const card = newAiHand[hIdx];
        if (!card) continue;

        if (card.stage > 1 && card.evolvesFromId) {
          const slot = newAiField.findIndex(
            (m) => m && m.card.id === card.evolvesFromId
          );
          if (slot !== -1) {
            const baseMon = newAiField[slot]!;
            newAiField[slot] = {
              ...baseMon,
              card,
              currentAttack: card.attack,
              currentDefense: card.maxDefense,
              maxDefense: card.maxDefense,
              summonTurnsLeft: 0,
              isReady: true,
              hasAttacked: false,
            };
            newAiHand.splice(hIdx, 1);
            logs.push(`🤖 ${ai.name} evoluiu ${baseMon.card.name} para ${card.name}!`);

            // Apply AI evolution special abilities
            if (card.id === 'fire_stage3') {
              for (let i = 0; i < newHumanField.length; i++) {
                if (newHumanField[i]) {
                  newHumanField[i]!.currentDefense -= 3;
                  if (newHumanField[i]!.currentDefense <= 0) {
                    newHumanField[i] = null;
                  }
                }
              }
              logs.push(`🔥 Explosão de Meteoro de ${card.name} atingiu suas criaturas com 3 de dano!`);
            } else if (card.id === 'elec_stage3') {
              newHumanHp = Math.max(0, newHumanHp - 3);
              logs.push(`⚡ Tempestade de Raios atingiu você causando 3 de dano!`);
            }
            break;
          }
        }
      }

      // Try basic monster summons (Stage 1)
      for (let hIdx = newAiHand.length - 1; hIdx >= 0; hIdx--) {
        const card = newAiHand[hIdx];
        if (!card) continue;

        if (card.type === 'monster' && card.stage === 1) {
          const emptySlot = newAiField.findIndex((m) => m === null);
          if (emptySlot !== -1) {
            newAiField[emptySlot] = {
              instanceId: `ai_${Date.now()}_${Math.random()}`,
              card,
              currentAttack: card.attack,
              currentDefense: card.defense || card.maxDefense || 2,
              maxDefense: card.maxDefense || card.defense || 2,
              summonTurnsLeft: card.summonTurns,
              isReady: card.summonTurns === 0,
              hasAttacked: true, // Summoning sickness: cannot attack in the same turn it enters!
              statusEffects: {},
            };
            newAiHand.splice(hIdx, 1);
            logs.push(`🤖 ${ai.name} invocou ${card.name} em campo!`);
            break;
          }
        }
      }

      // Try casting spells (fireball, lightning, sword, heal, etc.)
      for (let hIdx = newAiHand.length - 1; hIdx >= 0; hIdx--) {
        const card = newAiHand[hIdx];
        if (!card || card.type !== 'spell') continue;

        if (card.spellEffect === 'fireball' || card.spellEffect === 'lightning') {
          const humanSlot = newHumanField.findIndex((m) => m !== null);
          if (humanSlot !== -1) {
            const dmg = card.spellPower || (card.spellEffect === 'fireball' ? 3 : 2);
            const tgt = { ...newHumanField[humanSlot]! };
            tgt.currentDefense -= dmg;
            if (tgt.currentDefense <= 0) {
              newHumanField[humanSlot] = null;
              logs.push(`🔥 ${ai.name} lançou ${card.name} e destruiu seu ${tgt.card.name}!`);
            } else {
              newHumanField[humanSlot] = tgt;
              logs.push(`🔥 ${ai.name} lançou ${card.name} em seu ${tgt.card.name} (-${dmg} DEF)!`);
            }
            newAiHand.splice(hIdx, 1);
            break;
          }
        } else if (card.spellEffect === 'sword' || card.spellEffect === 'fire_sword') {
          const buffSlot = newAiField.findIndex((m) => m !== null);
          if (buffSlot !== -1) {
            const tgt = { ...newAiField[buffSlot]! };
            tgt.currentAttack += card.spellPower || 2;
            newAiField[buffSlot] = tgt;
            logs.push(`⚔️ ${ai.name} usou ${card.name} aumentando o ataque de ${tgt.card.name}!`);
            newAiHand.splice(hIdx, 1);
            break;
          }
        } else if (card.spellEffect === 'poison') {
          const humanSlot = newHumanField.findIndex((m) => m !== null && !m.statusEffects?.poisoned);
          if (humanSlot !== -1) {
            const tgt = { ...newHumanField[humanSlot]! };
            tgt.statusEffects = { ...tgt.statusEffects, poisoned: 1 };
            newHumanField[humanSlot] = tgt;
            logs.push(`🧪 ${ai.name} envenenou seu ${tgt.card.name}!`);
            newAiHand.splice(hIdx, 1);
            break;
          }
        }
      }

      // 2. Attacks with ready monsters on AI field
      for (let aSlot = 0; aSlot < newAiField.length; aSlot++) {
        const mon = newAiField[aSlot];
        if (!mon || mon.summonTurnsLeft > 0 || mon.hasAttacked || mon.statusEffects?.frozen) continue;

        // Find targets on human side
        const humanTargetIdx = newHumanField.findIndex((m) => m !== null);
        if (humanTargetIdx !== -1) {
          const humanMon = newHumanField[humanTargetIdx]!;
          const newDefDef = humanMon.currentDefense - mon.currentAttack;

          mon.hasAttacked = true;
          logs.push(`⚔️ ${mon.card.name} do oponente atacou seu ${humanMon.card.name}!`);

          triggerCombatDamage(`top-slot-${aSlot}`, `bottom-slot-${humanTargetIdx}`, mon.currentAttack, newDefDef <= 0, false);

          if (newDefDef <= 0) {
            newHumanField[humanTargetIdx] = null;
            logs.push(`💀 Seu ${humanMon.card.name} foi destruído!`);
          } else {
            newHumanField[humanTargetIdx] = { ...humanMon, currentDefense: newDefDef };
          }
        } else {
          // Direct attack on human player!
          newHumanHp = Math.max(0, newHumanHp - mon.currentAttack);
          mon.hasAttacked = true;
          logs.push(`💥 ATAQUE DIRETO: ${mon.card.name} atingiu você causando ${mon.currentAttack} de dano!`);

          triggerCombatDamage(`top-slot-${aSlot}`, 'bottom-player', mon.currentAttack, false, true);
        }
      }

      // 3. Complete turn handover: update Human's field upkeep (decrement summon turns)
      const updatedPlayer1Field = newHumanField.map((mon) => {
        if (!mon) return null;
        let st = mon.summonTurnsLeft;
        let ready = mon.isReady;
        if (st > 0) {
          st -= 1;
          if (st === 0) ready = true;
        }

        // Process poison for human monster if poisoned
        let def = mon.currentDefense;
        if (mon.statusEffects?.poisoned && mon.statusEffects.poisoned > 0) {
          def -= mon.statusEffects.poisoned;
          if (def <= 0) return null;
        }

        return {
          ...mon,
          summonTurnsLeft: st,
          isReady: ready,
          hasAttacked: false,
          currentDefense: def,
          statusEffects: {
            ...mon.statusEffects,
            frozen: false,
          },
        };
      });

      // Human draws card for new turn
      let hHand = [...human.hand];
      let hDeck = [...human.deck];
      if (hDeck.length > 0 && hHand.length < 6) {
        sound.playCardDraw();
        hHand.push(hDeck[0]);
        hDeck = hDeck.slice(1);
      }

      logs.push(`🔄 Turno ${currentBattle.turnNumber + 1}: Sua vez de jogar!`);

      return {
        ...currentBattle,
        turnNumber: currentBattle.turnNumber + 1,
        currentTurn: 'player1',
        player1: {
          ...currentBattle.player1,
          field: updatedPlayer1Field,
          hand: hHand,
          deck: hDeck,
          hp: newHumanHp,
        },
        player2: {
          ...currentBattle.player2,
          field: newAiField,
          hand: newAiHand,
        },
        combatLog: [...logs, ...currentBattle.combatLog],
      };
    });
  };

  // Helper for rendering health bar with pip blocks (faithful to Monster Master visual!)
  const renderHealthBar = (current: number, max: number) => {
    const totalPips = 20;
    const activePips = Math.round((Math.max(0, current) / max) * totalPips);

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 p-1 bg-black/80 rounded border border-amber-500/40">
          {Array.from({ length: totalPips }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-4 rounded-xs transition-colors duration-200 ${
                i < activePips
                  ? 'bg-gradient-to-t from-amber-500 to-yellow-300 shadow-xs shadow-amber-400'
                  : 'bg-stone-800'
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
          {current}/{max} HP
        </span>
      </div>
    );
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Background Graphic */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
        style={{ backgroundImage: `url('/src/assets/images/monster_arena_bg_1790341379169.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/90 pointer-events-none" />

      {/* Floating text notification toast */}
      {floatingNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-amber-500 text-amber-300 px-6 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-bold animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{floatingNotification}</span>
        </div>
      )}

      {/* Pass & Play Modal Handoff Privacy Curtain */}
      {battle.waitingForPassHandover && (
        <PassAndPlayModal
          nextPlayerName={activePlayer.name}
          nextPlayerAvatar={activePlayer.avatar}
          turnNumber={battle.turnNumber}
          onReady={() => {
            setBattle((prev) => ({ ...prev, waitingForPassHandover: false }));
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TOP ZONE: OPPONENT / DEFENDING PLAYER (Or Player 1 when Player 2's turn in Pass & Play) */}
      {/* ========================================================================= */}
      <div className="relative z-10 p-3 sm:p-4 bg-slate-950/60 border-b border-rose-950/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Opponent Portrait */}
            <div className={`relative w-12 h-12 rounded-xl bg-rose-950/80 border-2 border-rose-500/50 flex items-center justify-center text-2xl shadow-lg transition-all ${
              hitTargetKey === 'top-player' ? 'animate-shake ring-4 ring-rose-500 shadow-rose-500/60' : ''
            }`}>
              {topPlayer.avatar || '🤖'}
              {hitTargetKey === 'top-player' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-3xl animate-slash select-none">💥</span>
                </div>
              )}
              {floatingTexts
                .filter((f) => f.targetKey === 'top-player')
                .map((f) => (
                  <div key={f.id} className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-40 animate-float-damage whitespace-nowrap">
                    <span className={`text-sm sm:text-base font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${f.color}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">
                  {topPlayer.name}
                </span>
                {battle.currentTurn === topPlayerKey && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/40 text-rose-300 border border-rose-500/30 animate-pulse">
                    VEZ DELE
                  </span>
                )}
              </div>
              {renderHealthBar(topPlayer.hp, topPlayer.maxHp)}
            </div>
          </div>

          {/* Opponent Deck & Hand Count */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1 font-mono">
              <span className="text-slate-500">Mão:</span>
              <span className="text-white font-bold">{topPlayer.hand.length} cartas</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-slate-500">Deck:</span>
              <span className="text-white font-bold">{topPlayer.deck.length}</span>
            </div>
          </div>
        </div>

        {/* Opponent Field Slots (5 slots) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-2">
          {topPlayer.field.map((monster, idx) => {
            const slotKey = `top-slot-${idx}`;
            const isAttacking = attackingSlotKey === slotKey;
            const isHit = hitTargetKey === slotKey;
            const elem = monster ? getElementColors(monster.card.element) : null;
            const isTargetable = (targetMode?.type === 'monster_attack' || targetMode?.type === 'spell_enemy') && monster;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (isLongPressActiveRef.current) {
                    isLongPressActiveRef.current = false;
                    return;
                  }
                  if (targetMode?.type === 'monster_attack') {
                    handleAttackEnemyMonster(idx);
                  } else if (targetMode?.type === 'spell_enemy') {
                    handleApplySpellEnemy(idx);
                  }
                }}
                className={`relative w-20 h-28 sm:w-28 sm:h-38 rounded-xl border-2 flex items-center justify-center transition-all select-none ${
                  monster && elem
                    ? `${elem.bg} ${elem.border} ${elem.glow} shadow-lg`
                    : 'border-dashed border-rose-900/40 bg-black/40'
                } ${
                  isAttacking ? 'animate-lunge-down z-30' : ''
                } ${
                  isHit ? 'animate-shake ring-4 ring-rose-500 shadow-rose-500/50' : ''
                } ${
                  isTargetable
                    ? 'cursor-pointer hover:border-amber-400 hover:scale-105 ring-2 ring-amber-400/80 animate-pulse'
                    : ''
                }`}
              >
                {monster && elem ? (
                  <div
                    onMouseEnter={() => setHoveredCard(monster.card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onTouchStart={() => startLongPress(monster.card)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                    className="w-full h-full p-1 sm:p-1.5 relative flex flex-col justify-between"
                  >
                    {/* Top Tag: Name & Element Icon */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 truncate max-w-[80%]">
                        <span className="text-[10px] sm:text-xs font-black text-white truncate drop-shadow">
                          {monster.card.name}
                        </span>
                      </div>
                      <span
                        className="text-[9px] px-1 rounded font-bold uppercase tracking-wider shrink-0 flex items-center gap-0.5"
                        style={{ backgroundColor: `${elem.accent}33`, color: elem.accent }}
                        title={elem.name}
                      >
                        {elem.icon}
                      </span>
                    </div>

                    {/* Center Artwork */}
                    <div className="relative flex-1 my-0.5 sm:my-1 overflow-hidden rounded-md bg-black/50 border border-white/10 flex items-center justify-center">
                      {monster.card.image ? (
                        <img
                          src={monster.card.image}
                          alt={monster.card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">{elem.icon}</span>
                      )}

                      {/* Stage indicator */}
                      {monster.card.stage > 1 && (
                        <div className="absolute top-0.5 left-0.5 px-1 rounded bg-amber-400 text-black text-[8px] font-black">
                          E{monster.card.stage}
                        </div>
                      )}
                    </div>

                    {/* Bottom Status / Stats */}
                    {monster.summonTurnsLeft > 0 ? (
                      <div className="text-[9px] sm:text-[10px] text-amber-300 font-mono bg-black/80 rounded px-1 py-0.5 text-center font-bold border border-amber-500/40">
                        ⏳ {monster.summonTurnsLeft}t carga
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono font-black bg-black/60 rounded px-1 py-0.5 border border-white/10">
                        <span className="text-rose-400 drop-shadow">⚔️{monster.currentAttack}</span>
                        <span className="text-cyan-400 drop-shadow">🛡️{monster.currentDefense}</span>
                      </div>
                    )}

                    {/* Quick Detail Zoom Button (explicit tap/click to view without holding) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedCard(monster.card);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-amber-400 text-amber-300 text-[10px] flex items-center justify-center shadow opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 z-20 cursor-pointer"
                      title="Segure para ampliar ou clique para detalhes"
                    >
                      🔍
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-rose-800/60 font-mono">Vazio</span>
                )}

                {/* Floating Combat Text for this slot */}
                {floatingTexts
                  .filter((f) => f.targetKey === slotKey)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center animate-float-damage"
                    >
                      <span className={`text-base sm:text-xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${f.color}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}

                {/* Slash Particle on Hit */}
                {isHit && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                    <span className="text-3xl sm:text-5xl animate-slash select-none">⚔️</span>
                    <div className="absolute inset-0 bg-rose-500/35 rounded-xl animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MIDDLE ZONE: THE MONSTER MASTER NEON DIVIDER & TURN SPINNER BUTTON */}
      {/* ========================================================================= */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-2 bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-rose-950/70 border-y-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10">
        {/* Left: Menu & Sound Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-600 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition cursor-pointer"
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Center: Turn indicator & target direct attack button if open */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Turno {battle.turnNumber}
            </span>
            <div className="text-xs sm:text-sm font-bold text-amber-400 flex items-center justify-center gap-1.5">
              <span>
                {battle.currentTurn === bottomPlayerKey
                  ? `Sua Vez (${bottomPlayer.name})`
                  : `Vez de ${topPlayer.name}`}
              </span>
              {battle.currentTurn === 'player2' && (battle.mode === 'story' || battle.mode === 'online_ranked') && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            {battle.combatLog[0] && (
              <div className="text-[10px] text-cyan-300 font-mono truncate max-w-[200px] sm:max-w-[320px] hidden sm:block">
                {battle.combatLog[0]}
              </div>
            )}
          </div>

          {/* Direct Attack Opportunity Button */}
          {targetMode?.type === 'monster_attack' && !topPlayer.field.some((m) => m !== null) && (
            <button
              onClick={handleDirectAttackPlayer}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm animate-pulse shadow-lg shadow-rose-600/40 cursor-pointer flex items-center gap-1.5"
            >
              <Swords className="w-4 h-4" />
              <span>GOLPE DIRETO NO DUELISTA!</span>
            </button>
          )}
        </div>

        {/* Right: The Iconic Monster Master Turn Spinner Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEndTurn}
            disabled={battle.mode !== 'pass_and_play' && battle.currentTurn !== 'player1'}
            className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 border-2 border-amber-300 shadow-xl shadow-amber-500/40 flex items-center justify-center transition-transform active:scale-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Encerrar Turno (Girar)"
          >
            <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 font-bold transition-transform duration-500 group-hover:rotate-180" />
            <span className="absolute -bottom-5 text-[9px] font-bold text-amber-300 uppercase tracking-tighter whitespace-nowrap">
              {battle.mode === 'pass_and_play'
                ? (battle.currentTurn === 'player1' ? 'Passar P2' : 'Passar P1')
                : 'Passar'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ZONE: ACTIVE / LOCAL PLAYER (Device Owner) */}
      {/* ========================================================================= */}
      <div className="relative z-10 p-3 sm:p-4 bg-slate-950/70 border-t border-cyan-950/50 flex flex-col gap-2">
        {/* Player Field Slots (5 slots) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-1">
          {bottomPlayer.field.map((monster, idx) => {
            const slotKey = `bottom-slot-${idx}`;
            const isAttacking = attackingSlotKey === slotKey;
            const isHit = hitTargetKey === slotKey;
            const elem = monster ? getElementColors(monster.card.element) : null;
            const isSelected = battle.selectedFieldSlot === idx;
            const canAttack = monster && monster.summonTurnsLeft === 0 && !monster.hasAttacked && battle.currentTurn === bottomPlayerKey;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (isLongPressActiveRef.current) {
                    isLongPressActiveRef.current = false;
                    return;
                  }
                  if (targetMode?.type === 'spell_friendly') {
                    handleApplySpellFriendly(idx);
                  } else if (battle.selectedCardIndex !== null && !monster) {
                    handleSummonMonster(idx);
                  } else if (monster) {
                    handleSelectAttackingMonster(idx);
                  }
                }}
                className={`relative w-20 h-28 sm:w-28 sm:h-38 rounded-xl border-2 flex items-center justify-center transition-all select-none ${
                  monster && elem
                    ? `${elem.bg} ${elem.border} ${elem.glow} shadow-lg`
                    : 'border-dashed border-cyan-900/50 bg-black/40 hover:border-cyan-400 cursor-pointer'
                } ${
                  isAttacking ? 'animate-lunge-up z-30' : ''
                } ${
                  isHit ? 'animate-shake ring-4 ring-rose-500 shadow-rose-500/50' : ''
                } ${
                  isSelected ? 'ring-4 ring-amber-400 -translate-y-1' : ''
                } ${
                  canAttack ? 'ring-2 ring-emerald-400 animate-pulse cursor-pointer' : ''
                } ${
                  targetMode?.type === 'spell_friendly' && monster
                    ? 'ring-2 ring-amber-400 hover:scale-105 cursor-pointer'
                    : ''
                }`}
              >
                {monster && elem ? (
                  <div
                    onMouseEnter={() => setHoveredCard(monster.card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onTouchStart={() => startLongPress(monster.card)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                    className="w-full h-full p-1 sm:p-1.5 relative flex flex-col justify-between"
                  >
                    {/* Top Tag: Name & Element Icon */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 truncate max-w-[80%]">
                        <span className="text-[10px] sm:text-xs font-black text-white truncate drop-shadow">
                          {monster.card.name}
                        </span>
                      </div>
                      <span
                        className="text-[9px] px-1 rounded font-bold uppercase tracking-wider shrink-0 flex items-center gap-0.5"
                        style={{ backgroundColor: `${elem.accent}33`, color: elem.accent }}
                        title={elem.name}
                      >
                        {elem.icon}
                      </span>
                    </div>

                    {/* Center Artwork */}
                    <div className="relative flex-1 my-0.5 sm:my-1 overflow-hidden rounded-md bg-black/50 border border-white/10 flex items-center justify-center">
                      {monster.card.image ? (
                        <img
                          src={monster.card.image}
                          alt={monster.card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">{elem.icon}</span>
                      )}

                      {/* Stage indicator */}
                      {monster.card.stage > 1 && (
                        <div className="absolute top-0.5 left-0.5 px-1 rounded bg-amber-400 text-black text-[8px] font-black">
                          E{monster.card.stage}
                        </div>
                      )}
                    </div>

                    {/* Bottom Status / Stats */}
                    {monster.summonTurnsLeft > 0 ? (
                      <div className="text-[9px] sm:text-[10px] text-amber-300 font-mono bg-black/80 rounded px-1 py-0.5 text-center font-bold border border-amber-500/40">
                        ⏳ {monster.summonTurnsLeft}t carga
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono font-black bg-black/60 rounded px-1 py-0.5 border border-white/10">
                        <span className="text-rose-400 drop-shadow">⚔️{monster.currentAttack}</span>
                        <span className="text-cyan-400 drop-shadow">🛡️{monster.currentDefense}</span>
                      </div>
                    )}

                    {/* Quick Detail Zoom Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedCard(monster.card);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-amber-400 text-amber-300 text-[10px] flex items-center justify-center shadow opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 z-20 cursor-pointer"
                      title="Segure para ampliar ou clique para detalhes"
                    >
                      🔍
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-cyan-600/70 text-center p-1">
                    <span className="text-[10px] font-mono">Invocar</span>
                  </div>
                )}

                {/* Floating Combat Text for this slot */}
                {floatingTexts
                  .filter((f) => f.targetKey === slotKey)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center animate-float-damage"
                    >
                      <span className={`text-base sm:text-xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${f.color}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}

                {/* Slash Particle on Hit */}
                {isHit && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                    <span className="text-3xl sm:text-5xl animate-slash select-none">⚔️</span>
                    <div className="absolute inset-0 bg-rose-500/35 rounded-xl animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Player Stats & Header */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2">
          <div className="flex items-center gap-3">
            {/* Player Portrait */}
            <div className={`relative w-12 h-12 rounded-xl bg-cyan-950/80 border-2 border-cyan-500/50 flex items-center justify-center text-2xl shadow-lg transition-all ${
              hitTargetKey === 'bottom-player' ? 'animate-shake ring-4 ring-rose-500 shadow-rose-500/60' : ''
            }`}>
              {bottomPlayer.avatar || '🧙'}
              {hitTargetKey === 'bottom-player' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-3xl animate-slash select-none">💥</span>
                </div>
              )}
              {floatingTexts
                .filter((f) => f.targetKey === 'bottom-player')
                .map((f) => (
                  <div key={f.id} className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-40 animate-float-damage whitespace-nowrap">
                    <span className={`text-sm sm:text-base font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${f.color}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">
                  {bottomPlayer.name}
                </span>
                {battle.currentTurn === bottomPlayerKey && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-600/40 text-cyan-300 border border-cyan-500/30">
                    SUA VEZ
                  </span>
                )}
              </div>
              {renderHealthBar(bottomPlayer.hp, bottomPlayer.maxHp)}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-slate-500">Cartas no Deck: </span>
              <span className="text-white font-bold">{bottomPlayer.deck.length}</span>
            </div>
          </div>
        </div>

        {/* Player Hand Tray */}
        <div className="mt-1 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-2 px-2 scrollbar-none">
          {bottomPlayer.hand.map((card, idx) => (
            <div
              key={`${card.id}_${idx}`}
              className="relative group transition-transform duration-200 hover:scale-105 hover:-translate-y-2 z-10 hover:z-30 cursor-pointer select-none"
              onMouseEnter={() => setHoveredCard(card)}
              onMouseLeave={() => setHoveredCard(null)}
              onTouchStart={() => startLongPress(card)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onTouchCancel={cancelLongPress}
              onClick={() => {
                if (isLongPressActiveRef.current) {
                  isLongPressActiveRef.current = false;
                  return;
                }
                handleHandCardClick(idx);
              }}
            >
              <CardComponent
                card={card}
                size="sm"
                isSelected={battle.selectedCardIndex === idx}
                isPlayable={battle.currentTurn === bottomPlayerKey}
              />

              {/* Quick Details Button for easy accessibility without long-press */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectedCard(card);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-amber-400 text-amber-300 text-[10px] font-bold flex items-center justify-center shadow opacity-80 hover:opacity-100 hover:scale-110 active:scale-90 transition z-20 cursor-pointer"
                title="Toque e segure para ampliar, ou clique aqui para ver detalhes"
              >
                🔍
              </button>
            </div>
          ))}
          {bottomPlayer.hand.length === 0 && (
            <div className="text-xs text-slate-500 py-4">Mão vazia. Espere o próximo turno para sacar!</div>
          )}
        </div>
      </div>

      {/* Desktop Non-blocking Hover Preview (pinned, never captures clicks) */}
      {hoveredCard && !inspectedCard && (
        <div className="fixed bottom-24 right-4 sm:right-10 z-30 pointer-events-none drop-shadow-2xl animate-in fade-in zoom-in-95 duration-150 hidden md:block">
          <div className="p-2 bg-slate-950/95 border-2 border-amber-400/80 rounded-2xl shadow-2xl shadow-amber-500/30 backdrop-blur-md flex flex-col items-center">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1">
              Prévia da Carta
            </span>
            <CardComponent card={hoveredCard} size="lg" />
          </div>
        </div>
      )}

      {/* Enlarged Card Inspector / Zoom Modal (Shown when holding pressed on mobile or clicking 🔍) */}
      {inspectedCard && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setInspectedCard(null)}
        >
          <div
            className="relative p-4 bg-slate-950/95 border-2 border-amber-400 rounded-3xl shadow-2xl shadow-amber-500/40 flex flex-col items-center max-w-sm w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Detalhes da Carta</span>
              </span>
              <button
                onClick={() => setInspectedCard(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <CardComponent card={inspectedCard} size="xl" />

            <div className="w-full mt-3 flex items-center gap-2">
              {bottomPlayer.hand.some((c) => c.id === inspectedCard.id) && battle.currentTurn === bottomPlayerKey && (
                <button
                  onClick={() => {
                    const idx = bottomPlayer.hand.findIndex((c) => c.id === inspectedCard.id);
                    if (idx !== -1) {
                      handleHandCardClick(idx);
                    }
                    setInspectedCard(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
                >
                  ⚡ Ativar / Jogar Carta
                </button>
              )}
              <button
                onClick={() => setInspectedCard(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GAME OVER MODAL */}
      {/* ========================================================================= */}
      {battle.winner && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4">
              {battle.winner === 'player1' ? '🏆' : '💀'}
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              {battle.winner === 'player1' ? 'VITÓRIA ÉPICA!' : 'DERROTA NO DUELO'}
            </h2>

            <p className="text-sm text-slate-300 mb-6">
              {battle.winner === 'player1'
                ? `Parabéns! Você derrotou ${battle.player2.name} e provou a força da sua estratégia e evolução!`
                : `${battle.player2.name} dominou a partida. Reorganize seu deck e tente novamente!`}
            </p>

            {battle.winner === 'player1' && (
              <div className="w-full bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 mb-6 flex items-center justify-center gap-3 text-amber-300 font-bold">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Recompensa: +50 Moedas de Ouro & EXP de Treinador!</span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base shadow-lg transition cursor-pointer"
            >
              Continuar Jornada
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
