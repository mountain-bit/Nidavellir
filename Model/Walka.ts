import { NPC } from './NPC'
import { Opis } from './Opis'

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

    public pobierzOpisZwyciestwa(): Opis {
        return this.opisyZwyciestwa
    }

    public ustawOpisZwyciestwa(opis: Opis): void {
        this.opisyZwyciestwa = opis
    }

    public pobierzOpisPorazki(): Opis {
        return this.opisyPorazki
    }

    public ustawOpisPorazki(opis: Opis): void {
        this.opisyPorazki = opis
    }

    public pobierzOpisRemisu(): Opis {
        return this.opisRemisu
    }

    public ustawOpisRemisu(opis: Opis): void {
        this.opisRemisu = opis
    }

    public dodajPrzeciwnika(przeciwnik: NPC): void {
        this.przeciwnicy.push(przeciwnik)
    }

    public usunPrzeciwnika(przeciwnik: NPC): void {
        this.przeciwnicy = this.przeciwnicy.filter(p => p !== przeciwnik)
    }

    public pobierzPrzeciwnikow(): NPC[] {
        return this.przeciwnicy
    }

    public static fromJSON(json: any): Walka {
        if (!json) return new Walka('', '')
        const w = new Walka(json.id || '', json.nazwa || '')
        if (json.opisyZwyciestwa) w.ustawOpisZwyciestwa(Opis.fromJSON(json.opisyZwyciestwa))
        if (json.opisyPorazki) w.ustawOpisPorazki(Opis.fromJSON(json.opisyPorazki))
        if (json.opisRemisu) w.ustawOpisRemisu(Opis.fromJSON(json.opisRemisu))
        if (json.przeciwnicy && Array.isArray(json.przeciwnicy)) {
            json.przeciwnicy.forEach((p: any) => w.dodajPrzeciwnika(NPC.fromJSON(p)))
        }
        return w
    }
}
