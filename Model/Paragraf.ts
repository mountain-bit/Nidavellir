import { Opis } from './Opis'
import { Przeskok } from './Przeskok'
import { Tag } from './Tag'
import { Walka } from './Walka'

export class Paragraf {
    private id: string = ''
    private tags: Tag[] = []
    private numer: number = 0
    private numerWylosowany: number = 0
    private blokadaNumeru: boolean = false
    private tytul: string = ''
    private tresc: Opis = new Opis()
    private listaPrzeskokow: Przeskok[] = []
    private czyJestWalka: boolean = false
    private walka: Walka = new Walka('', '')

    constructor(
        id: string,
        tytul: string = '',
        tresc: Opis = new Opis(),
        listaPrzeskokow: Przeskok[] = [],
        czyJestWalka: boolean = false,
        walka: Walka = new Walka('', ''),
        tags: Tag[] = []
    ) {
        this.id = id
        this.tytul = tytul
        this.tresc = tresc
        this.listaPrzeskokow = listaPrzeskokow
        this.czyJestWalka = czyJestWalka
        this.walka = walka
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

    public pobierzTytul(): string {
        return this.tytul
    }

    public ustawTytul(tytul: string): void {
        this.tytul = tytul
    }

    public pobierzTresc(): Opis {
        return this.tresc
    }

    public ustawTresc(tresc: Opis): void {
        this.tresc = tresc
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

    public pobierzNumer(): number {
        return this.numer
    }

    public ustawNumer(numer: number): void {
        this.numer = numer
    }

    public pobierzNumerWylosowany(): number {
        return this.numerWylosowany
    }

    public ustawNumerWylosowany(numer: number): void {
        this.numerWylosowany = numer
    }

    public pobierzBlokadaNumeru(): boolean {
        return this.blokadaNumeru
    }

    public ustawBlokadaNumeru(blokada: boolean): void {
        this.blokadaNumeru = blokada
    }

    public pobierzListaPrzeskokow(): Przeskok[] {
        return this.listaPrzeskokow
    }

    public ustawListaPrzeskokow(listaPrzeskokow: Przeskok[]): void {
        this.listaPrzeskokow = listaPrzeskokow
    }

    public czymaPrzeskok(id: string): boolean {
        return this.listaPrzeskokow.some(p => p.pobierzID() === id)
    }

    public dodajPrzeskok(przeskok: Przeskok): void {
        this.listaPrzeskokow.push(przeskok)
    }

    public usunPrzeskok(id: string): void {
        this.listaPrzeskokow = this.listaPrzeskokow.filter(p => p.pobierzID() !== id)
    }

    public pobierzPrzeskok(id: string): Przeskok | undefined {
        return this.listaPrzeskokow.find(p => p.pobierzID() === id)
    }

    public pobierzCzyJestWalka(): boolean {
        return this.czyJestWalka
    }

    public ustawCzyJestWalka(czyJestWalka: boolean): void {
        this.czyJestWalka = czyJestWalka
    }

    public pobierzWalke(): Walka {
        return this.walka
    }

    public ustawWalke(walka: Walka): void {
        this.walka = walka
    }

    public static fromJSON(json: any): Paragraf {
        if (!json) return new Paragraf('')
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const p = new Paragraf(
            json.id || '',
            json.tytul || '',
            Opis.fromJSON(json.tresc),
            (json.listaPrzeskokow || []).map((przeskok: any) => Przeskok.fromJSON(przeskok)),
            json.czyJestWalka || false,
            json.walka ? Walka.fromJSON(json.walka) : new Walka('', ''),
            tagsParsed
        )
        if (json.numer !== undefined) p.numer = json.numer
        if (json.numerWylosowany !== undefined) p.numerWylosowany = json.numerWylosowany
        if (json.blokadaNumeru !== undefined) p.blokadaNumeru = json.blokadaNumeru
        return p
    }

    public toJSON(): any {
        return {
            id: this.id,
            tytul: this.tytul,
            tresc: this.tresc,
            listaPrzeskokow: this.listaPrzeskokow,
            czyJestWalka: this.czyJestWalka,
            walka: this.walka,
            tags: this.tags,
            numer: this.numer,
            numerWylosowany: this.numerWylosowany,
            blokadaNumeru: this.blokadaNumeru,
        }
    }
}
