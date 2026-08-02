/**
 * Translations: English
 */
import type { Translations } from './pl'

const en: Translations = {
    // General
    app: {
        title: 'Paragraph Game Engine',
        version: 'Version',
    },

    // Project
    projekt: {
        nowy: 'New project',
        otworz: 'Open project',
        zapisz: 'Save project',
        zamknij: 'Close project',
        nazwa: 'Project name',
        autor: 'Author',
        wersja: 'Version',
        opis: 'Description',
    },

    // Scenes and paragraphs
    scena: {
        nowa: 'New scene',
        usun: 'Delete scene',
        edytuj: 'Edit scene',
        nazwa: 'Scene name',
    },
    paragraf: {
        nowy: 'New paragraph',
        usun: 'Delete paragraph',
        edytuj: 'Edit paragraph',
        tytul: 'Title',
        tresc: 'Content',
        przeskoki: 'Jumps',
        walka: 'Combat',
    },

    // Character
    postac: {
        gracz: 'Player character',
        npc: 'NPC',
        imie: 'Name',
        klasa: 'Character class',
        cechy: 'Traits',
        umiejetnosci: 'Skills',
        przymioty: 'Attributes',
    },

    // Items
    przedmiot: {
        lista: 'Items',
        nowy: 'New item',
        usun: 'Delete item',
        nazwa: 'Name',
        opis: 'Description',
    },

    // Locations
    lokacja: {
        lista: 'Locations',
        nowa: 'New location',
        usun: 'Delete location',
        nazwa: 'Name',
        opis: 'Description',
    },

    // Errors
    bledy: {
        nieznanyBlad: 'An unknown error occurred',
        brakPliku: 'File not found',
        zapiszNieudany: 'Failed to save file',
        wczytajNieudany: 'Failed to load file',
    },

    // Buttons
    przyciski: {
        ok: 'OK',
        anuluj: 'Cancel',
        zapisz: 'Save',
        usun: 'Delete',
        dodaj: 'Add',
        edytuj: 'Edit',
        zamknij: 'Close',
    },
}

export default en
