import { Opis } from './Opis'
import { Tag } from './Tag'

export class Lokacja {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private tags: Tag[] = []

    constructor(id: string = '', nazwa: string = '', opis: Opis = new Opis(), tags: Tag[] = []) {
        this.id = id
        this.nazwa = nazwa
        this.opis = opis
        this.tags = tags
    }

    public pobierzID(): string {
        return this.id
    }

    public pobierzNazwe(): string {
        return this.nazwa
    }

    public pobierzOpis(): Opis {
        return this.opis
    }

    public ustawOpis(opis: Opis): void {
        this.opis = opis
    }

    public pobierzTagi(): Tag[] {
        return this.tags
    }

    public ustawTagi(tags: Tag[]): void {
        this.tags = tags
    }

    public dodajTag(tag: Tag): void {
        if (!this.tags.some(t => t.pobierzID() === tag.pobierzID())) {
            this.tags.push(tag)
        }
    }

    public usunTag(tagIdOrName: string): void {
        this.tags = this.tags.filter(
            t => t.pobierzID() !== tagIdOrName && t.pobierzNazwe() !== tagIdOrName
        )
    }

    public czymaTag(tagIdOrName: string): boolean {
        return this.tags.some(
            t => t.pobierzID() === tagIdOrName || t.pobierzNazwe() === tagIdOrName
        )
    }

    public static fromJSON(json: any): Lokacja {
        if (!json) return new Lokacja()
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        return new Lokacja(json.id || '', json.nazwa || '', Opis.fromJSON(json.opis), tagsParsed)
    }

    public toJSON(): any {
        return {
            id: this.id,
            nazwa: this.nazwa,
            opis: this.opis,
            tags: this.tags,
        }
    }
}
