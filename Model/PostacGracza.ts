import { Cecha } from "./Cecha"
import { KlasaPostaci } from "./KlasaPostaci"
import { Opis } from "./Opis"
import { Przedmiot } from "./Przedmiot"
import { Przymiot } from "./Przymiot"
import { Umiejetnosc } from "./Umiejetnosc"

export class PostacGracza {
    private id: string = ""
    private nazwa: string = ""
    private opis: Opis = new Opis()
    private cechy: Cecha[] = []
    private umiejetnosci: Umiejetnosc[] = []
    private przymioty: Przymiot[] = []
    private przedmioty: Przedmiot[] = []
    private klasaPostaci: KlasaPostaci | null = null

    constructor(id: string = "", nazwa: string = "", opis: Opis = new Opis(), cechy: Cecha[] = [], umiejetnosci: Umiejetnosc[] = [], przymioty: Przymiot[] = [], przedmioty: Przedmiot[] = [], klasaPostaci: KlasaPostaci | null = null) {
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
        if (this.id !== "") return this.id
        return undefined
    }

    public nadajID(id: string) {
        this.id = id
    }

    public czymaID(): boolean {
        return this.id !== ""
    }

    public pobierzNazwe(): string {
        return this.nazwa
    }

    public ustawNazwe(nazwa: string) {
        this.nazwa = nazwa
    }

    public pobierzOpis(): Opis {
        return this.opis
    }

    public ustawOpis(opis: Opis) {
        this.opis = opis
    }

    public pobierzCecha(id: string): string | number | undefined {
        return this.cechy.find(c => c.pobierzID() === id)?.pobierzWartosc()
    }

    public dodajCecha(cecha: Cecha) {
        this.cechy.push(cecha)
    }

    public usunCecha(id: string) {
        this.cechy = this.cechy.filter(c => c.pobierzID() !== id)
    }

    public czymaCecha(id: string): boolean {
        return this.cechy.some(c => c.pobierzID() === id)
    }

    public pobierzUmiejetnosc(id: string): Umiejetnosc | undefined {
        return this.umiejetnosci.find(u => u.pobierzID() === id)
    }

    public dodajUmiejetnosc(umiejetnosc: Umiejetnosc) {
        this.umiejetnosci.push(umiejetnosc)
    }

    public usunUmiejetnosc(id: string) {
        this.umiejetnosci = this.umiejetnosci.filter(u => u.pobierzID() !== id)
    }

    public czymaUmiejetnosc(id: string): boolean {
        return this.umiejetnosci.some(u => u.pobierzID() === id)
    }

    public pobierzPrzymiot(id: string): Przymiot | undefined {
        return this.przymioty.find(p => p.pobierzID() === id)
    }

    public dodajPrzymiot(przymiot: Przymiot) {
        this.przymioty.push(przymiot)
    }

    public usunPrzymiot(id: string) {
        this.przymioty = this.przymioty.filter(p => p.pobierzID() !== id)
    }

    public czymaPrzymiot(id: string): boolean {
        return this.przymioty.some(p => p.pobierzID() === id)
    }

    public pobierzPrzedmiot(id: string): Przedmiot | undefined {
        return this.przedmioty.find(p => p.pobierzID() === id)
    }

    public dodajPrzedmiot(przedmiot: Przedmiot) {
        this.przedmioty.push(przedmiot)
    }

    public usunPrzedmiot(id: string) {
        this.przedmioty = this.przedmioty.filter(p => p.pobierzID() !== id)
    }

    public czymaPrzedmiot(id: string): boolean {
        return this.przedmioty.some(p => p.pobierzID() === id)
    }

    public pobierzKlasaPostaci(): KlasaPostaci | undefined {
        return this.klasaPostaci || undefined
    }

    public ustawKlasaPostaci(klasaPostaci: KlasaPostaci) {
        this.klasaPostaci = klasaPostaci
    }

}