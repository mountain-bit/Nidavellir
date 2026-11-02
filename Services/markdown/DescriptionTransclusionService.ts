import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { CombatMarkdownService } from '../combat/CombatMarkdownService'
import { EntityAccessor } from '../helpers/EntityAccessor'
import {
    EMBED_LINK_REGEX as SHARED_EMBED_LINK_REGEX,
    EMBED_MACRO_REGEX as SHARED_EMBED_MACRO_REGEX,
} from '../helpers/MarkdownPatterns'

export type DescriptionEmbedType = 'item' | 'character' | 'location'
export type DescriptionEmbedVariant = 'text' | 'summary'

export interface IDescriptionEmbedInfo {
    type: DescriptionEmbedType
    id: string
    variant: DescriptionEmbedVariant
    rawMatch: string
    label?: string
}

export interface ITransclusionEntityLike {
    getId?: () => string
    id?: string
    getName?: () => string
    name?: string
    getDescription?: () => unknown
    description?: unknown
}

export interface ITransclusionProjectData {
    items?: (Item | ITransclusionEntityLike)[]
    characters?: (NPC | ITransclusionEntityLike)[]
    locations?: (Location | ITransclusionEntityLike)[]
    [key: string]: unknown
}

export interface ITransclusionOptions {
    /**
     * How to handle missing entities.
     * 'warning-placeholder' (default): inserts a visible warning marker
     * 'empty': replaces with empty string
     * 'throw': throws an Error
     */
    fallbackOnMissing?: 'warning-placeholder' | 'empty' | 'throw'
    /**
     * Optional custom wrapper/formatter for injected description.
     */
    wrapperTemplate?: (text: string, embed: IDescriptionEmbedInfo, entityName?: string) => string
    /**
     * Maximum recursive transclusion depth (default: 5).
     */
    maxDepth?: number
}

// Re-export regexes for backwards compatibility
export const EMBED_LINK_REGEX = SHARED_EMBED_LINK_REGEX
export const EMBED_MACRO_REGEX = SHARED_EMBED_MACRO_REGEX

export class DescriptionTransclusionService {
    /**
     * Extracts all embed macro descriptors present in the markdown string.
     */
    public static extractEmbeds(markdown: string): IDescriptionEmbedInfo[] {
        if (!markdown || typeof markdown !== 'string') return []
        const list: IDescriptionEmbedInfo[] = []

        // 1. Link format: [Label](embed://type/id/variant)
        const linkRegex = new RegExp(EMBED_LINK_REGEX.source, 'g')
        let linkMatch: RegExpExecArray | null
        while ((linkMatch = linkRegex.exec(markdown)) !== null) {
            const label = linkMatch[1].trim()
            const type = linkMatch[2] as DescriptionEmbedType
            const id = linkMatch[3].trim()
            const variant = (linkMatch[4] as DescriptionEmbedVariant) || 'text'
            list.push({
                type,
                id,
                variant,
                label,
                rawMatch: linkMatch[0],
            })
        }

        // 2. Legacy macro format: {{embed:type:id:variant}}
        const macroRegex = new RegExp(EMBED_MACRO_REGEX.source, 'g')
        let macroMatch: RegExpExecArray | null
        while ((macroMatch = macroRegex.exec(markdown)) !== null) {
            const type = macroMatch[1] as DescriptionEmbedType
            const id = macroMatch[2].trim()
            const variant = (macroMatch[3] as DescriptionEmbedVariant) || 'text'
            list.push({
                type,
                id,
                variant,
                rawMatch: macroMatch[0],
            })
        }

        return list
    }

    /**
     * Converts markdown macro {{embed:type:id:variant}} to link [Opis: id](embed://type/id/variant)
     * and protects combat blocks for TipTap parsing.
     */
    public static preprocessForEditor(markdown: string): string {
        if (!markdown || typeof markdown !== 'string') return ''
        const result = markdown.replace(
            EMBED_MACRO_REGEX,
            (_full, type: string, id: string, variant: string = 'text') => {
                const cleanId = id.trim()
                const cleanVariant = variant ? variant.trim() : 'text'
                const url =
                    cleanVariant === 'summary'
                        ? `embed://${type}/${cleanId}/summary`
                        : `embed://${type}/${cleanId}`
                return `[Opis: ${cleanId}](${url})`
            }
        )

        return CombatMarkdownService.preprocessCombatForEditor(result)
    }

