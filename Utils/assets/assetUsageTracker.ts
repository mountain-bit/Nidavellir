/**
 * Utility for tracking and refactoring asset references across project data.
 */

import { ASSET_URL_PREFIX } from './assetUtils'

export type AssetUsageEntityType = 'hero' | 'npc' | 'scene' | 'item' | 'location' | 'file' | 'other'

export interface IAssetUsage {
    id: string
    name: string
    type: AssetUsageEntityType
    field: string
    detail?: string
}

export interface ITextContainer {
    text?: string
    getText?: () => string
    setText?: (v: string) => void
}

export interface IGenericEntity {
    id?: string
    name?: string
    avatar?: string
    image?: string
    title?: string
    description?: string | ITextContainer
    content?: string | ITextContainer
    getId?: () => string
    getName?: () => string
    getAvatar?: () => string
    getImage?: () => string
    getTitle?: () => string
    getDescription?: () => ITextContainer
    getContent?: () => ITextContainer
    setAvatar?: (v: string) => void
    setImage?: (v: string) => void
}

export interface IProjectContextLike {
    playerCharacter?: IGenericEntity | null
    projectCharacters?: IGenericEntity[]
    projectItems?: IGenericEntity[]
    projectLocations?: IGenericEntity[]
    projectParagraphs?: IGenericEntity[]
    items?: IGenericEntity[]
    files?: Record<string, string>
    projectData?: IProjectContextLike | null
    markProjectDirty?: () => void
}

interface IEntityCategoryDescriptor {
    type: AssetUsageEntityType
    entities: IGenericEntity[]
    defaultIdPrefix: string
    defaultName: string
    useTitleFirst?: boolean
    avatarField?: string
    allowImageFallback?: boolean
    descField: string
}

function normalizePath(p: string): string {
    return (p || '').replace(/\\/g, '/').trim()
}

