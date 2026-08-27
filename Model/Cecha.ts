import { Opis } from './Opis'

export class Cecha {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private wartosc: string | number

    constructor(id: string, nazwa: string = '', opis: Opis = new Opis(), wartosc: string | number) {
        this.nazwa = nazwa
        this.opis = opis
        this.wartosc = wartosc
        this.id = id
    }

    public pobierzNazwe(): string {
        return this.nazwa
    }

    public pobierzOpis(): Opis {
        return this.opis
    }

    public pobierzWartosc(): string | number {
        return this.wartosc
    }

    public ustawNazwe(nazwa: string): void {
        this.nazwa = nazwa
    }

    public ustawOpis(opis: Opis): void {
        this.opis = opis
    }

    public ustawWartosc(wartosc: string | number): void {
        this.wartosc = wartosc
    }

    public pobierzID(): string {
        return this.id
    }

    public nadajID(id: string): void {
        this.id = id
    }

    public czymaID(): boolean {
        return this.id !== ''
    }

    public static fromJSON(json: any): Cecha {
        if (!json) return new Cecha('', '', new Opis(), '')
        return new Cecha(
            json.id || '',
            json.nazwa || '',
            Opis.fromJSON(json.opis),
            json.wartosc || ''
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            nazwa: this.nazwa,
            opis: this.opis,
            wartosc: this.wartosc,
        }
    }
}
