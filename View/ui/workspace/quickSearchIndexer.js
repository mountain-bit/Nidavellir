import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'

/**
 * Extracts plain text from an entity's description (supports Description instances, strings, and objects).
 *
 * @param {unknown} desc
 * @returns {string}
 */
export function getEntityText(desc) {
    if (!desc) return ''
    if (typeof desc === 'string') return desc
    if (typeof desc.getText === 'function') {
        const text = desc.getText()
        if (text) return text
    }
    if (typeof desc.getSummary === 'function') {
        const summary = desc.getSummary()
        if (summary) return summary
    }
    if (typeof desc.text === 'string' && desc.text) return desc.text
    if (typeof desc.summary === 'string' && desc.summary) return desc.summary
    return ''
}

/**
 * Escapes HTML and highlights matching substrings in text.
 *
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
export function highlightMatch(text, query) {
    if (!text) return ''
    const safeText = escapeHtml(text)
    const trimmedQuery = (query || '').trim()
    if (!trimmedQuery) return safeText

    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    try {
        const regex = new RegExp(`(${escapedQuery})`, 'gi')
        return safeText.replace(
            regex,
            '<mark class="bg-blue-500/30 text-blue-200 font-semibold rounded px-0.5">$1</mark>'
        )
    } catch {
        return safeText
    }
}

/**
 * Collects all searchable project entities from the application context.
 *
 * @param {object} ctx
 * @returns {Array<object>}
 */
