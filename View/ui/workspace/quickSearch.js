import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { updateTopBarUI } from './topBar.js'
import { updateRightSidebarUI } from './workspace.js'

let activeContext = null
let currentQuery = ''
let activeCategoryFilter = 'all'
let currentResults = []
let activeSelectedIndex = 0

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

    const wordBoundaryRegex = /[\s,.\-_/()§#[\]"':;]+/
    const titleWords = titleLower.split(wordBoundaryRegex).filter(Boolean)
    const descWords = descLower.split(wordBoundaryRegex).filter(Boolean)

    // Tier 1: Match at beginning of words in title / number
    // "po początku wyrazów"
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

    const wordPrefixIndex = titleWords.findIndex(w => w.startsWith(q))
    if (wordPrefixIndex !== -1) {
        return { matched: true, tier: 1, score: 20 + wordPrefixIndex * 2 + titleLower.length * 0.1 }
    }

    // Tier 2: Match inside a word in title
    // "następnie po frazie wewnątrz wyrazu"
    if (titleLower.includes(q)) {
        const pos = titleLower.indexOf(q)
        return { matched: true, tier: 2, score: 100 + pos + titleLower.length * 0.1 }
    }

    // Tier 3: Match at beginning of words in description
    const descPrefixIndex = descWords.findIndex(w => w.startsWith(q))
    if (descPrefixIndex !== -1) {
        return { matched: true, tier: 3, score: 200 + descPrefixIndex * 2 }
    }

    // Tier 4: Match inside a word in description
    if (descLower.includes(q)) {
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
    if (tagsList.some(t => t.toLowerCase().startsWith(q))) {
        return { matched: true, tier: 5, score: 500 }
    }
    if (tagsList.some(t => t.toLowerCase().includes(q))) {
        return { matched: true, tier: 5, score: 550 }
    }

    const loc = (candidate.locationName || '').toLowerCase()
    if (loc.startsWith(q) || loc.includes(q)) {
        return { matched: true, tier: 5, score: 600 }
    }

    const modifiersList = Array.isArray(candidate.modifiers) ? candidate.modifiers : []
    if (modifiersList.some(m => m.toLowerCase().includes(q))) {
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
    const allObjects = getAllProjectObjects(ctx)
    const trimmedQuery = (query || '').trim()

    let filtered = allObjects
    if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(item => item.category === categoryFilter)
    }

    const scored = []
    filtered.forEach(item => {
        const result = scoreCandidate(item, trimmedQuery)
        if (result.matched) {
            scored.push({
                item,
                tier: result.tier,
                score: result.score,
            })
        }
    })

    // Sort: Tier 1 (word prefix) always before Tier 2 (substring in word), then by score
    scored.sort((a, b) => {
        if (a.tier !== b.tier) {
            return a.tier - b.tier
        }
        return a.score - b.score
    })

    return scored.map(s => s.item)
}

/**
 * Executes navigation / selection for a chosen quick search result.
 * - If paragraph: centers and focuses graph view on the paragraph node and opens right details.
 * - If location/NPC/rule: opens right sidebar details and description.
 *
 * @param {object} item
 * @param {object} ctx
 */
export function executeQuickSearchAction(item, ctx, options = {}) {
    if (!item || !ctx) return

    const { type, entity, id } = item
    const shouldSwitchDrawerTab = options.switchDrawerTab !== false

    if (type === 'paragraph') {
        // 1. Switch to Graph View if not already active
        if (typeof ctx.showGraph === 'function') {
            ctx.showGraph(true)
        }
        if (ctx.vm && typeof ctx.vm.setActiveMainView === 'function') {
            ctx.vm.setActiveMainView('graph')
        }
        if (typeof ctx.updateMainWorkspaceUI === 'function') {
            ctx.updateMainWorkspaceUI(ctx)
        }
        if (typeof updateTopBarUI === 'function') {
            updateTopBarUI(ctx)
        }

        // 2. Open right sidebar so paragraph details and content are visible
        if (ctx.vm) {
            if (typeof ctx.vm.setRightSidebarCollapsed === 'function') {
                ctx.vm.setRightSidebarCollapsed(false)
            }
            if (typeof ctx.vm.setRightSidebarOpen === 'function') {
                ctx.vm.setRightSidebarOpen(true)
            }
        }
        const rightSidebar = document.getElementById('right-sidebar')
        const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
        const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
        if (typeof updateRightSidebarUI === 'function' && rightSidebar) {
            updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
        }

        const targetId = id || (entity?.getId && entity.getId()) || ''
        if (ctx.vm && typeof ctx.vm.setSelectedParagraphId === 'function') {
            ctx.vm.setSelectedParagraphId(targetId)
        }

        // 3. Select paragraph entity
        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(entity, 'paragraph')
        } else if (ctx.vm && typeof ctx.vm.selectElement === 'function') {
            ctx.vm.selectElement(entity, 'paragraph')
        }

        // 4. Focus and center graph on paragraph node
        if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.focusOnElement === 'function') {
            ctx.storyGraphInstance.focusOnElement(targetId, true)
        }

        // 5. Render details & history
        if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
        if (typeof ctx.renderHistoryBar === 'function') {
            ctx.renderHistoryBar(ctx)
        }

        toast.info(`Przeniesiono do paragrafu: ${item.title}`, 'Graf historii')
    } else if (type === 'scene') {
        // Scene: switch to graph, focus on scene, open details
        if (ctx.vm && typeof ctx.vm.setActiveMainView === 'function') {
            ctx.vm.setActiveMainView('graph')
        }
        if (typeof ctx.updateMainWorkspaceUI === 'function') {
            ctx.updateMainWorkspaceUI(ctx)
        }
        if (typeof updateTopBarUI === 'function') {
            updateTopBarUI(ctx)
        }

        if (ctx.vm && typeof ctx.vm.setRightSidebarCollapsed === 'function') {
            ctx.vm.setRightSidebarCollapsed(false)
        }
        const rightSidebar = document.getElementById('right-sidebar')
        const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
        const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
        if (typeof updateRightSidebarUI === 'function' && rightSidebar) {
            updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
        }

        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(entity, 'scene')
        } else if (ctx.vm && typeof ctx.vm.selectElement === 'function') {
            ctx.vm.selectElement(entity, 'scene')
        }

        const targetId = id || (entity.getId && entity.getId()) || ''
        if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.focusOnElement === 'function') {
            ctx.storyGraphInstance.focusOnElement(targetId, true)
        }

        if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
        if (typeof ctx.renderHistoryBar === 'function') {
            ctx.renderHistoryBar(ctx)
        }

        toast.info(`Wybrano scenę: ${item.title}`, 'Scena')
    } else {
        // Location, NPC, Template, Item, Stat, Skill, Parameter, Feature, Tag, Hero:
        // Open details and description!
        if (ctx.vm) {
            if (typeof ctx.vm.setRightSidebarCollapsed === 'function') {
                ctx.vm.setRightSidebarCollapsed(false)
            }
            if (typeof ctx.vm.setRightSidebarOpen === 'function') {
                ctx.vm.setRightSidebarOpen(true)
            }
        }
        const rightSidebar = document.getElementById('right-sidebar')
        const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
        const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
        if (typeof updateRightSidebarUI === 'function' && rightSidebar) {
            updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
        }

        // Switch left drawer to matching category tab if requested and drawer is open or available
        if (shouldSwitchDrawerTab && ctx.vm && typeof ctx.vm.toggleLeftTab === 'function') {
            if (type === 'character' || type === 'template') {
                ctx.vm.toggleLeftTab('characters')
            } else if (type === 'location') {
                ctx.vm.toggleLeftTab('locations')
            } else if (
                type === 'stat' ||
                type === 'skill' ||
                type === 'parameter' ||
                type === 'feature'
            ) {
                ctx.vm.toggleLeftTab('traits')
            } else if (type === 'tag') {
                ctx.vm.toggleLeftTab('paragraphs')
            }
            if (typeof ctx.updateLeftDrawerUI === 'function') {
                ctx.updateLeftDrawerUI()
            }
        }

        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(entity, type)
        } else if (ctx.vm && typeof ctx.vm.selectElement === 'function') {
            ctx.vm.selectElement(entity, type)
        }

        if (typeof ctx.renderHistoryBar === 'function') {
            ctx.renderHistoryBar(ctx)
        }
        if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }

        toast.info(`Otwarto szczegóły i opis: ${item.title}`, item.typeLabel)
    }
}

