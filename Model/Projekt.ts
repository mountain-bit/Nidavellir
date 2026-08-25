import type { EntitiesData, ProjectData } from '../types/ipc'
import { Cecha } from './Cecha'
import { KlasaPostaci } from './KlasaPostaci'
import { Lokacja } from './Lokacja'
import { NPC } from './NPC'
import { Opis } from './Opis'
import { PostacGracza } from './PostacGracza'
import { Przedmiot } from './Przedmiot'
import { Przymiot } from './Przymiot'
import { Scena } from './Scena'
import { Tag } from './Tag'
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
    private listaTagow: Tag[] = []

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

    public pobierzPostacGracza(): PostacGracza {
        return this.postacGracza
    }

    public ustawPostacGracza(postacGracza: PostacGracza): void {
        this.postacGracza = postacGracza
    }

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

    public pobierzWszystkieTagi(): Tag[] {
        const tagMap = new Map<string, Tag>()

        this.listaTagow.forEach(t => tagMap.set(t.pobierzID() || t.pobierzNazwe(), t))

        this.sceny.forEach(s => {
            s.pobierzTagi().forEach(t => tagMap.set(t.pobierzID() || t.pobierzNazwe(), t))
            s.pobierzParagrafy().forEach(p => {
                p.pobierzTagi().forEach(t => tagMap.set(t.pobierzID() || t.pobierzNazwe(), t))
            })
        })

        this.lokacje.forEach(l => {
            l.pobierzTagi().forEach(t => tagMap.set(t.pobierzID() || t.pobierzNazwe(), t))
        })

        return Array.from(tagMap.values())
    }

    public dodajTag(tag: Tag): void {
        if (!this.listaTagow.some(t => t.pobierzID() === tag.pobierzID())) {
            this.listaTagow.push(tag)
        }
    }

    public usunTag(tagIdOrName: string): void {
        this.listaTagow = this.listaTagow.filter(
            t => t.pobierzID() !== tagIdOrName && t.pobierzNazwe() !== tagIdOrName
        )
    }

    public static fromJSON(projectData: ProjectData, entities: EntitiesData = {}): Projekt {
        const lokacje = (entities.Lokacje ?? []).map(l => Lokacja.fromJSON(l))
        const postacie = (entities.NPC ?? []).map(n => NPC.fromJSON(n))
        const przedmioty = (entities.Przedmioty ?? []).map(p => Przedmiot.fromJSON(p))
        const klasyPostaci = (entities.KlasyPostaci ?? []).map(k => KlasaPostaci.fromJSON(k))

        const sceny = (entities.Paragrafy ?? []).map(s => Scena.fromJSON(s))

        const postacGraczaData = (entities.PostacGracza ?? [])[0]
        const postacGracza = postacGraczaData
            ? PostacGracza.fromJSON(postacGraczaData)
            : new PostacGracza()

        const zasady = entities.Zasady ?? []
        const globalneCechy = zasady.filter(z => z.typ === 'cecha').map(z => Cecha.fromJSON(z))
        const globalneUmiejetnosci = zasady
            .filter(z => z.typ === 'umiejetnosc')
            .map(z => Umiejetnosc.fromJSON(z))
        const globalnePrzymioty = zasady
            .filter(z => z.typ === 'przymiot')
            .map(z => Przymiot.fromJSON(z))

        return new Projekt(
            projectData.id ?? '',
            projectData.nazwa ?? '',
            projectData.autor ?? '',
            projectData.wersja ?? '1.0.0',
            new Opis(),
            sceny,
            lokacje,
            postacie,
            przedmioty,
            klasyPostaci,
            postacGracza,
            globalneCechy,
            globalneUmiejetnosci,
            globalnePrzymioty
        )
    }
}