export function getAllProjectObjects(ctx) {
    if (!ctx) return []

    const items = []
    const resolveText = (key, fallback) => {
        if (typeof t === 'function') {
            const res = t(key)
            if (res && res !== key) return res
        }
        return fallback
    }

    // 1. Paragraphs
    const paragraphs = ctx.projectParagraphs || ctx.projectData?.projectParagraphs || []
    paragraphs.forEach(p => {
        if (!p) return
        const isStart = Boolean(p.getIsStart && p.getIsStart())
        const isEnd = Boolean(p.getIsEnd && p.getIsEnd())
        const title = isStart
            ? 'START'
            : (p.getTitle && p.getTitle()) ||
              (p.getName && p.getName()) ||
              `Paragraf ${p.getNumber?.() || p.getId?.() || ''}`
        const desc = getEntityText(
            p.getContent ? p.getContent() : p.getDescription ? p.getDescription() : p.content
        )
        const tags = (p.getTags ? p.getTags() : [])
            .map(tg => (tg.getName ? tg.getName() : tg.name))
            .filter(Boolean)
        const locationName =
            p.getLocation && p.getLocation()
                ? p.getLocation().getName
                    ? p.getLocation().getName()
                    : ''
                : ''
        const charNames = (p.getCharacters ? p.getCharacters() : [])
            .map(c => (c.getName ? c.getName() : c.name))
            .filter(Boolean)
        const num = p.getDisplayNumber
            ? p.getDisplayNumber()
            : p.getNumber && p.getNumber() > 0
              ? p.getNumber()
              : p.number || 1

        items.push({
            id: p.getId ? p.getId() : String(p.id || ''),
            number: num,
            title: title || 'Paragraf',
            description: desc,
            category: 'paragraphs',
            type: 'paragraph',
            typeLabel: isStart
                ? 'Węzeł START'
                : isEnd
                  ? 'Zakończenie (Koniec)'
                  : resolveText('left_panel.paragraphs', 'Paragraf'),
            icon: isStart ? 'play' : isEnd ? 'flag' : 'paragraph',
            badgeColor: isStart
                ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                : isEnd
                  ? 'text-rose-300 bg-rose-500/20 border-rose-500/40'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
            actionText: 'Przejdź na grafie',
            tags,
            locationName,
            charNames,
            entity: p,
        })
    })

    // 2. Scenes
    const scenes = ctx.projectScenes || ctx.projectData?.projectScenes || []
    scenes.forEach(s => {
        if (!s) return
        const title =
            (s.getName && s.getName()) || (s.getTitle && s.getTitle()) || s.name || 'Scena'
        const desc = getEntityText(s.getDescription ? s.getDescription() : s.description)

        items.push({
            id: s.getId ? s.getId() : String(s.id || ''),
            title,
            description: desc,
            category: 'scenes',
            type: 'scene',
            typeLabel: resolveText('left_panel.scenes', 'Scena'),
            icon: 'scene',
            badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
            actionText: 'Przejdź na grafie',
            entity: s,
        })
    })

    // 3. Characters / NPCs
    const characters = ctx.projectCharacters || ctx.projectData?.projectCharacters || []
    characters.forEach(c => {
        if (!c) return
        const title = (c.getName && c.getName()) || c.name || 'Postać'
        const desc = getEntityText(c.getDescription ? c.getDescription() : c.description)

        items.push({
            id: c.getId ? c.getId() : String(c.id || ''),
            title,
            description: desc,
            category: 'characters',
            type: 'character',
            typeLabel: resolveText('left_panel.characters', 'Postać (NPC)'),
            icon: 'character',
            badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: c,
        })
    })

    // 4. Templates
    const templates = ctx.projectTemplates || ctx.projectData?.projectTemplates || []
    templates.forEach(tObj => {
        if (!tObj) return
        const title = (tObj.getName && tObj.getName()) || tObj.name || 'Szablon'
        const desc = getEntityText(tObj.getDescription ? tObj.getDescription() : tObj.description)

        items.push({
            id: tObj.getId ? tObj.getId() : String(tObj.id || ''),
            title,
            description: desc,
            category: 'characters',
            type: 'template',
            typeLabel: resolveText('left_panel.templates', 'Szablon NPC'),
            icon: 'template',
            badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: tObj,
        })
    })

    // 5. Locations
    const locations = ctx.projectLocations || ctx.projectData?.projectLocations || []
    locations.forEach(l => {
        if (!l) return
        const title = (l.getName && l.getName()) || l.name || 'Lokacja'
        const desc = getEntityText(l.getDescription ? l.getDescription() : l.description)

        items.push({
            id: l.getId ? l.getId() : String(l.id || ''),
            title,
            description: desc,
            category: 'locations',
            type: 'location',
            typeLabel: resolveText('left_panel.locations', 'Lokacja'),
            icon: 'location',
            badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: l,
        })
    })

    // 6. Items
    const itemsList =
        ctx.projectItems || ctx.projectData?.projectItems || ctx.projectData?.items || []
    itemsList.forEach(it => {
        if (!it) return
        const title = (it.getName && it.getName()) || it.name || it.id || 'Przedmiot'
        const desc = getEntityText(it.getDescription ? it.getDescription() : it.description)
        const tags = (it.getTags ? it.getTags() : it.tags || [])
            .map(tg => (tg.getName ? tg.getName() : tg.name))
            .filter(Boolean)
        const category = (it.getCategory ? it.getCategory() : it.category) || ''
        const modifiers = (it.getModifiers ? it.getModifiers() : it.modifiers || [])
            .map(m => `${m.targetName || m.name || ''} ${m.operator || ''}${m.value ?? ''}`.trim())
            .filter(Boolean)

        items.push({
            id: it.getId ? it.getId() : String(it.id || ''),
            title,
            description: desc,
            category: 'items',
            type: 'item',
            typeLabel: category ? `Przedmiot (${category})` : 'Przedmiot',
            icon: 'item',
            badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
            actionText: 'Otwórz szczegóły i opis',
            tags,
            modifiers,
            entity: it,
        })
    })

    // 7. Stats (Cechy)
    const stats = ctx.projectStats || ctx.projectData?.projectStats || []
    stats.forEach(st => {
        if (!st) return
        const title = (st.getName && st.getName()) || st.name || 'Cecha'
        const desc = getEntityText(st.getDescription ? st.getDescription() : st.description)

        items.push({
            id: st.getId ? st.getId() : String(st.id || ''),
            title,
            description: desc,
            category: 'rules',
            type: 'stat',
            typeLabel: 'Cecha',
            icon: 'stat',
            badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: st,
        })
    })

    // 8. Skills (Umiejętności)
    const skills = ctx.projectSkills || ctx.projectData?.projectSkills || []
    skills.forEach(sk => {
        if (!sk) return
        const title = (sk.getName && sk.getName()) || sk.name || 'Umiejętność'
        const desc = getEntityText(sk.getDescription ? sk.getDescription() : sk.description)

        items.push({
            id: sk.getId ? sk.getId() : String(sk.id || ''),
            title,
            description: desc,
            category: 'rules',
            type: 'skill',
            typeLabel: 'Umiejętność',
            icon: 'skill',
            badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: sk,
        })
    })

    // 9. Parameters (Parametry)
    const params = ctx.projectParameters || ctx.projectData?.projectParameters || []
    params.forEach(pm => {
        if (!pm) return
        const title = (pm.getName && pm.getName()) || pm.name || 'Parametr'
        const desc = getEntityText(pm.getDescription ? pm.getDescription() : pm.description)

        items.push({
            id: pm.getId ? pm.getId() : String(pm.id || ''),
            title,
            description: desc,
            category: 'rules',
            type: 'parameter',
            typeLabel: 'Parametr',
            icon: 'parameter',
            badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: pm,
        })
    })

    // 10. Features (Przymioty)
    const features = ctx.projectFeatures || ctx.projectData?.projectFeatures || []
    features.forEach(ft => {
        if (!ft) return
        const title = (ft.getName && ft.getName()) || ft.name || 'Przymiot'
        const desc = getEntityText(ft.getDescription ? ft.getDescription() : ft.description)

        items.push({
            id: ft.getId ? ft.getId() : String(ft.id || ''),
            title,
            description: desc,
            category: 'rules',
            type: 'feature',
            typeLabel: 'Przymiot',
            icon: 'feature',
            badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
            actionText: 'Otwórz szczegóły i opis',
            entity: ft,
        })
    })

    // 11. Tags
    const tags = ctx.projectTags || ctx.projectData?.projectTags || []
    tags.forEach(tg => {
        if (!tg) return
        const title = (tg.getName && tg.getName()) || tg.name || 'Tag'

        items.push({
            id: tg.getId ? tg.getId() : String(tg.id || ''),
            title,
            description: tg.getColor ? tg.getColor() : tg.color || '',
            category: 'tags',
            type: 'tag',
            typeLabel: 'Tag',
            icon: 'tag',
            badgeColor: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/30',
            actionText: 'Otwórz szczegóły',
            entity: tg,
        })
    })

    // 12. Main Hero (Player Character)
    const hero = ctx.playerCharacter || ctx.projectData?.playerCharacter
    if (hero) {
        const title = (hero.getName && hero.getName()) || hero.name || 'Główny Bohater'
        const desc = getEntityText(hero.getDescription ? hero.getDescription() : hero.description)

        items.push({
            id: hero.getId ? hero.getId() : 'main_hero',
            title,
            description: desc,
            category: 'characters',
            type: 'player_character',
            typeLabel: 'Bohater gracza',
            icon: 'character',
            badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
            actionText: 'Otwórz kartę bohatera',
            entity: hero,
        })
    }

    return items
}