/**
 * Renders category filter buttons inside quick search modal.
 */
function renderCategoryFilters() {
    const container = document.getElementById('quick-search-category-filters')
    if (!container) return

    const categories = [
        { id: 'all', label: 'Wszystkie' },
        { id: 'paragraphs', label: 'Paragrafy' },
        { id: 'scenes', label: 'Sceny' },
        { id: 'characters', label: 'Postacie' },
        { id: 'locations', label: 'Lokacje' },
        { id: 'items', label: 'Przedmioty' },
        { id: 'rules', label: 'Cechy i Zasady' },
    ]

    container.innerHTML = categories
        .map(cat => {
            const isActive = activeCategoryFilter === cat.id
            return `
                <button
                    type="button"
                    class="quick-search-filter-btn px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer font-medium ${
                        isActive
                            ? 'bg-[#3d4e61] text-white border border-[#4a5e74] shadow-sm'
                            : 'bg-[#1e1f24] text-zinc-400 hover:text-zinc-200 hover:bg-[#25272e] border border-[#2e3037]'
                    }"
                    data-filter="${cat.id}"
                >${cat.label}</button>
            `
        })
        .join('')

    container.querySelectorAll('.quick-search-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategoryFilter = btn.dataset.filter || 'all'
            renderCategoryFilters()
            renderQuickSearchResults(activeContext, currentQuery)
        })
    })
}

