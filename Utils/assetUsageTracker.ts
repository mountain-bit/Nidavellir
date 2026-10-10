/**
 * Utility for tracking and refactoring asset references across project data.
 */

export interface IAssetUsage {
    id: string
    name: string
    type: 'hero' | 'npc' | 'scene' | 'item' | 'location' | 'file' | 'other'
    field: string
    detail?: string
}

function normalizePath(p: string): string {
    return (p || '').replace(/\\/g, '/').trim()
}

function getFileName(p: string): string {
    const parts = normalizePath(p).split('/')
    return parts[parts.length - 1] || ''
}

function pathMatches(candidate: string, targetPath: string, targetFileName: string): boolean {
    if (!candidate) return false
    const clean = normalizePath(candidate)
    const normTarget = normalizePath(targetPath)
    if (clean === normTarget) return true
    if (clean.endsWith(normTarget)) return true
    if (clean.includes(`/${targetFileName}`) || clean === targetFileName) return true
    if (clean.includes(`asset://project/${normTarget}`)) return true
    return false
}

function textContainsAsset(text: string, targetPath: string, targetFileName: string): boolean {
    if (!text || typeof text !== 'string') return false
    const normTarget = normalizePath(targetPath)
    if (text.includes(normTarget)) return true
    if (text.includes(`asset://project/${normTarget}`)) return true
    if (text.includes(targetFileName)) return true
    return false
}

interface IGenericEntity {
    id?: string
    name?: string
    avatar?: string
    image?: string
    title?: string
    description?: string | { text?: string }
    content?: string | { text?: string }
    getId?: () => string
    getName?: () => string
    getAvatar?: () => string
    getImage?: () => string
    getTitle?: () => string
    getDescription?: () => { getText?: () => string; setText?: (v: string) => void }
    getContent?: () => { getText?: () => string; setText?: (v: string) => void }
    setAvatar?: (v: string) => void
}

interface IProjectContextLike {
    playerCharacter?: IGenericEntity
    projectCharacters?: IGenericEntity[]
    projectItems?: IGenericEntity[]
    projectLocations?: IGenericEntity[]
    projectParagraphs?: IGenericEntity[]
    items?: IGenericEntity[]
    files?: Record<string, string>
    projectData?: IProjectContextLike
    markProjectDirty?: () => void
}

/**
 * Scans application project data for any usages of the given asset.
 *
 * @param ctx Application context or project data container
 * @param assetPath Relative path of the asset (e.g. "Assets/Images/portrait.png")
 * @returns List of detected usages
 */
