/**
 * Predefined fantasy class avatars for NPC creation.
 * Clean, modern SVG representations of classic tabletop & fantasy RPG archetypes.
 */

import { t } from '../../dist/Utils/translate.js'

export const FANTASY_AVATARS = [
    {
        id: 'warrior',
        nameKey: 'avatars.warrior',
        category: 'combat',
        color: '#60a5fa',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.4)',
        // Crossed swords & sturdy shield
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
            <path d="M13 19l6-6"></path>
            <path d="M16 16l4 4"></path>
            <path d="M19 21l2-2"></path>
            <path d="M9.5 6.5L21 18v3h-3L6.5 9.5"></path>
            <path d="M11 5L5 11"></path>
            <path d="M8 8L4 4"></path>
            <path d="M5 3L3 5"></path>
        </svg>`,
    },
    {
        id: 'mage',
        nameKey: 'avatars.mage',
        category: 'magic',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.18)',
        borderColor: 'rgba(59, 130, 246, 0.45)',
        // Magic staff / mystic star orb
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
            <circle cx="12" cy="12" r="4"></circle>
        </svg>`,
    },
    {
        id: 'rogue',
        nameKey: 'avatars.rogue',
        category: 'stealth',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.15)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        // Dual daggers / stealth hood
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 2a5 5 0 00-5 5v3a5 5 0 0010 0V7a5 5 0 00-5-5z"></path>
            <path d="M6 14v1a6 6 0 0012 0v-1"></path>
            <path d="M3 21h18"></path>
            <path d="M12 17v4"></path>
        </svg>`,
    },
    {
        id: 'cleric',
        nameKey: 'avatars.priest',
        category: 'divine',
        color: '#818cf8',
        bgColor: 'rgba(129, 140, 248, 0.15)',
        borderColor: 'rgba(129, 140, 248, 0.4)',
        // Divine sun halo & holy symbol
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`,
    },
    {
        id: 'ranger',
        nameKey: 'avatars.ranger',
        category: 'ranged',
        color: '#2dd4bf',
        bgColor: 'rgba(45, 212, 191, 0.15)',
        borderColor: 'rgba(45, 212, 191, 0.4)',
        // Bow and arrow
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M4 12a8 8 0 0116 0"></path>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <path d="M16 8l4 4-4 4"></path>
            <line x1="12" y1="4" x2="12" y2="20"></line>
        </svg>`,
    },
    {
        id: 'paladin',
        nameKey: 'avatars.paladin',
        category: 'holy',
        color: '#93c5fd',
        bgColor: 'rgba(147, 197, 253, 0.15)',
        borderColor: 'rgba(147, 197, 253, 0.4)',
        // Holy shield with cross
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="9" y1="11" x2="15" y2="11"></line>
        </svg>`,
    },
    {
        id: 'bard',
        nameKey: 'avatars.bard',
        category: 'utility',
        color: '#a78bfa',
        bgColor: 'rgba(167, 139, 250, 0.15)',
        borderColor: 'rgba(167, 139, 250, 0.4)',
        // Lyre / musical inspiration
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
        </svg>`,
    },
    {
        id: 'necromancer',
        nameKey: 'avatars.necromancer',
        category: 'dark',
        color: '#7dd3fc',
        bgColor: 'rgba(125, 211, 252, 0.15)',
        borderColor: 'rgba(125, 211, 252, 0.4)',
        // Skull of dark arts
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 2a7 7 0 00-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 00-7-7z"></path>
            <path d="M9 17v4m6-4v4"></path>
            <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
            <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
        </svg>`,
    },
    {
        id: 'druid',
        nameKey: 'avatars.druid',
        category: 'nature',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.15)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        // Leaf of life & balance
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M11 20A7 7 0 014 13c0-4.4 3.6-8 8-8 1.4 0 2.8.4 4 1.1A7 7 0 0120 13c0 4.4-3.6 8-8 8h-1z"></path>
            <path d="M12 5v15"></path>
        </svg>`,
    },
    {
        id: 'merchant',
        nameKey: 'avatars.merchant',
        category: 'civilian',
        color: '#94a3b8',
        bgColor: 'rgba(148, 163, 184, 0.15)',
        borderColor: 'rgba(148, 163, 184, 0.4)',
        // Scales of commerce / merchant coin
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 3v18"></path>
            <path d="M5 6h14"></path>
            <path d="M2 13l3-7 3 7a3 3 0 01-6 0z"></path>
            <path d="M16 13l3-7 3 7a3 3 0 01-6 0z"></path>
        </svg>`,
    },
]

/**
 * Returns the translated display name for an avatar.
 *
 * @param {{ nameKey: string, id: string }} avatar
 * @returns {string}
 */
export function getAvatarName(avatar) {
    return t(avatar.nameKey) || avatar.id
}

export function getAvatarById(id) {
    return FANTASY_AVATARS.find(a => a.id === id) || FANTASY_AVATARS[0]
}
