export class Opis {
    private tekst: string = ''
    private streszczenie: string = ''
    private tekstDlaAutora: string = ''

    constructor(tekst: string = '', streszczenie: string = '', tekstDlaAutora: string = '') {
        this.tekst = tekst
        this.streszczenie = streszczenie
        this.tekstDlaAutora = tekstDlaAutora
    }

    public pobierzTekst(): string {
        return this.tekst
    }

    public pobierzStreszczenie(): string {
        return this.streszczenie
    }

    public pobierzTekstDlaAutora(): string {
        return this.tekstDlaAutora
    }

    public ustawTekst(tekst: string): void {
        this.tekst = tekst
    }

    public ustawStreszczenie(streszczenie: string): void {
        this.streszczenie = streszczenie
    }

    public ustawTekstDlaAutora(tekstDlaAutora: string): void {
        this.tekstDlaAutora = tekstDlaAutora
    }
}