export function findAssetUsages(ctx: unknown, assetPath: string): IAssetUsage[] {
    const usages: IAssetUsage[] = []
    if (!ctx || !assetPath) return usages

    const targetPath = normalizePath(assetPath)
    const targetFileName = getFileName(targetPath)
    if (!targetFileName) return usages

    const context = (ctx || {}) as IProjectContextLike
    const projectData = (context.projectData || context) as IProjectContextLike

    // 1. Player Character / Hero
    const hero = context.playerCharacter || projectData.playerCharacter
    if (hero) {
        const heroAvatar = typeof hero.getAvatar === 'function' ? hero.getAvatar() : hero.avatar
        const heroName =
            (typeof hero.getName === 'function' ? hero.getName() : hero.name) || 'Bohater'
        const heroId =
            (typeof hero.getId === 'function' ? hero.getId() : hero.id) || 'player_character'

        if (heroAvatar && pathMatches(heroAvatar, targetPath, targetFileName)) {
            usages.push({
                id: heroId,
                name: heroName,
                type: 'hero',
                field: 'Portret bohatera',
            })
        }

        const heroDesc =
            typeof hero.getDescription === 'function'
                ? hero.getDescription()?.getText?.() || ''
                : typeof hero.description === 'string'
                  ? hero.description
                  : hero.description?.text || ''

        if (textContainsAsset(heroDesc, targetPath, targetFileName)) {
            usages.push({
                id: heroId,
                name: heroName,
                type: 'hero',
                field: 'Opis bohatera',
            })
        }
    }

    // 2. Characters / NPCs
    const characters = context.projectCharacters || projectData.projectCharacters || []
    if (Array.isArray(characters)) {
        for (const npc of characters) {
            if (!npc) continue
            const npcId =
                (typeof npc.getId === 'function' ? npc.getId() : npc.id) || `npc_${Date.now()}`
            const npcName = (typeof npc.getName === 'function' ? npc.getName() : npc.name) || 'NPC'

            const npcAvatar = typeof npc.getAvatar === 'function' ? npc.getAvatar() : npc.avatar
            if (npcAvatar && pathMatches(npcAvatar, targetPath, targetFileName)) {
                usages.push({
                    id: npcId,
                    name: npcName,
                    type: 'npc',
                    field: 'Portret postaci',
                })
            }

            const npcDesc =
                typeof npc.getDescription === 'function'
                    ? npc.getDescription()?.getText?.() || ''
                    : typeof npc.description === 'string'
                      ? npc.description
                      : npc.description?.text || ''

            if (textContainsAsset(npcDesc, targetPath, targetFileName)) {
                usages.push({
                    id: npcId,
                    name: npcName,
                    type: 'npc',
                    field: 'Opis postaci',
                })
            }
        }
    }

    // 3. Items
    const items = context.projectItems || projectData.projectItems || projectData.items || []
    if (Array.isArray(items)) {
        for (const item of items) {
            if (!item) continue
            const itemId =
                (typeof item.getId === 'function' ? item.getId() : item.id) || `item_${Date.now()}`
            const itemName =
                (typeof item.getName === 'function' ? item.getName() : item.name) || 'Przedmiot'
            const itemAvatar =
                (typeof item.getAvatar === 'function' ? item.getAvatar() : item.avatar) ||
                (typeof item.getImage === 'function' ? item.getImage() : item.image)

            if (itemAvatar && pathMatches(itemAvatar, targetPath, targetFileName)) {
                usages.push({
                    id: itemId,
                    name: itemName,
                    type: 'item',
                    field: 'Ikona przedmiotu',
                })
            }
        }
    }

    // 4. Locations
    const locations = context.projectLocations || projectData.projectLocations || []
    if (Array.isArray(locations)) {
        for (const loc of locations) {
            if (!loc) continue
            const locId =
                (typeof loc.getId === 'function' ? loc.getId() : loc.id) || `loc_${Date.now()}`
            const locName =
                (typeof loc.getName === 'function' ? loc.getName() : loc.name) || 'Lokacja'
            const locAvatar = typeof loc.getAvatar === 'function' ? loc.getAvatar() : loc.avatar

            if (locAvatar && pathMatches(locAvatar, targetPath, targetFileName)) {
                usages.push({
                    id: locId,
                    name: locName,
                    type: 'location',
                    field: 'Grafika lokacji',
                })
            }
        }
    }

    // 5. Paragraphs / Scenes
    const paragraphs = context.projectParagraphs || projectData.projectParagraphs || []
    if (Array.isArray(paragraphs)) {
        for (const p of paragraphs) {
            if (!p) continue
            const pId = (typeof p.getId === 'function' ? p.getId() : p.id) || `p_${Date.now()}`
            const pTitle =
                (typeof p.getTitle === 'function' ? p.getTitle() : p.title) ||
                (typeof p.getName === 'function' ? p.getName() : p.name) ||
                `Węzeł ${pId}`

            let contentText = ''
            if (typeof p.getContent === 'function') {
                contentText = p.getContent()?.getText?.() || ''
            } else if (typeof p.getDescription === 'function') {
                contentText = p.getDescription()?.getText?.() || ''
            } else if (typeof p.content === 'string') {
                contentText = p.content
            } else if (
                typeof p.content === 'object' &&
                p.content &&
                typeof p.content.text === 'string'
            ) {
                contentText = p.content.text
            } else if (
                typeof p.description === 'object' &&
                p.description &&
                typeof p.description.text === 'string'
            ) {
                contentText = p.description.text
            }

            if (textContainsAsset(contentText, targetPath, targetFileName)) {
                usages.push({
                    id: pId,
                    name: pTitle,
                    type: 'scene',
                    field: 'Treść sceny',
                })
            }
        }
    }

    // 6. Project Files Map (Markdown sources)
    const files = context.files || projectData.files
    if (files && typeof files === 'object') {
        for (const [filePath, fileContent] of Object.entries(files)) {
            if (
                typeof fileContent === 'string' &&
                textContainsAsset(fileContent, targetPath, targetFileName)
            ) {
                // Ensure not already counted as a scene
                const alreadyRecorded = usages.some(u => u.detail === filePath)
                if (!alreadyRecorded) {
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
    ctx: unknown,
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
    const context = (ctx || {}) as IProjectContextLike
    const projectData = (context.projectData || context) as IProjectContextLike

    const replaceText = (str: string): string => {
        if (!str || typeof str !== 'string') return str
        let res = str
        if (res.includes(oldPath)) {
            res = res.split(oldPath).join(newPath)
            replaceCount++
        }
        if (res.includes(`asset://project/${oldPath}`)) {
            res = res.split(`asset://project/${oldPath}`).join(`asset://project/${newPath}`)
            replaceCount++
        }
        if (oldFileName !== newFileName && res.includes(oldFileName)) {
            res = res.split(oldFileName).join(newFileName)
            replaceCount++
        }
        return res
    }

    // 1. Hero
    const hero = context.playerCharacter || projectData.playerCharacter
    if (hero) {
        const curAvatar = typeof hero.getAvatar === 'function' ? hero.getAvatar() : hero.avatar
        if (curAvatar && pathMatches(curAvatar, oldPath, oldFileName)) {
            if (typeof hero.setAvatar === 'function') hero.setAvatar(newPath)
            else hero.avatar = newPath
            replaceCount++
        }
        if (typeof hero.getDescription === 'function' && hero.getDescription()) {
            const desc = hero.getDescription()
            if (desc && typeof desc.getText === 'function') {
                const text = desc.getText() || ''
                const updated = replaceText(text)
                if (updated !== text && typeof desc.setText === 'function') desc.setText(updated)
            }
        }
    }

    // 2. Characters / NPCs
    const characters = context.projectCharacters || projectData.projectCharacters || []
    if (Array.isArray(characters)) {
        for (const npc of characters) {
            if (!npc) continue
            const curAvatar = typeof npc.getAvatar === 'function' ? npc.getAvatar() : npc.avatar
            if (curAvatar && pathMatches(curAvatar, oldPath, oldFileName)) {
                if (typeof npc.setAvatar === 'function') npc.setAvatar(newPath)
                else npc.avatar = newPath
                replaceCount++
            }
            if (typeof npc.getDescription === 'function' && npc.getDescription()) {
                const desc = npc.getDescription()
                if (desc && typeof desc.getText === 'function') {
                    const text = desc.getText() || ''
                    const updated = replaceText(text)
                    if (updated !== text && typeof desc.setText === 'function')
                        desc.setText(updated)
                }
            }
        }
    }

    // 3. Items
    const items = context.projectItems || projectData.projectItems || projectData.items || []
    if (Array.isArray(items)) {
        for (const item of items) {
            if (!item) continue
            const curAvatar =
                (typeof item.getAvatar === 'function' ? item.getAvatar() : item.avatar) ||
                (typeof item.getImage === 'function' ? item.getImage() : item.image)
            if (curAvatar && pathMatches(curAvatar, oldPath, oldFileName)) {
                if (typeof item.setAvatar === 'function') item.setAvatar(newPath)
                else item.avatar = newPath
                replaceCount++
            }
        }
    }

    // 4. Paragraphs
    const paragraphs = context.projectParagraphs || projectData.projectParagraphs || []
    if (Array.isArray(paragraphs)) {
        for (const p of paragraphs) {
            if (!p) continue
            if (typeof p.getContent === 'function' && p.getContent()) {
                const c = p.getContent()
                if (c && typeof c.getText === 'function') {
                    const text = c.getText() || ''
                    const updated = replaceText(text)
                    if (updated !== text && typeof c.setText === 'function') c.setText(updated)
                }
            } else if (typeof p.getDescription === 'function' && p.getDescription()) {
                const d = p.getDescription()
                if (d && typeof d.getText === 'function') {
                    const text = d.getText() || ''
                    const updated = replaceText(text)
                    if (updated !== text && typeof d.setText === 'function') d.setText(updated)
                }
            } else if (typeof p.content === 'string') {
                p.content = replaceText(p.content)
            } else if (
                typeof p.content === 'object' &&
                p.content &&
                typeof p.content.text === 'string'
            ) {
                p.content.text = replaceText(p.content.text)
            }
        }
    }

    // 5. Files map
    const files = context.files || projectData.files
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
