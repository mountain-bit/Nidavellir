/**
 * Compiler Extractors - Resolves entity text and extracts available player characters.
 */

/**
 * Resolves full narrative markdown content for an entity (Paragraph, Location, NPC, Item).
 * Strictly prioritizes actual Markdown files from ctx.files or disk over short summaries.
 *
 * @param {any} entityOrDesc
 * @param {object|null} [ctx=null]
 * @returns {string}
 */
export function extractText(entityOrDesc, ctx = null) {
    return extractEntityMarkdown(entityOrDesc, ctx)
}

export function extractEntityMarkdown(entity, ctx = null) {
    if (!entity) return ''
    if (typeof entity === 'string') return entity.trim()

    // 1. Resolve Description object or content container
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : entity.content && typeof entity.content === 'object'
                ? entity.content
                : entity.description && typeof entity.description === 'object'
                  ? entity.description
                  : null

    const rawFilePath =
        (desc && typeof desc.getFilePath === 'function' ? desc.getFilePath() : null) ||
        (desc && typeof desc.filePath === 'string' ? desc.filePath : null) ||
        (desc && typeof desc.textPath === 'string' ? desc.textPath : null) ||
        (typeof entity.getFilePath === 'function' ? entity.getFilePath() : null) ||
        (typeof entity.filePath === 'string' ? entity.filePath : null) ||
        ''

    const files = ctx?.files || ctx?.projectData?.files || {}
    const title =
        (typeof entity.getTitle === 'function' ? entity.getTitle() : null) ||
        (typeof entity.getName === 'function' ? entity.getName() : null) ||
        entity.title ||
        entity.name ||
        (typeof entity.getId === 'function' ? entity.getId() : entity.id) ||
        ''

    // 2. Check in files map using various path representations
    if (rawFilePath && files && typeof files === 'object') {
        const norm = rawFilePath.replace(/\\/g, '/')
        const base = norm.split('/').pop() || norm
        const baseNoExt = base.replace(/\.md$/i, '')

        const candidates = [
            rawFilePath,
            norm,
            norm.startsWith('./') ? norm.slice(2) : './' + norm,
            base,
            baseNoExt + '.md',
        ]

        for (const candidate of candidates) {
            if (typeof files[candidate] === 'string' && files[candidate].trim()) {
                return files[candidate].trim()
            }
        }
    }

    // 3. Check in files map by entity title or standard naming convention
    if (title && files && typeof files === 'object') {
        const cleanName = String(title)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\s-]+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')

        const possibleNames = [
            `${title}.md`,
            `${cleanName}.md`,
            `Description_Paragraph_${cleanName}.md`,
            `Description_NPC_${cleanName}.md`,
            `Description_Location_${cleanName}.md`,
            `Description_Item_${cleanName}.md`,
        ]

        for (const fn of possibleNames) {
            if (typeof files[fn] === 'string' && files[fn].trim()) {
                return files[fn].trim()
            }
        }

        // Fuzzy search in files keys
        const lowerClean = cleanName.toLowerCase()
        if (lowerClean) {
            for (const [k, val] of Object.entries(files)) {
                if (typeof val === 'string' && val.trim() && k.toLowerCase().endsWith('.md')) {
                    const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '')
                    if (normK.includes(lowerClean)) {
                        return val.trim()
                    }
                }
            }
        }
    }

    // 4. Try reading directly from disk if in Node/Electron environment with projectPath
    const projectPath =
        (typeof ctx?.getProjectPath === 'function' ? ctx.getProjectPath() : null) ||
        ctx?.projectPath ||
        (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
        ''
    if (rawFilePath && projectPath && typeof require === 'function') {
        try {
            const fs = require('fs')
            const path = require('path')
            const fullPath = path.resolve(projectPath, rawFilePath)
            if (fs.existsSync(fullPath)) {
                const diskContent = fs.readFileSync(fullPath, 'utf8')
                if (typeof diskContent === 'string' && diskContent.trim()) {
                    return diskContent.trim()
                }
            }
        } catch {
            // Non-fatal if require or fs is unavailable in browser context
        }
    }

    // 5. Look for narrative text on desc.getText() / entity.text
    // CRITICAL: Explicitly avoid returning the summary/streszczenie as narrative text!
    const summaryStr = (
        (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : '') ||
        (desc && typeof desc.summary === 'string' ? desc.summary : '') ||
        (typeof entity.getSummary === 'function' ? entity.getSummary() : '') ||
        (typeof entity.summary === 'string' ? entity.summary : '') ||
        ''
    ).trim()

    let narrativeText = ''
    if (desc && typeof desc.getText === 'function') {
        const t = desc.getText()
        if (typeof t === 'string' && t.trim()) narrativeText = t.trim()
    } else if (desc && typeof desc.text === 'string' && desc.text.trim()) {
        narrativeText = desc.text.trim()
    } else if (typeof entity.getText === 'function') {
        const t = entity.getText()
        if (typeof t === 'string' && t.trim()) narrativeText = t.trim()
    } else if (typeof entity.text === 'string' && entity.text.trim()) {
        narrativeText = entity.text.trim()
    }

    // If narrative text is present and differs from summary, return it
    if (narrativeText && narrativeText !== summaryStr) {
        return narrativeText
    }

    if (narrativeText) {
        return narrativeText
    }

    // Do NOT return summaryStr as narrative markdown! Return empty string.
    return ''
}

