export interface IDescriptionJSON {
    text?: string
    summary?: string
    authorNotes?: string
    textPath?: string
    authorNotesPath?: string
}

export class Description {
    private text: string = ''
    private summary: string = ''
    private authorNotes: string = ''
    private textPath: string = ''
    private authorNotesPath: string = ''

    constructor(
        text: string = '',
        summary: string = '',
        authorNotes: string = '',
        textPath: string = '',
        authorNotesPath: string = ''
    ) {
        this.text = text
        this.summary = summary
        this.authorNotes = authorNotes
        this.textPath = textPath
        this.authorNotesPath = authorNotesPath
    }

    public getText(): string {
        return this.text
    }

    public setText(text: string): void {
        this.text = text
    }

    public getSummary(): string {
        return this.summary
    }

    public setSummary(summary: string): void {
        this.summary = summary
    }

    public getAuthorNotes(): string {
        return this.authorNotes
    }

    public setAuthorNotes(authorNotes: string): void {
        this.authorNotes = authorNotes
    }

    public getTextPath(): string {
        return this.textPath
    }

    public setTextPath(textPath: string): void {
        this.textPath = textPath
    }

    public getAuthorNotesPath(): string {
        return this.authorNotesPath
    }

    public setAuthorNotesPath(authorNotesPath: string): void {
        this.authorNotesPath = authorNotesPath
    }

    public static fromJSON(json: IDescriptionJSON | null | undefined): Description {
        if (!json || typeof json !== 'object') {
            return new Description()
        }
        const text = typeof json.text === 'string' ? json.text : ''
        const summary = typeof json.summary === 'string' ? json.summary : ''
        const authorNotes = typeof json.authorNotes === 'string' ? json.authorNotes : ''
        const textPath = typeof json.textPath === 'string' ? json.textPath : ''
        const authorNotesPath = typeof json.authorNotesPath === 'string' ? json.authorNotesPath : ''

        return new Description(text, summary, authorNotes, textPath, authorNotesPath)
    }

    public toJSON(): IDescriptionJSON {
        return {
            text: this.text,
            summary: this.summary,
            authorNotes: this.authorNotes,
            textPath: this.textPath,
            authorNotesPath: this.authorNotesPath,
        }
    }
}
