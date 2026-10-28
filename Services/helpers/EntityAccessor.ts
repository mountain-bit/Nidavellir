import { Paragraph } from '../../Model/Paragraph'

export type DescriptionVariant = 'text' | 'summary'

export interface INormalizedProjectScope {
    paragraphs: Paragraph[]
    characters: unknown[]
    locations: unknown[]
    items: unknown[]
    tags: unknown[]
    traits: unknown[]
    skills: unknown[]
    parameters: unknown[]
    features: unknown[]
    scenes: unknown[]
    templates: unknown[]
    playerCharacter: unknown | null
    files: Record<string, string>
    projectFiles?: Record<string, string>
    projectData?: Record<string, unknown>
    vm?: unknown
}

/**
 * Shared utility for safely accessing properties on domain Model instances
 * as well as plain/duck-typed objects (e.g. deserialized JSON or test mocks).
 */
export class EntityAccessor {
    /**
     * Resolves the string identifier from an entity or plain object.
     */
    public static getId(entity: unknown, fallbackToName: boolean = false): string {
        if (!entity || typeof entity !== 'object') return ''
        const rec = entity as Record<string, unknown>

        if (typeof rec.getId === 'function') {
            const val = (rec.getId as () => unknown)()
            if (typeof val === 'string') return val.trim()
            if (val !== undefined && val !== null) return String(val).trim()
        }
        if (typeof rec.id === 'string') {
            return rec.id.trim()
        }

        if (fallbackToName) {
            return this.getName(entity)
        }

        return ''
    }

    /**
     * Resolves the human-readable name from an entity or plain object.
     */
    public static getName(entity: unknown, fallback: string = ''): string {
        if (!entity || typeof entity !== 'object') return fallback
        const rec = entity as Record<string, unknown>

        if (typeof rec.getName === 'function') {
            const val = (rec.getName as () => unknown)()
            if (typeof val === 'string' && val.trim()) return val.trim()
        }
        if (typeof rec.name === 'string' && rec.name.trim()) {
            return rec.name.trim()
        }

        return fallback
    }

    /**
     * Resolves the title or name from an entity (such as Paragraph or Scene),
     * falling back to `fallback` if neither is present.
     */
    public static getTitleOrName(entity: unknown, fallback: string = ''): string {
        if (!entity || typeof entity !== 'object') return fallback
        const rec = entity as Record<string, unknown>

        if (typeof rec.getTitle === 'function') {
            const title = (rec.getTitle as () => unknown)()
            if (typeof title === 'string' && title) return title
        }
        if (typeof rec.getName === 'function') {
            const name = (rec.getName as () => unknown)()
            if (typeof name === 'string' && name) return name
        }
        if (typeof rec.title === 'string' && rec.title) return rec.title
        if (typeof rec.name === 'string' && rec.name) return rec.name

        return fallback
    }

    /**
     * Resolves the value from a Stat, Parameter, or trait-like object.
     */
    public static getValue(entity: unknown): string | number | undefined {
        if (!entity || typeof entity !== 'object') return undefined
        const rec = entity as Record<string, unknown>

        const val =
            typeof rec.getValue === 'function' ? (rec.getValue as () => unknown)() : rec.value

        if (val !== undefined && val !== null && val !== '') {
            return val as string | number
        }
        return undefined
    }

    /**
     * Extracts description text or summary from an entity's Description object or string field.
     */
    public static getDescriptionText(
        entity: unknown,
        variant: DescriptionVariant = 'text'
    ): string {
        if (!entity || typeof entity !== 'object') return ''
        const rec = entity as Record<string, unknown>

        let descObj: unknown = null
        if (typeof rec.getDescription === 'function') {
            descObj = (rec.getDescription as () => unknown)()
        } else if (rec.description !== undefined) {
            descObj = rec.description
        }

        if (!descObj) return ''
        if (typeof descObj === 'string') return descObj

        if (typeof descObj === 'object' && descObj !== null) {
            const anyDesc = descObj as {
                getText?: () => string
                text?: string
                getSummary?: () => string
                summary?: string
            }

            if (variant === 'summary') {
                const summary =
                    typeof anyDesc.getSummary === 'function'
                        ? anyDesc.getSummary()
                        : anyDesc.summary
                if (summary && typeof summary === 'string') {
                    return summary
                }
            }

            const text = typeof anyDesc.getText === 'function' ? anyDesc.getText() : anyDesc.text
            if (text && typeof text === 'string') {
                return text
            }

            const fallbackSummary =
                typeof anyDesc.getSummary === 'function' ? anyDesc.getSummary() : anyDesc.summary
            if (fallbackSummary && typeof fallbackSummary === 'string') {
                return fallbackSummary
            }
        }

        return ''
    }

