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
        if (!h) return
        const name = (typeof h.getName === 'function' ? h.getName() : h.name || '').trim()
        if (!name) return
        const id = (typeof h.getId === 'function' ? h.getId() : h.id) || name
        if (seenIds.has(id)) return
        seenIds.add(id)
        heroes.push(h)
    }

    // 1. Check ctx.projectData.entities.PlayerCharacter or ctx.entities.PlayerCharacter
    const rawEntities =
        ctx?.projectData?.entities?.PlayerCharacter ||
        ctx?.projectData?.entities?.PostacGracza ||
        ctx?.entities?.PlayerCharacter ||
        ctx?.entities?.PostacGracza ||
        []
    if (Array.isArray(rawEntities)) {
        rawEntities.forEach(addHero)
    }

    // 2. Check ctx.projectData.playerCharacters or ctx.playerCharacters or vm.project.getPlayerCharacters
    const pcList =
        ctx?.projectData?.playerCharacters ||
        ctx?.playerCharacters ||
        (ctx?.vm?.project?.getPlayerCharacters ? ctx.vm.project.getPlayerCharacters() : null) ||
        []
    if (Array.isArray(pcList)) {
        pcList.forEach(addHero)
    }

    // 3. Check single playerCharacter fallback
    const singlePc =
        ctx?.projectData?.playerCharacter ||
        ctx?.playerCharacter ||
        (ctx?.vm?.project?.getPlayerCharacter ? ctx.vm.project.getPlayerCharacter() : null)
    if (singlePc) {
        addHero(singlePc)
    }

    return heroes
}

/**
 * Compiles a comprehensive character sheet object from a PlayerCharacter domain model or raw object.
 * Extracts actual stats, skills, parameters/vitals, items, and attributes.
 *
 * @param {object} hero
 * @returns {object|null}
 */
