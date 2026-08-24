import { Cecha } from './Cecha'
import { Opis } from './Opis'
import { Przymiot } from './Przymiot'
import { Umiejetnosc } from './Umiejetnosc'

export class NPC {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private cechy: Cecha[] = []
    private umiejetnosci: Umiejetnosc[] = []
    private przymioty: Przymiot[] = []

    constructor(
        id: string,
        nazwa: string = '',
        opis: Opis = new Opis(),
        cechy: Cecha[] = [],
        umiejetnosci: Umiejetnosc[] = [],
        przymioty: Przymiot[] = []
    ) {
        this.id = id
        this.nazwa = nazwa
        this.opis = opis
        this.cechy = cechy
        this.umiejetnosci = umiejetnosci
        this.przymioty = przymioty
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

    public pobierzOpis(): Opis {
        return this.opis
    }

    public ustawOpis(opis: Opis): void {
        this.opis = opis
    }

    public pobierzCecha(id: string): string | number | undefined {
        return this.cechy.find(c => c.pobierzID() === id)?.pobierzWartosc()
    }

    public dodajCecha(cecha: Cecha): void {
        this.cechy.push(cecha)
    }

    public usunCecha(id: string): void {
        this.cechy = this.cechy.filter(c => c.pobierzID() !== id)
    }

    public czymaCecha(id: string): boolean {
        return this.cechy.some(c => c.pobierzID() === id)
    }

    public pobierzUmiejetnosc(id: string): Umiejetnosc | undefined {
        return this.umiejetnosci.find(u => u.pobierzID() === id)
    }

    public dodajUmiejetnosc(umiejetnosc: Umiejetnosc): void {
        this.umiejetnosci.push(umiejetnosc)
    }

    public usunUmiejetnosc(id: string): void {
        this.umiejetnosci = this.umiejetnosci.filter(u => u.pobierzID() !== id)
    }

    public czymaUmiejetnosc(id: string): boolean {
        return this.umiejetnosci.some(u => u.pobierzID() === id)
    }

    public pobierzPrzymiot(id: string): Przymiot | undefined {
        return this.przymioty.find(p => p.pobierzID() === id)
    }

    public dodajPrzymiot(przymiot: Przymiot): void {
        this.przymioty.push(przymiot)
    }

    public usunPrzymiot(id: string): void {
        this.przymioty = this.przymioty.filter(p => p.pobierzID() !== id)
    }

    public czymaPrzymiot(id: string): boolean {
        return this.przymioty.some(p => p.pobierzID() === id)
    }

    public static fromJSON(json: any): NPC {
        if (!json) return new NPC('')
        const npc = new NPC(
            json.id || '',
            json.nazwa || '',
            Opis.fromJSON(json.opis),
            (json.cechy || []).map((c: any) => Cecha.fromJSON(c)),
            (json.umiejetnosci || []).map((u: any) => Umiejetnosc.fromJSON(u)),
            (json.przymioty || []).map((p: any) => Przymiot.fromJSON(p))
        )
        return npc
    }
}