/**
 * Resolves all available player characters in the current project context.
 * Deduplicates by ID or name and filters out empty or unconfigured entries.
 *
 * @param {object} ctx
 * @returns {Array<object>}
 */
export function getAvailablePlayerCharacters(ctx) {
    if (!ctx) return []
    const heroes = []
    const seenIds = new Set()

    const addHero = h => {
        if (!h || typeof h !== 'object') return
        const rawName =
            typeof h.getName === 'function'
                ? h.getName()
                : h.name || h.imie || h.title || h.label || ''
        const name = typeof rawName === 'string' ? rawName.trim() : String(rawName || '').trim()
        const rawId =
            typeof h.getId === 'function' ? h.getId() : h.id || h.identifier || h.uuid || ''
        const id = rawId !== undefined && rawId !== null ? String(rawId).trim() : ''

        // Check if hero has any substance (stats, parameters, skills, class, items)
        const hasStats =
            (typeof h.getStats === 'function' ? h.getStats() : h.stats)?.length > 0 ||
            (typeof h.getParameters === 'function' ? h.getParameters() : h.parameters)?.length >
                0 ||
            (typeof h.getSkills === 'function' ? h.getSkills() : h.skills)?.length > 0 ||
            (typeof h.getItems === 'function' ? h.getItems() : h.items)?.length > 0 ||
            Boolean(
                typeof h.getCharacterClass === 'function' ? h.getCharacterClass() : h.characterClass
            )

        // Ignore empty objects that have no name, no id, and no stats
        if (!name && !id && !hasStats) return

        const effectiveKey = id || name || `hero_${heroes.length}`
        if (seenIds.has(effectiveKey)) return
        seenIds.add(effectiveKey)
        heroes.push(h)
    }

    // Inspect all candidate sources without short-circuiting on empty arrays:
    const candidateSources = [
        ctx?.projectData?.entities?.PlayerCharacter,
        ctx?.projectData?.entities?.PostacGracza,
        ctx?.entities?.PlayerCharacter,
        ctx?.entities?.PostacGracza,
        ctx?.projectData?.playerCharacters,
        ctx?.playerCharacters,
        typeof ctx?.vm?.project?.getPlayerCharacters === 'function'
            ? ctx.vm.project.getPlayerCharacters()
            : null,
        typeof ctx?.project?.getPlayerCharacters === 'function'
            ? ctx.project.getPlayerCharacters()
            : null,
        ctx?.projectData?.playerCharacter,
        ctx?.playerCharacter,
        typeof ctx?.vm?.project?.getPlayerCharacter === 'function'
            ? ctx.vm.project.getPlayerCharacter()
            : null,
        typeof ctx?.project?.getPlayerCharacter === 'function'
            ? ctx.project.getPlayerCharacter()
            : null,
    ]

    // Also check ProjectManager singleton if accessible in window or global scope
    try {
        const pmProject =
            (typeof window !== 'undefined' &&
                window?.ProjectManager?.getInstance?.()?.getProject?.()) ||
            (typeof globalThis !== 'undefined' &&
                globalThis?.ProjectManager?.getInstance?.()?.getProject?.())
        if (pmProject) {
            if (typeof pmProject.getPlayerCharacters === 'function') {
                candidateSources.push(pmProject.getPlayerCharacters())
            }
            if (typeof pmProject.getPlayerCharacter === 'function') {
                candidateSources.push(pmProject.getPlayerCharacter())
            }
        }
    } catch {
        // ignore ProjectManager access error in restricted test environments
    }

    for (const src of candidateSources) {
        if (!src) continue
        if (Array.isArray(src)) {
            for (const item of src) {
                addHero(item)
            }
        } else {
            addHero(src)
        }
    }

    return heroes
}
