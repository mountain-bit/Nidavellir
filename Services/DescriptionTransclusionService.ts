import { Item } from '../Model/Item'
import { Location } from '../Model/Location'
import { NPC } from '../Model/NPC'

export type DescriptionEmbedType = 'item' | 'character' | 'location'
export type DescriptionEmbedVariant = 'text' | 'summary'

export interface IDescriptionEmbedInfo {
    type: DescriptionEmbedType
    id: string
    variant: DescriptionEmbedVariant
    rawMatch: string
    label?: string
}

export interface ITransclusionProjectData {
    items?: (
        | Item
        | {
              getId?: () => string
              id?: string
              getName?: () => string
              name?: string
              getDescription?: () => unknown
              description?: unknown
          }
    )[]
    characters?: (
        | NPC
        | {
              getId?: () => string
              id?: string
              getName?: () => string
              name?: string
              getDescription?: () => unknown
              description?: unknown
          }
    )[]
    locations?: (
        | Location
        | {
              getId?: () => string
              id?: string
              getName?: () => string
              name?: string
              getDescription?: () => unknown
              description?: unknown
          }
    )[]
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

// Regex matching markdown link [Label](embed://type/id) or [Label](embed://type/id/variant) or [Label](embed://type/id:variant)
export const EMBED_LINK_REGEX =
    /\[([^\]]+)\]\(embed:\/\/(item|character|location)\/([^/?#):]+)(?:[/:]?(text|summary))?\)/g

// Legacy macro {{embed:type:id}} or {{embed:type:id:variant}}
export const EMBED_MACRO_REGEX =
    /\{\{embed:(item|character|location):([^:}]+)(?::(text|summary))?\}\}/g

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
     * Converts markdown macro {{embed:type:id:variant}} to link [Opis: id](embed://type/id/variant) for TipTap parsing.
     */
    public static preprocessForEditor(markdown: string): string {
        if (!markdown || typeof markdown !== 'string') return ''
        let result = markdown.replace(
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

        // Protect combat markdown block from ProseMirror table flattening and HTML comment stripping
        const combatRegex =
            /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})[\s\S]*?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/gi
        result = result.replace(combatRegex, (rawCombatMatch: string) => {
            let cleanRaw = rawCombatMatch.trim()
            cleanRaw = cleanRaw
                .replace(/(?:<p>)?\{\{combat:start\}\}(?:<\/p>)?/gi, '<!-- COMBAT_START -->')
                .replace(/(?:<p>)?\{\{combat:end\}\}(?:<\/p>)?/gi, '<!-- COMBAT_END -->')
            if (!cleanRaw.includes('<!-- COMBAT_START -->')) {
                cleanRaw = '<!-- COMBAT_START -->\n' + cleanRaw
            }
            if (!cleanRaw.includes('<!-- COMBAT_END -->')) {
                cleanRaw = cleanRaw + '\n<!-- COMBAT_END -->'
            }
            return `\n\n<div data-combat-block="true" data-raw-combat="${encodeURIComponent(cleanRaw)}"></div>\n\n`
        })

        return result
    }

    /**
     * Converts legacy TipTap HTML block placeholder back into clean markdown link [Opis: id](embed://type/id).
     */
    public static postprocessFromEditor(content: string): string {
        if (!content || typeof content !== 'string') return ''
        const divRegex =
            /<div[^>]*data-description-embed="true"[^>]*data-type="([^"]+)"[^>]*data-id="([^"]+)"(?:[^>]*data-variant="([^"]+)")?[^>]*><\/div>/gi
        let result = content.replace(divRegex, (_match, type, id, variant) => {
            const v = variant || 'text'
            const url = v === 'summary' ? `embed://${type}/${id}/summary` : `embed://${type}/${id}`
            return `[Opis: ${id}](${url})`
        })

        // Restore combat block from TipTap HTML placeholder if present in serialized string
        const combatDivRegex =
            /<div[^>]*data-combat-block="true"[^>]*data-raw-combat="([^"]+)"[^>]*><\/div>/gi
        result = result.replace(combatDivRegex, (_match, encoded) => {
            try {
                return '\n\n' + decodeURIComponent(encoded).trim() + '\n\n'
            } catch {
                return '\n\n' + encoded.trim() + '\n\n'
            }
        })

        // Restore combat comments from TipTap markdown serialization without accumulating blank lines
        result = result
            .replace(/(?:<p>)?\{\{combat:start\}\}(?:<\/p>)?/gi, '<!-- COMBAT_START -->')
            .replace(/(?:<p>)?\{\{combat:end\}\}(?:<\/p>)?/gi, '<!-- COMBAT_END -->')
            .replace(/\n*<!--\s*COMBAT_START\s*-->\s*\n*/gi, '\n\n<!-- COMBAT_START -->\n')
            .replace(/\n*<!--\s*COMBAT_END\s*-->\s*\n*/gi, '\n<!-- COMBAT_END -->\n\n')
            .replace(/\n{3,}/g, '\n\n')

        return result
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

            const entityName =
                typeof entity.getName === 'function' ? entity.getName() : entity.name || id
            const rawDescription = this.getEntityDescriptionText(entity, variant)

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
    ): {
        getName?: () => string
        name?: string
        getDescription?: () => unknown
        description?: unknown
    } | null {
        let list: {
            getId?: () => string
            id?: string
            getName?: () => string
            name?: string
            getDescription?: () => unknown
            description?: unknown
        }[] = []

        if (type === 'item') {
            list = (projectData.items || projectData.projectItems || []) as typeof list
        } else if (type === 'character') {
            list = (projectData.characters || projectData.projectCharacters || []) as typeof list
            // Also check playerCharacter
            const player = (projectData.playerCharacter || null) as (typeof list)[0] | null
            if (player) {
                const pId = typeof player.getId === 'function' ? player.getId() : player.id
                if (pId === id || id === 'hero_player') return player
            }
        } else if (type === 'location') {
            list = (projectData.locations || projectData.projectLocations || []) as typeof list
        }

        const found = list.find(item => {
            const itemId = typeof item.getId === 'function' ? item.getId() : item.id
            return itemId === id
        })

        return found || null
    }

    private static getEntityDescriptionText(
        entity: { getDescription?: () => unknown; description?: unknown },
        variant: DescriptionEmbedVariant
    ): string {
        let descObj: unknown = null
        if (typeof entity.getDescription === 'function') {
            descObj = entity.getDescription()
        } else if (entity.description !== undefined) {
            descObj = entity.description
        }

        if (!descObj) return ''

        if (typeof descObj === 'string') {
            return descObj
        }

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
}
