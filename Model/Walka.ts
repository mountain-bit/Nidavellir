import { Opis } from './Opis'
import { NPC } from './NPC'

export class Walka {
    private id: string = ''
    private nazwa: string = ''
    private opisyZwyciestwa: Opis = new Opis()
    private opisyPorazki: Opis = new Opis()
    private opisRemisu: Opis = new Opis()
    private przeciwnicy: NPC[] = []

    constructor(
        id: string,
        nazwa: string = '',
        opisyZwyciestwa: Opis = new Opis(),
        opisyPorazki: Opis = new Opis(),
        opisRemisu: Opis = new Opis(),
        przeciwnicy: NPC[] = []
    ) {
        this.id = id
        this.nazwa = nazwa
        this.opisyZwyciestwa = opisyZwyciestwa
        this.opisyPorazki = opisyPorazki
        this.opisRemisu = opisRemisu
        this.przeciwnicy = przeciwnicy
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

    public pobierzNazwe(): string {
        return this.nazwa
    }

    public ustawNazwe(nazwa: string) {
        this.nazwa = nazwa
    }

    public pobierzOpisZwyciestwa(): Opis {
        return this.opisyZwyciestwa
    }

    public ustawOpisZwyciestwa(opis: Opis) {
        this.opisyZwyciestwa = opis
    }

    public pobierzOpisPorazki(): Opis {
        return this.opisyPorazki
    }

    public ustawOpisPorazki(opis: Opis) {
        this.opisyPorazki = opis
    }

    public pobierzOpisRemisu(): Opis {
        return this.opisRemisu
    }

    public ustawOpisRemisu(opis: Opis) {
        this.opisRemisu = opis
    }

    public dodajPrzeciwnika(przeciwnik: NPC) {
        this.przeciwnicy.push(przeciwnik)
    }

    public usunPrzeciwnika(przeciwnik: NPC) {
        this.przeciwnicy = this.przeciwnicy.filter(p => p !== przeciwnik)
    }

    public pobierzPrzeciwnikow(): NPC[] {
        return this.przeciwnicy
    }
}
