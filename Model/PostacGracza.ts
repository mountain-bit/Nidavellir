import { Cecha } from './Cecha'
import { KlasaPostaci } from './KlasaPostaci'
import { Opis } from './Opis'
import { Przedmiot } from './Przedmiot'
import { Przymiot } from './Przymiot'
import { Umiejetnosc } from './Umiejetnosc'

export class PostacGracza {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private cechy: Cecha[] = []
    private umiejetnosci: Umiejetnosc[] = []
    private przymioty: Przymiot[] = []
    private przedmioty: Przedmiot[] = []
    private klasaPostaci: KlasaPostaci | null = null

    constructor(
        id: string = '',
        nazwa: string = '',
        opis: Opis = new Opis(),
        cechy: Cecha[] = [],
        umiejetnosci: Umiejetnosc[] = [],
        przymioty: Przymiot[] = [],
        przedmioty: Przedmiot[] = [],
        klasaPostaci: KlasaPostaci | null = null
    ) {
        this.id = id
        this.nazwa = nazwa
        this.opis = opis
        this.cechy = cechy
        this.umiejetnosci = umiejetnosci
        this.przymioty = przymioty
        this.przedmioty = przedmioty
        this.klasaPostaci = klasaPostaci
    }

    public pobierzID(): string | undefined {
        if (this.id !== '') return this.id
        return undefined
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

    public pobierzPrzedmiot(id: string): Przedmiot | undefined {
        return this.przedmioty.find(p => p.pobierzID() === id)
    }

    public dodajPrzedmiot(przedmiot: Przedmiot): void {
        this.przedmioty.push(przedmiot)
    }

    public usunPrzedmiot(id: string): void {
        this.przedmioty = this.przedmioty.filter(p => p.pobierzID() !== id)
    }

    public czymaPrzedmiot(id: string): boolean {
        return this.przedmioty.some(p => p.pobierzID() === id)
    }

    public pobierzKlasaPostaci(): KlasaPostaci | undefined {
        return this.klasaPostaci || undefined
    }

    public ustawKlasaPostaci(klasaPostaci: KlasaPostaci): void {
        this.klasaPostaci = klasaPostaci
    }

    public static fromJSON(json: any): PostacGracza {
        if (!json) return new PostacGracza()
        return new PostacGracza(
            json.id || '',
            json.nazwa || '',
            Opis.fromJSON(json.opis),
            (json.cechy || []).map((c: any) => Cecha.fromJSON(c)),
            (json.umiejetnosci || []).map((u: any) => Umiejetnosc.fromJSON(u)),
            (json.przymioty || []).map((p: any) => Przymiot.fromJSON(p)),
            (json.przedmioty || []).map((p: any) => Przedmiot.fromJSON(p)),
            json.klasaPostaci ? KlasaPostaci.fromJSON(json.klasaPostaci) : null
        )
    }
}