    /**
     * Normalizes various project scope inputs (AppContext, ProjectData, Project instance, or entity array)
     * into a consistent structure with all entity collections.
     */
    public static normalizeScope(raw: unknown): INormalizedProjectScope {
        const emptyScope: INormalizedProjectScope = {
            paragraphs: [],
            characters: [],
            locations: [],
            items: [],
            tags: [],
            traits: [],
            skills: [],
            parameters: [],
            features: [],
            scenes: [],
            templates: [],
            playerCharacter: null,
            files: {},
        }

        if (!raw) return emptyScope

        if (Array.isArray(raw)) {
            const paragraphs: Paragraph[] = []
            const otherEntities: unknown[] = []
            for (const item of raw) {
                if (
                    item instanceof Paragraph ||
                    (item &&
                        typeof item === 'object' &&
                        typeof (item as Record<string, unknown>).getChoices === 'function')
                ) {
                    paragraphs.push(item as Paragraph)
                } else if (item) {
                    otherEntities.push(item)
                }
            }
            return {
                ...emptyScope,
                paragraphs,
                characters: otherEntities,
                locations: otherEntities,
                items: otherEntities,
                scenes: otherEntities,
                templates: otherEntities,
            }
        }

        if (typeof raw !== 'object') return emptyScope

        const obj = raw as Record<string, unknown>
        const projectData = ((obj.projectData && typeof obj.projectData === 'object'
            ? obj.projectData
            : obj.project && typeof obj.project === 'object'
              ? obj.project
              : obj) || {}) as Record<string, unknown>

        const pickArray = <T = unknown>(...candidates: unknown[]): T[] => {
            for (const c of candidates) {
                if (Array.isArray(c)) return c as T[]
            }
            return []
        }

        const paragraphs = pickArray<Paragraph>(
            obj.paragraphs,
            obj.projectParagraphs,
            projectData.projectParagraphs,
            projectData.paragraphs
        )

        const characters = pickArray(
            obj.characters,
            obj.projectCharacters,
            projectData.projectCharacters,
            projectData.characters
        )

        const locations = pickArray(
            obj.locations,
            obj.projectLocations,
            projectData.projectLocations,
            projectData.locations
        )

        const items = pickArray(
            obj.items,
            obj.projectItems,
            projectData.projectItems,
            projectData.items
        )

        const tags = pickArray(obj.tags, obj.projectTags, projectData.projectTags, projectData.tags)

        const traits = pickArray(
            obj.traits,
            obj.stats,
            obj.projectStats,
            projectData.projectStats,
            projectData.stats,
            projectData.traits
        )

        const skills = pickArray(
            obj.skills,
            obj.projectSkills,
            projectData.projectSkills,
            projectData.skills
        )

        const parameters = pickArray(
            obj.parameters,
            obj.projectParameters,
            projectData.projectParameters,
            projectData.parameters
        )

        const features = pickArray(
            obj.features,
            obj.projectFeatures,
            projectData.projectFeatures,
            projectData.features
        )

        const scenes = pickArray(
            obj.scenes,
            obj.projectScenes,
            projectData.projectScenes,
            projectData.scenes
        )

        const templates = pickArray(
            obj.templates,
            obj.projectTemplates,
            projectData.projectTemplates,
            projectData.templates
        )

        const playerCharacter = obj.playerCharacter ?? projectData.playerCharacter ?? null

        const files = ((obj.files && typeof obj.files === 'object'
            ? obj.files
            : projectData.files && typeof projectData.files === 'object'
              ? projectData.files
              : {}) || {}) as Record<string, string>

        const projectFiles =
            obj.projectFiles && typeof obj.projectFiles === 'object'
                ? (obj.projectFiles as Record<string, string>)
                : undefined

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
            playerCharacter,
            files,
            projectFiles,
            projectData,
            vm: obj.vm || (typeof obj.getFileDisplayName === 'function' ? obj : undefined),
        }
    }
}
