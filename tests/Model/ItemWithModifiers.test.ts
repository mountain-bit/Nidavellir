import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Inventory } from '../../Model/Inventory'
import { type IItemModifier, Item } from '../../Model/Item'
import { type IParagraphItemAction, Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('ItemWithModifiers - Domain Models & ViewModel (Stage 1)', () => {
    describe('Item Model', () => {
        it('initializes with default values, tags, modifiers and inventory config', () => {
            const item = new Item('it_sword_1', 'Krasnoludzki Topór')
            expect(item.getId()).toBe('it_sword_1')
            expect(item.getName()).toBe('Krasnoludzki Topór')
            expect(item.hasId()).toBe(true)
            expect(item.getTags()).toEqual([])
            expect(item.getModifiers()).toEqual([])
            expect(item.getCategory()).toBe('misc')
            expect(item.getSlotSize()).toBe(1)
            expect(item.getWeight()).toBe(1)
            expect(item.isConsumable()).toBe(false)
            expect(item.isInStartingInventory()).toBe(false)
            expect(item.getTargetInventoryId()).toBe('')
        })

        it('manages tags correctly (add, remove, check, duplicates avoidance)', () => {
            const item = new Item('it_dagger', 'Sztylet Cienia')
            const tagWeapon = new Tag('tag_weapon', 'Broń', '#ef4444')
            const tagStealth = new Tag('tag_stealth', 'Skradanie', '#3b82f6')

            item.addTag(tagWeapon)
            item.addTag(tagStealth)
            expect(item.getTags().length).toBe(2)
            expect(item.hasTag('tag_weapon')).toBe(true)
            expect(item.hasTag('Broń')).toBe(true)
            expect(item.hasTag('Skradanie')).toBe(true)

            // Duplicate tag should not be added
            item.addTag(new Tag('tag_weapon', 'Broń'))
            expect(item.getTags().length).toBe(2)

            // Remove tag by ID or Name
            item.removeTag('tag_weapon')
            expect(item.getTags().length).toBe(1)
            expect(item.hasTag('tag_weapon')).toBe(false)

            item.removeTag('Skradanie')
            expect(item.getTags().length).toBe(0)
            expect(item.hasTag('Skradanie')).toBe(false)
        })

        it('manages RPG modifiers (add, update existing by id, remove, check)', () => {
            const item = new Item('it_ring', 'Pierścień Siły')
            const modStrength: IItemModifier = {
                id: 'mod_str',
                targetType: 'stat',
                targetName: 'Siła',
                value: 3,
                operator: '+',
                description: 'Mistyczny splot dodający tężyzny',
            }
            const modHp: IItemModifier = {
                id: 'mod_hp',
                targetType: 'parameter',
                targetName: 'Punkty Życia',
                value: 10,
                operator: '+',
            }

            item.addModifier(modStrength)
            item.addModifier(modHp)
            expect(item.getModifiers().length).toBe(2)
            expect(item.hasModifier('mod_str')).toBe(true)
            expect(item.hasModifier('Siła')).toBe(true)
            expect(item.hasModifier('Punkty Życia')).toBe(true)

            // Update existing modifier with same ID
            const updatedStrength: IItemModifier = {
                ...modStrength,
                value: 5,
            }
            item.addModifier(updatedStrength)
            expect(item.getModifiers().length).toBe(2)
            expect(item.getModifiers().find(m => m.id === 'mod_str')?.value).toBe(5)

            // Remove modifier
            item.removeModifier('mod_str')
            expect(item.getModifiers().length).toBe(1)
            expect(item.hasModifier('mod_str')).toBe(false)
        })

        it('manages inventory configuration properties', () => {
            const item = new Item('it_claymore', 'Wielki Miecz')
            item.setCategory('weapon')
            item.setSlotSize(2)
            item.setWeight(5)
            item.setIsConsumable(false)
            item.setInStartingInventory(true)
            item.setTargetInventoryId('inv_backpack')

            expect(item.getCategory()).toBe('weapon')
            expect(item.getSlotSize()).toBe(2)
            expect(item.getWeight()).toBe(5)
            expect(item.isConsumable()).toBe(false)
            expect(item.isInStartingInventory()).toBe(true)
            expect(item.getTargetInventoryId()).toBe('inv_backpack')

            // Partial update via setInventoryConfig
            item.setInventoryConfig({ slotSize: 3, isConsumable: true })
            expect(item.getSlotSize()).toBe(3)
            expect(item.isConsumable()).toBe(true)
            expect(item.getCategory()).toBe('weapon') // preserved
        })

        it('serializes and deserializes cleanly with full backward compatibility', () => {
            const desc = new Description('Ostrze elfickie', 'Krótkie podsumowanie')
            desc.setFilePath('Items/miecz/Description_Item_miecz.md')
            const tag = new Tag('tag_elf', 'Elfickie', '#10b981')
            const mod: IItemModifier = {
                id: 'mod_1',
                targetType: 'skill',
                targetName: 'Walka mieczem',
                value: 15,
                operator: '+',
                description: 'Precyzyjne wyważenie',
            }

            const item = new Item('it_elf_sword', 'Elficki Sztylet', desc, [tag], [mod], {
                category: 'weapon',
                slotSize: 1,
                weight: 2,
                isConsumable: false,
                inStartingInventory: true,
                targetInventoryId: 'inv_main',
            })

            const json = item.toJSON()
            expect(json.id).toBe('it_elf_sword')
            expect(json.name).toBe('Elficki Sztylet')
            expect(json.category).toBe('weapon')
            expect(json.slotSize).toBe(1)
            expect(json.inStartingInventory).toBe(true)
            expect(json.tags.length).toBe(1)
            expect(json.modifiers.length).toBe(1)

            // Reconstruct from JSON
            const restored = Item.fromJSON(json)
            expect(restored.getId()).toBe('it_elf_sword')
            expect(restored.getName()).toBe('Elficki Sztylet')
            expect(restored.getDescription().getText()).toBe('Ostrze elfickie')
            expect(restored.getDescription().getFilePath()).toBe(
                'Items/miecz/Description_Item_miecz.md'
            )
            expect(restored.getTags().length).toBe(1)
            expect(restored.getTags()[0].getName()).toBe('Elfickie')
            expect(restored.getModifiers().length).toBe(1)
            expect(restored.getModifiers()[0].targetName).toBe('Walka mieczem')
            expect(restored.getCategory()).toBe('weapon')
            expect(restored.isInStartingInventory()).toBe(true)
            expect(restored.getTargetInventoryId()).toBe('inv_main')

            // Backward compatibility with legacy minimal JSON
            const legacyJson = { id: 'it_old', name: 'Stary klucz' }
            const legacyRestored = Item.fromJSON(legacyJson)
            expect(legacyRestored.getId()).toBe('it_old')
            expect(legacyRestored.getName()).toBe('Stary klucz')
            expect(legacyRestored.getTags()).toEqual([])
            expect(legacyRestored.getModifiers()).toEqual([])
            expect(legacyRestored.getSlotSize()).toBe(1)
        })
    })

    describe('Paragraph Item Actions', () => {
        it('stores, adds and removes item actions in paragraphs', () => {
            const p = new Paragraph('p_armory', 'Zbrojownia')
            const actionGive: IParagraphItemAction = {
                id: 'act_1',
                itemId: 'it_sword',
                itemName: 'Miecz',
                action: 'give',
                quantity: 1,
            }
            const actionRequire: IParagraphItemAction = {
                id: 'act_2',
                itemId: 'it_key',
                itemName: 'Klucz do zbrojowni',
                action: 'require',
                quantity: 1,
            }

            p.addItemAction(actionGive)
            p.addItemAction(actionRequire)

            expect(p.getItemActions().length).toBe(2)
            expect(p.hasItemAction('it_sword')).toBe(true)
            expect(p.hasItemAction('Klucz do zbrojowni')).toBe(true)
            expect(p.getItems().length).toBe(2)

            // Removing item action
            p.removeItemAction('it_sword')
            expect(p.getItemActions().length).toBe(1)
            expect(p.hasItemAction('it_sword')).toBe(false)
        })

        it('clears item actions when paragraph is marked as START node', () => {
            const p = new Paragraph('start', 'START')
            p.setIsStart(true)
            p.addItemAction({ itemId: 'it_torch', action: 'give' })

            expect(p.getItemActions()).toEqual([])
            expect(p.hasItemAction('it_torch')).toBe(false)
        })

        it('serializes and deserializes item actions in Paragraph toJSON/fromJSON', () => {
            const p = new Paragraph('p_cave', 'Jaskinia Skarbów')
            p.addItemAction({
                id: 'act_chest',
                itemId: 'it_gold',
                itemName: 'Złote Monety',
                action: 'give',
                quantity: 50,
            })
            p.addItemAction({
                id: 'act_lock',
                itemId: 'it_crowbar',
                itemName: 'Łom',
                action: 'require',
            })

            const json = p.toJSON()
            expect(json.itemActions).toBeDefined()
            expect((json.itemActions as IParagraphItemAction[]).length).toBe(2)

            const restored = Paragraph.fromJSON(json)
            expect(restored.getItemActions().length).toBe(2)
            expect(restored.getItemActions()[0].itemId).toBe('it_gold')
            expect(restored.getItemActions()[0].quantity).toBe(50)
            expect(restored.getItemActions()[1].action).toBe('require')
        })
    })

    describe('Inventory slotSize Integration', () => {
        it('calculates capacity based on item slot sizes', () => {
            const inv = new Inventory('inv_test', 'Torba podróżna', 4)

            // 1. Two-handed warhammer requires 2 slots
            const warhammer = new Item('it_hammer', 'Młot Bojowy', new Description(), [], [], {
                slotSize: 2,
            })
            expect(inv.canAddItem(warhammer)).toBe(true)
            expect(inv.addItem(warhammer)).toBe(true)
            expect(inv.getUsedSlots()).toBe(2)
            expect(inv.getFreeSlots()).toBe(2)
            expect(inv.isFull()).toBe(false)

            // 2. Heavy shield requires 2 slots -> exactly fills inventory (4 / 4)
            const shield = new Item('it_shield', 'Tarcza', new Description(), [], [], {
                slotSize: 2,
            })
            expect(inv.canAddItem(shield)).toBe(true)
            expect(inv.addItem(shield)).toBe(true)
            expect(inv.getUsedSlots()).toBe(4)
            expect(inv.getFreeSlots()).toBe(0)
            expect(inv.isFull()).toBe(true)

            // 3. Trying to add standard 1-slot dagger fails
            const dagger = new Item('it_dagger', 'Sztylet')
            expect(inv.canAddItem(dagger)).toBe(false)
            expect(inv.addItem(dagger)).toBe(false)

            // 4. Weightless quest trinket (slotSize: 0) can still be added
            const token = new Item('it_token', 'Żeton Gildii', new Description(), [], [], {
                slotSize: 0,
            })
            expect(inv.canAddItem(token)).toBe(true)
            expect(inv.addItem(token)).toBe(true)
            expect(inv.getItems().length).toBe(3)
            expect(inv.getUsedSlots()).toBe(4)
        })
    })

    describe('MainWindowViewModel Item Integration', () => {
        it('creates item with custom category and description', () => {
            const vm = new MainWindowViewModel()
            const item = vm.createItem('Mikstura Many', 'Eliksir', 'consumable')

            expect(item.getId().startsWith('item_')).toBe(true)
            expect(item.getName()).toBe('Mikstura Many')
            expect(item.getCategory()).toBe('consumable')
        })

        it('supports adding tags and modifiers to selected item', () => {
            const vm = new MainWindowViewModel()
            const item = vm.createItem('Rękawice Zręczności')
            vm.selectElement(item, 'item')

            const tag = new Tag('tag_armor', 'Pancerz')
            vm.addTagToSelectedItem(tag)
            expect(item.hasTag('Pancerz')).toBe(true)

            const modifier: IItemModifier = {
                id: 'mod_dex',
                targetType: 'stat',
                targetName: 'Zręczność',
                value: 2,
                operator: '+',
            }
            vm.addModifierToSelectedItem(modifier)
            expect(item.hasModifier('Zręczność')).toBe(true)

            vm.updateSelectedItemInventoryConfig({ slotSize: 1, weight: 0.5 })
            expect(item.getSlotSize()).toBe(1)
            expect(item.getWeight()).toBe(0.5)

            // Removal
            vm.removeModifierFromSelectedItem('mod_dex')
            expect(item.hasModifier('mod_dex')).toBe(false)
            vm.removeTagFromSelectedItem('Pancerz')
            expect(item.hasTag('Pancerz')).toBe(false)
        })

        it('supports adding item actions to selected paragraph', () => {
            const vm = new MainWindowViewModel()
            const paragraph = vm.createParagraph('Skarbiec')
            vm.selectElement(paragraph, 'paragraph')

            const action: IParagraphItemAction = {
                id: 'act_find',
                itemId: 'it_relic',
                itemName: 'Relikt Starych Bogów',
                action: 'give',
            }

            vm.addItemActionToSelectedParagraph(action)
            expect(paragraph.hasItemAction('it_relic')).toBe(true)

            vm.removeItemActionFromSelectedParagraph('it_relic')
            expect(paragraph.hasItemAction('it_relic')).toBe(false)
        })
    })
})
