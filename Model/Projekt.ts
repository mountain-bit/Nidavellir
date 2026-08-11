import { Cecha } from './Cecha'
import { KlasaPostaci } from './KlasaPostaci'
import { Lokacja } from './Lokacja'
import { NPC } from './NPC'
import { Opis } from './Opis'
import { PostacGracza } from './PostacGracza'
import { Przedmiot } from './Przedmiot'
import { Przymiot } from './Przymiot'
import { Scena } from './Scena'
import { Umiejetnosc } from './Umiejetnosc'

export class Projekt {
    private id: string = ''
    private nazwa: string = ''
    private autor: string = ''
    private wersja: string = '1.0.0'
    private opis: Opis = new Opis()

    private sceny: Scena[] = []
    private lokacje: Lokacja[] = []
    private postacie: NPC[] = []
    private przedmioty: Przedmiot[] = []
    private klasyPostaci: KlasaPostaci[] = []
    private postacGracza: PostacGracza = new PostacGracza()

    // Globalne definicje, z których gracz/NPC mogą korzystać
    private globalneCechy: Cecha[] = []
    private globalneUmiejetnosci: Umiejetnosc[] = []
    private globalnePrzymioty: Przymiot[] = []

    constructor(
        id: string = '',
        nazwa: string = '',
        autor: string = '',
        wersja: string = '1.0.0',
        opis: Opis = new Opis(),
        sceny: Scena[] = [],
        lokacje: Lokacja[] = [],
        postacie: NPC[] = [],
        przedmioty: Przedmiot[] = [],
        klasyPostaci: KlasaPostaci[] = [],
        postacGracza: PostacGracza = new PostacGracza(),
        globalneCechy: Cecha[] = [],
        globalneUmiejetnosci: Umiejetnosc[] = [],
        globalnePrzymioty: Przymiot[] = []
    ) {
        this.id = id
        this.nazwa = nazwa
        this.autor = autor
        this.wersja = wersja
        this.opis = opis
        this.sceny = sceny
        this.lokacje = lokacje
        this.postacie = postacie
        this.przedmioty = przedmioty
        this.klasyPostaci = klasyPostaci
        this.postacGracza = postacGracza
        this.globalneCechy = globalneCechy
        this.globalneUmiejetnosci = globalneUmiejetnosci
        this.globalnePrzymioty = globalnePrzymioty
    }

    // --- Podstawowe dane ---

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

    public pobierzAutora(): string {
        return this.autor
    }

    public ustawAutora(autor: string): void {
        this.autor = autor
    }

    public pobierzWersje(): string {
        return this.wersja
    }

    public ustawWersje(wersja: string): void {
        this.wersja = wersja
    }

    public pobierzOpis(): Opis {
        return this.opis
    }

    public ustawOpis(opis: Opis): void {
        this.opis = opis
    }

    // --- Sceny ---

    public pobierzSceny(): Scena[] {
        return this.sceny
    }

    public ustawSceny(sceny: Scena[]): void {
        this.sceny = sceny
    }

    public dodajScene(scena: Scena): void {
        this.sceny.push(scena)
    }

    public usunScene(id: string): void {
        this.sceny = this.sceny.filter(s => s.pobierzID() !== id)
    }

    public pobierzScene(id: string): Scena | undefined {
        return this.sceny.find(s => s.pobierzID() === id)
    }

    public czymaScene(id: string): boolean {
        return this.sceny.some(s => s.pobierzID() === id)
    }

    // --- Lokacje ---
    public pobierzLokacje(): Lokacja[] {
        return this.lokacje
    }

    public ustawLokacje(lokacje: Lokacja[]): void {
        this.lokacje = lokacje
    }

    public dodajLokacja(lokacja: Lokacja): void {
        this.lokacje.push(lokacja)
    }

    public usunLokacja(id: string): void {
        this.lokacje = this.lokacje.filter(l => l.pobierzID() !== id)
    }

    public pobierzLokacja(id: string): Lokacja | undefined {
        return this.lokacje.find(l => l.pobierzID() === id)
    }

