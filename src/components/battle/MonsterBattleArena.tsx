/**
 * Monster Master: Evolution TCG RPG - Battle Arena Component
 * Faithful adaptation of the classic Monster Master arena with Pokémon Evolution mechanics
 */

import React, { useState, useEffect } from 'react';
import {
  BattleState,
  BoardMonster,
  CardDefinition,
} from '../../types/game';
import { CARDS_BY_ID } from '../../data/cards';
import { CardComponent } from './CardComponent';
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

  // Current active player object
  const activePlayerKey = battle.currentTurn;
  const isPlayer1Turn = battle.currentTurn === 'player1';
  const activePlayer = isPlayer1Turn ? battle.player1 : battle.player2;
  const defendingPlayer = isPlayer1Turn ? battle.player2 : battle.player1;

  // Handle clicking a card in player hand
  const handleHandCardClick = (cardIndex: number) => {
    if (battle.winner) return;
    sound.playButtonClick();

    const card = activePlayer.hand[cardIndex];
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
      } else if (card.spellEffect === 'restore') {
        // Direct player heal
        applyPlayerRestore(cardIndex, card.spellPower || 2);
      } else if (
        card.spellEffect === 'fireball' ||
        card.spellEffect === 'lightning' ||
        card.spellEffect === 'poison' ||
        card.spellEffect === 'curse'
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
    const card = activePlayer.hand[battle.selectedCardIndex];
    if (!card || card.type !== 'monster' || card.stage > 1) return;

    // Check if slot is occupied
    if (activePlayer.field[slotIndex]) {
      triggerNotification('Esse espaço já está ocupado por outro monstro!');
      return;
    }

    sound.playCardPlay();

    const newMonster: BoardMonster = {
      instanceId: `${card.id}_${Date.now()}_${Math.random()}`,
      card,
      currentAttack: card.attack,
      currentDefense: card.defense,
      maxDefense: card.maxDefense,
      summonTurnsLeft: card.summonTurns,
      isReady: card.summonTurns === 0,
      hasAttacked: false,
      statusEffects: {},
    };

    const newField = [...activePlayer.field];
    newField[slotIndex] = newMonster;

    const newHand = activePlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

    setBattle((prev) => {
      const pKey = prev.currentTurn;
      const otherKey = pKey === 'player1' ? 'player2' : 'player1';
      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          hand: newHand,
          field: newField,
        },
        selectedCardIndex: null,
        combatLog: [
          `${prev[pKey].name} invocou ${card.name} (${card.summonTurns}t de espera)!`,
          ...prev.combatLog,
        ],
      };
    });

    setTargetMode(null);
  };

  // Apply Pokémon Evolution to a friendly monster
  const handleEvolveMonster = (slotIndex: number, evoCard: CardDefinition) => {
    const targetMonster = activePlayer.field[slotIndex];
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

    const newField = [...activePlayer.field];
    newField[slotIndex] = evolvedMonster;

    // Remove played card from hand
    const newHand = activePlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

    // Apply special evolution ability
    let abilityLog = '';
    const defField = [...defendingPlayer.field];
    let defHp = defendingPlayer.hp;

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
      abilityLog = `⚡ Tempestade de Raios atingiu ${defendingPlayer.name} diretamente com 3 de dano!`;
    } else if (evolvedCardDef.id === 'mech_stage3') {
      // Titanmech: +2 defense to all friendly monsters
      newField.forEach((mon) => {
        if (mon) {
          mon.currentDefense += 2;
          mon.maxDefense += 2;
        }
      });
      abilityLog = `🛡️ Blindagem de Ferro reforçou todo o exército aliado com +2 de Defesa!`;
    }

    triggerNotification(`✨ EVOLUÇÃO POKÉMON! ${targetMonster.card.name} evoluiu para ${evolvedCardDef.name}!`);

    setBattle((prev) => {
      const pKey = prev.currentTurn;
      const otherKey = pKey === 'player1' ? 'player2' : 'player1';
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

    setTargetMode(null);
  };

  // Apply spells to friendly monster
  const handleApplySpellFriendly = (slotIndex: number) => {
    if (battle.selectedCardIndex === null || !targetMode?.spellCard) return;
    const card = targetMode.spellCard;
    const targetMonster = activePlayer.field[slotIndex];

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
      case 'summon':
        updatedMonster.summonTurnsLeft = 0;
        updatedMonster.isReady = true;
        logMsg = `⏳ Summon Fast despertou ${targetMonster.card.name} instantaneamente!`;
        break;
      case 'sacrifice':
        // Sacrifices monster to heal player
        {
          const newField = [...activePlayer.field];
          newField[slotIndex] = null;
          const newHp = Math.min(activePlayer.maxHp, activePlayer.hp + 6);
          const newHand = activePlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

          setBattle((prev) => {
            const pKey = prev.currentTurn;
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

    const newField = [...activePlayer.field];
    newField[slotIndex] = updatedMonster;
    const newHand = activePlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

    setBattle((prev) => {
      const pKey = prev.currentTurn;
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
    const targetMonster = defendingPlayer.field[slotIndex];

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
      default:
        break;
    }

    if (updatedMonster.currentDefense <= 0) {
      isDestroyed = true;
      logMsg += ` 💀 ${targetMonster.card.name} foi destruído!`;
    }

    const newEnemyField = [...defendingPlayer.field];
    newEnemyField[slotIndex] = isDestroyed ? null : updatedMonster;

    const newHand = activePlayer.hand.filter((_, idx) => idx !== battle.selectedCardIndex);

    setBattle((prev) => {
      const pKey = prev.currentTurn;
      const otherKey = pKey === 'player1' ? 'player2' : 'player1';
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

  // Black Hole wipe
  const applyBlackHole = (cardIndex: number) => {
    sound.playAttackHit();
    const newHand = activePlayer.hand.filter((_, idx) => idx !== cardIndex);

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
    const newHand = activePlayer.hand.filter((_, idx) => idx !== cardIndex);
    const newHp = Math.min(activePlayer.maxHp, activePlayer.hp + amount);

    setBattle((prev) => {
      const pKey = prev.currentTurn;
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
    const monster = activePlayer.field[slotIndex];
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
      const enemyHasMonsters = defendingPlayer.field.some((m) => m !== null);
      if (enemyHasMonsters) {
        triggerNotification(`Escolha qual monstro inimigo atacar com ${monster.card.name}!`);
      } else {
        triggerNotification(`Campo inimigo vazio! Você pode atacar o líder ${defendingPlayer.name} diretamente!`);
      }
    }
  };

  // Execute attack against an enemy monster
  const handleAttackEnemyMonster = (targetSlot: number) => {
    if (battle.selectedFieldSlot === null || targetMode?.type !== 'monster_attack') return;
    const attacker = activePlayer.field[battle.selectedFieldSlot];
    const defender = defendingPlayer.field[targetSlot];

    if (!attacker || !defender) return;

    sound.playAttackHit();

    // Damage calculation: Attacker deals ATK to Defender's DEF
    // Defender also counterattacks dealing its ATK to Attacker's DEF!
    const newDefenderDef = defender.currentDefense - attacker.currentAttack;
    const newAttackerDef = attacker.currentDefense - defender.currentAttack;

    let log = `⚔️ ${attacker.card.name} atacou ${defender.card.name} causando ${attacker.currentAttack} de dano!`;

    const updatedDefender = { ...defender, currentDefense: newDefenderDef };
    const updatedAttacker = { ...attacker, currentDefense: newAttackerDef, hasAttacked: true };

    const newDefendingField = [...defendingPlayer.field];
    const newActiveField = [...activePlayer.field];

    if (newDefenderDef <= 0) {
      newDefendingField[targetSlot] = null;
      log += ` 💀 ${defender.card.name} foi eliminado!`;
    } else {
      newDefendingField[targetSlot] = updatedDefender;
      log += ` (Contra-ataque: ${defender.card.name} causou ${defender.currentAttack} de dano)`;
    }

    if (newAttackerDef <= 0) {
      newActiveField[battle.selectedFieldSlot] = null;
      log += ` 💀 ${attacker.card.name} caiu no contra-ataque!`;
    } else {
      newActiveField[battle.selectedFieldSlot] = updatedAttacker;
    }

    setBattle((prev) => {
      const pKey = prev.currentTurn;
      const otherKey = pKey === 'player1' ? 'player2' : 'player1';
      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          field: newActiveField,
        },
        [otherKey]: {
          ...prev[otherKey],
          field: newDefendingField,
        },
        selectedFieldSlot: null,
        combatLog: [log, ...prev.combatLog],
      };
    });

    setTargetMode(null);
  };

  // Execute direct attack on enemy player (when field is open)
  const handleDirectAttackPlayer = () => {
    if (battle.selectedFieldSlot === null || targetMode?.type !== 'monster_attack') return;
    const attacker = activePlayer.field[battle.selectedFieldSlot];
    if (!attacker) return;

    // Check if enemy has monsters blocking
    const enemyHasMonsters = defendingPlayer.field.some((m) => m !== null);
    if (enemyHasMonsters) {
      triggerNotification('Você precisa destruir os monstros inimigos antes de atacar o duelista diretamente!');
      return;
    }

    sound.playAttackHit();

    const damage = attacker.currentAttack;
    const newEnemyHp = Math.max(0, defendingPlayer.hp - damage);

    const newActiveField = [...activePlayer.field];
    newActiveField[battle.selectedFieldSlot] = { ...attacker, hasAttacked: true };

    const log = `💥 ATAQUE DIRETO! ${attacker.card.name} atacou ${defendingPlayer.name} diretamente causando ${damage} de dano!`;

    setBattle((prev) => {
      const pKey = prev.currentTurn;
      const otherKey = pKey === 'player1' ? 'player2' : 'player1';
      return {
        ...prev,
        [pKey]: {
          ...prev[pKey],
          field: newActiveField,
        },
        [otherKey]: {
          ...prev[otherKey],
          hp: newEnemyHp,
        },
        selectedFieldSlot: null,
        combatLog: [log, ...prev.combatLog],
      };
    });

    setTargetMode(null);
  };

  // Classic Monster Master Turn Spinner End Turn Handler
  const handleEndTurn = () => {
    if (battle.winner) return;

    sound.playTurnEnd();
    setTargetMode(null);

    const nextTurn = battle.currentTurn === 'player1' ? 'player2' : 'player1';
    const nextPlayerObj = nextTurn === 'player1' ? battle.player1 : battle.player2;

    // 1. Process upkeep ONLY for the player whose turn is starting:
    // Decrement summon turns on monsters
    const updatedField = nextPlayerObj.field.map((mon) => {
      if (!mon) return null;
      let newSummonTurns = mon.summonTurnsLeft;
      let ready = mon.isReady;

      if (newSummonTurns > 0) {
        newSummonTurns -= 1;
        if (newSummonTurns === 0) {
          ready = true;
        }
      }

      // Process poison damage ONLY if the monster is actually poisoned
      let def = mon.currentDefense;
      if (mon.statusEffects?.poisoned && mon.statusEffects.poisoned > 0) {
        def -= mon.statusEffects.poisoned;
        if (def <= 0) return null; // Only dies if poisoned to 0!
      }

      return {
        ...mon,
        summonTurnsLeft: newSummonTurns,
        isReady: ready,
        hasAttacked: false, // Reset attack state for new turn
        currentDefense: def,
        statusEffects: {
          ...mon.statusEffects,
          frozen: false, // Thaws
        },
      };
    });

    // 2. Draw 1 card from deck if available
    let nextHand = [...nextPlayerObj.hand];
    let nextDeck = [...nextPlayerObj.deck];

    if (nextDeck.length > 0 && nextHand.length < 6) {
      sound.playCardDraw();
      const drawnCard = nextDeck[0];
      nextDeck = nextDeck.slice(1);
      nextHand.push(drawnCard);
    }

    const isPassAndPlay = battle.mode === 'pass_and_play';

    setBattle((prev) => {
      const nextTurnState: BattleState = {
        ...prev,
        turnNumber: nextTurn === 'player1' ? prev.turnNumber + 1 : prev.turnNumber,
        currentTurn: nextTurn,
        [nextTurn]: {
          ...prev[nextTurn],
          hand: nextHand,
          deck: nextDeck,
          field: updatedField,
        },
        selectedCardIndex: null,
        selectedFieldSlot: null,
        waitingForPassHandover: isPassAndPlay, // Triggers privacy screen if local pass and play!
        combatLog: [
          `🔄 Turno ${prev.turnNumber}: Vez de ${prev[nextTurn].name}!`,
          ...prev.combatLog,
        ],
      };
      return nextTurnState;
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
              currentDefense: card.defense,
              maxDefense: card.maxDefense,
              summonTurnsLeft: card.summonTurns,
              isReady: card.summonTurns === 0,
              hasAttacked: false,
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
          const newAtkDef = mon.currentDefense - humanMon.currentAttack;

          mon.hasAttacked = true;
          logs.push(`⚔️ ${mon.card.name} do oponente atacou seu ${humanMon.card.name}!`);

          if (newDefDef <= 0) {
            newHumanField[humanTargetIdx] = null;
            logs.push(`💀 Seu ${humanMon.card.name} foi destruído!`);
          } else {
            newHumanField[humanTargetIdx] = { ...humanMon, currentDefense: newDefDef };
          }

          if (newAtkDef <= 0) {
            newAiField[aSlot] = null;
            logs.push(`💀 ${mon.card.name} do oponente caiu no contra-ataque!`);
          } else {
            mon.currentDefense = newAtkDef;
          }
        } else {
          // Direct attack on human player!
          newHumanHp = Math.max(0, newHumanHp - mon.currentAttack);
          mon.hasAttacked = true;
          logs.push(`💥 ATAQUE DIRETO: ${mon.card.name} atingiu você causando ${mon.currentAttack} de dano!`);
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
      {/* TOP ZONE: OPPONENT / PLAYER 2 */}
      {/* ========================================================================= */}
      <div className="relative z-10 p-3 sm:p-4 bg-slate-950/60 border-b border-rose-950/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Opponent Portrait */}
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border-2 border-rose-500/50 flex items-center justify-center text-2xl shadow-lg">
              {battle.player2.avatar || '🤖'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">
                  {battle.player2.name}
                </span>
                {battle.currentTurn === 'player2' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/40 text-rose-300 border border-rose-500/30 animate-pulse">
                    VEZ DELE
                  </span>
                )}
              </div>
              {renderHealthBar(battle.player2.hp, battle.player2.maxHp)}
            </div>
          </div>

          {/* Opponent Deck & Hand Count */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1 font-mono">
              <span className="text-slate-500">Mão:</span>
              <span className="text-white font-bold">{battle.player2.hand.length} cartas</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-slate-500">Deck:</span>
              <span className="text-white font-bold">{battle.player2.deck.length}</span>
            </div>
          </div>
        </div>

        {/* Opponent Field Slots (5 slots) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-2">
          {battle.player2.field.map((monster, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (targetMode?.type === 'monster_attack') {
                  handleAttackEnemyMonster(idx);
                } else if (targetMode?.type === 'spell_enemy') {
                  handleApplySpellEnemy(idx);
                }
              }}
              className={`w-20 h-28 sm:w-28 sm:h-38 rounded-lg border-2 flex items-center justify-center transition-all ${
                monster
                  ? 'border-rose-500/70 bg-slate-900 shadow-md'
                  : 'border-dashed border-rose-900/40 bg-black/30'
              } ${
                targetMode && monster
                  ? 'cursor-pointer hover:border-amber-400 hover:scale-105 ring-2 ring-amber-400/50'
                  : ''
              }`}
            >
              {monster ? (
                <div className="w-full h-full p-1 relative flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-white truncate">{monster.card.name}</div>
                  <div className="flex-1 flex items-center justify-center my-0.5 overflow-hidden rounded bg-black/40">
                    {monster.card.image ? (
                      <img src={monster.card.image} alt={monster.card.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">👾</span>
                    )}
                  </div>
                  {monster.summonTurnsLeft > 0 ? (
                    <div className="text-[9px] text-amber-400 font-mono bg-black/80 rounded px-1 py-0.5 text-center font-bold">
                      {monster.summonTurnsLeft}t carga
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] font-mono px-0.5 font-bold">
                      <span className="text-rose-400">⚔️{monster.currentAttack}</span>
                      <span className="text-cyan-400">🛡️{monster.currentDefense}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-rose-800/60 font-mono">Vazio</span>
              )}
            </div>
          ))}
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
              <span>{battle.currentTurn === 'player1' ? `Sua Vez (${battle.player1.name})` : `Vez de ${battle.player2.name}`}</span>
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
          {targetMode?.type === 'monster_attack' && !defendingPlayer.field.some((m) => m !== null) && (
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
            disabled={battle.currentTurn !== 'player1' && battle.mode !== 'pass_and_play'}
            className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 border-2 border-amber-300 shadow-xl shadow-amber-500/40 flex items-center justify-center transition-transform active:scale-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Encerrar Turno (Girar)"
          >
            <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 font-bold transition-transform duration-500 group-hover:rotate-180" />
            <span className="absolute -bottom-5 text-[9px] font-bold text-amber-300 uppercase tracking-tighter whitespace-nowrap">
              Passar
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ZONE: PLAYER 1 / LOCAL PLAYER */}
      {/* ========================================================================= */}
      <div className="relative z-10 p-3 sm:p-4 bg-slate-950/70 border-t border-cyan-950/50 flex flex-col gap-2">
        {/* Player Field Slots (5 slots) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-1">
          {battle.player1.field.map((monster, idx) => {
            const isSelected = battle.selectedFieldSlot === idx;
            const canAttack = monster && monster.summonTurnsLeft === 0 && !monster.hasAttacked && battle.currentTurn === 'player1';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (targetMode?.type === 'spell_friendly') {
                    handleApplySpellFriendly(idx);
                  } else if (battle.selectedCardIndex !== null && !monster) {
                    handleSummonMonster(idx);
                  } else if (monster) {
                    handleSelectAttackingMonster(idx);
                  }
                }}
                className={`w-20 h-28 sm:w-28 sm:h-38 rounded-lg border-2 flex items-center justify-center transition-all ${
                  monster
                    ? 'border-cyan-500/80 bg-slate-900 shadow-lg shadow-cyan-950/30'
                    : 'border-dashed border-cyan-900/50 bg-black/40 hover:border-cyan-400 cursor-pointer'
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
                {monster ? (
                  <div className="w-full h-full p-1 relative flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-white truncate flex items-center justify-between">
                      <span className="truncate">{monster.card.name}</span>
                      {monster.card.stage > 1 && (
                        <span className="text-[8px] bg-amber-500/80 text-black px-1 rounded font-bold">
                          E{monster.card.stage}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex items-center justify-center my-0.5 overflow-hidden rounded bg-black/40">
                      {monster.card.image ? (
                        <img src={monster.card.image} alt={monster.card.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🐉</span>
                      )}
                    </div>

                    {monster.summonTurnsLeft > 0 ? (
                      <div className="text-[9px] text-amber-400 font-mono bg-black/80 rounded px-1 py-0.5 text-center font-bold">
                        {monster.summonTurnsLeft}t carga
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] font-mono px-0.5 font-bold">
                        <span className="text-rose-400">⚔️{monster.currentAttack}</span>
                        <span className="text-cyan-400">🛡️{monster.currentDefense}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-cyan-700 text-center p-1">
                    <span className="text-[10px] font-mono">Invocar</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Player Stats & Header */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2">
          <div className="flex items-center gap-3">
            {/* Player 1 Portrait */}
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border-2 border-cyan-500/50 flex items-center justify-center text-2xl shadow-lg">
              {battle.player1.avatar || '🧙'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">
                  {battle.player1.name}
                </span>
                {battle.currentTurn === 'player1' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-600/40 text-cyan-300 border border-cyan-500/30">
                    SUA VEZ
                  </span>
                )}
              </div>
              {renderHealthBar(battle.player1.hp, battle.player1.maxHp)}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-slate-500">Cartas no Deck: </span>
              <span className="text-white font-bold">{battle.player1.deck.length}</span>
            </div>
          </div>
        </div>

        {/* Player 1 Hand Tray */}
        <div className="mt-1 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-1 px-2 scrollbar-none">
          {battle.player1.hand.map((card, idx) => (
            <CardComponent
              key={`${card.id}_${idx}`}
              card={card}
              size="sm"
              isSelected={battle.selectedCardIndex === idx}
              isPlayable={battle.currentTurn === 'player1'}
              onClick={() => handleHandCardClick(idx)}
            />
          ))}
          {battle.player1.hand.length === 0 && (
            <div className="text-xs text-slate-500 py-4">Mão vazia. Espere o próximo turno para sacar!</div>
          )}
        </div>
      </div>

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
