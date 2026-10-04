export type EntityType = 'location' | 'character' | 'trait' | 'tag' | 'item'

export interface IEntityMentionItem {
    id: string
    name: string
    type: EntityType
    icon?: string
    description?: string
}

export interface IDocumentEntities {
    locations: { id: string; name: string }[]
    characters: { id: string; name: string }[]
    tags: { id?: string; name: string }[]
    traits: { id?: string; name: string }[]
}

export interface IMarkdownEditorOptions {
    element: HTMLElement
    initialContent?: string
    placeholder?: string
    getProjectEntities?: () => IEntityMentionItem[]
    onUpdate?: (markdown: string, entities: IDocumentEntities) => void
    onEntityClick?: (entity: IEntityMentionItem) => void
}