    public czymaLokacja(id: string): boolean {
        return this.lokacje.some(l => l.pobierzID() === id)
    }

    // --- Postacie (NPC) ---

    public pobierzPostacie(): NPC[] {
        return this.postacie
    }

    public ustawPostacie(postacie: NPC[]): void {
        this.postacie = postacie
    }

    public dodajPostac(postac: NPC): void {
        this.postacie.push(postac)
    }

    public usunPostac(id: string): void {
        this.postacie = this.postacie.filter(p => p.pobierzID() !== id)
    }

    public pobierzPostac(id: string): NPC | undefined {
        return this.postacie.find(p => p.pobierzID() === id)
    }

    public czymaPostac(id: string): boolean {
        return this.postacie.some(p => p.pobierzID() === id)
    }

    // --- Przedmioty ---

    public pobierzPrzedmioty(): Przedmiot[] {
        return this.przedmioty
    }

    public ustawPrzedmioty(przedmioty: Przedmiot[]): void {
        this.przedmioty = przedmioty
    }

    public dodajPrzedmiot(przedmiot: Przedmiot): void {
        this.przedmioty.push(przedmiot)
    }

    public usunPrzedmiot(id: string): void {
        this.przedmioty = this.przedmioty.filter(p => p.pobierzID() !== id)
    }

    public pobierzPrzedmiot(id: string): Przedmiot | undefined {
        return this.przedmioty.find(p => p.pobierzID() === id)
    }

    public czymaPrzedmiot(id: string): boolean {
        return this.przedmioty.some(p => p.pobierzID() === id)
    }

    // --- Klasy Postaci ---

    public pobierzKlasyPostaci(): KlasaPostaci[] {
        return this.klasyPostaci
    }

    public ustawKlasyPostaci(klasyPostaci: KlasaPostaci[]): void {
        this.klasyPostaci = klasyPostaci
    }

    public dodajKlasePostaci(klasaPostaci: KlasaPostaci): void {
        this.klasyPostaci.push(klasaPostaci)
    }

    public usunKlasePostaci(id: string): void {
        this.klasyPostaci = this.klasyPostaci.filter(k => k.pobierzID() !== id)
    }

    public pobierzKlasePostaci(id: string): KlasaPostaci | undefined {
        return this.klasyPostaci.find(k => k.pobierzID() === id)
    }

    public czymaKlasePostaci(id: string): boolean {
        return this.klasyPostaci.some(k => k.pobierzID() === id)
    }

    // --- Postać Gracza ---

    public pobierzPostacGracza(): PostacGracza {
        return this.postacGracza
    }

    public ustawPostacGracza(postacGracza: PostacGracza): void {
        this.postacGracza = postacGracza
    }

    // --- Globalne Definicje (Cechy, Umiejętności, Przymioty) ---

    public pobierzGlobalneCechy(): Cecha[] {
        return this.globalneCechy
    }

    public ustawGlobalneCechy(cechy: Cecha[]): void {
        this.globalneCechy = cechy
    }

    public dodajGlobalnaCecha(cecha: Cecha): void {
        this.globalneCechy.push(cecha)
    }

    public pobierzGlobalneUmiejetnosci(): Umiejetnosc[] {
        return this.globalneUmiejetnosci
    }

    public ustawGlobalneUmiejetnosci(umiejetnosci: Umiejetnosc[]): void {
        this.globalneUmiejetnosci = umiejetnosci
    }

    public dodajGlobalnaUmiejetnosc(umiejetnosc: Umiejetnosc): void {
        this.globalneUmiejetnosci.push(umiejetnosc)
    }

    public pobierzGlobalnePrzymioty(): Przymiot[] {
        return this.globalnePrzymioty
    }

    public ustawGlobalnePrzymioty(przymioty: Przymiot[]): void {
        this.globalnePrzymioty = przymioty
    }

    public dodajGlobalnyPrzymiot(przymiot: Przymiot): void {
        this.globalnePrzymioty.push(przymiot)
    }
}
