
/* 
Klasa warunku - definicja warunku
nie wiadomo czy bedzie potzrebna.
*/
export class Warunek {

    private id: string = ""
    private nazwa: string = ""

    constructor(id: string, nazwa: string = "") {
        this.id = id
        this.nazwa = nazwa
    }

    public pobierzID(): string {
        return this.id
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

}