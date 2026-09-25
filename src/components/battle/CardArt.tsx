import React, { useState } from 'react';
import { CardDefinition, ElementType } from '../../types/game';

interface CardArtProps {
  card: CardDefinition;
  isLarge?: boolean;
  isField?: boolean;
}

export const CardArt: React.FC<CardArtProps> = ({ card, isLarge = false, isField = false }) => {
  const [imgError, setImgError] = useState(false);

  // If card has an image and it didn't fail, render it
  if (card.image && !imgError) {
    return (
      <img
        src={card.image}
        alt={card.name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover select-none"
      />
    );
  }

  // Otherwise, render bespoke rich SVG vector art for this specific card
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center select-none bg-slate-950">
      <CustomCardSvg card={card} isLarge={isLarge} isField={isField} />
    </div>
  );
};

interface SvgProps {
  card: CardDefinition;
  isLarge?: boolean;
  isField?: boolean;
}

const CustomCardSvg: React.FC<SvgProps> = ({ card }) => {
  const id = card.id;

  // Specific artworks for monsters
  switch (id) {
    // FIRE CHAIN
    case 'fire_stage1': // Emberpup
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ep-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#7f1d1d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#18181b" />
            </radialGradient>
            <linearGradient id="ep-fur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <filter id="glow-ep">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="200" height="150" fill="url(#ep-bg)" />
          {/* Flame particles */}
          <circle cx="30" cy="40" r="4" fill="#fde047" opacity="0.6" />
          <circle cx="170" cy="50" r="3" fill="#f97316" opacity="0.5" />
          <circle cx="45" cy="110" r="2.5" fill="#fde047" opacity="0.7" />
          <circle cx="160" cy="120" r="3.5" fill="#f59e0b" opacity="0.6" />
          {/* Emberpup body */}
          <ellipse cx="100" cy="100" rx="36" ry="28" fill="url(#ep-fur)" />
          {/* Ears (pointed flames) */}
          <path d="M75 65 L60 25 Q75 40 85 55 Z" fill="#f97316" filter="url(#glow-ep)" />
          <path d="M68 55 L62 33 Q72 45 78 52 Z" fill="#fef08a" />
          <path d="M125 65 L140 25 Q125 40 115 55 Z" fill="#f97316" filter="url(#glow-ep)" />
          <path d="M132 55 L138 33 Q128 45 122 52 Z" fill="#fef08a" />
          {/* Head */}
          <ellipse cx="100" cy="65" rx="26" ry="22" fill="url(#ep-fur)" />
          {/* Flame forehead tuft */}
          <path d="M95 48 Q100 32 103 40 Q107 30 110 46 Z" fill="#fde047" />
          {/* Eyes */}
          <ellipse cx="88" cy="62" rx="4.5" ry="6" fill="#18181b" />
          <ellipse cx="112" cy="62" rx="4.5" ry="6" fill="#18181b" />
          <circle cx="89" cy="60" r="2" fill="#ffffff" />
          <circle cx="113" cy="60" r="2" fill="#ffffff" />
          <circle cx="87" cy="64" r="0.8" fill="#fde047" />
          <circle cx="111" cy="64" r="0.8" fill="#fde047" />
          {/* Cute muzzle & nose */}
          <ellipse cx="100" cy="74" rx="8" ry="6" fill="#ffedd5" />
          <polygon points="98,71 102,71 100,74" fill="#7f1d1d" />
          <path d="M97 76 Q100 78 103 76" stroke="#991b1b" strokeWidth="1.5" fill="none" />
          {/* Flaming Tail */}
          <path d="M135 105 Q165 100 170 80 Q160 90 145 98 Z" fill="#f59e0b" filter="url(#glow-ep)" />
          <path d="M145 100 Q175 88 178 72 Q168 82 150 93 Z" fill="#ef4444" />
          {/* Paws */}
          <ellipse cx="80" cy="122" rx="9" ry="6" fill="#f97316" />
          <ellipse cx="120" cy="122" rx="9" ry="6" fill="#f97316" />
        </svg>
      );

    case 'fire_stage2': // Pyrowolf
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="pw-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="60%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
            <linearGradient id="pw-flame" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="60%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill="url(#pw-bg)" />
          {/* Fiery back mane spikes */}
          <path d="M50 110 L60 60 L80 90 L100 50 L120 85 L145 55 L140 110 Z" fill="#b91c1c" />
          <path d="M65 100 L75 65 L95 90 L110 58 L130 90 L135 100 Z" fill="url(#pw-flame)" opacity="0.85" />
          {/* Wolf Face (menacing) */}
          <polygon points="100,45 125,75 140,82 120,95 80,95 60,82 75,75" fill="#7f1d1d" />
          {/* Ears */}
          <polygon points="70,70 60,35 85,55" fill="#991b1b" />
          <polygon points="130,70 140,35 115,55" fill="#991b1b" />
          {/* Snout */}
          <polygon points="90,80 110,80 105,108 95,108" fill="#450a0a" />
          <polygon points="97,105 103,105 100,108" fill="#f97316" />
          {/* Glowing fiery wolf eyes */}
          <polygon points="80,72 90,75 83,78" fill="#fde047" />
          <polygon points="120,72 110,75 117,78" fill="#fde047" />
          {/* Fangs */}
          <polygon points="93,108 96,114 97,108" fill="#ffffff" />
          <polygon points="107,108 104,114 103,108" fill="#ffffff" />
          {/* Embers */}
          <circle cx="40" cy="50" r="3" fill="#fde047" opacity="0.8" />
          <circle cx="160" cy="40" r="2.5" fill="#f97316" opacity="0.7" />
          <circle cx="170" cy="90" r="2" fill="#ef4444" opacity="0.9" />
        </svg>
      );

    // WATER CHAIN
    case 'water_stage1': // Aquafrog
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="af-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#082f49" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="af-skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill="url(#af-bg)" />
          {/* Water rings & bubbles */}
          <ellipse cx="100" cy="125" rx="70" ry="14" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.4" />
          <circle cx="45" cy="45" r="7" fill="#7dd3fc" opacity="0.3" stroke="#e0f2fe" strokeWidth="1" />
          <circle cx="160" cy="55" r="10" fill="#7dd3fc" opacity="0.25" stroke="#e0f2fe" strokeWidth="1" />
          <circle cx="150" cy="110" r="5" fill="#7dd3fc" opacity="0.4" />
          {/* Frog Body */}
          <ellipse cx="100" cy="95" rx="42" ry="32" fill="url(#af-skin)" />
          <ellipse cx="100" cy="100" rx="26" ry="20" fill="#bae6fd" opacity="0.8" />
          {/* Bulbous Eyes on top */}
          <circle cx="75" cy="65" r="16" fill="#0284c7" />
          <circle cx="75" cy="65" r="12" fill="#ffffff" />
          <circle cx="77" cy="64" r="6" fill="#0369a1" />
          <circle cx="79" cy="62" r="2.5" fill="#ffffff" />

          <circle cx="125" cy="65" r="16" fill="#0284c7" />
          <circle cx="125" cy="65" r="12" fill="#ffffff" />
          <circle cx="123" cy="64" r="6" fill="#0369a1" />
          <circle cx="121" cy="62" r="2.5" fill="#ffffff" />
          {/* Mouth smile & nostrils */}
          <circle cx="95" cy="78" r="1.5" fill="#075985" />
          <circle cx="105" cy="78" r="1.5" fill="#075985" />
          <path d="M82 88 Q100 102 118 88" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Webbed Feet */}
          <ellipse cx="65" cy="120" rx="14" ry="6" fill="#0284c7" />
          <ellipse cx="135" cy="120" rx="14" ry="6" fill="#0284c7" />
        </svg>
      );

    case 'water_stage2': // Tidetoa
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="tt-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="60%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#tt-bg)" />
          {/* Rushing wave surges */}
          <path d="M0 120 Q50 90 100 115 T200 110 L200 150 L0 150 Z" fill="#0284c7" opacity="0.6" />
          <path d="M0 135 Q60 110 120 130 T200 125 L200 150 L0 150 Z" fill="#38bdf8" opacity="0.4" />
          {/* Armor shoulder pads */}
          <polygon points="50,75 35,95 70,105 75,85" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
          <polygon points="150,75 165,95 130,105 125,85" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
          {/* Warrior Toad Head & Crest */}
          <polygon points="100,40 120,48 115,62 100,56 85,62 80,48" fill="#38bdf8" />
          <ellipse cx="100" cy="85" rx="40" ry="34" fill="#0284c7" />
          {/* Glowing mystic eyes */}
          <polygon points="80,70 92,72 84,78" fill="#a7f3d0" />
          <polygon points="120,70 108,72 116,78" fill="#a7f3d0" />
          {/* Trident emblem on chest */}
          <path d="M100 82 L100 106 M94 86 L94 96 L100 100 L106 96 L106 86" stroke="#fde047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'water_beast': // Kraken Abissal
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="kb-bg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#kb-bg)" />
          {/* Glowing abyss whirlpool */}
          <ellipse cx="100" cy="120" rx="80" ry="25" fill="#06b6d4" opacity="0.2" />
          {/* Tentacles surging up */}
          <path d="M40 140 Q25 90 45 60 Q55 45 50 30 Q35 45 35 80 Q35 110 50 140 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
          <path d="M160 140 Q175 90 155 60 Q145 45 150 30 Q165 45 165 80 Q165 110 150 140 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
          <path d="M70 140 Q60 80 80 50 Q90 35 85 20 Q70 40 70 85 Q70 110 80 140 Z" fill="#0369a1" />
          <path d="M130 140 Q140 80 120 50 Q110 35 115 20 Q130 40 130 85 Q130 110 120 140 Z" fill="#0369a1" />
          {/* Giant Kraken Eye in deep water */}
          <circle cx="100" cy="95" r="24" fill="#0c4a6e" stroke="#06b6d4" strokeWidth="2" />
          <ellipse cx="100" cy="95" rx="14" ry="20" fill="#facc15" />
          <ellipse cx="100" cy="95" rx="4" ry="18" fill="#020617" />
          <circle cx="96" cy="88" r="3" fill="#ffffff" />
        </svg>
      );

    // METAL / STEAMPUNK CHAIN
    case 'mech_stage1': // Rat Engrenagem
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="mr-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#mr-bg)" />
          {/* Steampunk cogs background */}
          <circle cx="155" cy="45" r="22" fill="none" stroke="#d97706" strokeWidth="4" strokeDasharray="6,4" opacity="0.4" />
          <circle cx="45" cy="115" r="18" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="5,3" opacity="0.3" />
          {/* Wire Tail */}
          <path d="M145 105 Q175 100 170 70 Q165 50 180 40" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Metallic Rat Body */}
          <ellipse cx="105" cy="95" rx="38" ry="24" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M85 95 L125 95 M105 75 L105 115" stroke="#334155" strokeWidth="1.5" />
          {/* Head & Snout */}
          <polygon points="85,80 50,95 85,110" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Whiskers (copper wires) */}
          <line x1="50" y1="92" x2="25" y2="85" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="50" y1="95" x2="22" y2="95" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="50" y1="98" x2="25" y2="105" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Glowing Cyan Optical Eye */}
          <circle cx="72" cy="88" r="4.5" fill="#06b6d4" />
          <circle cx="72" cy="88" r="2" fill="#ffffff" />
          {/* Brass Cog Ear */}
          <circle cx="92" cy="74" r="10" fill="#b45309" stroke="#fde047" strokeWidth="2" strokeDasharray="4,2" />
        </svg>
      );

    case 'mech_stage2': // Dwarf Guerreiro
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="dw-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="70%" stopColor="#292524" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#dw-bg)" />
          {/* Dual Runic Battleaxe Silhouette */}
          <line x1="50" y1="130" x2="85" y2="40" stroke="#78716c" strokeWidth="4" />
          <path d="M72 40 Q50 35 48 60 Q70 65 78 50 Z" fill="#94a3b8" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M85 45 Q105 40 102 65 Q85 68 80 55 Z" fill="#94a3b8" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Dwarf Iron Helmet with Horns */}
          <path d="M100 45 Q125 45 125 65 L75 65 Q75 45 100 45 Z" fill="#64748b" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M75 55 Q60 50 62 35" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M125 55 Q140 50 138 35" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Helmet Eye Slot Glowing Amber */}
          <rect x="85" y="60" width="30" height="5" rx="2" fill="#fbbf24" />
          {/* Braided Copper Beard */}
          <path d="M80 68 Q100 130 100 130 Q100 130 120 68 Z" fill="#ea580c" />
          <line x1="100" y1="70" x2="100" y2="125" stroke="#c2410c" strokeWidth="2" />
          <line x1="90" y1="72" x2="93" y2="115" stroke="#c2410c" strokeWidth="1.5" />
          <line x1="110" y1="72" x2="107" y2="115" stroke="#c2410c" strokeWidth="1.5" />
        </svg>
      );

    case 'mech_behemoth': // Colosso Couraçado
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="mb-bg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#mb-bg)" />
          {/* Steam Smokestacks */}
          <rect x="65" y="25" width="12" height="30" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          <rect x="123" y="25" width="12" height="30" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="71" cy="20" r="8" fill="#e2e8f0" opacity="0.3" />
          <circle cx="129" cy="20" r="9" fill="#e2e8f0" opacity="0.3" />
          {/* Heavy Bastion Hull */}
          <polygon points="40,95 65,55 135,55 160,95 145,135 55,135" fill="#475569" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Furnace Grill glowing orange */}
          <rect x="85" y="85" width="30" height="22" rx="4" fill="#0f172a" stroke="#d97706" strokeWidth="2" />
          <line x1="90" y1="96" x2="110" y2="96" stroke="#f97316" strokeWidth="3" />
          <line x1="92" y1="90" x2="92" y2="102" stroke="#ea580c" strokeWidth="2" />
          <line x1="100" y1="90" x2="100" y2="102" stroke="#ea580c" strokeWidth="2" />
          <line x1="108" y1="90" x2="108" y2="102" stroke="#ea580c" strokeWidth="2" />
        </svg>
      );

    // ELECTRIC CHAIN
    case 'elec_stage1': // Sparkrat
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sr-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="65%" stopColor="#713f12" />
              <stop offset="100%" stopColor="#18181b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sr-bg)" />
          {/* Lightning arcs in bg */}
          <path d="M30 40 L45 60 L35 70 L55 95" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M165 30 L150 55 L160 65 L145 90" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.7" />
          {/* Lightning tail */}
          <path d="M135 105 L155 85 L145 75 L175 45 L170 65 L185 55" stroke="#facc15" strokeWidth="6" fill="none" strokeLinejoin="miter" />
          {/* Cute Rodent Body */}
          <ellipse cx="98" cy="98" rx="35" ry="28" fill="#facc15" />
          {/* Head */}
          <circle cx="98" cy="65" r="24" fill="#facc15" />
          {/* Ears with black tips */}
          <polygon points="76,55 60,20 86,40" fill="#facc15" />
          <polygon points="68,35 60,20 75,30" fill="#18181b" />
          <polygon points="120,55 136,20 110,40" fill="#facc15" />
          <polygon points="128,35 136,20 121,30" fill="#18181b" />
          {/* Cheek pouches red with sparks */}
          <circle cx="78" cy="72" r="7" fill="#ef4444" />
          <circle cx="118" cy="72" r="7" fill="#ef4444" />
          {/* Cute face */}
          <circle cx="88" cy="62" r="3.5" fill="#18181b" />
          <circle cx="108" cy="62" r="3.5" fill="#18181b" />
          <circle cx="89" cy="60" r="1.2" fill="#ffffff" />
          <circle cx="109" cy="60" r="1.2" fill="#ffffff" />
          <polygon points="96,69 100,69 98,71" fill="#18181b" />
          <path d="M95 73 Q98 76 101 73" stroke="#18181b" strokeWidth="1" fill="none" />
        </svg>
      );

    case 'elec_stage2': // Voltmane
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="vm-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="60%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#vm-bg)" />
          {/* Jagged electric mane */}
          <path d="M50 110 L65 50 L85 85 L105 35 L125 80 L145 45 L150 110 Z" fill="#ca8a04" />
          <path d="M60 100 L75 58 L95 85 L115 45 L135 80 L140 100 Z" fill="#fef08a" />
          {/* Lynx Face */}
          <polygon points="100,50 125,80 135,90 115,105 85,105 65,90 75,80" fill="#eab308" />
          {/* Ears with electric tufts */}
          <polygon points="75,65 65,30 90,52" fill="#a16207" />
          <path d="M65 30 L55 15 L70 25" stroke="#fef08a" strokeWidth="2" fill="none" />
          <polygon points="125,65 135,30 110,52" fill="#a16207" />
          <path d="M135 30 L145 15 L130 25" stroke="#fef08a" strokeWidth="2" fill="none" />
          {/* Glowing blue plasma eyes */}
          <polygon points="82,75 94,77 86,83" fill="#38bdf8" />
          <polygon points="118,75 106,77 114,83" fill="#38bdf8" />
          {/* Saber fangs */}
          <polygon points="90,98 94,114 96,98" fill="#ffffff" />
          <polygon points="110,98 106,114 104,98" fill="#ffffff" />
        </svg>
      );

    case 'elec_storm_dragon': // Dragão da Tempestade
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sd-bg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sd-bg)" />
          {/* Lightning Storm Clouds */}
          <ellipse cx="60" cy="35" rx="40" ry="20" fill="#334155" opacity="0.6" />
          <ellipse cx="140" cy="35" rx="45" ry="22" fill="#334155" opacity="0.6" />
          {/* Fork lightning */}
          <path d="M60 45 L50 75 L65 85 L45 125" stroke="#facc15" strokeWidth="3" fill="none" />
          <path d="M140 45 L150 75 L135 85 L155 125" stroke="#facc15" strokeWidth="3" fill="none" />
          {/* Dragon Head with Horns */}
          <polygon points="100,50 120,80 140,85 100,120 60,85 80,80" fill="#eab308" stroke="#facc15" strokeWidth="2" />
          {/* Dragon Horns */}
          <path d="M80 65 Q60 40 50 20" stroke="#fef08a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M120 65 Q140 40 150 20" stroke="#fef08a" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Dragon Eyes */}
          <ellipse cx="85" cy="80" rx="6" ry="3" fill="#ffffff" />
          <ellipse cx="115" cy="80" rx="6" ry="3" fill="#ffffff" />
        </svg>
      );

    // NATURE CHAIN
    case 'nature_stage1': // Sproutling / Broto Verde
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ns-bg" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="70%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#052e16" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ns-bg)" />
          {/* Floating flower spores */}
          <circle cx="35" cy="45" r="3" fill="#86efac" opacity="0.7" />
          <circle cx="165" cy="40" r="4" fill="#fde047" opacity="0.6" />
          <circle cx="150" cy="115" r="2.5" fill="#86efac" opacity="0.8" />
          {/* Sprout Leaf on head */}
          <path d="M100 55 Q90 20 70 30 Q85 45 98 55 Z" fill="#4ade80" />
          <path d="M100 55 Q110 20 130 30 Q115 45 102 55 Z" fill="#22c55e" />
          {/* Round Seed Body */}
          <circle cx="100" cy="85" r="32" fill="#16a34a" />
          <circle cx="100" cy="90" r="22" fill="#86efac" opacity="0.5" />
          {/* Rosy Cheeks */}
          <circle cx="82" cy="88" r="5" fill="#f43f5e" opacity="0.6" />
          <circle cx="118" cy="88" r="5" fill="#f43f5e" opacity="0.6" />
          {/* Eyes */}
          <ellipse cx="88" cy="80" rx="3.5" ry="5" fill="#052e16" />
          <ellipse cx="112" cy="80" rx="3.5" ry="5" fill="#052e16" />
          <circle cx="89" cy="78" r="1.5" fill="#ffffff" />
          <circle cx="113" cy="78" r="1.5" fill="#ffffff" />
          {/* Smile */}
          <path d="M95 90 Q100 95 105 90" stroke="#052e16" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Vine roots */}
          <path d="M85 115 Q80 130 70 135" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M115 115 Q120 130 130 135" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'nature_stage2': // Silvanor / Cervo da Floresta
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sn-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="70%" stopColor="#052e16" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sn-bg)" />
          {/* Blooming Branch Antlers */}
          <path d="M85 55 Q70 30 50 25 M65 35 Q50 45 45 55" stroke="#854d0e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="25" r="4" fill="#4ade80" />
          <circle cx="45" cy="55" r="3.5" fill="#ec4899" />
          <path d="M115 55 Q130 30 150 25 M135 35 Q150 45 155 55" stroke="#854d0e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="150" cy="25" r="4" fill="#4ade80" />
          <circle cx="155" cy="55" r="3.5" fill="#ec4899" />
          {/* Deer Head */}
          <polygon points="100,50 115,75 110,110 100,120 90,110 85,75" fill="#15803d" />
          {/* Forest Rune on Forehead */}
          <circle cx="100" cy="68" r="4" fill="#86efac" />
          {/* Gentle Glowing Eyes */}
          <ellipse cx="92" cy="80" rx="3.5" ry="5" fill="#022c22" />
          <ellipse cx="108" cy="80" rx="3.5" ry="5" fill="#022c22" />
          <circle cx="93" cy="78" r="1.5" fill="#86efac" />
          <circle cx="109" cy="78" r="1.5" fill="#86efac" />
        </svg>
      );

    // DARK CHAIN
    case 'dark_stage1': // Sombra Imp
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="si-bg" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="65%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#si-bg)" />
          {/* Shadow tendrils in bg */}
          <path d="M30 120 Q50 80 40 40 Q25 70 30 120 Z" fill="#6b21a8" opacity="0.4" />
          <path d="M170 120 Q150 80 160 40 Q175 70 170 120 Z" fill="#6b21a8" opacity="0.4" />
          {/* Horns */}
          <polygon points="75,65 60,30 85,55" fill="#3b0764" stroke="#a855f7" strokeWidth="1" />
          <polygon points="125,65 140,30 115,55" fill="#3b0764" stroke="#a855f7" strokeWidth="1" />
          {/* Imp Body */}
          <ellipse cx="100" cy="95" rx="34" ry="30" fill="#18181b" stroke="#7e22ce" strokeWidth="2" />
          {/* Glowing Violet Eyes */}
          <ellipse cx="86" cy="85" rx="7" ry="5" fill="#c084fc" />
          <ellipse cx="114" cy="85" rx="7" ry="5" fill="#c084fc" />
          <ellipse cx="86" cy="85" rx="2" ry="4" fill="#3b0764" />
          <ellipse cx="114" cy="85" rx="2" ry="4" fill="#3b0764" />
          {/* Mischievous Grin */}
          <path d="M88 105 Q100 116 112 105" stroke="#c084fc" strokeWidth="2" fill="none" strokeLinecap="round" />
          <polygon points="94,105 97,109 100,105" fill="#ffffff" />
          <polygon points="100,105 103,109 106,105" fill="#ffffff" />
        </svg>
      );

    case 'dark_stage2': // Espectro Sombrio
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="es-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="70%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#es-bg)" />
          {/* Scythe in background */}
          <line x1="140" y1="130" x2="165" y2="30" stroke="#71717a" strokeWidth="3" />
          <path d="M165 30 Q125 25 110 45 Q135 48 160 38 Z" fill="#c084fc" stroke="#e9d5ff" strokeWidth="1" />
          {/* Hooded Cloak */}
          <path d="M100 40 Q130 50 135 125 Q100 135 65 125 Q70 50 100 40 Z" fill="#18181b" stroke="#6b21a8" strokeWidth="2" />
          {/* Shadow face void */}
          <ellipse cx="100" cy="75" rx="18" ry="14" fill="#09090b" />
          {/* Eerie Glowing Eyes in void */}
          <ellipse cx="92" cy="75" rx="4" ry="2.5" fill="#e879f9" />
          <ellipse cx="108" cy="75" rx="4" ry="2.5" fill="#e879f9" />
        </svg>
      );

    // NEUTRAL / BOSS MONSTERS
    case 'monster_golem': // Golem de Rocha
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="mg-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#57534e" />
              <stop offset="70%" stopColor="#292524" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#mg-bg)" />
          {/* Stone Blocks */}
          <polygon points="50,90 75,55 125,55 150,90 135,130 65,130" fill="#78716c" stroke="#a8a29e" strokeWidth="2" />
          <polygon points="80,35 120,35 115,55 85,55" fill="#57534e" stroke="#a8a29e" strokeWidth="1.5" />
          {/* Cracked glowing runes */}
          <path d="M85 75 L95 85 L90 95 L110 105" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
          {/* Glowing Crystal Eyes */}
          <rect x="88" y="42" width="6" height="4" fill="#38bdf8" />
          <rect x="106" y="42" width="6" height="4" fill="#38bdf8" />
        </svg>
      );

    case 'monster_griffin': // Grifo Dourado
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="gr-bg" cx="50%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="70%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#gr-bg)" />
          {/* Feathered Wings */}
          <path d="M50 110 Q20 50 40 25 Q65 40 75 75 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
          <path d="M150 110 Q180 50 160 25 Q135 40 125 75 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
          {/* Eagle Head & Hooked Beak */}
          <polygon points="100,45 120,65 110,85 90,85 80,65" fill="#ffffff" />
          <polygon points="110,70 135,78 110,84" fill="#fbbf24" />
          {/* Fierce Eye */}
          <circle cx="98" cy="65" r="4" fill="#b91c1c" />
          <circle cx="98" cy="65" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'monster_hydra': // Hidra Primordial
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="hy-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="70%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#hy-bg)" />
          {/* 3 Serpentine Necks and Heads */}
          <path d="M70 140 Q40 90 60 50 Q75 40 70 60" stroke="#059669" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M100 140 Q100 80 100 40 Q115 35 105 55" stroke="#10b981" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M130 140 Q160 90 140 50 Q125 40 130 60" stroke="#059669" strokeWidth="8" fill="none" strokeLinecap="round" />
          {/* Glowing Yellow Fangs */}
          <circle cx="65" cy="48" r="2.5" fill="#fde047" />
          <circle cx="102" cy="38" r="3" fill="#fde047" />
          <circle cx="135" cy="48" r="2.5" fill="#fde047" />
        </svg>
      );

    // ==========================================
    // SPELLS (DETAILED GRAPHICS)
    // ==========================================
    case 'spell_fire_sword':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sfs-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="70%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sfs-bg)" />
          {/* Flaming Aura */}
          <path d="M100 20 Q125 60 115 95 Q135 65 100 20 Z" fill="#facc15" opacity="0.8" />
          <path d="M100 20 Q75 60 85 95 Q65 65 100 20 Z" fill="#f97316" opacity="0.8" />
          {/* Sword Blade */}
          <polygon points="100,25 107,95 93,95" fill="#e2e8f0" stroke="#f97316" strokeWidth="2" />
          <line x1="100" y1="28" x2="100" y2="92" stroke="#ea580c" strokeWidth="1.5" />
          {/* Crossguard & Hilt */}
          <rect x="80" y="95" width="40" height="7" rx="3" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
          <rect x="96" y="102" width="8" height="25" rx="2" fill="#451a03" />
          <circle cx="100" cy="130" r="6" fill="#d97706" />
        </svg>
      );

    case 'spell_ice_shield':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sis-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#082f49" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sis-bg)" />
          {/* Frost Spikes & Shield */}
          <polygon points="100,20 145,45 140,105 100,135 60,105 55,45" fill="#38bdf8" stroke="#bae6fd" strokeWidth="3" opacity="0.85" />
          {/* Snowflake crystal inside */}
          <line x1="100" y1="45" x2="100" y2="110" stroke="#ffffff" strokeWidth="2" />
          <line x1="75" y1="78" x2="125" y2="78" stroke="#ffffff" strokeWidth="2" />
          <line x1="82" y1="60" x2="118" y2="95" stroke="#ffffff" strokeWidth="2" />
          <line x1="82" y1="95" x2="118" y2="60" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );

    case 'spell_sword':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ss-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ss-bg)" />
          {/* Silver Knight Blade */}
          <polygon points="100,25 106,95 94,95" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="100" y1="28" x2="100" y2="92" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Golden Crossguard */}
          <rect x="80" y="95" width="40" height="6" rx="2" fill="#eab308" stroke="#fef08a" strokeWidth="1" />
          <rect x="97" y="101" width="6" height="24" rx="2" fill="#713f12" />
          <circle cx="100" cy="128" r="5" fill="#eab308" />
          {/* Gleam star */}
          <circle cx="100" cy="30" r="3" fill="#ffffff" />
        </svg>
      );

    case 'spell_shield':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ssh-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="70%" stopColor="#365314" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ssh-bg)" />
          {/* Golden Knight Heater Shield */}
          <path d="M100 30 L140 45 Q140 100 100 128 Q60 100 60 45 Z" fill="#ca8a04" stroke="#fde047" strokeWidth="3" />
          <path d="M100 40 L130 52 Q130 92 100 115 Q70 92 70 52 Z" fill="#1e293b" />
          {/* Cross on Shield */}
          <rect x="96" y="55" width="8" height="45" fill="#facc15" />
          <rect x="80" y="68" width="40" height="8" fill="#facc15" />
        </svg>
      );

    case 'spell_heal':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sh-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="70%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sh-bg)" />
          {/* Radiant Light Rays */}
          <circle cx="100" cy="75" r="45" fill="#86efac" opacity="0.3" />
          {/* Holy Emerald Cross */}
          <rect x="88" y="45" width="24" height="60" rx="4" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <rect x="70" y="63" width="60" height="24" rx="4" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          {/* Heart center */}
          <circle cx="100" cy="75" r="8" fill="#ffffff" />
        </svg>
      );

    case 'spell_fireball':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="fb-bg" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="60%" stopColor="#7c2d12" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#fb-bg)" />
          {/* Flaming Tail Trail */}
          <path d="M40 120 Q70 90 90 75 Q60 110 40 120 Z" fill="#b91c1c" />
          <path d="M50 110 Q80 80 95 75 Q70 100 50 110 Z" fill="#f97316" />
          {/* Blazing Comet Sphere */}
          <circle cx="115" cy="65" r="32" fill="#ef4444" />
          <circle cx="118" cy="62" r="22" fill="#f97316" />
          <circle cx="122" cy="58" r="14" fill="#fde047" />
          <circle cx="125" cy="55" r="7" fill="#ffffff" />
        </svg>
      );

    case 'spell_lightning':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="lt-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="70%" stopColor="#713f12" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#lt-bg)" />
          {/* Giant Lightning Bolt */}
          <polygon points="115,20 80,75 105,75 75,135 125,70 100,70" fill="#facc15" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="75" cy="135" r="8" fill="#fef08a" opacity="0.6" />
        </svg>
      );

    case 'spell_poison':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ps-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#6b21a8" />
              <stop offset="70%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ps-bg)" />
          {/* Poison Flask */}
          <path d="M92 40 L108 40 L108 55 L130 95 Q135 120 100 120 Q65 120 70 95 L92 55 Z" fill="#15803d" stroke="#86efac" strokeWidth="2.5" />
          {/* Bubbles */}
          <circle cx="95" cy="95" r="4" fill="#a855f7" />
          <circle cx="108" cy="85" r="6" fill="#a855f7" />
          <circle cx="98" cy="108" r="3" fill="#a855f7" />
          {/* Skull Icon on flask */}
          <circle cx="100" cy="88" r="5" fill="#ffffff" />
          <circle cx="98" cy="88" r="1.5" fill="#000000" />
          <circle cx="102" cy="88" r="1.5" fill="#000000" />
        </svg>
      );

    case 'spell_curse':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="cu-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="70%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#cu-bg)" />
          {/* Cursed Occult Eye */}
          <path d="M50 75 Q100 35 150 75 Q100 115 50 75 Z" fill="#2e1065" stroke="#a855f7" strokeWidth="3" />
          <circle cx="100" cy="75" r="18" fill="#e879f9" />
          <ellipse cx="100" cy="75" rx="5" ry="16" fill="#09090b" />
          <circle cx="97" cy="70" r="2" fill="#ffffff" />
        </svg>
      );

    case 'spell_black_hole':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="bh-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="45%" stopColor="#000000" />
              <stop offset="65%" stopColor="#581c87" />
              <stop offset="85%" stopColor="#c084fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="#030712" />
          {/* Accretion Disk */}
          <ellipse cx="100" cy="75" rx="75" ry="25" fill="none" stroke="#e879f9" strokeWidth="5" transform="rotate(-15 100 75)" opacity="0.8" />
          <ellipse cx="100" cy="75" rx="85" ry="30" fill="none" stroke="#f43f5e" strokeWidth="2" transform="rotate(-15 100 75)" opacity="0.6" />
          {/* Black Hole Event Horizon */}
          <circle cx="100" cy="75" r="30" fill="url(#bh-bg)" stroke="#a855f7" strokeWidth="2" />
        </svg>
      );

    case 'spell_charge':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ch-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ch-bg)" />
          {/* Speed Arrows & Lightning */}
          <path d="M40 75 L130 75 M115 55 L145 75 L115 95" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
          <polygon points="120,40 100,70 120,70 95,110 140,65 115,65" fill="#facc15" stroke="#fde047" strokeWidth="1" />
        </svg>
      );

    case 'spell_cleanse':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="cl-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#082f49" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#cl-bg)" />
          {/* Cascading Purifying Droplet */}
          <path d="M100 30 Q130 85 100 120 Q70 85 100 30 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="100" cy="75" r="16" fill="#38bdf8" opacity="0.6" />
          <circle cx="96" cy="65" r="4" fill="#ffffff" />
        </svg>
      );

    case 'spell_antidote':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ad-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="70%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ad-bg)" />
          {/* Elixir vial with fresh leaf */}
          <path d="M92 45 L108 45 L108 60 L125 95 Q130 115 100 115 Q70 115 75 95 L92 60 Z" fill="#6ee7b7" stroke="#34d399" strokeWidth="2" />
          {/* Mint Leaf */}
          <path d="M108 45 Q135 30 140 45 Q125 55 108 45 Z" fill="#22c55e" />
        </svg>
      );

    case 'spell_summon':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sm-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#3730a3" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sm-bg)" />
          {/* Arcane Summoning Circle */}
          <ellipse cx="100" cy="100" rx="65" ry="25" fill="none" stroke="#a5b4fc" strokeWidth="3" />
          <polygon points="100,80 140,110 60,110" fill="none" stroke="#818cf8" strokeWidth="2" />
          {/* Summoning Light Pillar */}
          <path d="M75 100 L90 25 L110 25 L125 100 Z" fill="#c7d2fe" opacity="0.4" />
        </svg>
      );

    case 'spell_sacrifice':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="sc-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="70%" stopColor="#500724" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#sc-bg)" />
          {/* Dark sacrificial altar & flame */}
          <polygon points="60,125 140,125 125,95 75,95" fill="#3f3f46" stroke="#9f1239" strokeWidth="2" />
          {/* Crimson Flame */}
          <path d="M100 35 Q125 70 100 95 Q75 70 100 35 Z" fill="#f43f5e" />
          <path d="M100 45 Q115 70 100 90 Q85 70 100 45 Z" fill="#fde047" />
        </svg>
      );

    case 'spell_restore':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="rs-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="70%" stopColor="#713f12" />
              <stop offset="100%" stopColor="#18181b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#rs-bg)" />
          {/* Golden Life Chalice */}
          <path d="M80 50 Q100 95 100 95 Q100 95 120 50 Z" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
          <rect x="96" y="95" width="8" height="20" fill="#d97706" />
          <ellipse cx="100" cy="115" rx="20" ry="6" fill="#fbbf24" />
          {/* Radiant star drops */}
          <circle cx="100" cy="40" r="5" fill="#ffffff" />
          <circle cx="85" cy="35" r="3" fill="#fef08a" />
          <circle cx="115" cy="35" r="3" fill="#fef08a" />
        </svg>
      );

    case 'spell_evo_stone':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="es-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="70%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
            <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="75%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill="url(#es-bg)" />
          {/* Prismatic Evolution Stone */}
          <polygon points="100,25 140,55 140,95 100,125 60,95 60,55" fill="url(#rainbow)" stroke="#ffffff" strokeWidth="2.5" />
          {/* Inner facets */}
          <polygon points="100,25 100,125 140,95" fill="#ffffff" opacity="0.2" />
          <polygon points="100,25 60,55 100,75" fill="#ffffff" opacity="0.3" />
          {/* Evolution glow rings */}
          <circle cx="100" cy="75" r="48" fill="none" stroke="#fde047" strokeWidth="1.5" strokeDasharray="5,4" />
        </svg>
      );

    case 'spell_tsunami':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ts-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ts-bg)" />
          {/* Giant Cresting Wave */}
          <path d="M0 150 Q60 140 80 100 Q100 50 140 40 Q170 35 155 60 Q135 75 120 75 Q150 90 200 150 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
          <path d="M125 40 Q150 35 145 55 Q135 60 120 65" fill="#ffffff" />
          {/* Foam drops */}
          <circle cx="160" cy="50" r="3" fill="#ffffff" />
          <circle cx="175" cy="65" r="4" fill="#ffffff" />
          <circle cx="185" cy="85" r="3" fill="#ffffff" />
        </svg>
      );

    case 'spell_earthquake':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="eq-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="70%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#eq-bg)" />
          {/* Fissured Earth */}
          <path d="M100 20 L90 55 L115 80 L85 110 L100 145" stroke="#f59e0b" strokeWidth="5" fill="none" />
          <polygon points="50,90 70,70 65,110" fill="#78716c" />
          <polygon points="140,80 160,60 155,100" fill="#78716c" />
        </svg>
      );

    case 'spell_berserk':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="bz-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="70%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#bz-bg)" />
          {/* Crossed Battleaxes with blood-red glow */}
          <line x1="50" y1="120" x2="150" y2="30" stroke="#71717a" strokeWidth="4" />
          <line x1="150" y1="120" x2="50" y2="30" stroke="#71717a" strokeWidth="4" />
          <path d="M140 30 Q165 25 160 50 Q145 55 135 40 Z" fill="#dc2626" />
          <path d="M60 30 Q35 25 40 50 Q55 55 65 40 Z" fill="#dc2626" />
          {/* Red glowing eyes */}
          <circle cx="85" cy="75" r="5" fill="#f87171" />
          <circle cx="115" cy="75" r="5" fill="#f87171" />
        </svg>
      );

    case 'spell_thorns':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="th-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="70%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#052e16" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#th-bg)" />
          {/* Thorny Briar Vines Shield */}
          <path d="M40 75 Q100 20 160 75 Q100 130 40 75 Z" fill="none" stroke="#854d0e" strokeWidth="4" />
          <polygon points="70,45 65,30 80,42" fill="#166534" />
          <polygon points="130,45 135,30 120,42" fill="#166534" />
          <polygon points="70,105 65,120 80,108" fill="#166534" />
          <polygon points="130,105 135,120 120,108" fill="#166534" />
          {/* Blooming Rose in center */}
          <circle cx="100" cy="75" r="14" fill="#e11d48" />
          <circle cx="100" cy="75" r="8" fill="#fda4af" />
        </svg>
      );

    case 'spell_arcane_barrier':
      return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
          <defs>
            <radialGradient id="ab-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="200" height="150" fill="url(#ab-bg)" />
          {/* Hexagonal energy shield */}
          <polygon points="100,25 145,50 145,100 100,125 55,100 55,50" fill="#a5b4fc" opacity="0.3" stroke="#818cf8" strokeWidth="3" />
          <polygon points="100,45 130,62 130,98 100,115 70,98 70,62" fill="none" stroke="#c7d2fe" strokeWidth="1.5" />
        </svg>
      );

    // Default Fallback Generator based on card element and type
    default:
      return <GenericElementalArt element={card.element} type={card.type} name={card.name} />;
  }
};

