import type { Choice } from '../../Model/Choice'
import type { Feature } from '../../Model/Feature'
import type { Item } from '../../Model/Item'
import type { Location } from '../../Model/Location'
import type { NPC } from '../../Model/NPC'
import type { NPC_Template } from '../../Model/NPC_Template'
import type { Paragraph } from '../../Model/Paragraph'
import type { Parameter } from '../../Model/Parameter'
import type { Scene } from '../../Model/Scene'
import type { Skill } from '../../Model/Skill'
import type { Stat } from '../../Model/Stat'
import type { Tag } from '../../Model/Tag'

export class EntityFilterManager {
    // Section Search Queries
    private paragraphSearchQuery: string = ''
    private selectedFilterTag: string | null = null
    private selectedFilterCharacter: string | null = null
    private selectedFilterScene: string | null = null

    private characterSearchQuery: string = ''
    private sceneSearchQuery: string = ''
    private locationSearchQuery: string = ''
    private statSearchQuery: string = ''
    private skillSearchQuery: string = ''
    private parameterSearchQuery: string = ''
    private featureSearchQuery: string = ''
    private tagSearchQuery: string = ''
    private connectionSearchQuery: string = ''
    private itemSearchQuery: string = ''

    // Paragraph Search & Filter Getters / Setters
    public getParagraphSearchQuery(): string {
        return this.paragraphSearchQuery
    }

    public setParagraphSearchQuery(query: string): void {
        this.paragraphSearchQuery = query
    }

    public getSelectedFilterTag(): string | null {
        return this.selectedFilterTag
    }

    public setSelectedFilterTag(tag: string | null): void {
        this.selectedFilterTag = tag
    }

    public getSelectedFilterCharacter(): string | null {
        return this.selectedFilterCharacter
    }

    public setSelectedFilterCharacter(charId: string | null): void {
        this.selectedFilterCharacter = charId
    }

    public getSelectedFilterScene(): string | null {
        return this.selectedFilterScene
    }

    public setSelectedFilterScene(sceneId: string | null): void {
        this.selectedFilterScene = sceneId
    }

    public clearParagraphFilters(): void {
        this.paragraphSearchQuery = ''
        this.selectedFilterTag = null
        this.selectedFilterCharacter = null
        this.selectedFilterScene = null
    }

    // Generic Section Queries
    public getCharacterSearchQuery(): string {
        return this.characterSearchQuery
    }

    public setCharacterSearchQuery(query: string): void {
        this.characterSearchQuery = query
    }

    public getSceneSearchQuery(): string {
        return this.sceneSearchQuery
    }

    public setSceneSearchQuery(query: string): void {
        this.sceneSearchQuery = query
    }

    public getLocationSearchQuery(): string {
        return this.locationSearchQuery
    }

    public setLocationSearchQuery(query: string): void {
        this.locationSearchQuery = query
    }

    public getStatSearchQuery(): string {
        return this.statSearchQuery
    }

    public setStatSearchQuery(query: string): void {
        this.statSearchQuery = query
    }

    public getSkillSearchQuery(): string {
        return this.skillSearchQuery
    }

    public setSkillSearchQuery(query: string): void {
        this.skillSearchQuery = query
    }

    public getParameterSearchQuery(): string {
        return this.parameterSearchQuery
    }

    public setParameterSearchQuery(query: string): void {
        this.parameterSearchQuery = query
    }

    public getFeatureSearchQuery(): string {
        return this.featureSearchQuery
    }

    public setFeatureSearchQuery(query: string): void {
        this.featureSearchQuery = query
    }

    public getTagSearchQuery(): string {
        return this.tagSearchQuery
    }

    public setTagSearchQuery(query: string): void {
        this.tagSearchQuery = query
    }

    public getConnectionSearchQuery(): string {
        return this.connectionSearchQuery
    }

    public setConnectionSearchQuery(query: string): void {
        this.connectionSearchQuery = query
    }

    public getItemSearchQuery(): string {
        return this.itemSearchQuery
    }

    public setItemSearchQuery(query: string): void {
        this.itemSearchQuery = query
    }

