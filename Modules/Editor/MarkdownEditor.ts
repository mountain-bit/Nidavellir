import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { CustomStylesService } from './CustomStylesService'
import { EntitySyncService } from './EntitySyncService'
import { CustomStyleMark } from './extensions/CustomStyleMark'
import { CustomUnderline } from './extensions/CustomUnderline'
import { DialogBlock } from './extensions/DialogBlock'
import { createEntitySuggestionConfig, EntityMention } from './extensions/EntityMention'
import {
    IActiveFormatting,
    IDocumentEntities,
    IEntityMentionItem,
    IMarkdownEditorOptions,
} from './types'

interface IMarkdownStorage {
    markdown?: {
        getMarkdown?: () => string
    }
}

interface IEditorChainedCommands {
    toggleUnderline: () => { run: () => boolean }
    toggleCustomStyle: (styleId: string) => { run: () => boolean }
    unsetCustomStyle: () => { run: () => boolean }
}

interface IEditorCommands {
    toggleDialog?: () => boolean
}

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
        const getEntities = this.options.getProjectEntities || ((): IEntityMentionItem[] => [])
        const customStyles = this.options.getCustomStyles
            ? this.options.getCustomStyles()
            : CustomStylesService.getStyles()
        CustomStylesService.injectStyleSheet(customStyles)

        this.editor = new Editor({
            element: this.container,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3, 4, 5],
                    },
                    underline: false,
                }),
                CustomUnderline,
                CustomStyleMark,
                DialogBlock,
                Markdown.configure({
                    html: true,
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
                handleClick: (_view, _pos, event): boolean => {
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
            onUpdate: ({ editor }): void => {
                if (this.isUpdatingInternally) return

                const markdown = this.getMarkdown()
                const entities = EntitySyncService.extractReferencedEntities(editor)

                if (this.options.onUpdate) {
                    this.options.onUpdate(markdown, entities)
                }
            },
            onSelectionUpdate: (): void => {
                if (this.options.onSelectionUpdate) {
                    this.options.onSelectionUpdate(this.getActiveFormatting())
                }
            },
            onTransaction: (): void => {
                if (this.options.onSelectionUpdate) {
                    this.options.onSelectionUpdate(this.getActiveFormatting())
                }
            },
        })
    }

    public getMarkdown(): string {
        if (!this.editor) return ''
        const storage = (this.editor.storage as IMarkdownStorage).markdown
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
    public setParagraph(): boolean {
        return this.editor?.chain().focus().setParagraph().run() ?? false
    }

    public toggleBold(): boolean {
        return this.editor?.chain().focus().toggleBold().run() ?? false
    }

    public toggleItalic(): boolean {
        return this.editor?.chain().focus().toggleItalic().run() ?? false
    }

    public toggleUnderline(): boolean {
        return (
            (this.editor?.chain().focus() as unknown as IEditorChainedCommands)
                .toggleUnderline()
                .run() ?? false
        )
    }

    public toggleStrike(): boolean {
        return this.editor?.chain().focus().toggleStrike().run() ?? false
    }

    public toggleHeading(level: 1 | 2 | 3 | 4 | 5): boolean {
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

    public toggleDialog(): boolean {
        return (this.editor?.commands as unknown as IEditorCommands).toggleDialog?.() ?? false
    }

    public toggleCustomStyle(styleId: string): boolean {
        return (
            (this.editor?.chain().focus() as unknown as IEditorChainedCommands)
                ?.toggleCustomStyle(styleId)
                .run() ?? false
        )
    }

    public unsetCustomStyle(): boolean {
        return (
            (this.editor?.chain().focus() as unknown as IEditorChainedCommands)
                ?.unsetCustomStyle()
                .run() ?? false
        )
    }

    public getActiveCustomStyle(): string | null {
        if (!this.editor) return null
        const attrs = this.editor.getAttributes('customStyle')
        return attrs?.styleId || null
    }

    public undo(): boolean {
        return this.editor?.chain().focus().undo().run() ?? false
    }

    public redo(): boolean {
        return this.editor?.chain().focus().redo().run() ?? false
    }

    public isActive(name: string, attrs?: Record<string, unknown>): boolean {
        return this.editor?.isActive(name, attrs) ?? false
    }

    public getActiveFormatting(): IActiveFormatting {
        if (!this.editor) return {}
        return {
            bold: this.editor.isActive('bold'),
            italic: this.editor.isActive('italic'),
            underline: this.editor.isActive('underline'),
            strike: this.editor.isActive('strike'),
            paragraph: this.editor.isActive('paragraph'),
            h1: this.editor.isActive('heading', { level: 1 }),
            h2: this.editor.isActive('heading', { level: 2 }),
            h3: this.editor.isActive('heading', { level: 3 }),
            h4: this.editor.isActive('heading', { level: 4 }),
            h5: this.editor.isActive('heading', { level: 5 }),
            bulletList: this.editor.isActive('bulletList'),
            orderedList: this.editor.isActive('orderedList'),
            blockquote: this.editor.isActive('blockquote'),
            dialog: this.editor.isActive('dialog'),
            customStyle: this.editor.isActive('customStyle'),
            activeCustomStyleId: this.getActiveCustomStyle(),
        }
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
