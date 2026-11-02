import { describe, expect, it } from 'vitest'

import { Choice, type ChoiceDiceCheck, type ChoiceModifier } from '../../Model/Choice'
import { ItemCondition, StatCondition } from '../../Model/Condition'
import { Description } from '../../Model/Description'
import { Inventory } from '../../Model/Inventory'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { PlayerCharacter } from '../../Model/PlayerCharacter'
import { EntityLinkUpdateService } from '../../Services/markdown/EntityLinkUpdateService'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('EntityLinkUpdateService', () => {
    describe('updateMarkdownLinks', () => {
        it('updates paragraph links preserving section numbers', () => {
            const md =
                'Możesz przejść do [§ 5 Stary Tytuł](entity://paragraph/p_5) lub ' +
                'odwiedzić [Stary Tytuł](entity://paragraph/p_5) albo ' +
                '- **Zwycięstwo** → [§ 5: Stary Tytuł](entity://paragraph/p_5).'

            const res = EntityLinkUpdateService.updateMarkdownLinks(md, {
                id: 'p_5',
                oldName: 'Stary Tytuł',
                newName: 'Nowy Tytuł',
                type: 'paragraph',
            })

            expect(res.updated).toBe(true)
            expect(res.text).toContain('[§ 5 Nowy Tytuł](entity://paragraph/p_5)')
            expect(res.text).toContain('[Nowy Tytuł](entity://paragraph/p_5)')
            expect(res.text).toContain('[§ 5: Nowy Tytuł](entity://paragraph/p_5)')
        })

        it('updates location mentions and embed links', () => {
            const md =
                'Wkraczasz do [Stara Karczma](entity://location/loc_1). ' +
                'Oto jej opis: [Opis: Stara Karczma](embed://location/loc_1).'

            const res = EntityLinkUpdateService.updateMarkdownLinks(md, {
                id: 'loc_1',
                oldName: 'Stara Karczma',
                newName: 'Złota Karczma',
                type: 'location',
            })

            expect(res.updated).toBe(true)
            expect(res.text).toContain('[Złota Karczma](entity://location/loc_1)')
            expect(res.text).toContain('[Opis: Złota Karczma](embed://location/loc_1)')
        })

        it('updates character/npc mentions and combat headers', () => {
            const md =
                'Spotykasz [Jan](entity://character/npc_1). ' +
                '[Opis: Jan](embed://character/npc_1/summary)\n\n' +
                '### Starcie: Jan\nWalka trwa.'

            const res = EntityLinkUpdateService.updateMarkdownLinks(md, {
                id: 'npc_1',
                oldName: 'Jan',
                newName: 'Janusz',
                type: 'character',
            })

            expect(res.updated).toBe(true)
            expect(res.text).toContain('[Janusz](entity://character/npc_1)')
            expect(res.text).toContain('[Opis: Janusz](embed://character/npc_1/summary)')
            expect(res.text).toContain('### Starcie: Janusz')
        })

        it('updates item links with embed', () => {
            const md =
                'Podnosisz [Zardzewiały Miecz](entity://item/it_sword).\n' +
                '[Opis: Zardzewiały Miecz](embed://item/it_sword)'

            const res = EntityLinkUpdateService.updateMarkdownLinks(md, {
                id: 'it_sword',
                oldName: 'Zardzewiały Miecz',
                newName: 'Świetlisty Miecz',
                type: 'item',
            })

            expect(res.updated).toBe(true)
            expect(res.text).toContain('[Świetlisty Miecz](entity://item/it_sword)')
            expect(res.text).toContain('[Opis: Świetlisty Miecz](embed://item/it_sword)')
        })

        it('updates trait and stat links', () => {
            const md = 'Wymagana cecha: [Siła](entity://trait/stat_str).'

            const res = EntityLinkUpdateService.updateMarkdownLinks(md, {
                id: 'stat_str',
                oldName: 'Siła',
                newName: 'Krzepa',
                type: 'stat',
            })

            expect(res.updated).toBe(true)
            expect(res.text).toContain('[Krzepa](entity://trait/stat_str)')
        })
    })

    describe('updateChoiceReferences', () => {
        it('updates ItemCondition, costs and rewards when an item is renamed', () => {
            const itemCond = new ItemCondition('ic_1', 'Klucz', 'Klucz', 1)
            const cost: ChoiceModifier = { type: 'item', name: 'Klucz', value: 1 }
            const reward: ChoiceModifier = { type: 'item', name: 'Klucz', value: 2 }

            const choice = new Choice(
                'c_1',
                'Otwórz drzwi',
                'p_1',
                'p_2',
                itemCond,
                new Description('Użyj [Klucz](entity://item/it_key)'),
                [cost],
                [reward]
            )

            const updatedCount = EntityLinkUpdateService.updateChoiceReferences([choice], {
                id: 'it_key',
                oldName: 'Klucz',
                newName: 'Złoty Klucz',
                type: 'item',
            })

            expect(updatedCount).toBe(1)
            expect(itemCond.getItemName()).toBe('Złoty Klucz')
            expect(itemCond.getName()).toBe('Złoty Klucz')
            expect(choice.getCosts()[0].name).toBe('Złoty Klucz')
            expect(choice.getRewards()[0].name).toBe('Złoty Klucz')
            expect(choice.getDescription().getText()).toContain(
                '[Złoty Klucz](entity://item/it_key)'
            )
        })

        it('updates StatCondition and diceCheck when a stat is renamed', () => {
            const statCond = new StatCondition('sc_1', 'Siła', 'Siła', '>=', 10)
            const diceCheck: ChoiceDiceCheck = {
                dice: '1k20',
                stat: 'Siła',
                branches: [{ min: 1, max: 20, targetParagraphId: 'p_win' }],
            }

            const choice = new Choice(
                'c_2',
                'Wyważ wrota',
                'p_1',
                'p_win',
                statCond,
                new Description(),
                [],
                [],
                diceCheck
            )

            const updatedCount = EntityLinkUpdateService.updateChoiceReferences([choice], {
                id: 'stat_1',
                oldName: 'Siła',
                newName: 'Krzepa',
                type: 'stat',
            })

            expect(updatedCount).toBe(1)
            expect(statCond.getStatName()).toBe('Krzepa')
            expect(statCond.getName()).toBe('Krzepa')
            expect(choice.getDiceCheck()?.stat).toBe('Krzepa')
        })

        it('updates choice name if choice was named after the destination paragraph', () => {
            const choice = new Choice('c_3', 'Mroczna Jaskinia', 'p_1', 'p_cave')

            EntityLinkUpdateService.updateChoiceReferences([choice], {
                id: 'p_cave',
                oldName: 'Mroczna Jaskinia',
                newName: 'Kryształowa Grota',
                type: 'paragraph',
            })

            expect(choice.getName()).toBe('Kryształowa Grota')
        })
    })

    describe('updateEntityReferences', () => {
        it('refactors references across paragraphs, markdown files, and characters', () => {
            const p1 = new Paragraph(
                'p_1',
                'Początek',
                new Description('Udaj się do [Stara Karczma](entity://location/loc_tavern).')
            )
            const p2 = new Paragraph(
                'p_2',
                'Sala',
                new Description(
                    'Kup [Miecz](entity://item/it_sword) od [Jan](entity://character/npc_1).'
                )
            )

            const char = new NPC('npc_1', 'Jan', new Description('Karczmarz'))
            const loc = new Location('loc_tavern', 'Stara Karczma')
            const item = new Item('it_sword', 'Miecz')

            const hero = new PlayerCharacter('hero_1', 'Bohater')
            const inv = new Inventory('inv_1', 'Plecak', 10, [new Item('it_sword', 'Miecz')])
            hero.addInventory(inv)

            const files: Record<string, string> = {
                'narrative.md':
                    'W dali widać [Stara Karczma](entity://location/loc_tavern). Tam czeka [Jan](entity://character/npc_1).',
            }

            const projectScope = {
                paragraphs: [p1, p2],
                characters: [char, hero],
                locations: [loc],
                items: [item],
                files,
            }

            // 1. Rename Location
            const locRes = EntityLinkUpdateService.updateEntityReferences(
                {
                    id: 'loc_tavern',
                    oldName: 'Stara Karczma',
                    newName: 'Karczma Pod Smokiem',
                    type: 'location',
                },
                projectScope
            )

            expect(locRes.updatedMarkdownCount).toBeGreaterThanOrEqual(2)
            expect(p1.getContent().getText()).toContain(
                '[Karczma Pod Smokiem](entity://location/loc_tavern)'
            )
            expect(files['narrative.md']).toContain(
                '[Karczma Pod Smokiem](entity://location/loc_tavern)'
            )

            // 2. Rename Item
            EntityLinkUpdateService.updateEntityReferences(
                {
                    id: 'it_sword',
                    oldName: 'Miecz',
                    newName: 'Ostrze Świtu',
                    type: 'item',
                },
                projectScope
            )

            expect(p2.getContent().getText()).toContain('[Ostrze Świtu](entity://item/it_sword)')
            expect(inv.getItems()[0].getName()).toBe('Ostrze Świtu')
        })
    })

    describe('MainWindowViewModel integration', () => {
        it('renaming an entity through vm.selection.updateName refactors links and fileDisplayNames', () => {
            const vm = new MainWindowViewModel()
            const p1 = vm.factory.createParagraph('Stary Rozdział')
            p1.setId('p_chap1')
            const p2 = vm.factory.createParagraph('Kolejny Krok')
            p2.getContent().setText('Wróć do [§ 1 Stary Rozdział](entity://paragraph/p_chap1).')

            vm.files.setFileDisplayName('paragraph_p_chap1.md', 'Stary Rozdział')
            vm.selection.selectElement(p1, 'paragraph')

            const success = vm.selection.updateName('Nowy Rozdział', [p1, p2], {
                paragraphs: [p1, p2],
                files: {
                    'custom.md': 'Oto link: [§ 1 Stary Rozdział](entity://paragraph/p_chap1)',
                },
                vm,
            })

            expect(success).toBe(true)
            expect(p1.getTitle()).toBe('Nowy Rozdział')
            expect(p2.getContent().getText()).toContain(
                '[§ 1 Nowy Rozdział](entity://paragraph/p_chap1)'
            )
            expect(vm.files.getFileDisplayName('paragraph_p_chap1.md')).toBe('Nowy Rozdział')
        })
    })
})