export function compileCharacterSheet(hero) {
    if (!hero) return null
    const name =
        (typeof hero.getName === 'function' ? hero.getName() : hero.name) || 'Bezimienny Bohater'

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

    // Stats (cechy główne)
    const rawStats = (typeof hero.getStats === 'function' ? hero.getStats() : hero.stats) || []
    const stats = rawStats.map(s => ({
        name: (typeof s.getName === 'function' ? s.getName() : s.name) || 'Cecha',
        value: typeof s.getValue === 'function' ? s.getValue() : (s.value ?? ''),
    }))

    // Parameters (parametry życiowe i zasoby, np. Zdrowie, Złoto, Mana)
    const rawParams =
        (typeof hero.getParameters === 'function' ? hero.getParameters() : hero.parameters) || []
    const parameters = rawParams.map(p => ({
        name: (typeof p.getName === 'function' ? p.getName() : p.name) || 'Wskaźnik',
        value: typeof p.getValue === 'function' ? p.getValue() : (p.value ?? ''),
        currentValue:
            typeof p.getCurrentValue === 'function' ? p.getCurrentValue() : (p.currentValue ?? ''),
        maxValue: typeof p.getMaxValue === 'function' ? p.getMaxValue() : (p.maxValue ?? ''),
    }))

    // Skills (umiejętności)
    const rawSkills = (typeof hero.getSkills === 'function' ? hero.getSkills() : hero.skills) || []
    const skills = rawSkills.map(sk => ({
        name: (typeof sk.getName === 'function' ? sk.getName() : sk.name) || 'Umiejętność',
        value: typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? ''),
    }))

    // Features (cechy specjalne i atuty)
    const rawFeatures =
        (typeof hero.getFeatures === 'function' ? hero.getFeatures() : hero.features) || []
    const features = rawFeatures.map(f => ({
        name: (typeof f.getName === 'function' ? f.getName() : f.name) || 'Zdolność',
        description:
            (typeof f.getDescription === 'function'
                ? f.getDescription()?.getText?.() || f.getDescription()?.getSummary?.()
                : f.description) || '',
    }))

    // Items (ekwipunek początkowy)
    const rawItems = (typeof hero.getItems === 'function' ? hero.getItems() : hero.items) || []
    const items = rawItems.map(i => ({
        name: (typeof i.getName === 'function' ? i.getName() : i.name) || 'Przedmiot',
    }))

    // Inventories (wielokrotny ekwipunek)
    const rawInventories =
        (typeof hero.getInventories === 'function' ? hero.getInventories() : hero.inventories) || []
    const inventories = rawInventories.map(inv => {
        const invName =
            (typeof inv.getName === 'function' ? inv.getName() : inv.name) || 'Ekwipunek'
        const invCapacity =
            typeof inv.getCapacity === 'function' ? inv.getCapacity() : (inv.capacity ?? 0)
        const invItemsRaw = (typeof inv.getItems === 'function' ? inv.getItems() : inv.items) || []
        const invItems = invItemsRaw.map(i => ({
            name: (typeof i.getName === 'function' ? i.getName() : i.name) || 'Przedmiot',
            description:
                (typeof i.getDescription === 'function' ? i.getDescription() : i.description) || '',
        }))
        return {
            id: (typeof inv.getId === 'function' ? inv.getId() : inv.id) || '',
            name: invName,
            capacity: Number(invCapacity) || 0,
            items: invItems,
        }
    })

    // Tags
    const rawTags = (typeof hero.getTags === 'function' ? hero.getTags() : hero.tags) || []
    const tags = rawTags.map(t =>
        typeof t.getName === 'function' ? t.getName() : t.name || String(t)
    )

    return {
        id: (typeof hero.getId === 'function' ? hero.getId() : hero.id) || name,
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

/**
 * Compiles project data according to user export options.
 *
 * @param {object} ctx - Application context
 * @param {object} options - Export options
 * @param {object} styleConfig - Active style configuration
 * @returns {object} Compiled gamebook model
 */
export function compileGamebook(ctx, options = {}, styleConfig = {}) {
    const rawParagraphs =
        ctx?.projectData?.projectParagraphs ||
        ctx?.projectParagraphs ||
        ctx?.vm?.project?.paragraphs ||
        []
    const rawLocations =
        ctx?.projectData?.projectLocations ||
        ctx?.projectData?.locations ||
        ctx?.projectLocations ||
        ctx?.vm?.project?.locations ||
        []
    const rawNpcs =
        ctx?.projectData?.projectCharacters ||
        ctx?.projectData?.npcs ||
        ctx?.projectCharacters ||
        ctx?.vm?.project?.characters ||
        []
    const rawItems =
        ctx?.projectData?.projectItems ||
        ctx?.projectData?.items ||
        ctx?.projectItems ||
        ctx?.vm?.project?.items ||
        []
    const rawRules = ctx?.projectData?.rules || ctx?.projectData?.projectRules || []

    const projectName =
        document.getElementById('project-name-display')?.textContent?.trim() ||
        ctx?.vm?.project?.getName?.() ||
        'Moja Gra Paragrafowa'

    // 1. Process paragraphs and numbering
    const compiledParagraphs = processParagraphs(rawParagraphs, options.shuffleParagraphs, ctx)

    // 2. Sections: Locations, NPCs, Items, Glossary
    const startSections = []
    const endSections = []

    // Helper to resolve entity file path
    const getEntityFilePath = ent => {
        const desc =
            typeof ent.getContent === 'function'
                ? ent.getContent()
                : typeof ent.getDescription === 'function'
                  ? ent.getDescription()
                  : ent.content || ent.description
        return (
            (desc && typeof desc.getFilePath === 'function' ? desc.getFilePath() : null) ||
            desc?.filePath ||
            desc?.textPath ||
            ent?.filePath ||
            ''
        )
    }

    // Locations
    if (options.includeLocations && rawLocations.length > 0) {
        const locSection = {
            title: 'Atlas Świata i Lokacje',
            type: 'locations',
            items: rawLocations.map(l => ({
                id: (typeof l.getId === 'function' ? l.getId() : l.id) || '',
                name:
                    (typeof l.getName === 'function' ? l.getName() : l.name) || 'Nieznana lokacja',
                description: extractEntityMarkdown(l, ctx),
                filePath: getEntityFilePath(l),
            })),
        }
        if (options.locationsPlacement === 'start') startSections.push(locSection)
        else endSections.push(locSection)
    }

    // NPCs
    if (options.includeNPCs && rawNpcs.length > 0) {
        const npcSection = {
            title: 'Dramatis Personae / Bestiariusz',
            type: 'npcs',
            items: rawNpcs.map(n => ({
                id: (typeof n.getId === 'function' ? n.getId() : n.id) || '',
                name: (typeof n.getName === 'function' ? n.getName() : n.name) || 'Postać',
                description: extractEntityMarkdown(n, ctx),
                filePath: getEntityFilePath(n),
            })),
        }
        if (options.npcsPlacement === 'start') startSections.push(npcSection)
        else endSections.push(npcSection)
    }

    // Items
    if (options.includeItems && rawItems.length > 0) {
        const itemSection = {
            title: 'Katalog Przedmiotów i Artefaktów',
            type: 'items',
            items: rawItems.map(i => ({
                id: (typeof i.getId === 'function' ? i.getId() : i.id) || '',
                name: (typeof i.getName === 'function' ? i.getName() : i.name) || 'Przedmiot',
                description: extractEntityMarkdown(i, ctx),
                filePath: getEntityFilePath(i),
            })),
        }
        if (options.itemsPlacement === 'start') startSections.push(itemSection)
        else endSections.push(itemSection)
    }

    // Glossary
    if (options.includeGlossary) {
        const glossaryItems = extractGlossary(ctx)
        if (glossaryItems.length > 0) {
            const glossarySection = {
                title: 'Glosariusz i Słowniczek Pojęć',
                type: 'glossary',
                items: glossaryItems,
            }
            if (options.glossaryPlacement === 'start') startSections.push(glossarySection)
            else endSections.push(glossarySection)
        }
    }

    // Rules
    let rulesContent = ''
    if (options.includeRules && rawRules.length > 0) {
        rulesContent = rawRules
            .map(r => `${r.title || r.name || 'Zasada'}:\n${r.content || r.description || ''}`)
            .join('\n\n')
    }

    // Character Sheet(s)
    const availableHeroes = getAvailablePlayerCharacters(ctx)
    let characterSheets = []

    if (options.includeCharacterSheet && availableHeroes.length > 0) {
        if (Array.isArray(options.selectedHeroIds) && options.selectedHeroIds.length > 0) {
            const filtered = availableHeroes.filter(h => {
                const hId =
                    (typeof h.getId === 'function' ? h.getId() : h.id) ||
                    (typeof h.getName === 'function' ? h.getName() : h.name)
                return options.selectedHeroIds.includes(hId)
            })
            characterSheets = (filtered.length > 0 ? filtered : availableHeroes).map(
                compileCharacterSheet
            )
        } else {
            characterSheets = availableHeroes.map(compileCharacterSheet)
        }
    }

    const paragraphMap = {}
    for (const p of compiledParagraphs) {
        if (p.id) {
            paragraphMap[p.id] = p.displayNumber
        }
    }

    return {
        title: projectName,
        author: ctx?.projectData?.author || 'Autor',
        includeCoverPage: options.includeCoverPage !== false,
        rulesContent,
        characterSheet: characterSheets[0] || null,
        characterSheets,
        startSections,
        endSections,
        paragraphs: compiledParagraphs,
        paragraphMap,
        styleConfig,
    }
}

/**
 * Normalizes and optionally shuffles paragraph numbering while respecting locks.
 * Strictly guarantees that paragraph numbers span 1 to N (where N is the total paragraphs count),
 * with paragraph 1 assigned to the starting paragraph, no duplicates, no gaps, and no numbers exceeding N.
 */
function processParagraphs(paragraphs, shuffle = false, ctx = null) {
    if (!paragraphs || paragraphs.length === 0) return []

    // Filter valid paragraphs
    const validParagraphs = paragraphs.filter(Boolean)
    const total = validParagraphs.length
    if (total === 0) return []

    // Map of paragraph original IDs/references
    const pList = validParagraphs.map((p, idx) => {
        const id = p.getId ? p.getId() : p.id || `p-${idx}`
        const isLocked =
            typeof p.getIsNumberLocked === 'function' ? p.getIsNumberLocked() : !!p.isNumberLocked
        const currentNum =
            typeof p.getDisplayNumber === 'function'
                ? p.getDisplayNumber()
                : typeof p.getNumber === 'function'
                  ? p.getNumber()
                  : p.number || idx + 1

        const text = extractEntityMarkdown(p, ctx)
        const desc =
            typeof p.getContent === 'function'
                ? p.getContent()
                : typeof p.getDescription === 'function'
                  ? p.getDescription()
                  : p.content || p.description
        const rawFilePath =
            (desc && typeof desc.getFilePath === 'function' ? desc.getFilePath() : null) ||
            desc?.filePath ||
            desc?.textPath ||
            p?.filePath ||
            ''

        const rawChoices = (p.getChoices ? p.getChoices() : p.choices) || []
        const choices = rawChoices.map(ch => {
            const cond = typeof ch.getCondition === 'function' ? ch.getCondition() : ch.condition
            const condSummary =
                cond && typeof cond.getSummary === 'function'
                    ? cond.getSummary()
                    : cond?.text || cond?.name || ''
            const costs = typeof ch.getCosts === 'function' ? ch.getCosts() : ch.costs || []
            const rewards = typeof ch.getRewards === 'function' ? ch.getRewards() : ch.rewards || []
            const diceCheck =
                typeof ch.getDiceCheck === 'function' ? ch.getDiceCheck() : ch.diceCheck || null

            return {
                text:
                    (typeof ch.getName === 'function' ? ch.getName() : null) ||
                    (typeof ch.getTitle === 'function' ? ch.getTitle() : null) ||
                    (typeof ch.getText === 'function' ? ch.getText() : null) ||
                    ch.name ||
                    ch.title ||
                    ch.text ||
                    'Wybierz',
                targetId:
                    (typeof ch.getTargetId === 'function' ? ch.getTargetId() : null) ||
                    (typeof ch.getToParagraphId === 'function' ? ch.getToParagraphId() : null) ||
                    (typeof ch.getTargetParagraphId === 'function'
                        ? ch.getTargetParagraphId()
                        : null) ||
                    ch.targetId ||
                    ch.toParagraphId ||
                    ch.targetParagraphId ||
                    '',
                targetNumber:
                    (typeof ch.getTargetNumber === 'function' ? ch.getTargetNumber() : null) ||
                    ch.targetNumber ||
                    null,
                conditionSummary: condSummary,
                costs,
                rewards,
                diceCheck,
            }
        })

        const isStart =
            (typeof p.getIsStart === 'function' ? p.getIsStart() : p.isStartNode || p.isStart) ||
            false

        return {
            id,
            isLocked,
            originalNum:
                typeof currentNum === 'number' && Number.isInteger(currentNum) ? currentNum : null,
            isStart,
            text,
            filePath: rawFilePath,
            choices,
        }
    })

    const idToNewNumber = new Map()
    const claimedNumbers = new Set()

    // 1. Identify start node (must always receive number 1)
    let startIdx = pList.findIndex(p => p.isStart)
    if (startIdx < 0) {
        startIdx = 0
    }
    const startP = pList[startIdx]
    idToNewNumber.set(startP.id, 1)
    claimedNumbers.add(1)

    // 2. Process locked paragraphs whose locked numbers are valid integers within [1, total]
    pList.forEach(p => {
        if (p.id === startP.id) return
        if (p.isLocked && p.originalNum !== null) {
            // Strictly check that the locked number is within 1 to N and not already claimed
            if (
                p.originalNum >= 1 &&
                p.originalNum <= total &&
                !claimedNumbers.has(p.originalNum)
            ) {
                idToNewNumber.set(p.id, p.originalNum)
                claimedNumbers.add(p.originalNum)
            }
        }
    })

    // 3. Gather remaining available numbers strictly from 1 to total (1 to N)
    const availableNumbers = []
    for (let n = 1; n <= total; n++) {
        if (!claimedNumbers.has(n)) {
            availableNumbers.push(n)
        }
    }

    // 4. Assign numbers to remaining unlocked paragraphs
    if (shuffle) {
        // Shuffle available pool using Fisher-Yates
        for (let i = availableNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]]
        }
    }

    // Assign available numbers in order (shuffled if shuffle=true, sequential ascending if shuffle=false)
    let availIdx = 0
    pList.forEach(p => {
        if (!idToNewNumber.has(p.id)) {
            const assignedNum = availableNumbers[availIdx++]
            idToNewNumber.set(p.id, assignedNum)
        }
    })

    // Also build a fallback map of original numbers to new numbers for choices that only recorded targetNumber
    const oldNumToNewNum = new Map()
    pList.forEach(p => {
        if (p.originalNum !== null && idToNewNumber.has(p.id)) {
            oldNumToNewNum.set(p.originalNum, idToNewNumber.get(p.id))
        }
    })

    // 5. Re-link choices to display numbers and sort paragraphs by presentation number
    const finalParagraphs = pList.map(p => {
        const myDisplayNumber = idToNewNumber.get(p.id) || 1
        const resolvedChoices = p.choices.map(ch => {
            let targetNum = ch.targetNumber
            if (ch.targetId && idToNewNumber.has(ch.targetId)) {
                targetNum = idToNewNumber.get(ch.targetId)
            } else if (targetNum && oldNumToNewNum.has(targetNum)) {
                targetNum = oldNumToNewNum.get(targetNum)
            }

            let resolvedDiceCheck = null
            if (ch.diceCheck && Array.isArray(ch.diceCheck.branches)) {
                resolvedDiceCheck = {
                    ...ch.diceCheck,
                    branches: ch.diceCheck.branches.map(b => {
                        let bTargetNum = null
                        if (b.targetParagraphId && idToNewNumber.has(b.targetParagraphId)) {
                            bTargetNum = idToNewNumber.get(b.targetParagraphId)
                        } else if (b.targetNumber && oldNumToNewNum.has(b.targetNumber)) {
                            bTargetNum = oldNumToNewNum.get(b.targetNumber)
                        }
                        return {
                            ...b,
                            targetNumber: bTargetNum,
                        }
                    }),
                }
            }

            return {
                text: ch.text,
                targetNumber: targetNum,
                conditionSummary: ch.conditionSummary,
                costs: ch.costs,
                rewards: ch.rewards,
                diceCheck: resolvedDiceCheck,
            }
        })

        return {
            id: p.id,
            displayNumber: myDisplayNumber,
            text: p.text,
            filePath: p.filePath,
            choices: resolvedChoices,
        }
    })

    // Sort by presentation number ascending so reading order is strictly 1, 2, ..., N
    finalParagraphs.sort((a, b) => a.displayNumber - b.displayNumber)

    return finalParagraphs
}

