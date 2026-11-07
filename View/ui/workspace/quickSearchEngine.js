import { getAllProjectObjects } from './quickSearchIndexer.js'

const WORD_BOUNDARY_REGEX = /[\s,.\-_/()§#[\]"':;]+/

/**
 * Computes match score and tier according to:
 * 1. Word-prefix matches in title (highest priority)
 * 2. In-word / phrase substring matches in title
 * 3. Word-prefix matches in description
 * 4. In-word / phrase matches in description
 * 5. Matches in metadata (ID, tags, locations)
 *
 * @param {object} candidate
 * @param {string} rawQuery
 * @returns {{ matched: boolean, tier: number, score: number }}
 */
export function scoreCandidate(candidate, rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase()
    if (!q) {
        return { matched: true, tier: 10, score: 0 }
    }

    const titleLower = (candidate.title || '').toLowerCase()
    const descLower = (candidate.description || '').toLowerCase()
    const idLower = (candidate.id || '').toLowerCase()
    const numberStr = candidate.number != null ? String(candidate.number) : ''

    // Tier 1: Match at beginning of words in title / number
    if (titleLower === q || numberStr === q) {
        return { matched: true, tier: 1, score: 0 }
    }

    if (
        titleLower.startsWith(q) ||
        numberStr.startsWith(q) ||
        `§ ${numberStr}`.toLowerCase().startsWith(q)
    ) {
        return { matched: true, tier: 1, score: 10 + titleLower.length * 0.1 }
    }

    if (titleLower.includes(q)) {
        const titleWords = titleLower.split(WORD_BOUNDARY_REGEX).filter(Boolean)
        const wordPrefixIndex = titleWords.findIndex(w => w.startsWith(q))
        if (wordPrefixIndex !== -1) {
            return {
                matched: true,
                tier: 1,
                score: 20 + wordPrefixIndex * 2 + titleLower.length * 0.1,
            }
        }

        // Tier 2: Match inside a word in title
        const pos = titleLower.indexOf(q)
        return { matched: true, tier: 2, score: 100 + pos + titleLower.length * 0.1 }
    }

    // Tier 3 & 4: Matches in description
    if (descLower.includes(q)) {
        const descWords = descLower.split(WORD_BOUNDARY_REGEX).filter(Boolean)
        const descPrefixIndex = descWords.findIndex(w => w.startsWith(q))
        if (descPrefixIndex !== -1) {
            return { matched: true, tier: 3, score: 200 + descPrefixIndex * 2 }
        }

        // Tier 4: Match inside a word in description
        const pos = descLower.indexOf(q)
        return { matched: true, tier: 4, score: 300 + pos * 0.1 }
    }

    // Tier 5: Match in ID, tags, locations, or secondary metadata
    if (idLower.startsWith(q)) {
        return { matched: true, tier: 5, score: 400 }
    }
    if (idLower.includes(q)) {
        return { matched: true, tier: 5, score: 450 }
    }

    const tagsList = Array.isArray(candidate.tags) ? candidate.tags : []
    if (tagsList.length > 0) {
        let hasPrefix = false
        let hasSub = false
        for (let i = 0; i < tagsList.length; i++) {
            const tLower = (tagsList[i] || '').toLowerCase()
            if (tLower.startsWith(q)) {
                hasPrefix = true
                break
            }
            if (tLower.includes(q)) {
                hasSub = true
            }
        }
        if (hasPrefix) return { matched: true, tier: 5, score: 500 }
        if (hasSub) return { matched: true, tier: 5, score: 550 }
    }

    const loc = (candidate.locationName || '').toLowerCase()
    if (loc) {
        if (loc.startsWith(q) || loc.includes(q)) {
            return { matched: true, tier: 5, score: 600 }
        }
    }

    const modifiersList = Array.isArray(candidate.modifiers) ? candidate.modifiers : []
    if (modifiersList.some(m => (m || '').toLowerCase().includes(q))) {
        return { matched: true, tier: 5, score: 650 }
    }

    return { matched: false, tier: 999, score: 9999 }
}

/**
 * Searches across all project objects, filtering and ordering results
 * primarily by word-prefix matches and secondarily by substring matches.
 *
 * @param {object} ctx
 * @param {string} query
 * @param {string} [categoryFilter='all']
 * @returns {Array<object>}
 */
export function searchProjectObjects(ctx, query, categoryFilter = 'all') {
    const allObjects = Array.isArray(ctx) ? ctx : getAllProjectObjects(ctx)
    const trimmedQuery = (query || '').trim()

    let filtered = allObjects
    if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(item => item.category === categoryFilter)
    }

    const scored = []
    const len = filtered.length
    for (let i = 0; i < len; i++) {
        const item = filtered[i]
        const result = scoreCandidate(item, trimmedQuery)
        if (result.matched) {
            scored.push({
                item,
                tier: result.tier,
                score: result.score,
            })
        }
    }

    // Sort: Tier 1 (word prefix) always before Tier 2 (substring in word), then by score
    scored.sort((a, b) => {
        if (a.tier !== b.tier) {
            return a.tier - b.tier
        }
        return a.score - b.score
    })

    const results = new Array(scored.length)
    for (let i = 0; i < scored.length; i++) {
        results[i] = scored[i].item
    }
    return results
}
