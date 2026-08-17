/* 
Klasa warunku - definicja warunku
nie wiadomo czy bedzie potzrebna.
*/
export class Warunek {
    private id: string = ''
    private nazwa: string = ''

    constructor(id: string, nazwa: string = '') {
        this.id = id
        this.nazwa = nazwa
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

    public static fromJSON(json: any): Warunek {
        if (!json) return new Warunek('')
        return new Warunek(json.id || '', json.nazwa || '')
    }
}
