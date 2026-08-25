import { describe, expect, it } from 'vitest'

import { KlasaPostaci } from '../../Model/KlasaPostaci'
import { Lokacja } from '../../Model/Lokacja'
import { NPC } from '../../Model/NPC'
import { Projekt } from '../../Model/Projekt'
import { Przedmiot } from '../../Model/Przedmiot'
import type { EntitiesData, ProjectData } from '../../types/ipc'

const minimalProjectData: ProjectData = {
    id: 'test-projekt',
    nazwa: 'Testowy Projekt',
    autor: 'Jan Testowy',
    wersja: '2.0.0',
    sciezkiOpisow: [],
    sciezkiDanych: [],
}

describe('Projekt.fromJSON()', () => {
    it('powinien zwrócić instancję Projekt', () => {
        const projekt = Projekt.fromJSON(minimalProjectData)
        expect(projekt).toBeInstanceOf(Projekt)
    })

    it('powinien odtworzyć podstawowe dane projektu', () => {
        const projekt = Projekt.fromJSON(minimalProjectData)
        expect(projekt.pobierzID()).toBe('test-projekt')
        expect(projekt.pobierzNazwe()).toBe('Testowy Projekt')
        expect(projekt.pobierzAutora()).toBe('Jan Testowy')
        expect(projekt.pobierzWersje()).toBe('2.0.0')
    })

    it('powinien zwrócić pusty projekt gdy brak encji', () => {
        const projekt = Projekt.fromJSON(minimalProjectData)
        expect(projekt.pobierzLokacje()).toHaveLength(0)
        expect(projekt.pobierzPostacie()).toHaveLength(0)
        expect(projekt.pobierzPrzedmioty()).toHaveLength(0)
        expect(projekt.pobierzKlasyPostaci()).toHaveLength(0)
        expect(projekt.pobierzSceny()).toHaveLength(0)
    })

    it('powinien deserializować Lokacje jako instancje Lokacja', () => {
        const entities: EntitiesData = {
            Lokacje: [
                {
                    id: 'las',
                    nazwa: 'Las',
                    opis: { tekst: 'Gęsty las', streszczenie: '', tekstDlaAutora: '' },
                    tags: ['zewnątrz'],
                },
                {
                    id: 'zamek',
                    nazwa: 'Zamek',
                    opis: { tekst: '', streszczenie: '', tekstDlaAutora: '' },
                    tags: [],
                },
            ],
        }
        const projekt = Projekt.fromJSON(minimalProjectData, entities)
        const lokacje = projekt.pobierzLokacje()
        expect(lokacje).toHaveLength(2)
        lokacje.forEach(l => expect(l).toBeInstanceOf(Lokacja))
        expect(lokacje[0].pobierzID()).toBe('las')
        expect(lokacje[0].pobierzNazwe()).toBe('Las')
        expect(lokacje[0].pobierzOpis().pobierzTekst()).toBe('Gęsty las')
        expect(lokacje[0].pobierzTagi().map(t => t.pobierzID())).toEqual(['zewnątrz'])
    })

    it('powinien deserializować NPC jako instancje NPC', () => {
        const entities: EntitiesData = {
            NPC: [
                {
                    id: 'strażnik',
                    nazwa: 'Strażnik',
                    opis: { tekst: '', streszczenie: '', tekstDlaAutora: '' },
                    cechy: [],
                    umiejetnosci: [],
                    przymioty: [],
                },
            ],
        }
        const projekt = Projekt.fromJSON(minimalProjectData, entities)
        const postacie = projekt.pobierzPostacie()
        expect(postacie).toHaveLength(1)
        expect(postacie[0]).toBeInstanceOf(NPC)
        expect(postacie[0].pobierzID()).toBe('strażnik')
    })

    it('powinien deserializować Przedmioty jako instancje Przedmiot', () => {
        const entities: EntitiesData = {
            Przedmioty: [
                {
                    id: 'miecz',
                    nazwa: 'Miecz',
                    opis: { tekst: 'Stalowy miecz', streszczenie: '', tekstDlaAutora: '' },
                },
            ],
        }
        const projekt = Projekt.fromJSON(minimalProjectData, entities)
        const przedmioty = projekt.pobierzPrzedmioty()
        expect(przedmioty).toHaveLength(1)
        expect(przedmioty[0]).toBeInstanceOf(Przedmiot)
        expect(przedmioty[0].pobierzID()).toBe('miecz')
    })

    it('powinien deserializować KlasyPostaci jako instancje KlasaPostaci', () => {
        const entities: EntitiesData = {
            KlasyPostaci: [
                {
                    id: 'wojownik',
                    nazwa: 'Wojownik',
                    poziom: 1,
                    opis: { tekst: '', streszczenie: '', tekstDlaAutora: '' },
                    cechy: [],
                    umiejetnosci: [],
                    przymioty: [],
                },
            ],
        }
        const projekt = Projekt.fromJSON(minimalProjectData, entities)
        const klasy = projekt.pobierzKlasyPostaci()
        expect(klasy).toHaveLength(1)
        expect(klasy[0]).toBeInstanceOf(KlasaPostaci)
        expect(klasy[0].pobierzID()).toBe('wojownik')
    })

    it('powinien obsłużyć brakujące pola w projectData (wartości domyślne)', () => {
        const niekompletne = {
            id: '',
            nazwa: '',
            autor: '',
            wersja: '',
            sciezkiOpisow: [],
            sciezkiDanych: [],
        } as ProjectData
        const projekt = Projekt.fromJSON(niekompletne)
        expect(projekt).toBeInstanceOf(Projekt)
        expect(projekt.pobierzID()).toBe('')
        expect(projekt.pobierzNazwe()).toBe('')
    })

    it('powinien obsłużyć puste tablice encji', () => {
        const entities: EntitiesData = {
            Lokacje: [],
            NPC: [],
            Przedmioty: [],
            KlasyPostaci: [],
        }
        const projekt = Projekt.fromJSON(minimalProjectData, entities)
        expect(projekt.pobierzLokacje()).toHaveLength(0)
        expect(projekt.pobierzPostacie()).toHaveLength(0)
        expect(projekt.pobierzPrzedmioty()).toHaveLength(0)
        expect(projekt.pobierzKlasyPostaci()).toHaveLength(0)
    })

    it('powinien deserializować wiele lokacji z zagnieżdżonymi opisami', () => {
        const entities: EntitiesData = {
            Lokacje: [
                {
                    id: 'krypta',
                    nazwa: 'Krypta',
                    opis: {
                        tekst: 'Zimna krypta',
                        streszczenie: 'Miejscowość',
                        tekstDlaAutora: 'Uwaga autora',
                    },
                    tags: ['podziemia', 'mroczne'],
                },
            ],
        }
        const projekt = Projekt.fromJSON(minimalProjectData, entities)
        const lokacja = projekt.pobierzLokacja('krypta')
        expect(lokacja).toBeInstanceOf(Lokacja)
        expect(lokacja?.pobierzOpis().pobierzTekst()).toBe('Zimna krypta')
        expect(lokacja?.pobierzOpis().pobierzStreszczenie()).toBe('Miejscowość')
        expect(lokacja?.pobierzOpis().pobierzTekstDlaAutora()).toBe('Uwaga autora')
        expect(lokacja?.pobierzTagi().map(t => t.pobierzID())).toEqual(['podziemia', 'mroczne'])
    })
})