function getFileName(p: string): string {
    const parts = normalizePath(p).split('/')
    return parts[parts.length - 1] || ''
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function pathMatches(candidate: string, targetPath: string, targetFileName: string): boolean {
    if (!candidate || typeof candidate !== 'string') return false
    const clean = normalizePath(candidate)
    const normTarget = normalizePath(targetPath)
    return (
        clean === normTarget ||
        clean === `${ASSET_URL_PREFIX}${normTarget}` ||
        clean.endsWith(`/${normTarget}`) ||
        clean === targetFileName ||
        clean.endsWith(`/${targetFileName}`)
    )
}

function textContainsAsset(text: string, targetPath: string, targetFileName: string): boolean {
    if (!text || typeof text !== 'string') return false
    const normTarget = normalizePath(targetPath)
    if (text.includes(normTarget) || text.includes(`${ASSET_URL_PREFIX}${normTarget}`)) {
        return true
    }

    if (targetFileName) {
        const escapedFileName = escapeRegex(targetFileName)
        const regex = new RegExp(
            `(?:(?<=[\\s\\(\\[\\"\\'\\/<>:])|^)${escapedFileName}(?=[\\s\\)\\]\\"\\'\\/>\\?\\#\\.,;:]|$)`,
            'i'
        )
        return regex.test(text)
    }
    return false
}

/**
 * Replaces references to an asset inside text (markdown, HTML, URLs) in a single-pass regex,
 * preventing corrupted or double-renamed substrings.
 */
export function replaceTextAssetReferences(
    text: string,
    oldPath: string,
    newPath: string,
    oldFileName: string,
    newFileName: string
): { updatedText: string; count: number } {
    if (!text || typeof text !== 'string') return { updatedText: text, count: 0 }
    if (!oldPath || !newPath || oldPath === newPath) return { updatedText: text, count: 0 }

    let count = 0
    const escapedOldPath = escapeRegex(oldPath)
    const escapedOldFileName = escapeRegex(oldFileName)

    // Matches:
    // 1. (asset:\/\/project\/)?oldPath
    // 2. oldFileName when bounded by markdown, path, quote or whitespace delimiters
    const pattern = new RegExp(
        `(asset:\\/\\/project\\/)?${escapedOldPath}|(?:(?<=[\\s\\(\\[\\"\\'\\/<>:])|^)${escapedOldFileName}(?=[\\s\\)\\]\\"\\'\\/>\\?\\#\\.,;:]|$)`,
        'g'
    )

    const updatedText = text.replace(pattern, (match, protocolGroup) => {
        count++
        if (protocolGroup) {
            return `${ASSET_URL_PREFIX}${newPath}`
        }
        if (match.endsWith(oldPath)) {
            return newPath
        }
        return newFileName
    })

    return { updatedText, count }
}

/**
 * Extracts text and an updater callback from an entity's description or content property.
 */
function extractEntityDescription(entity: IGenericEntity): {
    text: string
    update: (newText: string) => void
} {
    const noop = { text: '', update: (): void => {} }
    if (!entity) return noop

    // 1. Getter-based description/content object (getDescription / getContent)
    for (const getter of [entity.getDescription, entity.getContent]) {
        if (typeof getter === 'function') {
            const container = getter.call(entity)
            if (container && typeof container.getText === 'function') {
                return {
                    text: container.getText() || '',
                    update: (newText: string): void => {
                        if (typeof container.setText === 'function') {
                            container.setText(newText)
                        }
                    },
                }
            }
        }
    }

    // 2. Direct property (`content` or `description`) as string or `{ text: string }`
    for (const key of ['content', 'description'] as const) {
        const prop = entity[key]
        if (typeof prop === 'string') {
            return {
                text: prop,
                update: (newText: string): void => {
                    entity[key] = newText
                },
            }
        }
        if (prop && typeof prop === 'object' && typeof prop.text === 'string') {
            return {
                text: prop.text || '',
                update: (newText: string): void => {
                    prop.text = newText
                },
            }
        }
    }

    return noop
}

function getEntityId(entity: IGenericEntity, fallbackPrefix: string): string {
    const id = typeof entity.getId === 'function' ? entity.getId() : entity.id
    if (id) return id
    return fallbackPrefix === 'player_character'
        ? 'player_character'
        : `${fallbackPrefix}_${Date.now()}`
}

function getEntityDisplayName(
    entity: IGenericEntity,
    defaultName: string,
    entityId: string,
    useTitleFirst?: boolean
): string {
    if (useTitleFirst) {
        const title =
            (typeof entity.getTitle === 'function' ? entity.getTitle() : entity.title) ||
            (typeof entity.getName === 'function' ? entity.getName() : entity.name)
        return title || `${defaultName} ${entityId}`
    }
    const name = typeof entity.getName === 'function' ? entity.getName() : entity.name
    return name || defaultName
}

function getEntityAvatar(entity: IGenericEntity, allowImageFallback?: boolean): string | undefined {
    const avatar = typeof entity.getAvatar === 'function' ? entity.getAvatar() : entity.avatar
    if (avatar) return avatar
    if (allowImageFallback) {
        return typeof entity.getImage === 'function' ? entity.getImage() : entity.image
    }
    return undefined
}

function setEntityAvatar(
    entity: IGenericEntity,
    newPath: string,
    allowImageFallback?: boolean
): void {
    if (typeof entity.setAvatar === 'function') {
        entity.setAvatar(newPath)
    } else if (allowImageFallback && typeof entity.setImage === 'function') {
        entity.setImage(newPath)
    } else if (!allowImageFallback || entity.avatar !== undefined) {
        entity.avatar = newPath
    } else {
        entity.image = newPath
    }
}

function getCategoryDescriptors(ctx: IProjectContextLike | null | undefined): {
    context: IProjectContextLike
    categories: IEntityCategoryDescriptor[]
    files?: Record<string, string>
} {
    const context: IProjectContextLike = ctx || {}
    const projectData: IProjectContextLike = context.projectData || context

    const hero = context.playerCharacter || projectData.playerCharacter
    const characters = context.projectCharacters || projectData.projectCharacters || []
    const items = context.projectItems || projectData.projectItems || projectData.items || []
    const locations = context.projectLocations || projectData.projectLocations || []
    const paragraphs = context.projectParagraphs || projectData.projectParagraphs || []
    const files = context.files || projectData.files

    const categories: IEntityCategoryDescriptor[] = [
        {
            type: 'hero',
            entities: hero ? [hero] : [],
            defaultIdPrefix: 'player_character',
            defaultName: 'Bohater',
            avatarField: 'Portret bohatera',
            descField: 'Opis bohatera',
        },
        {
            type: 'npc',
            entities: Array.isArray(characters) ? characters : [],
            defaultIdPrefix: 'npc',
            defaultName: 'NPC',
            avatarField: 'Portret postaci',
            descField: 'Opis postaci',
        },
        {
            type: 'item',
            entities: Array.isArray(items) ? items : [],
            defaultIdPrefix: 'item',
            defaultName: 'Przedmiot',
            avatarField: 'Ikona przedmiotu',
            allowImageFallback: true,
            descField: 'Opis przedmiotu',
        },
        {
            type: 'location',
            entities: Array.isArray(locations) ? locations : [],
            defaultIdPrefix: 'loc',
            defaultName: 'Lokacja',
            avatarField: 'Grafika lokacji',
            descField: 'Opis lokacji',
        },
        {
            type: 'scene',
            entities: Array.isArray(paragraphs) ? paragraphs : [],
            defaultIdPrefix: 'p',
            defaultName: 'Węzeł',
            useTitleFirst: true,
            descField: 'Treść sceny',
        },
    ]

    return { context, categories, files }
}

/**
 * Scans application project data for any usages of the given asset.
 *
 * @param ctx Application context or project data container
 * @param assetPath Relative path of the asset (e.g. "Assets/Images/portrait.png")
 * @returns List of detected usages
 */
export function findAssetUsages(
    ctx: IProjectContextLike | null | undefined,
    assetPath: string
): IAssetUsage[] {
    const usages: IAssetUsage[] = []
    if (!ctx || !assetPath) return usages

    const targetPath = normalizePath(assetPath)
    const targetFileName = getFileName(targetPath)
    if (!targetFileName) return usages

    const { categories, files } = getCategoryDescriptors(ctx)

    for (const category of categories) {
        for (const entity of category.entities) {
            if (!entity) continue
            const entityId = getEntityId(entity, category.defaultIdPrefix)
            const entityName = getEntityDisplayName(
                entity,
                category.defaultName,
                entityId,
                category.useTitleFirst
            )

            if (category.avatarField) {
                const avatar = getEntityAvatar(entity, category.allowImageFallback)
                if (avatar && pathMatches(avatar, targetPath, targetFileName)) {
                    usages.push({
                        id: entityId,
                        name: entityName,
                        type: category.type,
                        field: category.avatarField,
                    })
                }
            }

            const descText = extractEntityDescription(entity).text
            if (textContainsAsset(descText, targetPath, targetFileName)) {
                usages.push({
                    id: entityId,
                    name: entityName,
                    type: category.type,
                    field: category.descField,
                })
            }
        }
    }

    if (files && typeof files === 'object') {
        for (const [filePath, fileContent] of Object.entries(files)) {
            if (
                typeof fileContent === 'string' &&
                textContainsAsset(fileContent, targetPath, targetFileName) &&
                !usages.some(u => u.detail === filePath)
            ) {
                usages.push({
                    id: filePath,
                    name: getFileName(filePath) || filePath,
                    type: 'file',
                    field: 'Plik projektu',
                    detail: filePath,
                })
            }
        }
    }

    return usages
}

/**
 * Replaces references to an old asset path with the new asset path across project data.
 *
 * @param ctx Application context or project data container
 * @param oldRelativePath Old asset relative path
 * @param newRelativePath New asset relative path
 * @returns Number of replacements performed
 */
export function replaceAssetReferences(
    ctx: IProjectContextLike | null | undefined,
    oldRelativePath: string,
    newRelativePath: string
): number {
    if (!ctx || !oldRelativePath || !newRelativePath) return 0

    const oldPath = normalizePath(oldRelativePath)
    const newPath = normalizePath(newRelativePath)
    const oldFileName = getFileName(oldPath)
    const newFileName = getFileName(newPath)
    if (!oldFileName || !newFileName || oldPath === newPath) return 0

    let replaceCount = 0
    const { context, categories, files } = getCategoryDescriptors(ctx)

    const replaceText = (str: string): string => {
        const { updatedText, count } = replaceTextAssetReferences(
            str,
            oldPath,
            newPath,
            oldFileName,
            newFileName
        )
        replaceCount += count
        return updatedText
    }

    for (const category of categories) {
        for (const entity of category.entities) {
            if (!entity) continue

            if (category.avatarField) {
                const curAvatar = getEntityAvatar(entity, category.allowImageFallback)
                if (curAvatar && pathMatches(curAvatar, oldPath, oldFileName)) {
                    setEntityAvatar(entity, newPath, category.allowImageFallback)
                    replaceCount++
                }
            }

            const { text, update } = extractEntityDescription(entity)
            if (text) {
                const updated = replaceText(text)
                if (updated !== text) {
                    update(updated)
                }
            }
        }
    }

    if (files && typeof files === 'object') {
        for (const [filePath, content] of Object.entries(files)) {
            if (typeof content === 'string') {
                const updated = replaceText(content)
                if (updated !== content) {
                    files[filePath] = updated
                }
            }
        }
    }

    if (replaceCount > 0 && typeof context.markProjectDirty === 'function') {
        context.markProjectDirty()
    }

    return replaceCount
}
