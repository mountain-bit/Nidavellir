import type { Choice } from '../../Model/Choice'
import type { Condition } from '../../Model/Condition'
import type { Description } from '../../Model/Description'
import type { Feature } from '../../Model/Feature'
import type { IItemInventoryConfig, IItemModifier } from '../../Model/Item'
import type { Location } from '../../Model/Location'
import type { NPC } from '../../Model/NPC'
import type { IParagraphItemAction } from '../../Model/Paragraph'
import type { Parameter } from '../../Model/Parameter'
import type { Skill } from '../../Model/Skill'
import type { Stat } from '../../Model/Stat'
import type { Tag } from '../../Model/Tag'
import type { ConnectionLineStyle } from '../../Modules/Graph/styles/StoryGraphStyles'

export type { ConnectionLineStyle }

export type RibbonTab = 'glowna' | 'sceny' | 'widok'
export type LeftTab =
    | 'paragraphs'
    | 'scenes'
    | 'characters'
    | 'locations'
    | 'items'
    | 'stats'
    | 'traits'
    | 'skills'
    | 'parameters'
    | 'main-character'
    | 'tags'
    | 'connections'
    | 'search'
    | 'settings'
    | 'explorer'
export type MainViewMode = 'markdown' | 'graph'

export interface IIdentifiableEntity {
    getId?: () => string
    getName?: () => string
    setName?: (name: string) => void
    getTitle?: () => string
    setTitle?: (title: string) => void
    getContent?: () => Description
    getDescription?: () => Description
    getColor?: () => string
    setColor?: (color: string) => void
    getIsNumberLocked?: () => boolean
    setIsNumberLocked?: (locked: boolean) => void
    getNumber?: () => number
    setNumber?: (num: number) => void
    getTags?: () => Tag[]
    addTag?: (tag: Tag) => void
    removeTag?: (tagId: string) => void
    getStats?: () => Stat[]
    setStats?: (stats: Stat[]) => void
    addStat?: (stat: Stat) => void
    removeStat?: (statId: string) => void
    getSkills?: () => Skill[]
    setSkills?: (skills: Skill[]) => void
    addSkill?: (skill: Skill) => void
    removeSkill?: (skillId: string) => void
    getParameters?: () => Parameter[]
    setParameters?: (params: Parameter[]) => void
    addParameter?: (param: Parameter) => void
    removeParameter?: (paramId: string) => void
    getFeatures?: () => Feature[]
    setFeatures?: (features: Feature[]) => void
    addFeature?: (feat: Feature) => void
    removeFeature?: (featId: string) => void
    getCustomAttributes?: () => { name: string; value: string }[]
    setCustomAttributes?: (attrs: { name: string; value: string }[]) => void
    getAvatar?: () => string
    setAvatar?: (avatar: string) => void
    getValue?: () => string | number
    setValue?: (val: string | number) => void
    getFormula?: () => string
    setFormula?: (formula: string) => void
    getCalculatedValue?: () => number | null
    setCalculatedValue?: (val: number | null) => void
    getMode?: () => string
    setMode?(mode: string): void
    getStatName?: () => string
    setStatName?: (name: string) => void
    getModifier?: () => string
    setModifier?: (mod: string) => void
    getFromParagraphId?: () => string
    setFromParagraphId?: (id: string) => void
    getToParagraphId?: () => string
    setToParagraphId?: (id: string) => void
    getCondition?: () => Condition | null
    setCondition?: (cond: Condition | null) => void
    getChoices?: () => Choice[]
    addChoice?: (choice: Choice) => void
    removeChoice?: (id: string) => void
    getCharacters?: () => NPC[]
    setCharacters?: (characters: NPC[]) => void
    addCharacter?: (character: NPC) => void
    removeCharacter?: (id: string) => void
    getLocations?: () => Location[]
    setLocations?: (locations: Location[]) => void
    addLocation?: (location: Location) => void
    removeLocation?: (id: string) => void
    hasLocation?: (id: string) => boolean
    getLocation?: () => Location | null
    setLocation?: (location: Location | null) => void
    getModifiers?: () => IItemModifier[]
    setModifiers?: (modifiers: IItemModifier[]) => void
    addModifier?: (modifier: IItemModifier) => void
    removeModifier?: (id: string) => void
    getInventoryConfig?: () => IItemInventoryConfig
    setInventoryConfig?: (config: Partial<IItemInventoryConfig>) => void
    getItemActions?: () => IParagraphItemAction[]
    setItemActions?: (actions: IParagraphItemAction[]) => void
    addItemAction?: (action: IParagraphItemAction) => void
    removeItemAction?: (id: string) => void
}

export interface IHistoryItem {
    id: string
    name: string
    type:
        | 'paragraph'
        | 'scene'
        | 'character'
        | 'template'
        | 'player_character'
        | 'playerCharacter'
        | 'main-character'
        | 'location'
        | 'item'
        | 'stat'
        | 'tag'
        | 'class'
        | 'document'
        | 'choice'
        | 'skill'
        | 'parameter'
        | 'feature'
    entity: IIdentifiableEntity
    parent?: unknown
}