/**
 * Extracts and consolidates glossary items from tags and descriptions.
 */
function extractGlossary(ctx) {
    const items = []
    const seen = new Set()

    const tags =
        ctx?.projectData?.projectTags ||
        ctx?.projectData?.tags ||
        ctx?.projectTags ||
        ctx?.vm?.project?.tags ||
        []
    tags.forEach(t => {
        const name = (typeof t.getName === 'function' ? t.getName() : null) || t.name || t.tag || t
        if (typeof name === 'string' && name.trim() && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase())
            const descText =
                (typeof t.getDescription === 'function'
                    ? extractEntityMarkdown(t.getDescription(), ctx)
                    : null) ||
                (typeof t.description === 'string' ? t.description : '') ||
                'Pojęcie kluczowe świata gry.'
            items.push({
                name: name.trim(),
                description: descText,
            })
        }
    })

    items.sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    return items
}

/**
 * Parses raw combat markdown block into structured fields (opponents, headers, outcomes).
 *
 * @param {string} combatText
 * @param {object|Map} [paragraphMap={}]
 * @returns {object}
 */
/**
 * Strips emoji characters from text to ensure clean literary book typography.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripEmojis(text) {
    if (!text) return ''
    return String(text)
        .replace(
            /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
            ''
        )
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

/**
 * Parses raw combat markdown block into structured fields (opponents, headers, outcomes).
 *
 * @param {string} combatText
 * @param {object|Map} [paragraphMap={}]
 * @returns {object}
 */
