import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { IDocumentEntities, IProjectEntityCandidate, ISyncProjectData } from './types'

interface ITipTapDocNode {
    type?: { name?: string }
    attrs?: { id?: string; label?: string; type?: string; [key: string]: unknown }
}

interface ITipTapSource {
    state?: {
        doc?: {
            descendants: (callback: (node: ITipTapDocNode) => void) => void
        }
    }
}

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
    const id = typeof e.getId === 'function' ? e.getId() : e.id
    const name = typeof e.getName === 'function' ? e.getName() : e.name
    return id === targetId || name === targetName
}

export class EntitySyncService {
    /**
     * Extracts all unique referenced entities from a Tiptap editor instance or raw markdown text.
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

                    if (id || label) {
                        const key = id || label
                        if (type === 'location') locationsMap.set(key, label)
                        else if (type === 'character') charactersMap.set(key, label)
                        else if (type === 'tag') tagsMap.set(key, label)
                        else if (type === 'trait') traitsMap.set(key, label)
                    }
                }
            })
        } else if (typeof source === 'string') {
            // Regex fallback for raw markdown: [Label](entity://type/id)
            const regex = /\[([^\]]+)\]\(entity:\/\/([^/]+)\/([^)]+)\)/g
            let match: RegExpExecArray | null
            while ((match = regex.exec(source)) !== null) {
                const label = match[1].trim()
                const type = match[2].trim().toLowerCase()
                const id = match[3].trim()
                const key = id || label

                if (type === 'location') locationsMap.set(key, label)
                else if (type === 'character') charactersMap.set(key, label)
                else if (type === 'tag') tagsMap.set(key, label)
                else if (type === 'trait') traitsMap.set(key, label)
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
     * Synchronizes extracted entities with a Paragraph instance.
     * Adds missing locations, characters, and tags.
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
        let changed = false
        const addedLocations: string[] = []
        const addedCharacters: string[] = []
        const addedTags: string[] = []

        // 1. Locations
        for (const loc of entities.locations) {
            if (!paragraph.hasLocation(loc.id) && !paragraph.hasLocation(loc.name)) {
                let locationInstance: Location | null = null
                if (projectData && Array.isArray(projectData.locations)) {
                    const found = projectData.locations.find(l =>
                        matchesEntity(l, loc.id, loc.name)
                    )
                    if (found) {
                        locationInstance =
                            found instanceof Location ? found : Location.fromJSON(found)
                    }
                }
                if (!locationInstance) {
                    locationInstance = new Location(loc.id, loc.name)
                }

                paragraph.addLocation(locationInstance)
                addedLocations.push(
                    typeof locationInstance.getName === 'function'
                        ? locationInstance.getName()
                        : loc.name
                )
                changed = true
            }
        }

        // 2. Characters (NPCs)
        for (const char of entities.characters) {
            if (!paragraph.hasCharacter(char.id) && !paragraph.hasCharacter(char.name)) {
                let characterInstance: NPC | null = null
                if (projectData && Array.isArray(projectData.characters)) {
                    const found = projectData.characters.find(c =>
                        matchesEntity(c, char.id, char.name)
                    )
                    if (found) {
                        characterInstance = found instanceof NPC ? found : NPC.fromJSON(found)
                    }
                }
                if (!characterInstance) {
                    characterInstance = new NPC(char.id, char.name)
                }

                paragraph.addCharacter(characterInstance)
                addedCharacters.push(
                    typeof characterInstance.getName === 'function'
                        ? characterInstance.getName()
                        : char.name
                )
                changed = true
            }
        }

        // 3. Tags
        for (const tag of entities.tags) {
            if (!paragraph.hasTag(tag.id || tag.name) && !paragraph.hasTag(tag.name)) {
                let tagInstance: Tag | null = null
                if (projectData && Array.isArray(projectData.tags)) {
                    const found = projectData.tags.find(t =>
                        matchesEntity(t, tag.id || tag.name, tag.name)
                    )
                    if (found) {
                        tagInstance = found instanceof Tag ? found : Tag.fromJSON(found)
                    }
                }
                if (!tagInstance) {
                    tagInstance = new Tag(tag.id || tag.name, tag.name)
                }

                paragraph.addTag(tagInstance)
                addedTags.push(
                    typeof tagInstance.getName === 'function' ? tagInstance.getName() : tag.name
                )
                changed = true
            }
        }

        return { changed, addedLocations, addedCharacters, addedTags }
    }

    /**
     * Synchronizes extracted traits and tags with an NPC instance.
     */
    public static syncWithNPC(
        npc: NPC,
        entities: IDocumentEntities,
        projectData?: { tags?: (Tag | IProjectEntityCandidate)[] }
    ): { changed: boolean; addedTags: string[] } {
        let changed = false
        const addedTags: string[] = []

        const allTags = [...entities.tags, ...entities.traits]
        for (const tag of allTags) {
            if (!npc.hasTag(tag.id || tag.name) && !npc.hasTag(tag.name)) {
                let tagInstance: Tag | null = null
                if (projectData && Array.isArray(projectData.tags)) {
                    const found = projectData.tags.find(t =>
                        matchesEntity(t, tag.id || tag.name, tag.name)
                    )
                    if (found) {
                        tagInstance = found instanceof Tag ? found : Tag.fromJSON(found)
                    }
                }
                if (!tagInstance) {
                    tagInstance = new Tag(tag.id || tag.name, tag.name)
                }

                npc.addTag(tagInstance)
                addedTags.push(
                    typeof tagInstance.getName === 'function' ? tagInstance.getName() : tag.name
                )
                changed = true
            }
        }

        return { changed, addedTags }
    }
}