/**
 * Renders the search results inside the modal list container.
 *
 * @param {object} ctx
 * @param {string} query
 */
export function renderQuickSearchResults(ctx, query) {
    const resultsContainer = document.getElementById('quick-search-results')
    const statsEl = document.getElementById('quick-search-stats')
    const clearBtn = document.getElementById('btn-quick-search-clear')

    if (!resultsContainer) return

    if (clearBtn) {
        if (query && query.trim()) {
            clearBtn.classList.remove('hidden')
        } else {
            clearBtn.classList.add('hidden')
        }
    }

    currentQuery = query || ''
    const results = searchProjectObjects(ctx, currentQuery, activeCategoryFilter)
    currentResults = results

    if (statsEl) {
        if (currentQuery.trim()) {
            statsEl.textContent = `Wyniki: ${results.length}`
        } else {
            statsEl.textContent = `Dostępne obiekty: ${results.length}`
        }
    }

    if (results.length === 0) {
        activeSelectedIndex = -1
        resultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center text-zinc-400 gap-2">
                <span class="opacity-50">${getIconSvg('search', 'w-8 h-8')}</span>
                <p class="text-xs font-medium text-zinc-300">Brak wyników dla frazy "${escapeHtml(currentQuery)}"</p>
                <p class="text-[11px] text-zinc-500">Spróbuj wpisać inną nazwę lub zmień filtr kategorii.</p>
            </div>
        `
        return
    }

    if (activeSelectedIndex >= results.length || activeSelectedIndex < 0) {
        activeSelectedIndex = 0
    }

    resultsContainer.innerHTML = results
        .map((item, idx) => {
            const isSelected = idx === activeSelectedIndex
            const highlightedTitle = highlightMatch(item.title, currentQuery)
            const highlightedDesc = highlightMatch(
                item.description ? item.description.slice(0, 90) : '',
                currentQuery
            )
            const iconSvg = getIconSvg(item.icon, 'w-4 h-4')

            return `
                <div
                    class="quick-search-item group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none ${
                        isSelected
                            ? 'bg-[#3d4e61]/35 border border-[#4a5e74] text-white ring-1 ring-[#5b738e]/40'
                            : 'bg-[#1e1f24] border border-[#2e3037] hover:bg-[#25272e] hover:border-[#4a5e74]/50 text-zinc-200'
                    }"
                    data-index="${idx}"
                    data-item-id="${escapeHtml(item.id)}"
                    data-item-type="${escapeHtml(item.type)}"
                >
                    <div class="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.badgeColor}">
                            ${iconSvg}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-zinc-100'}">
                                    ${highlightedTitle}
                                </span>
                                <span class="text-[10px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wider shrink-0 ${item.badgeColor}">
                                    ${item.typeLabel}
                                </span>
                            </div>
                            ${
                                highlightedDesc
                                    ? `<p class="text-[11px] text-zinc-400 truncate mt-0.5 leading-tight">${highlightedDesc}</p>`
                                    : ''
                            }
                        </div>
                    </div>
                    <div class="shrink-0 flex items-center gap-2">
                        <span class="text-[10px] font-medium px-2 py-0.5 rounded transition-opacity ${
                            isSelected
                                ? 'opacity-100 text-blue-300 bg-blue-500/20 border border-blue-500/30'
                                : 'opacity-0 group-hover:opacity-100 text-zinc-400 bg-zinc-800 border border-zinc-700'
                        }">
                            ↵ ${item.actionText}
                        </span>
                    </div>
                </div>
            `
        })
        .join('')

    // Attach click and mouseover listeners
    resultsContainer.querySelectorAll('.quick-search-item').forEach(el => {
        const index = Number(el.dataset.index)

        el.addEventListener('click', () => {
            const chosen = results[index]
            if (chosen) {
                closeQuickSearch()
                executeQuickSearchAction(chosen, ctx)
            }
        })

        el.addEventListener('mouseenter', () => {
            activeSelectedIndex = index
            updateActiveItemHighlight(resultsContainer)
        })
    })
}

/**
 * Updates CSS classes on items to reflect current keyboard active selection without re-rendering entire list.
 *
 * @param {HTMLElement} container
 */
function updateActiveItemHighlight(container) {
    if (!container) return
    const items = container.querySelectorAll('.quick-search-item')
    items.forEach((el, idx) => {
        const actionBadge = el.querySelector('span:last-child')
        if (idx === activeSelectedIndex) {
            el.className =
                'quick-search-item group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none bg-blue-600/20 border border-blue-500/40 text-white ring-1 ring-blue-500/30'
            if (actionBadge) {
                actionBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded transition-opacity opacity-100 text-blue-300 bg-blue-500/20 border border-blue-500/30'
            }
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        } else {
            el.className =
                'quick-search-item group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none bg-[#18181b]/80 border border-[#27272a] hover:bg-[#202025] hover:border-zinc-700 text-zinc-200'
            if (actionBadge) {
                actionBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded transition-opacity opacity-0 group-hover:opacity-100 text-zinc-400 bg-zinc-800 border border-zinc-700'
            }
        }
    })
}

/**
 * Opens the Quick Search spotlight modal.
 *
 * @param {object} ctx - Application Context
 */
export function openQuickSearch(ctx) {
    activeContext = ctx
    const modal = document.getElementById('modal-quick-search')
    if (modal) {
        modal.classList.remove('hidden')
        activeCategoryFilter = 'all'
        activeSelectedIndex = 0
        renderCategoryFilters()

        const input = document.getElementById('quick-search-input')
        if (input) {
            input.value = ''
            renderQuickSearchResults(ctx, '')
            setTimeout(() => {
                input.focus()
            }, 30)
        }
        return
    }

    // Graceful fallback if modal is not in DOM (e.g. legacy test environment)
    const searchInput = document.getElementById('search-input')
    if (searchInput) {
        if (
            ctx?.vm &&
            typeof ctx.vm.isLeftDrawerOpen === 'function' &&
            !ctx.vm.isLeftDrawerOpen()
        ) {
            ctx.vm.toggleLeftTab('paragraphs')
            if (typeof ctx.updateLeftDrawerUI === 'function') ctx.updateLeftDrawerUI()
        }
        searchInput.focus()
    } else {
        toast.info(t('topbar.buttons.search') || 'Szukaj')
    }
}

/**
 * Closes the Quick Search spotlight modal.
 */
export function closeQuickSearch() {
    const modal = document.getElementById('modal-quick-search')
    if (modal) {
        modal.classList.add('hidden')
    }
}

/**
 * Initializes Quick Search controller listeners and DOM bindings.
 *
 * @param {object} ctx - Application context
 */
export function initQuickSearch(ctx) {
    activeContext = ctx
    const modal = document.getElementById('modal-quick-search')
    const input = document.getElementById('quick-search-input')
    const clearBtn = document.getElementById('btn-quick-search-clear')

    if (input) {
        input.addEventListener('input', () => {
            activeSelectedIndex = 0
            renderQuickSearchResults(activeContext, input.value)
        })

        input.addEventListener('keydown', e => {
            const resultsContainer = document.getElementById('quick-search-results')
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (currentResults.length > 0) {
                    activeSelectedIndex = (activeSelectedIndex + 1) % currentResults.length
                    updateActiveItemHighlight(resultsContainer)
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (currentResults.length > 0) {
                    activeSelectedIndex =
                        (activeSelectedIndex - 1 + currentResults.length) % currentResults.length
                    updateActiveItemHighlight(resultsContainer)
                }
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (currentResults.length > 0 && activeSelectedIndex >= 0) {
                    const chosen = currentResults[activeSelectedIndex]
                    if (chosen) {
                        closeQuickSearch()
                        executeQuickSearchAction(chosen, activeContext)
                    }
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                closeQuickSearch()
            }
        })
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (input) {
                input.value = ''
                input.focus()
                activeSelectedIndex = 0
                renderQuickSearchResults(activeContext, '')
            }
        })
    }

    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                closeQuickSearch()
            }
        })
    }

    // Connect topbar quick-search buttons
    document.querySelectorAll('[data-action="quick-search"]').forEach(btn => {
        btn.onclick = e => {
            e.preventDefault()
            openQuickSearch(ctx)
        }
    })
}
