export class Tag {
    private id: string = ''
    private nazwa: string = ''
    private kolor: string = '#3b82f6'

    constructor(id: string = '', nazwa: string = '', kolor: string = '#3b82f6') {
        this.id = id
        this.nazwa = nazwa || id
        this.kolor = kolor
    }

    public pobierzID(): string {
        return this.id
    }

    public nadajID(id: string): void {
        this.id = id
    }

    public pobierzNazwe(): string {
        return this.nazwa
    }

    public ustawNazwe(nazwa: string): void {
        this.nazwa = nazwa
    }

    public pobierzKolor(): string {
        return this.kolor
    }

    public ustawKolor(kolor: string): void {
        this.kolor = kolor
    }

    public static fromJSON(json: any): Tag {
        if (!json) return new Tag()
        if (typeof json === 'string') return new Tag(json, json)
        return new Tag(
            json.id || json.nazwa || '',
            json.nazwa || json.name || json.id || '',
            json.kolor || json.color || '#3b82f6'
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            nazwa: this.nazwa,
            kolor: this.kolor,
        }
    }
}