const GenericElementalArt: React.FC<{ element: ElementType; type: string; name: string }> = ({
  element,
  type,
  name,
}) => {
  const elemTheme = {
    fire: { bg: '#991b1b', light: '#f97316', dark: '#450a0a', icon: '🔥' },
    water: { bg: '#0369a1', light: '#38bdf8', dark: '#082f49', icon: '💧' },
    electric: { bg: '#ca8a04', light: '#fde047', dark: '#713f12', icon: '⚡' },
    nature: { bg: '#15803d', light: '#4ade80', dark: '#052e16', icon: '🌿' },
    metal: { bg: '#475569', light: '#cbd5e1', dark: '#1e293b', icon: '⚙️' },
    dark: { bg: '#581c87', light: '#c084fc', dark: '#18181b', icon: '🌑' },
    neutral: { bg: '#57534e', light: '#a8a29e', dark: '#1c1917', icon: '⭐' },
  }[element];

  return (
    <svg viewBox="0 0 200 150" className="w-full h-full">
      <defs>
        <radialGradient id={`gen-${element}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={elemTheme.light} stopOpacity="0.8" />
          <stop offset="60%" stopColor={elemTheme.bg} />
          <stop offset="100%" stopColor={elemTheme.dark} />
        </radialGradient>
      </defs>
      <rect width="200" height="150" fill={`url(#gen-${element})`} />
      <circle cx="100" cy="75" r="45" fill="none" stroke={elemTheme.light} strokeWidth="2" strokeDasharray="6,4" />
      <circle cx="100" cy="75" r="32" fill={elemTheme.dark} opacity="0.6" />
      <text
        x="100"
        y="85"
        textAnchor="middle"
        fontSize="32"
        fill="#ffffff"
        className="select-none font-bold"
      >
        {elemTheme.icon}
      </text>
      <text
        x="100"
        y="125"
        textAnchor="middle"
        fontSize="11"
        fill="#e2e8f0"
        fontWeight="bold"
        className="select-none tracking-wider"
      >
        {type === 'spell' ? 'FEITIÇO' : name.toUpperCase()}
      </text>
    </svg>
  );
};
