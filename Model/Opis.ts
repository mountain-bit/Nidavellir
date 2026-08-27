export interface IOpisJSON {
    tekst: string
    streszczenie: string
    tekstDlaAutora: string
    sciezkaTekst: string
    sciezkaTekstDlaAutora: string
}

export type OpisJSON = IOpisJSON

export class Opis {
    private tekst: string = ''
    private streszczenie: string = ''
    private tekstDlaAutora: string = ''
    private sciezkaTekst: string = ''
    private sciezkaTekstDlaAutora: string = ''

    constructor(
        tekst: string = '',
        streszczenie: string = '',
        tekstDlaAutora: string = '',
        sciezkaTekst: string = '',
        sciezkaTekstDlaAutora: string = ''
    ) {
        this.tekst = tekst
        this.streszczenie = streszczenie
        this.tekstDlaAutora = tekstDlaAutora
        this.sciezkaTekst = sciezkaTekst
        this.sciezkaTekstDlaAutora = sciezkaTekstDlaAutora
    }

    public pobierzTekst(): string {
        return this.tekst
    }

    public ustawTekst(tekst: string): void {
        this.tekst = tekst
    }

    public pobierzStreszczenie(): string {
        return this.streszczenie
    }

    public ustawStreszczenie(streszczenie: string): void {
        this.streszczenie = streszczenie
    }

    public pobierzTekstDlaAutora(): string {
        return this.tekstDlaAutora
    }

    public ustawTekstDlaAutora(tekstDlaAutora: string): void {
        this.tekstDlaAutora = tekstDlaAutora
    }

    public pobierzSciezkaTekst(): string {
        return this.sciezkaTekst
    }

    public ustawSciezkaTekst(sciezka: string): void {
        this.sciezkaTekst = sciezka
    }

    public pobierzSciezkaTekstDlaAutora(): string {
        return this.sciezkaTekstDlaAutora
    }

    public ustawSciezkaTekstDlaAutora(sciezka: string): void {
        this.sciezkaTekstDlaAutora = sciezka
    }

    public toJSON(): IOpisJSON {
        return {
            tekst: this.tekst,
            streszczenie: this.streszczenie,
            tekstDlaAutora: this.tekstDlaAutora,
            sciezkaTekst: this.sciezkaTekst,
            sciezkaTekstDlaAutora: this.sciezkaTekstDlaAutora,
        }
    }

    public static fromJSON(json: Partial<IOpisJSON> | unknown): Opis {
        if (!json || typeof json !== 'object') return new Opis()
        const data = json as Partial<IOpisJSON>
        return new Opis(
            typeof data.tekst === 'string' ? data.tekst : '',
            typeof data.streszczenie === 'string' ? data.streszczenie : '',
            typeof data.tekstDlaAutora === 'string' ? data.tekstDlaAutora : '',
            typeof data.sciezkaTekst === 'string' ? data.sciezkaTekst : '',
            typeof data.sciezkaTekstDlaAutora === 'string' ? data.sciezkaTekstDlaAutora : ''
        )
    }
}
