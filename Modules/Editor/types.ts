import type { Location } from '../../Model/Location'
import type { NPC } from '../../Model/NPC'
import type { Tag } from '../../Model/Tag'

export type EntityType = 'location' | 'character' | 'trait' | 'tag' | 'item'

export interface IEntityMentionItem {
    id: string
    name: string
    type: EntityType
    icon?: string
    description?: string
    label?: string
    pos?: number
    rect?: DOMRect
    clientPoint?: { x: number; y: number }
}

export type DescriptionEmbedType = 'item' | 'character' | 'location'
export type DescriptionEmbedVariant = 'text' | 'summary'

export interface IDescriptionEmbedAttrs {
    id: string
    type: DescriptionEmbedType
    variant?: DescriptionEmbedVariant
    name?: string
    label?: string
    pos?: number
    rect?: DOMRect
    clientPoint?: { x: number; y: number }
}

export interface IDocumentEntities {
    locations: { id: string; name: string }[]
    characters: { id: string; name: string }[]
    tags: { id?: string; name: string }[]
    traits: { id?: string; name: string }[]
    embeds?: IDescriptionEmbedAttrs[]
}

export type IProjectEntityCandidate = {
    id?: string
    name?: string
    getId?: () => string
    getName?: () => string
    [key: string]: unknown
}

export interface ISyncProjectData {
    locations?: (Location | IProjectEntityCandidate)[]
    characters?: (NPC | IProjectEntityCandidate)[]
    tags?: (Tag | IProjectEntityCandidate)[]
}

export interface ICustomTextStyle {
    id: string
    name: string
    color?: string
    backgroundColor?: string
    italic?: boolean
    bold?: boolean
    underline?: boolean
    border?: boolean
    fontFamily?: string
    docxStyleName?: string
}

export interface IActiveFormatting {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    paragraph?: boolean
    h1?: boolean
    h2?: boolean
    h3?: boolean
    h4?: boolean
    h5?: boolean
    bulletList?: boolean
    orderedList?: boolean
    blockquote?: boolean
    dialog?: boolean
    customStyle?: boolean
    activeCustomStyleId?: string | null
    [key: string]: unknown
}

export interface IMarkdownEditorOptions {
    element: HTMLElement
    initialContent?: string
    placeholder?: string
    editable?: boolean
    getProjectEntities?: () => IEntityMentionItem[]
    getCustomStyles?: () => ICustomTextStyle[]
    onUpdate?: (markdown: string, entities: IDocumentEntities) => void
    onEntityClick?: (entity: IEntityMentionItem) => void
    onDescriptionEmbedClick?: (embed: IDescriptionEmbedAttrs) => void
    onSelectionUpdate?: (activeStates: IActiveFormatting) => void
}

export interface IFontCatalogItem {
    id: string
    family: string
    category: string
    subsets?: string[]
    supportsPolish?: boolean
    tags?: string[]
}

export interface IFetchFontsResult {
    fonts: IFontCatalogItem[]
    isOnline: boolean
    error?: string
}
