import { Choice } from '../Model/Choice'
import { ItemCondition, StatCondition } from '../Model/Condition'
import { Paragraph } from '../Model/Paragraph'

export interface IEntityRenameEvent {
    id: string
    oldName: string
    newName: string
    type?: string
}

export interface IProjectScope {
    paragraphs?: Paragraph[]
    characters?: unknown[]
    locations?: unknown[]
    items?: unknown[]
    tags?: unknown[]
    traits?: unknown[]
    skills?: unknown[]
    parameters?: unknown[]
    features?: unknown[]
    scenes?: unknown[]
    templates?: unknown[]
    files?: Record<string, string>
    projectData?: {
        projectParagraphs?: Paragraph[]
        projectCharacters?: unknown[]
        projectLocations?: unknown[]
        projectItems?: unknown[]
        items?: unknown[]
        projectTags?: unknown[]
        projectStats?: unknown[]
        projectSkills?: unknown[]
        projectParameters?: unknown[]
        projectFeatures?: unknown[]
        projectScenes?: unknown[]
        projectTemplates?: unknown[]
        files?: Record<string, string>
        [key: string]: unknown
    }
    projectFiles?: Record<string, string>
    vm?: unknown
}

export interface ILinkUpdateResult {
    updatedFilesCount: number
    updatedEntitiesCount: number
    updatedChoicesCount: number
    updatedMarkdownCount: number
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class EntityLinkUpdateService {
    /**
     * Regex matching inline entity mentions: [Label](entity://type/id)
     */
    public static readonly ENTITY_LINK_REGEX =
        /\[([^\]]*)\]\(entity:\/\/([a-zA-Z0-9_-]+)\/([^/?#)\s]+)\)/g

    /**
     * Regex matching embed links: [Label](embed://type/id) or [Label](embed://type/id/variant)
     */
    public static readonly EMBED_LINK_REGEX =
        /\[([^\]]*)\]\(embed:\/\/([a-zA-Z0-9_-]+)\/([^/?#):\s]+)(?:[/:]?(text|summary))?\)/g

    /**
     * Updates markdown links, embeds, and mentions referencing the renamed entity.
     */
    public static updateMarkdownLinks(
        markdown: string,
        event: IEntityRenameEvent
    ): { updated: boolean; text: string } {
        if (!markdown || typeof markdown !== 'string') {
            return { updated: false, text: markdown || '' }
        }

        let result = markdown
        let hasUpdated = false

        // 1. Process inline entity mentions [Label](entity://type/id)
        result = result.replace(
            this.ENTITY_LINK_REGEX,
            (fullMatch, rawLabel: string, type: string, targetId: string) => {
                const label = rawLabel.trim()
                const cleanType = type.trim().toLowerCase()
                const cleanTargetId = targetId.trim()

                const isMatchingId = Boolean(event.id && cleanTargetId === event.id)
                const isMatchingName =
                    Boolean(event.oldName) &&
                    (label === event.oldName ||
                        label.toLowerCase() === event.oldName.toLowerCase() ||
                        label.includes(event.oldName))

                const isCompatibleType =
                    !event.type ||
                    cleanType === event.type.toLowerCase() ||
                    ((cleanType === 'character' || cleanType === 'npc') &&
                        (event.type === 'character' || event.type === 'npc')) ||
                    (['trait', 'stat', 'skill', 'parameter', 'feature'].includes(cleanType) &&
                        ['trait', 'stat', 'skill', 'parameter', 'feature'].includes(
                            event.type.toLowerCase()
                        ))

                if (!isMatchingId && (!isMatchingName || !isCompatibleType)) {
                    return fullMatch
                }

                let newLabel = rawLabel

                if (cleanType === 'paragraph' || event.type === 'paragraph') {
                    // Check for paragraph section number prefix: "§ 5 " or "#5 " or "§ 5: "
                    const prefixMatch = rawLabel.match(/^([§#]\s*\d+\s*:?\s*)(?:.*)$/)
                    if (prefixMatch) {
                        const prefix = prefixMatch[1]
                        newLabel = event.newName
                            ? `${prefix.trim()} ${event.newName}`
                            : prefix.trim()
                    } else if (
                        isMatchingId ||
                        label === event.oldName ||
                        label.toLowerCase() === event.oldName.toLowerCase()
                    ) {
                        newLabel = event.newName || rawLabel
                    } else if (event.oldName && rawLabel.includes(event.oldName)) {
                        newLabel = rawLabel.replaceAll(event.oldName, event.newName)
                    }
                } else {
                    if (
                        label === event.oldName ||
                        label.toLowerCase() === event.oldName.toLowerCase()
                    ) {
                        newLabel = event.newName
                    } else if (label === cleanTargetId) {
                        newLabel = event.newName
                    } else if (event.oldName && rawLabel.includes(event.oldName)) {
                        newLabel = rawLabel.replaceAll(event.oldName, event.newName)
                    } else if (isMatchingId && (!rawLabel || rawLabel === cleanTargetId)) {
                        newLabel = event.newName
                    }
                }

                if (newLabel !== rawLabel) {
                    hasUpdated = true
                    return `[${newLabel}](entity://${type}/${targetId})`
                }
                return fullMatch
            }
        )

        // 2. Process embed links [Label](embed://type/id/variant)
        result = result.replace(
            this.EMBED_LINK_REGEX,
            (fullMatch, rawLabel: string, type: string, targetId: string, variant?: string) => {
                const label = rawLabel.trim()
                const cleanType = type.trim().toLowerCase()
                const cleanTargetId = targetId.trim()

                const isMatchingId = Boolean(event.id && cleanTargetId === event.id)
                const isMatchingName =
                    Boolean(event.oldName) &&
                    (label.includes(event.oldName) ||
                        label === event.oldName ||
                        label.toLowerCase() === event.oldName.toLowerCase())

                const isCompatibleType =
                    !event.type ||
                    cleanType === event.type.toLowerCase() ||
                    ((cleanType === 'character' || cleanType === 'npc') &&
                        (event.type === 'character' || event.type === 'npc'))

                if (!isMatchingId && (!isMatchingName || !isCompatibleType)) {
                    return fullMatch
                }

                let newLabel = rawLabel
                if (rawLabel.startsWith('Opis:')) {
                    newLabel = `Opis: ${event.newName}`
                } else if (
                    label === event.oldName ||
                    label.toLowerCase() === event.oldName.toLowerCase()
                ) {
                    newLabel = event.newName
                } else if (label === cleanTargetId) {
                    newLabel = event.newName
                } else if (event.oldName && rawLabel.includes(event.oldName)) {
                    newLabel = rawLabel.replaceAll(event.oldName, event.newName)
                } else if (isMatchingId) {
                    newLabel = `Opis: ${event.newName}`
                }

                if (newLabel !== rawLabel) {
                    hasUpdated = true
                    const varSuffix = variant ? `/${variant}` : ''
                    return `[${newLabel}](embed://${type}/${targetId}${varSuffix})`
                }
                return fullMatch
            }
        )

        // 3. Process combat headers if opponent NPC renamed (### Starcie: OldName)
        if (
            (event.type === 'character' || event.type === 'npc') &&
            event.oldName &&
            event.newName
        ) {
            const combatHeaderRegex = new RegExp(
                `(### Starcie:\\s*)${escapeRegex(event.oldName)}`,
                'gi'
            )
            if (combatHeaderRegex.test(result)) {
                result = result.replace(combatHeaderRegex, `$1${event.newName}`)
                hasUpdated = true
            }
        }

        return { updated: hasUpdated, text: result }
    }

    /**
     * Updates Choice conditions (ItemCondition, StatCondition), costs, rewards, diceCheck and destination names.
     */
    public static updateChoiceReferences(choices: Choice[], event: IEntityRenameEvent): number {
        if (!Array.isArray(choices) || choices.length === 0) return 0
        let count = 0

        for (const choice of choices) {
            let choiceChanged = false

            // 1. Condition
            const cond = choice.getCondition()
            if (cond) {
                const isItem =
                    cond instanceof ItemCondition ||
                    (typeof cond.getType === 'function' && cond.getType() === 'item') ||
                    'getItemName' in cond
                const isStat =
                    cond instanceof StatCondition ||
                    (typeof cond.getType === 'function' && cond.getType() === 'stat') ||
                    'getStatName' in cond

                if (isItem) {
                    const itemCond = cond as ItemCondition
                    const curItemName = itemCond.getItemName ? itemCond.getItemName() : ''
                    if (
                        curItemName === event.oldName ||
                        (event.id && (itemCond as unknown as { id?: string }).id === event.id)
                    ) {
                        itemCond.setItemName(event.newName)
                        choiceChanged = true
                    }
                    if (itemCond.getName && itemCond.getName() === event.oldName) {
                        itemCond.setName(event.newName)
                        choiceChanged = true
                    }
                }

                if (isStat) {
                    const statCond = cond as StatCondition
                    const curStatName = statCond.getStatName ? statCond.getStatName() : ''
                    if (
                        curStatName === event.oldName ||
                        (event.id && (statCond as unknown as { id?: string }).id === event.id)
                    ) {
                        statCond.setStatName(event.newName)
                        choiceChanged = true
                    }
                    if (statCond.getName && statCond.getName() === event.oldName) {
                        statCond.setName(event.newName)
                        choiceChanged = true
                    }
                }
            }

            // 2. Costs
            const costs = choice.getCosts()
            if (Array.isArray(costs)) {
                for (const cost of costs) {
                    if (cost.name === event.oldName || (event.id && cost.id === event.id)) {
                        cost.name = event.newName
                        choiceChanged = true
                    }
                }
            }

            // 3. Rewards
            const rewards = choice.getRewards()
            if (Array.isArray(rewards)) {
                for (const reward of rewards) {
                    if (reward.name === event.oldName || (event.id && reward.id === event.id)) {
                        reward.name = event.newName
                        choiceChanged = true
                    }
                }
            }

            // 4. Dice check
            const diceCheck = choice.getDiceCheck()
            if (diceCheck && diceCheck.stat === event.oldName) {
                diceCheck.stat = event.newName
                choiceChanged = true
            }

            // 5. Choice name matching destination paragraph
            if (
                (event.type === 'paragraph' || !event.type) &&
                choice.getToParagraphId() === event.id
            ) {
                if (choice.getName() === event.oldName) {
                    choice.setName(event.newName)
                    choiceChanged = true
                }
            }

            // 6. Choice description markdown
            const desc = choice.getDescription()
            if (desc && typeof desc.getText === 'function') {
                const res = this.updateMarkdownLinks(desc.getText(), event)
                if (res.updated) {
                    desc.setText(res.text)
                    choiceChanged = true
                }
            }

            if (choiceChanged) {
                count++
            }
        }

        return count
    }

    /**
     * Traverses all entities, choices, files and markdown documents in the provided project scope,
     * updating all links and references to the renamed entity.
     */
    public static updateEntityReferences(
        event: IEntityRenameEvent,
        projectScope?: unknown
    ): ILinkUpdateResult {
        const result: ILinkUpdateResult = {
            updatedFilesCount: 0,
            updatedEntitiesCount: 0,
            updatedChoicesCount: 0,
            updatedMarkdownCount: 0,
        }

        if (!event || !event.oldName || !event.newName || event.oldName === event.newName) {
            return result
        }

        const scope = this.normalizeScope(projectScope)

        // 1. Update markdown files in project files dictionary
        const fileDictionaries = [scope.files, scope.projectData?.files, scope.projectFiles]
        for (const fileDict of fileDictionaries) {
            if (fileDict && typeof fileDict === 'object') {
                for (const [key, content] of Object.entries(fileDict)) {
                    if (typeof content === 'string') {
                        const res = this.updateMarkdownLinks(content, event)
                        if (res.updated) {
                            fileDict[key] = res.text
                            result.updatedFilesCount++
                            result.updatedMarkdownCount++
                        }
                    }
                }
            }
        }

        // 2. Update Paragraphs (content, choices, combat)
        const paragraphs = scope.paragraphs || []
        for (const p of paragraphs) {
            let entityUpdated = false

            // Paragraph content description
            const content = p.getContent ? p.getContent() : null
            if (content && typeof content.getText === 'function') {
                const res = this.updateMarkdownLinks(content.getText(), event)
                if (res.updated) {
                    content.setText(res.text)
                    entityUpdated = true
                    result.updatedMarkdownCount++
                }
            }

            // Paragraph choices
            const choices = p.getChoices ? p.getChoices() : []
            const choicesUpdated = this.updateChoiceReferences(choices, event)
            if (choicesUpdated > 0) {
                result.updatedChoicesCount += choicesUpdated
                entityUpdated = true
            }

            // Paragraph combat opponents & outcomes
            if (typeof p.getCombat === 'function') {
                const combat = p.getCombat()
                if (combat) {
                    // Check opponent names
                    const opponents = (combat as unknown as { opponents?: unknown[] }).opponents
                    if (Array.isArray(opponents)) {
                        for (const opp of opponents) {
                            const o = opp as {
                                id?: string
                                name?: string
                                characterId?: string
                                setName?: (n: string) => void
                            }
                            if (
                                o.characterId === event.id ||
                                o.id === event.id ||
                                o.name === event.oldName
                            ) {
                                if (typeof o.setName === 'function') o.setName(event.newName)
                                else o.name = event.newName
                                entityUpdated = true
                            }
                        }
                    }
                    // Check outcomes target / name
                    const outcomes = (combat as unknown as { outcomes?: unknown[] }).outcomes
                    if (Array.isArray(outcomes)) {
                        for (const out of outcomes) {
                            const o = out as { targetParagraphId?: string; name?: string }
                            if (o.targetParagraphId === event.id && o.name === event.oldName) {
                                o.name = event.newName
                                entityUpdated = true
                            }
                        }
                    }
                }
            }

            if (entityUpdated) {
                result.updatedEntitiesCount++
            }
        }

        // 3. Update Other Project Entities (Characters, Locations, Items, Scenes, Tags, Traits, Templates)
        const otherEntityLists = [
            scope.characters || [],
            scope.locations || [],
            scope.items || [],
            scope.scenes || [],
            scope.templates || [],
        ]

        for (const list of otherEntityLists) {
            for (const entity of list) {
                let entUpdated = false
                const e = entity as {
                    getDescription?: () => {
                        getText?: () => string
                        setText?: (t: string) => void
                    }
                    getInventories?: () => unknown[]
                    getStats?: () => unknown[]
                    getSkills?: () => unknown[]
                    getParameters?: () => unknown[]
                    getFeatures?: () => unknown[]
                }

                // Description markdown
                if (typeof e.getDescription === 'function') {
                    const desc = e.getDescription()
                    if (
                        desc &&
                        typeof desc.getText === 'function' &&
                        typeof desc.setText === 'function'
                    ) {
                        const res = this.updateMarkdownLinks(desc.getText(), event)
                        if (res.updated) {
                            desc.setText(res.text)
                            entUpdated = true
                            result.updatedMarkdownCount++
                        }
                    }
                }

                // Inventories on Character / PlayerCharacter
                if (typeof e.getInventories === 'function') {
                    const invs = e.getInventories()
                    if (Array.isArray(invs)) {
                        for (const inv of invs) {
                            const i = inv as { getItems?: () => unknown[] }
                            if (typeof i.getItems === 'function') {
                                const items = i.getItems()
                                if (Array.isArray(items)) {
                                    for (const it of items) {
                                        const itemObj = it as {
                                            getId?: () => string
                                            getName?: () => string
                                            setName?: (n: string) => void
                                        }
                                        const curName = itemObj.getName ? itemObj.getName() : ''
                                        const curId = itemObj.getId ? itemObj.getId() : ''
                                        if (
                                            curName === event.oldName ||
                                            (event.id && curId === event.id)
                                        ) {
                                            if (typeof itemObj.setName === 'function') {
                                                itemObj.setName(event.newName)
                                                entUpdated = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Traits / stats / skills / parameters / features on Character
                const traitGetters = [e.getStats, e.getSkills, e.getParameters, e.getFeatures]
                for (const getter of traitGetters) {
                    if (typeof getter === 'function') {
                        const traitList = getter.call(e)
                        if (Array.isArray(traitList)) {
                            for (const trait of traitList) {
                                const tr = trait as {
                                    getId?: () => string
                                    getName?: () => string
                                    setName?: (n: string) => void
                                }
                                const curName = tr.getName ? tr.getName() : ''
                                const curId = tr.getId ? tr.getId() : ''
                                if (curName === event.oldName || (event.id && curId === event.id)) {
                                    if (typeof tr.setName === 'function') {
                                        tr.setName(event.newName)
                                        entUpdated = true
                                    }
                                }
                            }
                        }
                    }
                }

                if (entUpdated) {
                    result.updatedEntitiesCount++
                }
            }
        }

        // 4. Update Active DOM Editor if open
        if (typeof document !== 'undefined') {
            const fileEditor = document.getElementById('file-editor') as HTMLTextAreaElement | null
            if (fileEditor && typeof fileEditor.value === 'string') {
                const res = this.updateMarkdownLinks(fileEditor.value, event)
                if (res.updated) {
                    fileEditor.value = res.text
                }
            }

            const win =
                typeof window !== 'undefined'
                    ? (window as unknown as { getMainEditorInstance?: () => unknown })
                    : null
            const mainEditor = win?.getMainEditorInstance ? win.getMainEditorInstance() : null
            if (
                mainEditor &&
                typeof (mainEditor as { getMarkdown?: () => string }).getMarkdown === 'function' &&
                typeof (mainEditor as { setMarkdown?: (s: string) => void }).setMarkdown ===
                    'function'
            ) {
                const mEditor = mainEditor as {
                    getMarkdown: () => string
                    setMarkdown: (s: string) => void
                }
                const cur = mEditor.getMarkdown()
                const res = this.updateMarkdownLinks(cur, event)
                if (res.updated) {
                    mEditor.setMarkdown(res.text)
                }
            }
        }

        return result
    }

    /**
     * Normalizes various project scope inputs (AppContext, ProjectData, entity array, etc.)
     * into a consistent IProjectScope structure.
     */
    private static normalizeScope(raw: unknown): IProjectScope {
        if (!raw) return {}

        // If raw is an array of entities
        if (Array.isArray(raw)) {
            const paragraphs: Paragraph[] = []
            const otherEntities: unknown[] = []
            for (const item of raw) {
                if (item instanceof Paragraph || (item && typeof item.getChoices === 'function')) {
                    paragraphs.push(item as Paragraph)
                } else if (item) {
                    otherEntities.push(item)
                }
            }
            return {
                paragraphs,
                characters: otherEntities,
                locations: otherEntities,
                items: otherEntities,
                scenes: otherEntities,
                templates: otherEntities,
            }
        }

        const obj = raw as Record<string, unknown>
        const projectData = (obj.projectData || obj) as Record<string, unknown>

        const paragraphs = (obj.paragraphs ||
            obj.projectParagraphs ||
            projectData.projectParagraphs ||
            []) as Paragraph[]

        const characters = (obj.characters ||
            obj.projectCharacters ||
            projectData.projectCharacters ||
            []) as unknown[]

        const locations = (obj.locations ||
            obj.projectLocations ||
            projectData.projectLocations ||
            []) as unknown[]

        const items = (obj.items ||
            obj.projectItems ||
            projectData.projectItems ||
            projectData.items ||
            []) as unknown[]

        const tags = (obj.tags || obj.projectTags || projectData.projectTags || []) as unknown[]

        const traits = (obj.traits ||
            obj.projectStats ||
            projectData.projectStats ||
            []) as unknown[]

        const skills = (obj.skills ||
            obj.projectSkills ||
            projectData.projectSkills ||
            []) as unknown[]

        const parameters = (obj.parameters ||
            obj.projectParameters ||
            projectData.projectParameters ||
            []) as unknown[]

        const features = (obj.features ||
            obj.projectFeatures ||
            projectData.projectFeatures ||
            []) as unknown[]

        const scenes = (obj.scenes ||
            obj.projectScenes ||
            projectData.projectScenes ||
            []) as unknown[]

        const templates = (obj.templates ||
            obj.projectTemplates ||
            projectData.projectTemplates ||
            []) as unknown[]

        const files = (obj.files || projectData.files || {}) as Record<string, string>

        return {
            paragraphs,
            characters,
            locations,
            items,
            tags,
            traits,
            skills,
            parameters,
            features,
            scenes,
            templates,
            files,
            projectData: projectData as IProjectScope['projectData'],
            vm: obj.vm || (typeof obj.getFileDisplayName === 'function' ? obj : undefined),
        }
    }
}
