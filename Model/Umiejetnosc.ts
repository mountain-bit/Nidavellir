import { Opis } from './Opis'

export class Umiejetnosc {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()

    constructor(id: string = '', nazwa: string = '', opis: Opis = new Opis()) {
        this.nazwa = nazwa
        this.opis = opis
        this.id = id
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

    public czymaID(): boolean {
        return this.id !== ''
    }

    public pobierzID(): string {
        return this.id
    }

    public nadajID(id: string): void {
        this.id = id
    }

    public static fromJSON(json: any): Umiejetnosc {
        if (!json) return new Umiejetnosc()
        return new Umiejetnosc(json.id || '', json.nazwa || '', Opis.fromJSON(json.opis))
    }
}
