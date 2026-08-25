import { Cecha } from './Cecha'
import { Opis } from './Opis'
import { Przymiot } from './Przymiot'
import { Tag } from './Tag'
import { Umiejetnosc } from './Umiejetnosc'

export class NPC {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private cechy: Cecha[] = []
    private umiejetnosci: Umiejetnosc[] = []
    private przymioty: Przymiot[] = []
    private tags: Tag[] = []

    constructor(
        id: string,
        nazwa: string = '',
        opis: Opis = new Opis(),
        cechy: Cecha[] = [],
        umiejetnosci: Umiejetnosc[] = [],
        przymioty: Przymiot[] = [],
        tags: Tag[] = []
    ) {
        this.id = id
        this.nazwa = nazwa
        this.opis = opis
        this.cechy = cechy
        this.umiejetnosci = umiejetnosci
        this.przymioty = przymioty
        this.tags = tags
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

    public pobierzCechy(): Cecha[] {
        return this.cechy
    }

    public pobierzCecha(id: string): string | number | undefined {
        return this.cechy
            .find(c => c.pobierzID() === id || c.pobierzNazwe() === id)
            ?.pobierzWartosc()
    }

    public dodajCecha(cecha: Cecha): void {
        if (!this.cechy.some(c => c.pobierzID() === cecha.pobierzID())) {
            this.cechy.push(cecha)
        }
    }

    public usunCecha(id: string): void {
        this.cechy = this.cechy.filter(c => c.pobierzID() !== id && c.pobierzNazwe() !== id)
    }

    public czymaCecha(id: string): boolean {
        return this.cechy.some(c => c.pobierzID() === id || c.pobierzNazwe() === id)
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
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const npc = new NPC(
            json.id || '',
            json.nazwa || '',
            Opis.fromJSON(json.opis),
            (json.cechy || []).map((c: any) => Cecha.fromJSON(c)),
            (json.umiejetnosci || []).map((u: any) => Umiejetnosc.fromJSON(u)),
            (json.przymioty || []).map((p: any) => Przymiot.fromJSON(p)),
            tagsParsed
        )
        return npc
    }

    public toJSON(): any {
        return {
            id: this.id,
            nazwa: this.nazwa,
            opis: this.opis,
            cechy: this.cechy,
            umiejetnosci: this.umiejetnosci,
            przymioty: this.przymioty,
            tags: this.tags,
        }
    }
}