    /**
     * Converts legacy TipTap HTML block placeholder back into clean markdown link [Opis: id](embed://type/id)
     * and restores combat blocks from TipTap serialization.
     */
    public static postprocessFromEditor(content: string): string {
        if (!content || typeof content !== 'string') return ''
        const divRegex =
            /<div[^>]*data-description-embed="true"[^>]*data-type="([^"]+)"[^>]*data-id="([^"]+)"(?:[^>]*data-variant="([^"]+)")?[^>]*><\/div>/gi
        const result = content.replace(divRegex, (_match, type, id, variant) => {
            const v = variant || 'text'
            const url = v === 'summary' ? `embed://${type}/${id}/summary` : `embed://${type}/${id}`
            return `[Opis: ${id}](${url})`
        })

        return CombatMarkdownService.postprocessCombatFromEditor(result)
    }

    /**
     * Resolves all embed tags in the given markdown text by looking up entities in projectData.
     * Supports nested transclusions with cycle detection.
     */
    public static resolve(
        markdown: string,
        projectData: ITransclusionProjectData = {},
        options: ITransclusionOptions = {},
        visited = new Set<string>(),
        currentDepth = 0
    ): string {
        if (!markdown || typeof markdown !== 'string') return ''
        const maxDepth = options.maxDepth !== undefined ? options.maxDepth : 5

        if (currentDepth > maxDepth) {
            return markdown
        }

        const resolveOne = (
            rawMatch: string,
            typeStr: string,
            idStr: string,
            variantStr: string = 'text',
            customLabel?: string
        ): string => {
            const type = typeStr as DescriptionEmbedType
            const id = idStr.trim()
            const variant = (variantStr as DescriptionEmbedVariant) || 'text'
            const key = `${type}:${id}`

            if (visited.has(key)) {
                return `⚠️ [Cykliczne odwołanie do opisu: ${type} "${id}"]`
            }

            const entity = this.findEntity(type, id, projectData)
            if (!entity) {
                if (options.fallbackOnMissing === 'empty') {
                    return ''
                }
                if (options.fallbackOnMissing === 'throw') {
                    throw new Error(`Nie znaleziono obiektu do transkluzji opisu: ${type} "${id}"`)
                }
                return `⚠️ [Brakujący opis obiektu: ${type} "${id}"]`
            }

            const entityName = EntityAccessor.getName(entity, id)
            const rawDescription = EntityAccessor.getDescriptionText(entity, variant)

            const newVisited = new Set(visited)
            newVisited.add(key)
            const resolvedDescription = this.resolve(
                rawDescription,
                projectData,
                options,
                newVisited,
                currentDepth + 1
            )

            if (options.wrapperTemplate) {
                const embedInfo: IDescriptionEmbedInfo = {
                    type,
                    id,
                    variant,
                    label: customLabel,
                    rawMatch,
                }
                return options.wrapperTemplate(resolvedDescription, embedInfo, entityName)
            }

            return resolvedDescription
        }

        // 1. Resolve markdown link format: [Label](embed://type/id/variant)
        let result = markdown.replace(
            EMBED_LINK_REGEX,
            (rawMatch, label: string, type: string, id: string, variant: string = 'text') => {
                return resolveOne(rawMatch, type, id, variant, label)
            }
        )

        // 2. Resolve legacy macro format: {{embed:type:id:variant}}
        result = result.replace(
            EMBED_MACRO_REGEX,
            (rawMatch, type: string, id: string, variant: string = 'text') => {
                return resolveOne(rawMatch, type, id, variant)
            }
        )

        return result
    }

    private static findEntity(
        type: DescriptionEmbedType,
        id: string,
        projectData: ITransclusionProjectData
    ): ITransclusionEntityLike | null {
        const scope = EntityAccessor.normalizeScope(projectData)
        let list: unknown[] = []

        if (type === 'item') {
            list = scope.items
        } else if (type === 'character') {
            list = scope.characters
            if (scope.playerCharacter) {
                const pId = EntityAccessor.getId(scope.playerCharacter)
                if (pId === id || id === 'hero_player') {
                    return scope.playerCharacter as ITransclusionEntityLike
                }
            }
        } else if (type === 'location') {
            list = scope.locations
        }

        const found = list.find(item => EntityAccessor.getId(item) === id)
        return (found as ITransclusionEntityLike) || null
    }
}
