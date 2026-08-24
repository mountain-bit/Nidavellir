import { Lokacja } from './Lokacja'
import { NPC } from './NPC'
import { Opis } from './Opis'
import { Paragraf } from './Paragraf'

export class Scena {
    private id: string = ''
    private nazwa: string = ''
    private opis: Opis = new Opis()
    private paragrafy: Paragraf[] = []
    private postacie: NPC[] = []
    private lokacja: Lokacja | null = null
    private tags: string[] = []
    private poczatkowyParagrafID: string = ''

    constructor(
        id: string = '',
        nazwa: string = '',
        opis: Opis = new Opis(),
        paragrafy: Paragraf[] = [],
        postacie: NPC[] = [],
        lokacja: Lokacja | null = null,
        tags: string[] = [],
        poczatkowyParagrafID: string = ''
    ) {
        this.id = id
        this.nazwa = nazwa
        this.opis = opis
        this.paragrafy = paragrafy
        this.postacie = postacie
        this.lokacja = lokacja
        this.tags = tags
        this.poczatkowyParagrafID = poczatkowyParagrafID
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

    public pobierzParagrafy(): Paragraf[] {
        return this.paragrafy
    }

    public ustawParagrafy(paragrafy: Paragraf[]): void {
        this.paragrafy = paragrafy
    }

    public dodajParagraf(paragraf: Paragraf): void {
        this.paragrafy.push(paragraf)
    }

    public usunParagraf(id: string): void {
        this.paragrafy = this.paragrafy.filter(p => p.pobierzID() !== id)
    }

    public pobierzParagraf(id: string): Paragraf | undefined {
        return this.paragrafy.find(p => p.pobierzID() === id)
    }

    public czymaParagraf(id: string): boolean {
        return this.paragrafy.some(p => p.pobierzID() === id)
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

    public pobierzLokacje(): Lokacja | null {
        return this.lokacja
    }

    public ustawLokacje(lokacja: Lokacja | null): void {
        this.lokacja = lokacja
    }

    public pobierzTagi(): string[] {
        return this.tags
    }

    public dodajTag(tag: string): void {
        this.tags.push(tag)
    }

    public usunTag(tag: string): void {
        this.tags = this.tags.filter(t => t !== tag)
    }

    public czymaTag(tag: string): boolean {
        return this.tags.includes(tag)
    }

    public pobierzPoczatkowyParagrafID(): string {
        return this.poczatkowyParagrafID
    }

    public ustawPoczatkowyParagrafID(id: string): void {
        this.poczatkowyParagrafID = id
    }

    public static fromJSON(json: any): Scena {
        if (!json) return new Scena()
        return new Scena(
            json.id || '',
            json.nazwa || '',
            Opis.fromJSON(json.opis),
            (json.paragrafy || []).map((p: any) => Paragraf.fromJSON(p)),
            (json.postacie || []).map((p: any) => NPC.fromJSON(p)),
            json.lokacja ? Lokacja.fromJSON(json.lokacja) : null,
            json.tags || [],
            json.poczatkowyParagrafID || ''
        )
    }
}
