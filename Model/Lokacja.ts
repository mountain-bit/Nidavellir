import { Opis } from './Opis'

export class Lokacja {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private tags: string[] = []

    constructor(id: string = '', nazwa: string = '', opis: Opis = new Opis(), tags: string[] = []) {
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

    public dodajTag(tag: string): void {
        this.tags.push(tag)
    }

    public usunTag(tag: string): void {
        this.tags = this.tags.filter(t => t !== tag)
    }

    public pobierzTagi(): string[] {
        return this.tags
    }
}
