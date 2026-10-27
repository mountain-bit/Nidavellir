import { Location } from '../../../Model/Location'
import { NPC } from '../../../Model/NPC'
import { Paragraph } from '../../../Model/Paragraph'
import { Tag } from '../../../Model/Tag'
import { IDocumentEntities, IProjectEntityCandidate, ISyncProjectData } from '../types'

interface ITipTapDocNode {
    type?: { name?: string }
    attrs?: { id?: string; label?: string; name?: string; type?: string; [key: string]: unknown }
}

interface ITipTapSource {
    state?: {
        doc?: {
            descendants: (callback: (node: ITipTapDocNode) => void) => void
        }
    }
}

/**
 * Bezpiecznie dekoduje komponent URI, ignorując błędy formatowania.
 */
function safeDecodeUriComponent(val: string): string {
    try {
        return decodeURIComponent((val || '').trim())
    } catch {
        return (val || '').trim()
    }
}

/**
 * Bezpiecznie rejestruje encję w mapie, zapobiegając nadpisaniu czytelnej etykiety przez surowy identyfikator.
 */
function registerEntity(map: Map<string, string>, rawId: string, rawLabel: string): void {
    const id = safeDecodeUriComponent(rawId)
    const label = (rawLabel || '').trim()
    const key = id || label
    if (!key) return

    const existing = map.get(key)
    if (!existing || (existing === key && label && label !== key)) {
        map.set(key, label || key)
    }
}

/**
 * Sprawdza, czy obiekt kandydujący odpowiada poszukiwanej encji po niepustym ID lub nazwie.
 */
function matchesEntity(candidate: unknown, targetId: string, targetName: string): boolean {
    const e = candidate as
        | {
              id?: string
              name?: string
              getId?: () => string
              getName?: () => string
          }
        | null
        | undefined
    if (!e) return false

    const rawId = typeof e.getId === 'function' ? e.getId() : e.id
    const rawName = typeof e.getName === 'function' ? e.getName() : e.name

    const id = (rawId || '').trim()
    const name = (rawName || '').trim().toLowerCase()
    const cleanTargetId = (targetId || '').trim()
    const cleanTargetName = (targetName || '').trim().toLowerCase()

    const idMatch = Boolean(cleanTargetId && id && id === cleanTargetId)
    const nameMatch = Boolean(cleanTargetName && name && name === cleanTargetName)

    return idMatch || nameMatch
}

interface ISyncTarget<T> {
    has: (idOrName: string) => boolean
    add: (entity: T) => void
}

/**
 * Pomocnicza funkcja generyczna synchronizująca listę encji z encją nadrzędną (Paragraph lub NPC).
 */
function syncEntityList<T extends { getName?: () => string }>(
    target: ISyncTarget<T>,
    items: Array<{ id?: string; name: string }>,
    candidates: unknown[] | undefined,
    factory: (id: string, name: string, found?: unknown) => T,
    addedList: string[]
): boolean {
    let changed = false
    for (const item of items) {
        const id = (item.id || item.name || '').trim()
        const name = (item.name || id).trim()
        if (!id && !name) continue

        if (!target.has(id) && !target.has(name)) {
            let foundCandidate: unknown = undefined
            if (Array.isArray(candidates)) {
                foundCandidate = candidates.find(c => matchesEntity(c, id, name))
            }

            const entityInstance = factory(id, name, foundCandidate)
            target.add(entityInstance)

            const resolvedName =
                typeof entityInstance.getName === 'function' ? entityInstance.getName() : name
            addedList.push(resolvedName)
            changed = true
        }
    }
    return changed
}

/**
 * Serwis analizujący referencje do encji w tekście oraz synchronizujący powiązania
 * z modelem danych (paragrafami i postaciami NPC).
 */
export class EntitySyncService {
    /**
     * Wyodrębnia wszystkie unikalne encje referencjonowane w edytorze TipTap lub surowym tekście Markdown.
     */
    public static extractReferencedEntities(source: unknown): IDocumentEntities {
        const locationsMap = new Map<string, string>()
        const charactersMap = new Map<string, string>()
        const tagsMap = new Map<string, string>()
        const traitsMap = new Map<string, string>()

        const tipTap = source as ITipTapSource | null
        if (
            tipTap &&
            tipTap.state &&
            tipTap.state.doc &&
            typeof tipTap.state.doc.descendants === 'function'
        ) {
            tipTap.state.doc.descendants((node: ITipTapDocNode) => {
                if (node.type && node.type.name === 'mention' && node.attrs) {
                    const id = String(node.attrs.id || '').trim()
                    const label = String(node.attrs.label || id).trim()
                    const type = String(node.attrs.type || 'location').toLowerCase()

                    if (type === 'location') registerEntity(locationsMap, id, label)
                    else if (type === 'character') registerEntity(charactersMap, id, label)
                    else if (type === 'tag') registerEntity(tagsMap, id, label)
                    else if (type === 'trait') registerEntity(traitsMap, id, label)
                } else if (node.type && node.type.name === 'descriptionEmbed' && node.attrs) {
                    const id = String(node.attrs.id || '').trim()
                    const label = String(node.attrs.name || id).trim()
                    const type = String(node.attrs.type || 'item').toLowerCase()

                    if (type === 'location') registerEntity(locationsMap, id, label)
                    else if (type === 'character') registerEntity(charactersMap, id, label)
                }
            })
        } else if (typeof source === 'string') {
            // 1. Wzmianki: [Etykieta](entity://type/id)
            const regex = /\[([^\]]+)\]\(entity:\/\/([^/]+)\/([^)]+)\)/g
            let match: RegExpExecArray | null
            while ((match = regex.exec(source)) !== null) {
                const label = match[1].trim()
                const type = match[2].trim().toLowerCase()
                const id = match[3].trim()

                if (type === 'location') registerEntity(locationsMap, id, label)
                else if (type === 'character') registerEntity(charactersMap, id, label)
                else if (type === 'tag') registerEntity(tagsMap, id, label)
                else if (type === 'trait') registerEntity(traitsMap, id, label)
            }

