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

    public ustawNazwe(nazwa: string) {
        this.nazwa = nazwa
    }

    public ustawOpis(opis: Opis) {
        this.opis = opis
    }

    public ustawWartosc(wartosc: string | number) {
        this.wartosc = wartosc
    }

    public pobierzID(): string {
        return this.id
    }

    public nadajID(id: string) {
        this.id = id
    }

    public czymaID(): boolean {
        return this.id !== ''
    }
}