export function parseCombatBlock(combatText, paragraphMap = {}) {
    const raw = stripEmojis(combatText || '')
    const titleMatch = raw.match(/###\s*(?:Starcie:\s*)?([^\n\r]+)/i)
    const title = stripEmojis(titleMatch ? titleMatch[1].trim() : 'Starcie')

    // Extract table lines
    const lines = raw.split(/\r?\n/)
    const tableLines = lines.filter(l => {
        const t = l.trim()
        return t.startsWith('|') && t.endsWith('|')
    })

    let headers = []
    const rows = []

    if (tableLines.length >= 2) {
        headers = tableLines[0]
            .split('|')
            .map(c => stripEmojis(c.trim()))
            .filter((c, i, a) => i > 0 && i < a.length - 1)

        // Ignore separator row (index 1)
        for (let i = 2; i < tableLines.length; i++) {
            const cells = tableLines[i]
                .split('|')
                .map(c => stripEmojis(c.trim()))
                .filter((c, idx, a) => idx > 0 && idx < a.length - 1)
            if (cells.length > 0) {
                rows.push(cells)
            }
        }
    }

    // Extract outcomes
    const outcomes = []
    const outcomeRegex = /-\s*\*\*([^*]+)\*\*\s*→\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.*))/g
    let match
    while ((match = outcomeRegex.exec(raw)) !== null) {
        const name = stripEmojis(match[1].trim())
        const linkText = stripEmojis((match[2] || match[4] || '').trim())
        const targetUrl = (match[3] || '').trim()

        let targetNumber = null
        if (targetUrl) {
            const pMatch = targetUrl.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
            if (pMatch) {
                const targetId = pMatch[1]
                targetNumber =
                    paragraphMap[targetId] ||
                    (typeof paragraphMap.get === 'function' ? paragraphMap.get(targetId) : null)
            }
        }
        if (!targetNumber) {
            const numMatch = linkText.match(/§\s*(\d+)/) || linkText.match(/(\d+)/)
            if (numMatch) {
                targetNumber = parseInt(numMatch[1], 10)
            }
        }

        let cleanTarget = linkText
            .replace(/entity:\/\/[^)]+/g, '')
            .replace(/[()[\]]/g, '')
            .trim()

        if (targetNumber) {
            cleanTarget = `Przejdź do § ${targetNumber}`
        }

        outcomes.push({
            name,
            targetNumber,
            targetText:
                cleanTarget || (targetNumber ? `Przejdź do § ${targetNumber}` : 'Koniec starcia'),
        })
    }

    return {
        title,
        headers,
        rows,
        outcomes,
        hasOpponents: rows.length > 0,
        raw,
    }
}

/**
 * Renders parsed combat data into semantic, publication-styled HTML without emojis.
 *
 * @param {object} combatData
 * @param {object|Map} [paragraphMap={}]
 * @returns {string}
 */
