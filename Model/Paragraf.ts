import { Opis } from './Opis'
import { Przeskok } from './Przeskok'
import { Walka } from './Walka'

export class Paragraf {
    private id: string = ''
    private tags: string[] = []
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
        walka: Walka = new Walka('', '')
    ) {
        this.id = id
        this.tytul = tytul
        this.tresc = tresc
        this.listaPrzeskokow = listaPrzeskokow
        this.czyJestWalka = czyJestWalka
        this.walka = walka
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
}