    // Filtering logic
    public searchAndFilterChoices(choices: Choice[], paragraphs: Paragraph[]): Choice[] {
        const query = this.connectionSearchQuery.trim().toLowerCase()
        if (!query) return choices

        return choices.filter(c => {
            const nameMatch = c.getName().toLowerCase().includes(query)
            const condSummary = c.getCondition()?.getSummary().toLowerCase() || ''
            const condMatch = condSummary.includes(query)

            const fromP = paragraphs.find(p => p.getId() === c.getFromParagraphId())
            const toP = paragraphs.find(p => p.getId() === c.getToParagraphId())
            const fromMatch = fromP ? fromP.getTitle().toLowerCase().includes(query) : false
            const toMatch = toP ? toP.getTitle().toLowerCase().includes(query) : false

            const isCombat = Boolean(
                (typeof c.getIsCombatOutcome === 'function' && c.getIsCombatOutcome()) ||
                (c as unknown as { isCombatOutcome?: boolean }).isCombatOutcome
            )
            const combatMatch =
                isCombat &&
                ('walka'.includes(query) || 'po walce'.includes(query) || 'combat'.includes(query))

            return nameMatch || condMatch || fromMatch || toMatch || combatMatch
        })
    }

    public searchAndFilterParagraphs(
        paragraphs: Paragraph[],
        scenes?: Scene[],
        characters?: NPC[]
    ): Paragraph[] {
        let result = [...paragraphs]

        if (this.selectedFilterTag) {
            const tagStr = this.selectedFilterTag.toLowerCase()
            result = result.filter(p =>
                p
                    .getTags()
                    .some(
                        t =>
                            t.getId().toLowerCase() === tagStr ||
                            t.getName().toLowerCase() === tagStr
                    )
            )
        }

        if (this.selectedFilterScene && scenes && scenes.length > 0) {
            const sceneId = this.selectedFilterScene
            const scene = scenes.find(s => s.getId() === sceneId)
            if (scene) {
                result = result.filter(p => scene.hasParagraph(p.getId()))
            }
        }

        if (this.selectedFilterCharacter && characters && characters.length > 0) {
            const charId = this.selectedFilterCharacter
            result = result.filter(p =>
                p.getTags().some(t => t.getId() === charId || t.getName() === charId)
            )
        }

        const query = this.paragraphSearchQuery.trim().toLowerCase()
        if (!query) {
            return result.sort((a, b) => {
                if (a.getIsNumberLocked() && !b.getIsNumberLocked()) return -1
                if (!a.getIsNumberLocked() && b.getIsNumberLocked()) return 1
                return 0
            })
        }

        result = result.filter(p => {
            const titleMatch = p.getTitle().toLowerCase().includes(query)
            const contentMatch = p.getContent().getText().toLowerCase().includes(query)
            const dispNum = (
                typeof p.getDisplayNumber === 'function' ? p.getDisplayNumber() : p.getNumber()
            ).toString()
            const numberMatch = dispNum.includes(query)
            return titleMatch || contentMatch || numberMatch
        })

        return result.sort((a, b) => {
            const aLocked = a.getIsNumberLocked()
            const bLocked = b.getIsNumberLocked()
            if (aLocked && !bLocked) return -1
            if (!aLocked && bLocked) return 1

            const aTitleMatch = a.getTitle().toLowerCase().includes(query)
            const bTitleMatch = b.getTitle().toLowerCase().includes(query)
            if (aTitleMatch && !bTitleMatch) return -1
            if (!aTitleMatch && bTitleMatch) return 1

            return 0
        })
    }