export function renderCombatHtml(combatData, paragraphMap = {}) {
    const oppTableHtml = combatData.hasOpponents
        ? `
        <table class="combat-opponents-table">
            <thead>
                <tr>
                    ${combatData.headers
                        .map(
                            (h, idx) =>
                                `<th class="${idx === 0 ? 'text-left' : 'text-center'}">${escapeHtml(h)}</th>`
                        )
                        .join('')}
                </tr>
            </thead>
            <tbody>
                ${combatData.rows
                    .map(
                        row => `
                    <tr>
                        ${row
                            .map(
                                (c, idx) =>
                                    `<td class="${idx === 0 ? 'opponent-name' : 'opponent-stat'}">${escapeHtml(c)}</td>`
                            )
                            .join('')}
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
        `
        : ''

    const outcomesHtml =
        combatData.outcomes && combatData.outcomes.length > 0
            ? `
        <div class="combat-outcomes">
            <div class="combat-outcomes-title">Możliwe wyniki walki:</div>
            <ul class="combat-outcomes-list">
                ${combatData.outcomes
                    .map(
                        o => `
                    <li>
                        <span class="outcome-marker">—</span>
                        <span class="outcome-name"><strong>${escapeHtml(o.name)}</strong>:</span>
                        <span class="outcome-target">${escapeHtml(o.targetText)}</span>
                    </li>
                `
                    )
                    .join('')}
            </ul>
        </div>
        `
            : ''

    let plainContentHtml = ''
    if (!combatData.hasOpponents && (!combatData.outcomes || combatData.outcomes.length === 0)) {
        const cleanBody = combatData.raw
            .replace(/###\s*[^\n\r]+/g, '')
            .replace(/---/g, '')
            .trim()
        if (cleanBody) {
            plainContentHtml = `<div class="combat-body">${formatInlineMarkdown(cleanBody, paragraphMap)}</div>`
        }
    }

    return `
    <div class="gamebook-combat-card gamebook-combat-box">
        <div class="combat-card-header">
            <span class="combat-badge">STARCIE: ${escapeHtml(combatData.title.toUpperCase())}</span>
        </div>
        ${oppTableHtml}
        ${outcomesHtml}
        ${plainContentHtml}
    </div>
    `
}

/**
 * Formats inline markdown, resolving entity mentions, embeds, and paragraph references into styled HTML elements without emojis.
 *
 * @param {string} str
 * @param {object|Map} [paragraphMap={}]
 * @returns {string}
 */
export function formatInlineMarkdown(str, paragraphMap = {}) {
    if (!str) return ''

    let s = str

    // Links: [label](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, rawLabel, rawUrl) => {
        const url = rawUrl.trim()
        const label = stripEmojis(rawLabel.trim())

        // 1. Paragraph link: entity://paragraph/targetId
        const pMatch = url.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
        if (pMatch) {
            const targetId = pMatch[1]
            const targetNum =
                paragraphMap[targetId] ||
                (typeof paragraphMap.get === 'function' ? paragraphMap.get(targetId) : null)

            if (targetNum) {
                if (/^§?\s*\d+/.test(label)) {
                    const cleanLabel = label.replace(/^§?\s*\d+\s*:?\s*/, '').trim()
                    return cleanLabel
                        ? `<span class="gamebook-entity gamebook-entity-paragraph">§ ${targetNum} (${escapeHtml(cleanLabel)})</span>`
                        : `<span class="gamebook-entity gamebook-entity-paragraph">§ ${targetNum}</span>`
                }
                return `<span class="gamebook-entity gamebook-entity-paragraph">${escapeHtml(label)} (→ § ${targetNum})</span>`
            }
            return `<span class="gamebook-entity gamebook-entity-paragraph">${escapeHtml(label)}</span>`
        }

        // 2. Entity link: entity://(location|character|npc|item|tag|trait)/id
        const eMatch = url.match(/^entity:\/\/(location|character|npc|item|tag|trait)\/([^/?#]+)$/)
        if (eMatch) {
            const type =
                eMatch[1] === 'npc' ? 'character' : eMatch[1] === 'trait' ? 'tag' : eMatch[1]
            const cleanLabel = label.replace(/^Opis:\s*/i, '').trim()

            return `<span class="gamebook-entity gamebook-entity-${type}"><span class="entity-name">${escapeHtml(cleanLabel)}</span></span>`
        }

        // 3. Embed link: embed://(location|character|npc|item)/id...
        const embedMatch = url.match(/^embed:\/\/(location|character|npc|item)\/([^/?#]+)/)
        if (embedMatch) {
            const type = embedMatch[1] === 'npc' ? 'character' : embedMatch[1]
            const cleanLabel = label.replace(/^Opis:\s*/i, '').trim()

            return `<span class="gamebook-entity gamebook-entity-${type}"><span class="entity-name">${escapeHtml(cleanLabel)}</span></span>`
        }

        // 4. External link or other
        return `<span class="gamebook-link">${escapeHtml(label)}</span>`
    })

    // Legacy embed macros {{embed:type:id...}}
    s = s.replace(
        /\{\{embed:(item|character|location):([^:}]+)(?::[^}]+)?\}\}/g,
        (_m, type, id) => {
            return `<span class="gamebook-entity gamebook-entity-${type}"><span class="entity-name">${escapeHtml(stripEmojis(id))}</span></span>`
        }
    )

    // Strip any lingering emojis from prose
    s = stripEmojis(s)

    // Bold & italic
    s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
    s = s.replace(/`([^`]+)`/g, '<code class="gamebook-code">$1</code>')

    return s
}

/**
 * Converts standard Markdown to semantic print-safe HTML with styled combat and entities.
 *
 * @param {string} mdText
 * @param {object|Map} [paragraphMap={}]
 * @returns {string}
 */
export function markdownToHtml(mdText, paragraphMap = {}) {
    if (!mdText) return ''
    let text = String(mdText).replace(/\r\n/g, '\n')

    // Clean TipTap dialog tags
    text = text.replace(/<p\s+class="gamebook-dialog"[^>]*>([\s\S]*?)<\/p>/gi, '\n\n— $1\n\n')

    // Extract and render combat blocks
    const combatRegex =
        /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})([\s\S]*?)(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/gi
    const combatCards = []

    text = text.replace(combatRegex, (_match, combatContent) => {
        const combatData = parseCombatBlock(combatContent, paragraphMap)
        const rendered = renderCombatHtml(combatData, paragraphMap)
        const idx = combatCards.length
        combatCards.push(rendered)
        return `\n\n___COMBAT_PLACEHOLDER_${idx}___\n\n`
    })

    const rawBlocks = text.split(/\n\n+/)
    const htmlBlocks = []

    for (let block of rawBlocks) {
        block = block.trim()
        if (!block) continue

        // Restore combat card
        const combatMatch = block.match(/^___COMBAT_PLACEHOLDER_(\d+)___$/)
        if (combatMatch) {
            const idx = parseInt(combatMatch[1], 10)
            if (combatCards[idx]) {
                htmlBlocks.push(combatCards[idx])
            }
            continue
        }

        // Headings: #, ##, ###, ####
        const hMatch = block.match(/^(#{1,6})\s+(.+)$/)
        if (hMatch) {
            const level = Math.min(hMatch[1].length + 1, 4)
            htmlBlocks.push(
                `<h${level} class="gamebook-heading">${formatInlineMarkdown(hMatch[2], paragraphMap)}</h${level}>`
            )
            continue
        }

        // Dialogue lines: — or –
        if (/^[—–]\s+/.test(block)) {
            htmlBlocks.push(
                `<div class="gamebook-dialog">${formatInlineMarkdown(block, paragraphMap)}</div>`
            )
            continue
        }

        // Blockquotes: > quote
        if (block.startsWith('>')) {
            const lines = block
                .split('\n')
                .map(l => l.replace(/^>\s?/, ''))
                .join('<br/>')
            htmlBlocks.push(
                `<blockquote class="gamebook-quote">${formatInlineMarkdown(lines, paragraphMap)}</blockquote>`
            )
            continue
        }

        // Unordered lists: - or *
        if (/^[-*]\s+/m.test(block)) {
            const items = block
                .split('\n')
                .filter(l => /^[-*]\s+/.test(l.trim()))
                .map(
                    l =>
                        `<li>${formatInlineMarkdown(l.trim().replace(/^[-*]\s+/, ''), paragraphMap)}</li>`
                )
                .join('')
            htmlBlocks.push(`<ul class="gamebook-list">${items}</ul>`)
            continue
        }

        // Ordered lists: 1.
        if (/^\d+\.\s+/m.test(block)) {
            const items = block
                .split('\n')
                .filter(l => /^\d+\.\s+/.test(l.trim()))
                .map(
                    l =>
                        `<li>${formatInlineMarkdown(l.trim().replace(/^\d+\.\s+/, ''), paragraphMap)}</li>`
                )
                .join('')
            htmlBlocks.push(`<ol class="gamebook-ordered-list">${items}</ol>`)
            continue
        }

        // Standard paragraph
        const lines = block
            .split('\n')
            .map(l => formatInlineMarkdown(l, paragraphMap))
            .join('<br/>')
        htmlBlocks.push(`<p>${lines}</p>`)
    }

    return htmlBlocks.join('\n')
}

/**
 * Generates print-ready HTML with @page rules, typographic hierarchy, and separators.
 *
 * @param {object} bookData - Compiled gamebook model
 * @param {object} styleConfig - Style configuration
 * @returns {string} Full HTML document
 */
export function generatePrintHtml(bookData, styleConfig = {}) {
    const pageFormat = styleConfig.pageFormat || 'A5'
    const orientation = styleConfig.pageOrientation || 'portrait'
    const cols = styleConfig.columns || 1
    const margins = styleConfig.margins || { top: 15, bottom: 15, left: 18, right: 15 }
    const fontFamily = styleConfig.fontFamily || 'Georgia, serif'
    const headerFontFamily = styleConfig.headerFontFamily || 'Cinzel, Georgia, serif'
    const fontSize = styleConfig.fontSize || 10
    const headerFontSize = styleConfig.headerFontSize || 13
    const lineHeight = styleConfig.lineHeight || 1.45
    const textColor = styleConfig.textColor || '#1a1a1a'
    const accentColor = styleConfig.accentColor || '#8b1e1e'
    const bgColor = styleConfig.backgroundColor || '#ffffff'
    const pIndent = styleConfig.paragraphIndent ?? 4
    const pSpacing = styleConfig.paragraphSpacing ?? 4
    const sepType = styleConfig.separatorType || 'ornament'
    const customSep = styleConfig.customSeparator || '❖ ❖ ❖'
    const choiceStyle = styleConfig.choiceStyle || 'italic'
    const choicePrefix = styleConfig.choicePrefix || '→ '

    let separatorHtml = ''
    if (sepType === 'page-break') {
        separatorHtml = '<div class="page-break-sep"></div>'
    } else if (sepType === 'line') {
        separatorHtml = '<hr class="p-line-sep" />'
    } else if (sepType === 'ornament') {
        separatorHtml = `<div class="p-ornament-sep">${escapeHtml(customSep)}</div>`
    } else {
        separatorHtml = '<div class="p-space-sep"></div>'
    }

    // Build paragraphs HTML
    const paragraphsHtml = (bookData.paragraphs || [])
        .map((p, idx) => {
            const isLast = idx === bookData.paragraphs.length - 1
            const choicesHtml = (p.choices || [])
                .map(ch => {
                    let prefixTags = ''
                    if (ch.conditionSummary) {
                        prefixTags += `<span class="choice-tag choice-condition" style="color: #b45309; font-weight: 600;">[Jeżeli: ${escapeHtml(ch.conditionSummary)}]</span> `
                    }
                    if (ch.costs && ch.costs.length > 0) {
                        const costsStr = ch.costs.map(c => `${c.value || 1} ${c.name}`).join(', ')
                        prefixTags += `<span class="choice-tag choice-cost" style="color: #b91c1c; font-weight: 600;">[Tracisz: ${escapeHtml(costsStr)}]</span> `
                    }
                    if (ch.rewards && ch.rewards.length > 0) {
                        const rewardsStr = ch.rewards
                            .map(r => `${r.value || 1} ${r.name}`)
                            .join(', ')
                        prefixTags += `<span class="choice-tag choice-reward" style="color: #047857; font-weight: 600;">[Zyskujesz: ${escapeHtml(rewardsStr)}]</span> `
                    }

                    if (
                        ch.diceCheck &&
                        Array.isArray(ch.diceCheck.branches) &&
                        ch.diceCheck.branches.length > 0
                    ) {
                        const dc = ch.diceCheck
                        const statPart = dc.stat ? ` + ${escapeHtml(dc.stat)}` : ''
                        const descPart = dc.description ? ` (${escapeHtml(dc.description)})` : ''
                        const branchesHtml = dc.branches
                            .map(b => {
                                const bTarget = b.targetNumber
                                    ? `idź do ${b.targetNumber}`
                                    : 'pozostań'
                                const bDesc = b.description ? ` — ${escapeHtml(b.description)}` : ''
                                return `<li class="dice-branch-item" style="margin: 2px 0;">Wynik ${b.min}–${b.max}: <strong>${bTarget}</strong>${bDesc}</li>`
                            })
                            .join('')
                        return `
                        <div class="choice-item ${choiceStyle} choice-with-dice" style="margin-bottom: 6px;">
                            <span class="choice-prefix">${escapeHtml(choicePrefix)}</span>${prefixTags}${escapeHtml(ch.text)}
                            <div class="choice-dice-block" style="margin-top: 3px; padding-left: 14px; font-size: 0.9em; color: #4b5563;">
                                <em>Rzuć kośćmi (${escapeHtml(dc.dice)}${statPart})${descPart}:</em>
                                <ul style="margin: 2px 0 0 16px; padding: 0;">
                                    ${branchesHtml}
                                </ul>
                            </div>
                        </div>`
                    }

                    const targetStr = ch.targetNumber
                        ? ` <span class="choice-target">(Idź do ${ch.targetNumber})</span>`
                        : ''
                    return `<div class="choice-item ${choiceStyle}"><span class="choice-prefix">${escapeHtml(choicePrefix)}</span>${prefixTags}${escapeHtml(ch.text)}${targetStr}</div>`
                })
                .join('')

            const bodyHtml = markdownToHtml(p.text || '', bookData.paragraphMap || {})

            return `
            <article class="gamebook-paragraph" id="p-${p.displayNumber}">
                <header class="paragraph-header">
                    <span class="paragraph-number">§ ${p.displayNumber}</span>
                </header>
                <div class="paragraph-body">
                    ${bodyHtml}
                </div>
                ${choicesHtml ? `<div class="paragraph-choices">${choicesHtml}</div>` : ''}
            </article>
            ${!isLast ? separatorHtml : ''}
        `
        })
        .join('')

    // Build extra sections
    const renderSectionList = sections => {
        if (!sections || sections.length === 0) return ''
        return sections
            .map(
                sec => `
            <section class="book-extra-section page-break-before">
                <h2>${escapeHtml(sec.title)}</h2>
                <div class="extra-items-grid">
                    ${(sec.items || [])
                        .map(
                            item => `
                        <article class="extra-item">
                            <h3 class="item-name">${escapeHtml(item.name)}</h3>
                            ${item.description ? `<div class="item-desc">${markdownToHtml(item.description, bookData.paragraphMap || {})}</div>` : '<p class="item-desc italic text-gray-500">(Brak opisu)</p>'}
                        </article>
                    `
                        )
                        .join('')}
                </div>
            </section>
        `
            )
            .join('')
    }

    const startSectionsHtml = renderSectionList(bookData.startSections)
    const endSectionsHtml = renderSectionList(bookData.endSections)

    // Character sheet(s) HTML
    const sheets =
        bookData.characterSheets && bookData.characterSheets.length > 0
            ? bookData.characterSheets
            : bookData.characterSheet
              ? [bookData.characterSheet]
              : []

    let sheetHtml = ''
    if (sheets.length > 0) {
        sheetHtml = sheets
            .map(sheet => {
                const statsHtml =
                    sheet.stats && sheet.stats.length > 0
                        ? `<div class="sheet-stats-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; margin: 8px 0;">
                            ${sheet.stats.map(s => `<div style="border: 1px solid #ccc; padding: 4px 6px; border-radius: 4px; font-size: 9pt;"><strong>${escapeHtml(s.name)}:</strong> ${escapeHtml(String(s.value))}</div>`).join('')}
                           </div>`
                        : ''

                const paramsHtml =
                    sheet.parameters && sheet.parameters.length > 0
                        ? `<div class="sheet-row stats-row" style="margin-top: 6px;">
                            ${sheet.parameters.map(p => `<div><strong>${escapeHtml(p.name)}:</strong> [ ${escapeHtml(String(p.currentValue || p.value || ''))} / ${escapeHtml(String(p.maxValue || ''))} ]</div>`).join('')}
                           </div>`
                        : `<div class="sheet-row stats-row">
                            <div><strong>Zdrowie:</strong> [ &nbsp; &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp; &nbsp; ]</div>
                            <div><strong>Złoto:</strong> [ &nbsp; &nbsp; &nbsp; &nbsp; ]</div>
                            <div><strong>Ekwipunek max:</strong> [ &nbsp; &nbsp; &nbsp; &nbsp; ]</div>
                           </div>`

                const skillsHtml =
                    sheet.skills && sheet.skills.length > 0
                        ? `<div style="margin: 6px 0; font-size: 9pt;">
                            <strong>Umiejętności:</strong> ${sheet.skills.map(sk => `${escapeHtml(sk.name)}${sk.value ? ` (${escapeHtml(String(sk.value))})` : ''}`).join(', ')}
                           </div>`
                        : ''

                let inventoryHtml = ''
                if (sheet.inventories && sheet.inventories.length > 0) {
                    inventoryHtml = sheet.inventories
                        .map(inv => {
                            const capText =
                                inv.capacity > 0
                                    ? ` (Pojemność: ${inv.capacity} miejsc)`
                                    : ' (Bez limitu)'
                            const invItems = inv.items || []
                            const numLines =
                                inv.capacity > 0 ? inv.capacity : Math.max(5, invItems.length + 2)
                            const lines = []
                            for (let i = 0; i < numLines; i++) {
                                const itemName = invItems[i]
                                    ? invItems[i].name
                                    : '..................................................................................'
                                lines.push(`<li>${escapeHtml(itemName)}</li>`)
                            }
                            return `
                        <div class="sheet-box-inner" style="margin-top: 8px;">
                            <strong>${escapeHtml(inv.name || 'Ekwipunek')}${escapeHtml(capText)}:</strong>
                            <ol class="backpack-lines" style="margin: 4px 0 0 16px; padding: 0;">
                                ${lines.join('')}
                            </ol>
                        </div>`
                        })
                        .join('')
                } else {
                    const itemsList = sheet.items && sheet.items.length > 0 ? sheet.items : []
                    const itemLines = []
                    for (let i = 0; i < Math.max(5, itemsList.length + 2); i++) {
                        const itemName = itemsList[i]
                            ? itemsList[i].name
                            : '..................................................................................'
                        itemLines.push(`<li>${escapeHtml(itemName)}</li>`)
                    }
                    inventoryHtml = `
                        <div class="sheet-box-inner" style="margin-top: 8px;">
                            <strong>Plecak i Wyposażenie:</strong>
                            <ol class="backpack-lines" style="margin: 4px 0 0 16px; padding: 0;">
                                ${itemLines.join('')}
                            </ol>
                        </div>`
                }

                return `
                <section class="character-sheet-section page-break-before">
                    <h2>Karta Postaci: ${escapeHtml(sheet.name || 'Bohater')}</h2>
                    <div class="sheet-box">
                        <div class="sheet-row">
                            <div><strong>Imię:</strong> ${escapeHtml(sheet.name || '...........................................')}</div>
                            <div><strong>Klasa:</strong> ${escapeHtml(sheet.characterClass || '........................')}</div>
                        </div>
                        ${sheet.summary ? `<p style="font-style: italic; font-size: 9pt; margin: 4px 0 8px 0; color: #555;">${escapeHtml(sheet.summary)}</p>` : ''}
                        ${paramsHtml}
                        ${statsHtml}
                        ${skillsHtml}
                        ${inventoryHtml}
                    </div>
                </section>
                `
            })
            .join('')
    }

    return `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(bookData.title)}</title>
    <style>
        @page {
            size: ${pageFormat} ${orientation};
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            @top-right {
                content: "${escapeHtml(bookData.title)}";
                font-family: ${fontFamily};
                font-size: 8pt;
                color: #888;
            }
            @bottom-center {
                content: counter(page);
                font-family: ${fontFamily};
                font-size: 9pt;
            }
        }

        body {
            font-family: ${fontFamily};
            font-size: ${fontSize}pt;
            line-height: ${lineHeight};
            color: ${textColor};
            background-color: ${bgColor};
            margin: 0;
            padding: 0;
            text-rendering: optimizeLegibility;
        }

        h1, h2, h3, .paragraph-header {
            font-family: ${headerFontFamily};
            color: ${accentColor};
            margin: 0 0 8pt 0;
        }

        .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
        }
        .cover-title {
            font-size: 26pt;
            margin-bottom: 12pt;
            letter-spacing: 1px;
        }
        .cover-author {
            font-size: 14pt;
            color: #555;
            margin-bottom: 24pt;
        }
        .cover-meta {
            font-size: 9pt;
            color: #888;
        }

        .book-content-container {
            column-count: ${cols};
            column-gap: 8mm;
            column-rule: ${cols > 1 ? '0.5pt solid #e0e0e0' : 'none'};
        }

        .gamebook-paragraph {
            break-inside: avoid;
            margin-bottom: ${pSpacing}pt;
        }

        .paragraph-number {
            font-size: ${headerFontSize}pt;
            font-weight: bold;
            color: ${accentColor};
            display: block;
            margin-bottom: 3pt;
        }

        .paragraph-body p {
            margin: 0 0 ${pSpacing}pt 0;
            text-align: justify;
            text-indent: ${pIndent}mm;
        }
        .paragraph-body p:first-child {
            text-indent: 0;
        }
        .paragraph-body h2, .paragraph-body h3, .paragraph-body h4 {
            font-family: ${headerFontFamily};
            color: ${accentColor};
            margin: 6pt 0 3pt 0;
            font-size: ${headerFontSize}pt;
        }
        .paragraph-body ul, .paragraph-body ol {
            margin: 4pt 0 6pt 14pt;
            padding-left: 0;
        }
        .paragraph-body li {
            margin-bottom: 2pt;
        }
        .gamebook-quote {
            border-left: 2pt solid ${accentColor};
            margin: 6pt 0 6pt 8pt;
            padding-left: 8pt;
            font-style: italic;
            color: #444;
        }
        .gamebook-dialog {
            border-left: 2pt solid ${accentColor};
            margin: 4pt 0 4pt 8pt;
            padding-left: 8pt;
            font-style: italic;
            color: ${textColor};
        }
        .gamebook-combat-card, .gamebook-combat-box {
            border: 1.5pt solid ${accentColor};
            background: #faf8f5;
            border-radius: 4pt;
            padding: 8pt 10pt;
            margin: 10pt 0;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .combat-card-header {
            border-bottom: 1pt solid rgba(0, 0, 0, 0.12);
            padding-bottom: 4pt;
            margin-bottom: 6pt;
        }
        .combat-badge {
            font-family: ${headerFontFamily};
            font-weight: bold;
            color: ${accentColor};
            font-size: ${fontSize * 0.95}pt;
            letter-spacing: 0.5px;
        }
        .combat-opponents-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6pt 0;
            font-size: ${fontSize * 0.88}pt;
        }
        .combat-opponents-table th {
            background: rgba(0, 0, 0, 0.04);
            border-bottom: 1.5pt solid ${accentColor};
            padding: 4pt 6pt;
            font-weight: bold;
            text-align: center;
        }
        .combat-opponents-table th.text-left {
            text-align: left;
        }
        .combat-opponents-table td {
            border-bottom: 0.5pt solid #ddd;
            padding: 4pt 6pt;
            text-align: center;
        }
        .combat-opponents-table td.opponent-name {
            text-align: left;
            font-weight: bold;
        }
        .combat-opponents-table td.opponent-stat {
            font-family: Consolas, monospace;
            font-weight: bold;
        }
        .combat-outcomes {
            margin-top: 6pt;
            padding-top: 4pt;
            border-top: 0.5pt dashed #ccc;
        }
        .combat-outcomes-title {
            font-weight: bold;
            font-size: ${fontSize * 0.88}pt;
            color: #555;
            margin-bottom: 3pt;
            text-transform: uppercase;
        }
        .combat-outcomes-list {
            list-style: none;
            padding-left: 0;
            margin: 0;
        }
        .combat-outcomes-list li {
            padding: 2pt 0;
            font-size: ${fontSize * 0.9}pt;
        }
        .combat-outcomes-list .outcome-marker {
            margin-right: 3pt;
            color: ${accentColor};
        }
        .combat-outcomes-list .outcome-target {
            font-weight: bold;
            font-style: italic;
            color: ${accentColor};
        }
        .combat-body {
            font-size: ${fontSize * 0.9}pt;
            color: #333;
            margin-top: 4pt;
        }

        /* Entity badges (Locations, NPCs, Items, Tags) without structural brackets */
        .gamebook-entity {
            display: inline-flex;
            align-items: center;
            gap: 2pt;
            padding: 0.5pt 4pt;
            border-radius: 3pt;
            font-size: 0.92em;
            line-height: 1.25;
            vertical-align: baseline;
            border: 0.5pt solid #ccc;
            background: rgba(0, 0, 0, 0.02);
            font-weight: 600;
        }
        .gamebook-entity-location {
            color: #8a5314;
            border-color: #d9ad74;
            background: #fdfaf4;
        }
        .gamebook-entity-character {
            color: #1a5675;
            border-color: #8ec3dc;
            background: #f4fafc;
        }
        .gamebook-entity-item {
            color: #7b2929;
            border-color: #dca3a3;
            background: #fcf6f6;
        }
        .gamebook-entity-tag {
            color: #444444;
            border-color: #cccccc;
            background: #f8f8f8;
        }
        .gamebook-entity-paragraph {
            color: ${accentColor};
            font-weight: bold;
            font-style: italic;
            border: none;
            background: transparent;
            padding: 0;
        }
        .entity-icon {
            font-size: 0.85em;
        }
        .gamebook-link {
            color: ${accentColor};
            text-decoration: underline;
        }
        .gamebook-code {
            font-family: Consolas, monospace;
            background: #eee;
            padding: 1pt 3pt;
            border-radius: 2pt;
            font-size: 8.5pt;
        }

        .paragraph-choices {
            margin-top: 6pt;
            padding-left: 2mm;
        }
        .choice-item {
            margin-bottom: 3pt;
            font-size: ${fontSize * 0.95}pt;
        }
        .choice-item.italic { font-style: italic; }
        .choice-item.bold { font-weight: bold; }
        .choice-item.box {
            border: 0.5pt solid #ddd;
            padding: 3pt 6pt;
            border-radius: 3pt;
            background: #fafafa;
        }
        .choice-target {
            font-weight: bold;
            color: ${accentColor};
        }

        /* Separators */
        .p-ornament-sep {
            text-align: center;
            margin: 12pt 0;
            color: #888;
            font-size: 11pt;
            letter-spacing: 2px;
            break-inside: avoid;
        }
        .p-line-sep {
            border: 0;
            border-top: 0.5pt solid #ccc;
            margin: 10pt auto;
            width: 60%;
            break-inside: avoid;
        }
        .p-space-sep {
            height: 14pt;
        }
        .page-break-sep, .page-break-before {
            page-break-before: always;
            break-before: page;
        }

        /* Extra sections */
        .extra-item {
            margin-bottom: 6pt;
            text-align: justify;
        }
        .item-name {
            font-weight: bold;
            color: ${accentColor};
        }

        /* Character sheet */
        .sheet-box {
            border: 1pt solid ${accentColor};
            border-radius: 4pt;
            padding: 10pt;
            margin-top: 10pt;
        }
        .sheet-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8pt;
        }
        .backpack-lines {
            margin: 6pt 0 0 0;
            padding-left: 18pt;
            line-height: 1.8;
        }
    </style>
</head>
<body>
    ${
        bookData.includeCoverPage
            ? `
    <div class="cover-page">
        <h1 class="cover-title">${escapeHtml(bookData.title)}</h1>
        <div class="cover-author">${escapeHtml(bookData.author)}</div>
        <div class="cover-meta">Wygenerowano w Nidavelir • ${new Date().toLocaleDateString('pl-PL')}</div>
    </div>`
            : ''
    }

    ${sheetHtml}
    ${startSectionsHtml}

    <div class="book-content-container">
        ${paragraphsHtml}
    </div>

    ${endSectionsHtml}
</body>
</html>`
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
