import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { EntitySyncService } from './EntitySyncService'
import { createEntitySuggestionConfig, EntityMention } from './extensions/EntityMention'
import { IDocumentEntities, IEntityMentionItem, IMarkdownEditorOptions } from './types'

export class MarkdownEditor {
    private editor: Editor | null = null
    private container: HTMLElement
    private options: IMarkdownEditorOptions
    private isUpdatingInternally: boolean = false

    constructor(options: IMarkdownEditorOptions) {
        this.options = options
        this.container = options.element
        this.initEditor()
    }

    private initEditor(): void {
        const getEntities = this.options.getProjectEntities || (() => [])

        this.editor = new Editor({
            element: this.container,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3, 4],
                    },
                }),
                Markdown.configure({
                    html: false,
                    tightLists: true,
                    bulletListMarker: '-',
                    breaks: true,
                }),
                EntityMention.configure({
                    suggestion: createEntitySuggestionConfig(getEntities),
                }),
            ],
            content: this.options.initialContent || '',
            editorProps: {
                attributes: {
                    class: 'gamebook-prose prose prose-invert max-w-none focus:outline-none min-h-[200px] text-sm leading-relaxed text-[#e4e4e7] p-6 font-sans',
                    spellcheck: 'false',
                },
                handleClick: (_view, _pos, event) => {
                    const target = event.target as HTMLElement
                    const badge = target.closest('.entity-mention-badge') as HTMLElement
                    if (badge && this.options.onEntityClick) {
                        const id = badge.getAttribute('data-entity-id') || ''
                        const type = (badge.getAttribute('data-entity-type') ||
                            'location') as IEntityMentionItem['type']
                        const label =
                            badge.getAttribute('data-label') || badge.textContent?.trim() || id
                        this.options.onEntityClick({ id, name: label, type })
                        return true
                    }
                    return false
                },
            },
            onUpdate: ({ editor }) => {
                if (this.isUpdatingInternally) return

                const markdown = this.getMarkdown()
                const entities = EntitySyncService.extractReferencedEntities(editor)

                if (this.options.onUpdate) {
                    this.options.onUpdate(markdown, entities)
                }
            },
        })
    }

    public getMarkdown(): string {
        if (!this.editor) return ''
        const storage = (this.editor.storage as any).markdown
        if (storage && typeof storage.getMarkdown === 'function') {
            return storage.getMarkdown()
        }
        return this.editor.getText()
    }

    public setMarkdown(content: string): void {
        if (!this.editor) return
        this.isUpdatingInternally = true
        try {
            this.editor.commands.setContent(content || '')
        } finally {
            this.isUpdatingInternally = false
        }
    }

    public getExtractedEntities(): IDocumentEntities {
        if (!this.editor) {
            return { locations: [], characters: [], tags: [], traits: [] }
        }
        return EntitySyncService.extractReferencedEntities(this.editor)
    }

    public insertEntity(item: IEntityMentionItem): void {
        if (!this.editor) return
        this.editor
            .chain()
            .focus()
            .insertContent({
                type: 'mention',
                attrs: {
                    id: item.id,
                    label: item.name,
                    type: item.type,
                },
            })
            .insertContent(' ')
            .run()
    }

    // Formatting Toolbar Helpers
    public toggleBold(): boolean {
        return this.editor?.chain().focus().toggleBold().run() ?? false
    }

    public toggleItalic(): boolean {
        return this.editor?.chain().focus().toggleItalic().run() ?? false
    }

    public toggleHeading(level: 1 | 2 | 3 | 4): boolean {
        return this.editor?.chain().focus().toggleHeading({ level }).run() ?? false
    }

    public toggleBulletList(): boolean {
        return this.editor?.chain().focus().toggleBulletList().run() ?? false
    }

    public toggleOrderedList(): boolean {
        return this.editor?.chain().focus().toggleOrderedList().run() ?? false
    }

    public toggleBlockquote(): boolean {
        return this.editor?.chain().focus().toggleBlockquote().run() ?? false
    }

    public undo(): boolean {
        return this.editor?.chain().focus().undo().run() ?? false
    }

    public redo(): boolean {
        return this.editor?.chain().focus().redo().run() ?? false
    }

    public isActive(name: string, attrs?: Record<string, any>): boolean {
        return this.editor?.isActive(name, attrs) ?? false
    }

    public focus(): void {
        this.editor?.commands.focus()
    }

    public getWordCount(): number {
        if (!this.editor) return 0
        const text = this.editor.getText().trim()
        if (!text) return 0
        return text.split(/\s+/).filter(Boolean).length
    }

    public getCharacterCount(): number {
        if (!this.editor) return 0
        return this.editor.getText().length
    }

    public getRawEditor(): Editor | null {
        return this.editor
    }

    public destroy(): void {
        if (this.editor) {
            this.editor.destroy()
            this.editor = null
        }
    }
}
