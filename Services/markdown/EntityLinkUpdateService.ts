import { Choice } from '../../Model/Choice'
import { ItemCondition, StatCondition } from '../../Model/Condition'
import { EntityAccessor, type INormalizedProjectScope } from '../helpers/EntityAccessor'
import {
    ENTITY_LINK_REGEX as SHARED_ENTITY_LINK_REGEX,
    escapeRegex,
    GENERIC_EMBED_LINK_REGEX,
} from '../helpers/MarkdownPatterns'

export interface IEntityRenameEvent {
    id: string
    oldName: string
    newName: string
    type?: string
}

export type IProjectScope = Partial<INormalizedProjectScope>

export interface ILinkUpdateResult {
    updatedFilesCount: number
    updatedEntitiesCount: number
    updatedChoicesCount: number
    updatedMarkdownCount: number
}

const TRAIT_TYPES = new Set(['trait', 'stat', 'skill', 'parameter', 'feature'])
const CHARACTER_TYPES = new Set(['character', 'npc'])

export class EntityLinkUpdateService {
    /**
     * Regex matching inline entity mentions: [Label](entity://type/id)
     */
    public static readonly ENTITY_LINK_REGEX = SHARED_ENTITY_LINK_REGEX

    /**
     * Regex matching embed links: [Label](embed://type/id) or [Label](embed://type/id/variant)
     */
    public static readonly EMBED_LINK_REGEX = GENERIC_EMBED_LINK_REGEX

    /**
     * Checks whether a link type matches the rename event's entity type.
     */
    private static isCompatibleEntityType(linkType: string, eventType?: string): boolean {
        if (!eventType) return true
        const cleanLink = linkType.trim().toLowerCase()
        const cleanEvent = eventType.trim().toLowerCase()

        if (cleanLink === cleanEvent) return true
        if (CHARACTER_TYPES.has(cleanLink) && CHARACTER_TYPES.has(cleanEvent)) return true
        if (TRAIT_TYPES.has(cleanLink) && TRAIT_TYPES.has(cleanEvent)) return true

        return false
    }

    /**
     * Checks whether a markdown label matches the old entity name.
     */
    private static isMatchingLabel(label: string, oldName: string): boolean {
        if (!oldName) return false
        const cleanLabel = label.trim()
        return (
            cleanLabel === oldName ||
            cleanLabel.toLowerCase() === oldName.toLowerCase() ||
            cleanLabel.includes(oldName)
        )
    }

