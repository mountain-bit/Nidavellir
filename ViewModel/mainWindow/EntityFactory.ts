import { CharacterClass } from '../../Model/CharacterClass'
import { DEFAULT_TAG_COLOR } from '../../Model/constants'
import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
import { Paragraph } from '../../Model/Paragraph'
import { Parameter } from '../../Model/Parameter'
import { Scene } from '../../Model/Scene'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import { defaultIdGenerator, type IdGenerator } from '../../Utils/common/idGenerator'

export class EntityFactory {
    private idGenerator: IdGenerator

    constructor(idGenerator: IdGenerator = defaultIdGenerator) {
        this.idGenerator = idGenerator
    }

    public getIdGenerator(): IdGenerator {
        return this.idGenerator
    }

    public createStartParagraph(position: { x: number; y: number } = { x: 80, y: 180 }): Paragraph {
        const p = new Paragraph('start', 'START')
        p.setIsStart(true)
        p.setPosition(position)
        return p
    }

    public ensureStartParagraph(paragraphs: Paragraph[]): Paragraph {
        if (!Array.isArray(paragraphs)) {
            return this.createStartParagraph()
        }

        const existingStartIndex = paragraphs.findIndex(
            p =>
                p &&
                ((typeof p.getIsStart === 'function' && p.getIsStart()) ||
                    (typeof p.getId === 'function' && p.getId() === 'start') ||
                    (p as unknown as { isStart?: boolean }).isStart === true ||
                    (p as unknown as { id?: string }).id === 'start')
        )

        if (existingStartIndex !== -1) {
            const startNode = paragraphs[existingStartIndex]
            if (typeof startNode.setIsStart === 'function') {
                startNode.setIsStart(true)
            }
            if (typeof startNode.getTitle === 'function' && !startNode.getTitle()) {
                startNode.setTitle('START')
            }
            // Ensure uniqueness: exactly one START node per graph
            paragraphs.forEach((p, idx) => {
                if (idx !== existingStartIndex && p) {
                    if (typeof p.setIsStart === 'function' && p.getIsStart()) {
                        p.setIsStart(false)
                    }
                }
            })
            return startNode
        }

        const newStart = this.createStartParagraph()
        paragraphs.unshift(newStart)
        return newStart
    }

    public getStartParagraph(paragraphs: Paragraph[]): Paragraph | undefined {
        return paragraphs.find(p => p && (p.getIsStart() || p.getId() === 'start'))
    }

    public createParagraph(titleInput?: string, defaultTitle: string = 'New paragraph'): Paragraph {
        const title = (titleInput ?? '').trim() || defaultTitle
        const id = this.idGenerator('paragraph')
        return new Paragraph(id, title)
    }

    public createScene(nameInput?: string, defaultName: string = 'New scene'): Scene {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('scene')
        return new Scene(id, name)
    }

    public createItem(
        nameInput?: string,
        defaultName: string = 'New item',
        category: string = 'misc',
        description?: Description
    ): Item {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('item')
        return new Item(id, name, description || new Description(), [], [], { category })
    }

    public createCharacterClass(
        nameInput?: string,
        defaultName: string = 'New class'
    ): CharacterClass {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('class')
        return new CharacterClass(id, name)
    }

    public createCharacter(nameInput?: string, defaultName: string = 'New character'): NPC {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('npc')
        return new NPC(id, name)
    }

    public createTemplate(nameInput?: string, defaultName: string = 'New template'): NPC_Template {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('template')
        return new NPC_Template(id, name)
    }

    public createLocation(nameInput?: string, defaultName: string = 'New location'): Location {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('location')
        return new Location(id, name)
    }

    public createStat(nameInput?: string, defaultName: string = 'New stat'): Stat {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('stat')
        return new Stat(id, name, new Description(), '')
    }

    public createSkill(
        nameInput?: string,
        defaultNameOrMode: string = 'New skill',
        modeOrValue: 'direct' | 'stat_mod' | string = 'direct',
        valueOrStatName: string = '',
        statNameOrMod: string = '',
        modifierInput: string = ''
    ): Skill {
        let name: string
        let mode: 'direct' | 'stat_mod' = 'direct'
        let value: string = ''
        let statName: string = ''
        let modifier: string = ''

        if (defaultNameOrMode === 'direct' || defaultNameOrMode === 'stat_mod') {
            name = (nameInput ?? '').trim() || 'New skill'
            mode = defaultNameOrMode
            value = (modeOrValue as string) ?? ''
            statName = valueOrStatName ?? ''
            modifier = statNameOrMod ?? ''
        } else {
            name = (nameInput ?? '').trim() || defaultNameOrMode
            mode = modeOrValue === 'stat_mod' ? 'stat_mod' : 'direct'
            value = (valueOrStatName as string) ?? ''
            statName = statNameOrMod ?? ''
            modifier = modifierInput ?? ''
        }

        const id = this.idGenerator('skill')
        return new Skill(id, name, new Description(), mode, value, statName, modifier)
    }

    public createParameter(
        nameInput?: string,
        defaultNameOrMode: string = 'New parameter',
        modeOrValue: 'direct' | 'formula' | string | number = 'direct',
        valueOrFormula: string | number = '',
        formulaOrCalc: string | number | null = '',
        calculatedValueInput: number | null = null
    ): Parameter {
        let name: string
        let mode: 'direct' | 'formula' = 'direct'
        let value: string | number = ''
        let formula: string = ''
        let calculatedValue: number | null = null

        if (defaultNameOrMode === 'direct' || defaultNameOrMode === 'formula') {
            name = (nameInput ?? '').trim() || 'New parameter'
            mode = defaultNameOrMode
            value = (modeOrValue as string | number) ?? ''
            formula = (valueOrFormula as string) ?? ''
            calculatedValue = typeof formulaOrCalc === 'number' ? formulaOrCalc : null
        } else {
            name = (nameInput ?? '').trim() || defaultNameOrMode
            mode = modeOrValue === 'formula' ? 'formula' : 'direct'
            value = valueOrFormula ?? ''
            formula = (formulaOrCalc as string) ?? ''
            calculatedValue = calculatedValueInput
        }

        const id = this.idGenerator('parameter')
        return new Parameter(id, name, new Description(), mode, value, formula, calculatedValue)
    }

    public createFeature(nameInput?: string, defaultName: string = 'New feature'): Feature {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('feature')
        return new Feature(id, name, new Description())
    }

    public createTag(
        nameInput?: string,
        colorInput: string = DEFAULT_TAG_COLOR,
        defaultName: string = 'New tag'
    ): Tag {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('tag')
        return new Tag(id, name, colorInput)
    }
}
