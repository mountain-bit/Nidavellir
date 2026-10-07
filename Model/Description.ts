export interface IDescriptionJSON {
    text?: string
    summary?: string
    filePath?: string
    textPath?: string
}

export class Description {
    private text: string = ''
    private summary: string = ''
    private filePath: string = ''

    constructor(text: string = '', summary: string = '', filePath: string = '') {
        this.text = text
        this.summary = summary
        this.filePath = filePath
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

    public getFilePath(): string {
        return this.filePath
    }

    public setFilePath(filePath: string): void {
        this.filePath = filePath
    }

    /** Backwards-compatible alias for filePath */
    public getTextPath(): string {
        return this.filePath
    }

    /** Backwards-compatible alias for filePath */
    public setTextPath(textPath: string): void {
        this.filePath = textPath
    }

    public static fromJSON(json: IDescriptionJSON | null | undefined): Description {
        if (!json || typeof json !== 'object') {
            return new Description()
        }
        const text = typeof json.text === 'string' ? json.text : ''
        const summary = typeof json.summary === 'string' ? json.summary : ''
        const filePath =
            typeof json.filePath === 'string'
                ? json.filePath
                : typeof json.textPath === 'string'
                  ? json.textPath
                  : ''

        return new Description(text, summary, filePath)
    }

    public toJSON(): IDescriptionJSON {
        return {
            text: this.text,
            summary: this.summary,
            filePath: this.filePath,
        }
    }
}
