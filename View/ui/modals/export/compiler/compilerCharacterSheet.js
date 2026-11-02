/**
 * Compiler Character Sheet - Compiles PlayerCharacter domain models or plain objects into print sheets.
 */

/**
 * Compiles a comprehensive character sheet object from a PlayerCharacter domain model or raw object.
 * Extracts actual stats, skills, parameters/vitals, items, and attributes.
 *
 * @param {object} hero
 * @returns {object|null}
 */
export function compileCharacterSheet(hero) {
    if (!hero) return null
    const rawName =
        (typeof hero.getName === 'function'
            ? hero.getName()
            : hero.name || hero.imie || hero.title || hero.label) || ''
    const rawId = (typeof hero.getId === 'function' ? hero.getId() : hero.id) || ''
    const name =
        (typeof rawName === 'string' ? rawName.trim() : String(rawName || '').trim()) ||
        (rawId ? `Bohater (${rawId})` : 'Bohater')

    const charClassObj =
        typeof hero.getCharacterClass === 'function'
            ? hero.getCharacterClass()
            : hero.characterClass
    const characterClass =
        (charClassObj && typeof charClassObj.getName === 'function'
            ? charClassObj.getName()
            : charClassObj?.name || (typeof charClassObj === 'string' ? charClassObj : '')) || ''

    const summary =
        (typeof hero.getSummary === 'function'
            ? hero.getSummary()
            : hero.summary || hero.description?.summary || '') || ''
    const avatar = (typeof hero.getAvatar === 'function' ? hero.getAvatar() : hero.avatar) || ''

    // Stats (cechy główne) - only those with a non-empty name
    const rawStats = (typeof hero.getStats === 'function' ? hero.getStats() : hero.stats) || []
    const stats = rawStats
        .map(s => ({
            name: (typeof s.getName === 'function' ? s.getName() : s.name) || '',
            value: typeof s.getValue === 'function' ? s.getValue() : (s.value ?? ''),
        }))
        .filter(s => s.name.trim() !== '')

    // Parameters (parametry życiowe i zasoby, np. Zdrowie, Złoto, Mana)
    const rawParams =
        (typeof hero.getParameters === 'function' ? hero.getParameters() : hero.parameters) || []
    const parameters = rawParams
        .map(p => ({
            name: (typeof p.getName === 'function' ? p.getName() : p.name) || '',
            value: typeof p.getValue === 'function' ? p.getValue() : (p.value ?? ''),
            currentValue:
                typeof p.getCurrentValue === 'function'
                    ? p.getCurrentValue()
                    : (p.currentValue ?? ''),
            maxValue: typeof p.getMaxValue === 'function' ? p.getMaxValue() : (p.maxValue ?? ''),
        }))
        .filter(p => p.name.trim() !== '')

    // Skills (umiejętności)
    const rawSkills = (typeof hero.getSkills === 'function' ? hero.getSkills() : hero.skills) || []
    const skills = rawSkills
        .map(sk => ({
            name: (typeof sk.getName === 'function' ? sk.getName() : sk.name) || '',
            value: typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? ''),
        }))
        .filter(sk => sk.name.trim() !== '')

    // Features (cechy specjalne i atuty)
    const rawFeatures =
        (typeof hero.getFeatures === 'function' ? hero.getFeatures() : hero.features) || []
    const features = rawFeatures
        .map(f => ({
            name: (typeof f.getName === 'function' ? f.getName() : f.name) || '',
            description:
                (typeof f.getDescription === 'function'
                    ? f.getDescription()?.getText?.() || f.getDescription()?.getSummary?.()
                    : f.description) || '',
        }))
        .filter(f => f.name.trim() !== '')

    // Items (ekwipunek początkowy)
    const rawItems = (typeof hero.getItems === 'function' ? hero.getItems() : hero.items) || []
    const items = rawItems
        .map(i => ({
            name: (typeof i.getName === 'function' ? i.getName() : i.name) || '',
        }))
        .filter(i => i.name.trim() !== '')

    // Inventories (wielokrotny ekwipunek)
    const rawInventories =
        (typeof hero.getInventories === 'function' ? hero.getInventories() : hero.inventories) || []
    const inventories = rawInventories
        .map(inv => {
            const invName = (typeof inv.getName === 'function' ? inv.getName() : inv.name) || ''
            const invCapacity =
                typeof inv.getCapacity === 'function' ? inv.getCapacity() : (inv.capacity ?? 0)
            const invItemsRaw =
                (typeof inv.getItems === 'function' ? inv.getItems() : inv.items) || []
            const invItems = invItemsRaw
                .map(i => ({
                    name: (typeof i.getName === 'function' ? i.getName() : i.name) || '',
                    description:
                        (typeof i.getDescription === 'function'
                            ? i.getDescription()
                            : i.description) || '',
                }))
                .filter(i => i.name.trim() !== '')
            return {
                id: (typeof inv.getId === 'function' ? inv.getId() : inv.id) || '',
                name: invName,
                capacity: Number(invCapacity) || 0,
                items: invItems,
            }
        })
        .filter(inv => inv.name.trim() !== '')

    // Tags
    const rawTags = (typeof hero.getTags === 'function' ? hero.getTags() : hero.tags) || []
    const tags = rawTags
        .map(t => (typeof t.getName === 'function' ? t.getName() : t.name || String(t)))
        .filter(t => typeof t === 'string' && t.trim() !== '')

    return {
        id: (typeof hero.getId === 'function' ? hero.getId() : hero.id) || name || 'hero',
        name,
        characterClass,
        summary,
        avatar,
        stats,
        parameters,
        skills,
        features,
        items,
        inventories,
        tags,
    }
}
