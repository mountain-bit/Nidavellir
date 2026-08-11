import { Opis } from './Opis'
import { Warunek } from './Warunek'

export class Przeskok {
    private id: string = ''
    private nazwa: string = ''
    private warunek: Warunek = new Warunek('', '')
    private opis: Opis = new Opis()

    constructor(id: string, nazwa: string = '') {
        this.id = id
        this.nazwa = nazwa
        this.warunek = new Warunek('', '')
        this.opis = new Opis()
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

    public pobierzNazwe(): string {
        return this.nazwa
    }

    public ustawNazwe(nazwa: string): void {
        this.nazwa = nazwa
    }

    public pobierzWarunek(): Warunek {
        return this.warunek
    }

    public ustawWarunek(warunek: Warunek): void {
        this.warunek = warunek
    }

    public pobierzOpis(): Opis {
        return this.opis
    }

    public ustawOpis(opis: Opis): void {
        this.opis = opis
    }
}