            // 2. Linki embed: [Etykieta](embed://type/id)
            const embedLinkRegex =
                /\[([^\]]+)\]\(embed:\/\/(item|character|location)\/([^/?#):]+)(?:[/:]?[^)]*)?\)/g
            let elMatch: RegExpExecArray | null
            while ((elMatch = embedLinkRegex.exec(source)) !== null) {
                const label = elMatch[1].trim()
                const type = elMatch[2].trim().toLowerCase()
                const id = elMatch[3].trim()

                if (type === 'location') registerEntity(locationsMap, id, label)
                else if (type === 'character') registerEntity(charactersMap, id, label)
            }

            // 3. Makra embed: {{embed:item|character|location:id...}}
            const embedRegex = /\{\{embed:(item|character|location):([^:}]+)(?::[^}]+)?\}\}/g
            let embedMatch: RegExpExecArray | null
            while ((embedMatch = embedRegex.exec(source)) !== null) {
                const type = embedMatch[1].trim().toLowerCase()
                const id = embedMatch[2].trim()

                if (type === 'location') registerEntity(locationsMap, id, '')
                else if (type === 'character') registerEntity(charactersMap, id, '')
            }
        }

        return {
            locations: Array.from(locationsMap.entries()).map(([id, name]) => ({ id, name })),
            characters: Array.from(charactersMap.entries()).map(([id, name]) => ({ id, name })),
            tags: Array.from(tagsMap.entries()).map(([id, name]) => ({ id, name })),
            traits: Array.from(traitsMap.entries()).map(([id, name]) => ({ id, name })),
        }
    }

    /**
     * Synchronizuje wykryte encje z instancją Paragrafu.
     * Dodaje brakujące lokacje, postacie oraz tagi/cechy.
     */
    public static syncWithParagraph(
        paragraph: Paragraph,
        entities: IDocumentEntities,
        projectData?: ISyncProjectData
    ): {
        changed: boolean
        addedLocations: string[]
        addedCharacters: string[]
        addedTags: string[]
    } {
        const addedLocations: string[] = []
        const addedCharacters: string[] = []
        const addedTags: string[] = []

        // 1. Lokacje
        const locChanged = syncEntityList<Location>(
            {
                has: idOrName => paragraph.hasLocation(idOrName),
                add: loc => paragraph.addLocation(loc),
            },
            entities.locations || [],
            projectData?.locations,
            (id, name, found) =>
                found instanceof Location
                    ? found
                    : found
                      ? Location.fromJSON(found)
                      : new Location(id, name),
            addedLocations
        )

        // 2. Postacie NPC
        const charChanged = syncEntityList<NPC>(
            {
                has: idOrName => paragraph.hasCharacter(idOrName),
                add: char => paragraph.addCharacter(char),
            },
            entities.characters || [],
            projectData?.characters,
            (id, name, found) =>
                found instanceof NPC ? found : found ? NPC.fromJSON(found) : new NPC(id, name),
            addedCharacters
        )

        // 3. Tagi oraz Cechy
        const allTags = [...(entities.tags || []), ...(entities.traits || [])]
        const tagChanged = syncEntityList<Tag>(
            {
                has: idOrName => paragraph.hasTag(idOrName),
                add: tag => paragraph.addTag(tag),
            },
            allTags,
            projectData?.tags,
            (id, name, found) =>
                found instanceof Tag ? found : found ? Tag.fromJSON(found) : new Tag(id, name),
            addedTags
        )

        const changed = locChanged || charChanged || tagChanged
        return { changed, addedLocations, addedCharacters, addedTags }
    }

    /**
     * Synchronizuje wykryte tagi i cechy z instancją postaci NPC.
     */
    public static syncWithNPC(
        npc: NPC,
        entities: IDocumentEntities,
        projectData?: { tags?: (Tag | IProjectEntityCandidate)[] }
    ): { changed: boolean; addedTags: string[] } {
        const addedTags: string[] = []
        const allTags = [...(entities.tags || []), ...(entities.traits || [])]

        const changed = syncEntityList<Tag>(
            {
                has: idOrName => npc.hasTag(idOrName),
                add: tag => npc.addTag(tag),
            },
            allTags,
            projectData?.tags,
            (id, name, found) =>
                found instanceof Tag ? found : found ? Tag.fromJSON(found) : new Tag(id, name),
            addedTags
        )

        return { changed, addedTags }
    }
}
