import { Opis } from './Opis'

export class Przedmiot {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()

    constructor(id: string, nazwa: string = '', opis: Opis = new Opis()) {
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

    public ustawNazwe(nazwa: string) {
        this.nazwa = nazwa
    }

    public ustawOpis(opis: Opis) {
        this.opis = opis
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
