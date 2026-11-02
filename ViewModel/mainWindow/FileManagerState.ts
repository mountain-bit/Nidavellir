import { Description } from '../../Model/Description'
import { ProjectManager } from '../../Services/project/ProjectManager'
import { formatDescriptionFileName } from '../../Utils/fs/pathSanitizer'
import type { IHistoryItem } from './types'
import type { WorkspaceLayoutState } from './WorkspaceLayoutState'

export class FileManagerState {
    private activeFile: string | null = null
    private openFiles: string[] = []
    private fileDisplayNames: Map<string, string> = new Map()

    private layoutState: WorkspaceLayoutState
    private getSelectedItem: () => IHistoryItem | null

    constructor(layoutState: WorkspaceLayoutState, getSelectedItem: () => IHistoryItem | null) {
        this.layoutState = layoutState
        this.getSelectedItem = getSelectedItem
    }

    public openOrCreateDescriptionFile(_fileType?: 'text' | string): {
        fileName: string
        content: string
    } {
        const selectedItem = this.getSelectedItem()
        if (!selectedItem?.entity) {
            return { fileName: '', content: '' }
        }

        const entity = selectedItem.entity
        const desc: Description = entity.getContent
            ? entity.getContent()
            : entity.getDescription
              ? entity.getDescription()
              : new Description()

        let fileName = ''
        const existingPath = desc.getFilePath()
        if (existingPath) {
            const parts = existingPath.replace(/\\/g, '/').split('/')
            fileName = parts[parts.length - 1]
        }
        if (!fileName) {
            const type = selectedItem.type || 'element'
            fileName = formatDescriptionFileName(type, selectedItem.name)
            desc.setFilePath(fileName)
        }

        if (!desc.getText()) {
            desc.setText(`# ${selectedItem.name}\n\nNarrative text for players.`)
        }
        const content = desc.getText()

        if (selectedItem?.name) {
            this.fileDisplayNames.set(fileName, selectedItem.name)
        }

        this.setActiveFile(fileName)
        return { fileName, content }
    }

    public getActiveFile(): string | null {
        return this.activeFile
    }

    public setActiveFile(file: string | null): void {
        this.activeFile = file
        if (file) {
            this.layoutState.setActiveMainView('markdown')
            if (!this.openFiles.includes(file)) {
                this.openFiles.push(file)
            }
        }
    }

    public getOpenFiles(): string[] {
        return [...this.openFiles]
    }

    public closeFile(file: string): void {
        this.openFiles = this.openFiles.filter(f => f !== file)
        if (this.activeFile === file) {
            this.activeFile =
                this.openFiles.length > 0 ? this.openFiles[this.openFiles.length - 1] : null
        }
    }

    public setFileDisplayName(file: string, displayName: string): void {
        this.fileDisplayNames.set(file, displayName)
    }

    public updateFileDisplayNameForEntity(oldName: string, newName: string, id?: string): void {
        for (const [key, val] of this.fileDisplayNames.entries()) {
            if (val === oldName || (id && key.includes(id))) {
                this.fileDisplayNames.set(key, newName)
            }
        }
    }

    public getFileDisplayName(file: string | null): string {
        if (!file) return ''
        if (this.fileDisplayNames.has(file)) {
            return this.fileDisplayNames.get(file)!
        }

        const base = file.replace(/\\/g, '/').split('/').pop() || file
        if (this.fileDisplayNames.has(base)) {
            return this.fileDisplayNames.get(base)!
        }

        const baseWithoutExt = base.replace(/\.md$/i, '')
        if (this.fileDisplayNames.has(baseWithoutExt)) {
            return this.fileDisplayNames.get(baseWithoutExt)!
        }

        const project = ProjectManager.getInstance().getProject()
        if (project) {
            const allEntities: {
                getName?: () => string
                getTitle?: () => string
                getContent?: () => Description
                getDescription?: () => Description
            }[] = [
                ...project.getScenes().flatMap(s => s.getParagraphs()),
                ...project.getCharacters(),
                ...project.getLocations(),
                ...project.getItems(),
                ...project.getScenes(),
                ...project.getTemplates(),
                ...(project.getPlayerCharacter ? [project.getPlayerCharacter()] : []),
            ]

            for (const ent of allEntities) {
                const desc = ent.getContent
                    ? ent.getContent()
                    : ent.getDescription
                      ? ent.getDescription()
                      : null
                const filePath = desc?.getFilePath()
                if (filePath) {
                    const norm = filePath.replace(/\\/g, '/')
                    const normBase = norm.split('/').pop() || norm
                    const normBaseNoExt = normBase.replace(/\.md$/i, '')
                    if (
                        norm === file ||
                        norm.endsWith('/' + file) ||
                        normBase === base ||
                        normBaseNoExt === baseWithoutExt
                    ) {
                        const name = ent.getName
                            ? ent.getName()
                            : ent.getTitle
                              ? ent.getTitle()
                              : ''
                        if (name) {
                            this.fileDisplayNames.set(file, name)
                            return name
                        }
                    }
                }
            }
        }

        const match = /^Description_[^_]+_(.+)$/i.exec(baseWithoutExt)
        if (match && match[1]) {
            const parsedName = match[1].replace(/_/g, ' ')
            this.fileDisplayNames.set(file, parsedName)
            return parsedName
        }

        const legacyMatch = /^(.+)_(?:text|author)$/i.exec(baseWithoutExt)
        if (legacyMatch && legacyMatch[1]) {
            const parsedName = legacyMatch[1].replace(/_/g, ' ')
            this.fileDisplayNames.set(file, parsedName)
            return parsedName
        }

        const fallback = baseWithoutExt.replace(/_/g, ' ')
        this.fileDisplayNames.set(file, fallback)
        return fallback
    }
}