    public searchAndFilterScenes(scenes: Scene[]): Scene[] {
        const query = this.sceneSearchQuery.trim().toLowerCase()
        if (!query) return scenes
        return scenes.filter(
            s =>
                s.getName().toLowerCase().includes(query) ||
                s.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
    }

    public searchAndFilterCharacters(characters: NPC[]): NPC[] {
        const query = this.characterSearchQuery.trim().toLowerCase()
        if (!query) return characters
        return characters.filter(
            p =>
                p.getName().toLowerCase().includes(query) ||
                p.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
    }

    public searchAndFilterTemplates(templates: NPC_Template[]): NPC_Template[] {
        const query = this.characterSearchQuery.trim().toLowerCase()
        if (!query) return templates
        return templates.filter(
            p =>
                p.getName().toLowerCase().includes(query) ||
                p.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
    }

    public searchAndFilterLocations(locations: Location[]): Location[] {
        const query = this.locationSearchQuery.trim().toLowerCase()
        if (!query) return locations
        return locations.filter(
            l =>
                l.getName().toLowerCase().includes(query) ||
                l.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
    }

    public searchAndFilterItems(items: Item[]): Item[] {
        const query = this.itemSearchQuery.trim().toLowerCase()
        if (!query) return items
        return items.filter(
            it =>
                it.getName().toLowerCase().includes(query) ||
                (typeof it.getDescription === 'function' &&
                    it.getDescription() &&
                    it.getDescription().getText().toLowerCase().includes(query)) ||
                (typeof it.getTags === 'function' &&
                    it.getTags().some((t: Tag) => t.getName().toLowerCase().includes(query)))
        )
    }

    public searchAndFilterStats(stats: Stat[]): Stat[] {
        const query = this.statSearchQuery.trim().toLowerCase()
        if (!query) return stats
        return stats.filter(c => c.getName().toLowerCase().includes(query))
    }

    public searchAndFilterTags(tags: Tag[]): Tag[] {
        const query = this.tagSearchQuery.trim().toLowerCase()
        if (!query) return tags
        return tags.filter(t => t.getName().toLowerCase().includes(query))
    }

    public searchAndFilterSkills(skills: Skill[]): Skill[] {
        const query = this.skillSearchQuery.trim().toLowerCase()
        if (!query) return skills
        return skills.filter(u => u.getName().toLowerCase().includes(query))
    }

    public searchAndFilterParameters(parameters: Parameter[]): Parameter[] {
        const query = this.parameterSearchQuery.trim().toLowerCase()
        if (!query) return parameters
        return parameters.filter(p => p.getName().toLowerCase().includes(query))
    }

    public searchAndFilterFeatures(features: Feature[]): Feature[] {
        const query = this.featureSearchQuery.trim().toLowerCase()
        if (!query) return features
        return features.filter(f => f.getName().toLowerCase().includes(query))
    }

    public getSuggestedStats(existingStats: Stat[] = [], _characters: NPC[] = []): string[] {
        const set = new Set<string>()
        existingStats.forEach(s => {
            const n = (s.getName() || '').trim()
            if (n) set.add(n)
        })
        return Array.from(set)
    }

    public getSuggestedParameters(
        existingParameters: Parameter[] = [],
        _characters: NPC[] = []
    ): string[] {
        const set = new Set<string>()
        existingParameters.forEach(p => {
            const n = (p.getName() || '').trim()
            if (n) set.add(n)
        })
        return Array.from(set)
    }

    public getSuggestedSkills(existingSkills: Skill[] = [], _characters: NPC[] = []): string[] {
        const set = new Set<string>()
        existingSkills.forEach(s => {
            const n = (s.getName() || '').trim()
            if (n) set.add(n)
        })
        return Array.from(set)
    }

    public getSuggestedFeatures(
        existingFeatures: Feature[] = [],
        _characters: NPC[] = []
    ): string[] {
        const set = new Set<string>()
        existingFeatures.forEach(f => {
            const n = (f.getName() || '').trim()
            if (n) set.add(n)
        })
        return Array.from(set)
    }

    public getProjectTraitsCounts(
        stats: Stat[] = [],
        parameters: Parameter[] = [],
        skills: Skill[] = [],
        features: Feature[] = []
    ): { stats: number; parameters: number; skills: number; features: number; total: number } {
        return {
            stats: stats.length,
            parameters: parameters.length,
            skills: skills.length,
            features: features.length,
            total: stats.length + parameters.length + skills.length + features.length,
        }
    }

    public getSuggestedTags(existingTags: Tag[] = [], characters: NPC[] = []): string[] {
        const set = new Set<string>()
        existingTags.forEach(t => {
            const n = (t.getName() || '').trim()
            if (n) set.add(n)
        })
        characters.forEach(c => {
            const tags = typeof c.getTags === 'function' ? c.getTags() : []
            tags.forEach(t => {
                const n = (t.getName() || '').trim()
                if (n) set.add(n)
            })
        })
        return Array.from(set)
    }
}