    /**
     * Computes the updated label for an inline entity mention `[Label](entity://type/id)`.
     */
    private static computeUpdatedEntityLabel(
        rawLabel: string,
        cleanType: string,
        cleanTargetId: string,
        isMatchingId: boolean,
        event: IEntityRenameEvent
    ): string {
        const label = rawLabel.trim()

        if (cleanType === 'paragraph' || event.type === 'paragraph') {
            // Preserve paragraph section number prefix: "§ 5 " or "#5 " or "§ 5: "
            const prefixMatch = rawLabel.match(/^([§#]\s*\d+\s*:?\s*)(?:.*)$/)
            if (prefixMatch) {
                const prefix = prefixMatch[1].trim()
                return event.newName ? `${prefix} ${event.newName}` : prefix
            }
            if (
                isMatchingId ||
                label === event.oldName ||
                label.toLowerCase() === event.oldName.toLowerCase()
            ) {
                return event.newName || rawLabel
            }
            if (event.oldName && rawLabel.includes(event.oldName)) {
                return rawLabel.replaceAll(event.oldName, event.newName)
            }
            return rawLabel
        }

        if (
            label === event.oldName ||
            label.toLowerCase() === event.oldName.toLowerCase() ||
            label === cleanTargetId
        ) {
            return event.newName
        }
        if (event.oldName && rawLabel.includes(event.oldName)) {
            return rawLabel.replaceAll(event.oldName, event.newName)
        }
        if (isMatchingId && (!rawLabel || rawLabel === cleanTargetId)) {
            return event.newName
        }

        return rawLabel
    }

    /**
     * Computes the updated label for a description embed link `[Label](embed://type/id/variant)`.
     */
    private static computeUpdatedEmbedLabel(
        rawLabel: string,
        cleanTargetId: string,
        isMatchingId: boolean,
        event: IEntityRenameEvent
    ): string {
        const label = rawLabel.trim()
        if (rawLabel.startsWith('Opis:')) {
            return `Opis: ${event.newName}`
        }
        if (
            label === event.oldName ||
            label.toLowerCase() === event.oldName.toLowerCase() ||
            label === cleanTargetId
        ) {
            return event.newName
        }
        if (event.oldName && rawLabel.includes(event.oldName)) {
            return rawLabel.replaceAll(event.oldName, event.newName)
        }
        if (isMatchingId) {
            return `Opis: ${event.newName}`
        }
        return rawLabel
    }

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
                const cleanType = type.trim().toLowerCase()
                const cleanTargetId = targetId.trim()

                const isMatchingId = Boolean(event.id && cleanTargetId === event.id)
                const isMatchingName = this.isMatchingLabel(rawLabel, event.oldName)
                const isCompatibleType = this.isCompatibleEntityType(cleanType, event.type)

                if (!isMatchingId && (!isMatchingName || !isCompatibleType)) {
                    return fullMatch
                }

                const newLabel = this.computeUpdatedEntityLabel(
                    rawLabel,
                    cleanType,
                    cleanTargetId,
                    isMatchingId,
                    event
                )

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
                const cleanType = type.trim().toLowerCase()
                const cleanTargetId = targetId.trim()

                const isMatchingId = Boolean(event.id && cleanTargetId === event.id)
                const isMatchingName = this.isMatchingLabel(rawLabel, event.oldName)
                const isCompatibleType = this.isCompatibleEntityType(cleanType, event.type)

                if (!isMatchingId && (!isMatchingName || !isCompatibleType)) {
                    return fullMatch
                }

                const newLabel = this.computeUpdatedEmbedLabel(
                    rawLabel,
                    cleanTargetId,
                    isMatchingId,
                    event
                )

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
            event.type &&
            CHARACTER_TYPES.has(event.type.toLowerCase()) &&
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
     * Updates a single Choice Condition (ItemCondition or StatCondition) when its target entity is renamed.
     */
    private static updateChoiceCondition(cond: unknown, event: IEntityRenameEvent): boolean {
        if (!cond || typeof cond !== 'object') return false
        let changed = false

        const rec = cond as Record<string, unknown>
        const condType = typeof rec.getType === 'function' ? (rec.getType as () => unknown)() : ''
        const isItem = cond instanceof ItemCondition || condType === 'item' || 'getItemName' in rec
        const isStat = cond instanceof StatCondition || condType === 'stat' || 'getStatName' in rec

        if (isItem) {
            const itemCond = cond as ItemCondition
            const curItemName = itemCond.getItemName ? itemCond.getItemName() : ''
            if (
                curItemName === event.oldName ||
                (event.id && EntityAccessor.getId(itemCond) === event.id)
            ) {
                itemCond.setItemName(event.newName)
                changed = true
            }
            if (itemCond.getName && itemCond.getName() === event.oldName) {
                itemCond.setName(event.newName)
                changed = true
            }
        }

        if (isStat) {
            const statCond = cond as StatCondition
            const curStatName = statCond.getStatName ? statCond.getStatName() : ''
            if (
                curStatName === event.oldName ||
                (event.id && EntityAccessor.getId(statCond) === event.id)
            ) {
                statCond.setStatName(event.newName)
                changed = true
            }
            if (statCond.getName && statCond.getName() === event.oldName) {
                statCond.setName(event.newName)
                changed = true
            }
        }

        return changed
    }

    /**
     * Updates Choice conditions (ItemCondition, StatCondition), costs, rewards, diceCheck and destination names.
     */
    public static updateChoiceReferences(choices: Choice[], event: IEntityRenameEvent): number {
        if (!Array.isArray(choices) || choices.length === 0) return 0
        let count = 0

        for (const choice of choices) {
            let choiceChanged = this.updateChoiceCondition(choice.getCondition(), event)

            // Costs & Rewards
            const modifierLists = [choice.getCosts(), choice.getRewards()]
            for (const list of modifierLists) {
                if (Array.isArray(list)) {
                    for (const mod of list) {
                        if (mod.name === event.oldName || (event.id && mod.id === event.id)) {
                            mod.name = event.newName
                            choiceChanged = true
                        }
                    }
                }
            }

            // Dice check
            const diceCheck = choice.getDiceCheck()
            if (diceCheck && diceCheck.stat === event.oldName) {
                diceCheck.stat = event.newName
                choiceChanged = true
            }

            // Choice name matching destination paragraph
            if (
                (event.type === 'paragraph' || !event.type) &&
                choice.getToParagraphId() === event.id &&
                choice.getName() === event.oldName
            ) {
                choice.setName(event.newName)
                choiceChanged = true
            }

            // Choice description markdown
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
     * Updates markdown files inside project file dictionaries.
     */
    private static updateFileDictionaries(
        scope: INormalizedProjectScope,
        event: IEntityRenameEvent,
        result: ILinkUpdateResult
    ): void {
        const fileDictionaries = [
            scope.files,
            scope.projectData?.files as Record<string, string> | undefined,
            scope.projectFiles,
        ]
        const visitedDicts = new Set<object>()

        for (const fileDict of fileDictionaries) {
            if (fileDict && typeof fileDict === 'object' && !visitedDicts.has(fileDict)) {
                visitedDicts.add(fileDict)
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
    }

    /**
     * Updates combat opponents and outcomes inside a paragraph's Combat encounter.
     */
    private static updateCombatReferences(combat: unknown, event: IEntityRenameEvent): boolean {
        if (!combat || typeof combat !== 'object') return false
        let updated = false
        const rec = combat as { opponents?: unknown[]; outcomes?: unknown[] }

        if (Array.isArray(rec.opponents)) {
            for (const opp of rec.opponents) {
                const o = opp as {
                    id?: string
                    name?: string
                    characterId?: string
                    setName?: (n: string) => void
                }
                if (o.characterId === event.id || o.id === event.id || o.name === event.oldName) {
                    if (typeof o.setName === 'function') o.setName(event.newName)
                    else o.name = event.newName
                    updated = true
                }
            }
        }

        if (Array.isArray(rec.outcomes)) {
            for (const out of rec.outcomes) {
                const o = out as { targetParagraphId?: string; name?: string }
                if (o.targetParagraphId === event.id && o.name === event.oldName) {
                    o.name = event.newName
                    updated = true
                }
            }
        }

        return updated
    }

    /**
     * Updates a single non-paragraph entity (description, inventories, and attached traits).
     */
    private static updateSecondaryEntity(
        entity: unknown,
        event: IEntityRenameEvent,
        result: ILinkUpdateResult
    ): boolean {
        if (!entity || typeof entity !== 'object') return false
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

        // 1. Description markdown
        if (typeof e.getDescription === 'function') {
            const desc = e.getDescription()
            if (desc && typeof desc.getText === 'function' && typeof desc.setText === 'function') {
                const res = this.updateMarkdownLinks(desc.getText(), event)
                if (res.updated) {
                    desc.setText(res.text)
                    entUpdated = true
                    result.updatedMarkdownCount++
                }
            }
        }

        // 2. Inventories on Character / PlayerCharacter
        if (typeof e.getInventories === 'function') {
            const invs = e.getInventories()
            if (Array.isArray(invs)) {
                for (const inv of invs) {
                    const invObj = inv as { getItems?: () => unknown[] }
                    const items = typeof invObj.getItems === 'function' ? invObj.getItems() : []
                    if (Array.isArray(items)) {
                        for (const it of items) {
                            const itemObj = it as { setName?: (n: string) => void }
                            const curName = EntityAccessor.getName(it)
                            const curId = EntityAccessor.getId(it)
                            if (curName === event.oldName || (event.id && curId === event.id)) {
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

        // 3. Traits / stats / skills / parameters / features on Character
        const traitGetters = [e.getStats, e.getSkills, e.getParameters, e.getFeatures]
        for (const getter of traitGetters) {
            if (typeof getter === 'function') {
                const traitList = getter.call(e)
                if (Array.isArray(traitList)) {
                    for (const trait of traitList) {
                        const tr = trait as { setName?: (n: string) => void }
                        const curName = EntityAccessor.getName(trait)
                        const curId = EntityAccessor.getId(trait)
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

        return entUpdated
    }

    /**
     * Synchronizes any currently mounted DOM editors (`#file-editor` or TipTap main editor)
     * when running in a browser/renderer environment.
     */
    public static syncActiveDomEditors(event: IEntityRenameEvent): void {
        if (typeof document === 'undefined') return

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
            typeof (mainEditor as { setMarkdown?: (s: string) => void }).setMarkdown === 'function'
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

        const scope = EntityAccessor.normalizeScope(projectScope)

        // 1. Update markdown files in project files dictionary
        this.updateFileDictionaries(scope, event, result)

        // 2. Update Paragraphs (content, choices, combat)
        for (const p of scope.paragraphs) {
            let entityUpdated = false

            const content = p.getContent ? p.getContent() : null
            if (content && typeof content.getText === 'function') {
                const res = this.updateMarkdownLinks(content.getText(), event)
                if (res.updated) {
                    content.setText(res.text)
                    entityUpdated = true
                    result.updatedMarkdownCount++
                }
            }

            const choices = p.getChoices ? p.getChoices() : []
            const choicesUpdated = this.updateChoiceReferences(choices, event)
            if (choicesUpdated > 0) {
                result.updatedChoicesCount += choicesUpdated
                entityUpdated = true
            }

            if (
                typeof p.getCombat === 'function' &&
                this.updateCombatReferences(p.getCombat(), event)
            ) {
                entityUpdated = true
            }

            if (entityUpdated) {
                result.updatedEntitiesCount++
            }
        }

        // 3. Update Other Project Entities (Characters, Locations, Items, Scenes, Templates)
        const otherEntityLists = [
            scope.characters,
            scope.locations,
            scope.items,
            scope.scenes,
            scope.templates,
        ]
        const visitedEntities = new Set<unknown>()

        for (const list of otherEntityLists) {
            for (const entity of list) {
                if (visitedEntities.has(entity)) continue
                visitedEntities.add(entity)
                if (this.updateSecondaryEntity(entity, event, result)) {
                    result.updatedEntitiesCount++
                }
            }
        }

        // 4. Update Active DOM Editor if open
        this.syncActiveDomEditors(event)

        return result
    }
}
