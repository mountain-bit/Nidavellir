/**
 * Predefined fantasy class avatars for NPC creation.
 * Clean, modern SVG representations of classic tabletop & fantasy RPG archetypes.
 */

export const FANTASY_AVATARS = [
    {
        id: 'warrior',
        name: 'Wojownik',
        category: 'combat',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
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
        name: 'Mag',
        category: 'magic',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.4)',
        // Magic staff / mystic star orb
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
            <circle cx="12" cy="12" r="4"></circle>
        </svg>`,
    },
    {
        id: 'rogue',
        name: 'Łotrzyk',
        category: 'stealth',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
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
        name: 'Kapłan',
        category: 'divine',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
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
        name: 'Łucznik',
        category: 'ranged',
        color: '#84cc16',
        bgColor: 'rgba(132, 204, 22, 0.15)',
        borderColor: 'rgba(132, 204, 22, 0.4)',
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
        name: 'Paladyn',
        category: 'holy',
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.15)',
        borderColor: 'rgba(234, 179, 8, 0.4)',
        // Holy shield with cross
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="9" y1="11" x2="15" y2="11"></line>
        </svg>`,
    },
    {
        id: 'bard',
        name: 'Bard',
        category: 'utility',
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.15)',
        borderColor: 'rgba(236, 72, 153, 0.4)',
        // Lyre / musical inspiration
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
        </svg>`,
    },
    {
        id: 'necromancer',
        name: 'Nekromanta',
        category: 'dark',
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.15)',
        borderColor: 'rgba(168, 85, 247, 0.4)',
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
        name: 'Druid',
        category: 'nature',
        color: '#14b8a6',
        bgColor: 'rgba(20, 184, 166, 0.15)',
        borderColor: 'rgba(20, 184, 166, 0.4)',
        // Leaf of life & balance
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M11 20A7 7 0 014 13c0-4.4 3.6-8 8-8 1.4 0 2.8.4 4 1.1A7 7 0 0120 13c0 4.4-3.6 8-8 8h-1z"></path>
            <path d="M12 5v15"></path>
        </svg>`,
    },
    {
        id: 'merchant',
        name: 'Handlarz',
        category: 'civilian',
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.15)',
        borderColor: 'rgba(217, 119, 6, 0.4)',
        // Scales of commerce / merchant coin
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
            <path d="M12 3v18"></path>
            <path d="M5 6h14"></path>
            <path d="M2 13l3-7 3 7a3 3 0 01-6 0z"></path>
            <path d="M16 13l3-7 3 7a3 3 0 01-6 0z"></path>
        </svg>`,
    },
]

export function getAvatarById(id) {
    return FANTASY_AVATARS.find(a => a.id === id) || FANTASY_AVATARS[0]
}
