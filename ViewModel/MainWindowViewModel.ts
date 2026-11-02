import { CharacterClass } from '../Model/CharacterClass'
import {
    Choice,
    type ChoiceDiceCheck,
    type ChoiceModifier,
    type DiceBranch,
    type IChoiceDiceCheck,
    type IChoiceModifier,
    type IDiceBranch,
} from '../Model/Choice'
import { Combat } from '../Model/Combat'
import {
    Condition,
    ItemCondition,
    type StatComparisonOperator,
    StatCondition,
    TagCondition,
    TextCondition,
} from '../Model/Condition'
import { DEFAULT_SCENE_COLOR, DEFAULT_TAG_COLOR, ENTITY_CATEGORIES } from '../Model/constants'
import { Description } from '../Model/Description'
import { Feature } from '../Model/Feature'
import { Inventory } from '../Model/Inventory'
import {
    DEFAULT_ITEM_INVENTORY_CONFIG,
    type IItemInventoryConfig,
    type IItemModifier,
    Item,
    type ItemInventoryConfig,
    type ItemModifier,
} from '../Model/Item'
import { Location } from '../Model/Location'
import { NPC } from '../Model/NPC'
import { NPC_Template } from '../Model/NPC_Template'
import { type IParagraphItemAction, Paragraph, type ParagraphItemAction } from '../Model/Paragraph'
import { Parameter } from '../Model/Parameter'
import { PlayerCharacter } from '../Model/PlayerCharacter'
import { Project } from '../Model/Project'
import { Scene } from '../Model/Scene'
import { Skill } from '../Model/Skill'
import { Stat } from '../Model/Stat'
import { Tag } from '../Model/Tag'
import { CombatMarkdownService } from '../Services/combat/CombatMarkdownService'
import { CombatSyncService } from '../Services/combat/CombatSyncService'
import {
    type IItemExportJSON,
    type IItemExportOptions,
    type IItemExportUsage,
    ItemExportService,
} from '../Services/export/ItemExportService'
import { ParagraphNumberingService } from '../Services/graph/ParagraphNumberingService'
import { DescriptionTransclusionService } from '../Services/markdown/DescriptionTransclusionService'
import { EntityLinkUpdateService } from '../Services/markdown/EntityLinkUpdateService'
import { ProjectManager } from '../Services/project/ProjectManager'
import { defaultIdGenerator, type IdGenerator } from '../Utils/common/idGenerator'
import { ChoiceGraphManager } from './mainWindow/ChoiceGraphManager'
import { EntityFactory } from './mainWindow/EntityFactory'
import { EntityFilterManager } from './mainWindow/EntityFilterManager'
import { FileManagerState } from './mainWindow/FileManagerState'
import { SelectionHistoryManager } from './mainWindow/SelectionHistoryManager'
import type {
    ConnectionLineStyle,
    IHistoryItem,
    IIdentifiableEntity,
    LeftTab,
    MainViewMode,
    RibbonTab,
} from './mainWindow/types'
import { WorkspaceLayoutState } from './mainWindow/WorkspaceLayoutState'

export {
    CharacterClass,
    Choice,
    type ChoiceDiceCheck,
    type ChoiceModifier,
    Combat,
    CombatMarkdownService,
    CombatSyncService,
    Condition,
    type ConnectionLineStyle,
    DEFAULT_ITEM_INVENTORY_CONFIG,
    DEFAULT_SCENE_COLOR,
    DEFAULT_TAG_COLOR,
    Description,
    DescriptionTransclusionService,
    type DiceBranch,
    ENTITY_CATEGORIES,
    EntityLinkUpdateService,
    Feature,
    type IChoiceDiceCheck,
    type IChoiceModifier,
    type IDiceBranch,
    type IHistoryItem,
    type IIdentifiableEntity,
    type IItemExportJSON,
    type IItemExportOptions,
    type IItemExportUsage,
    type IItemInventoryConfig,
    type IItemModifier,
    Inventory,
    type IParagraphItemAction,
    Item,
    ItemCondition,
    ItemExportService,
    type ItemInventoryConfig,
    type ItemModifier,
    type LeftTab,
    Location,
    type MainViewMode,
    NPC,
    NPC_Template,
    Paragraph,
    type ParagraphItemAction,
    ParagraphNumberingService,
    Parameter,
    PlayerCharacter,
    Project,
    ProjectManager,
    type RibbonTab,
    Scene,
    Skill,
    Stat,
    type StatComparisonOperator,
    StatCondition,
    Tag,
    TagCondition,
    TextCondition,
}

export class MainWindowViewModel {
    public readonly layout: WorkspaceLayoutState
    public readonly files: FileManagerState
    public readonly selection: SelectionHistoryManager
    public readonly factory: EntityFactory
    public readonly graph: ChoiceGraphManager
    public readonly filter: EntityFilterManager
    public project?: unknown

    constructor(idGenerator: IdGenerator = defaultIdGenerator) {
        this.layout = new WorkspaceLayoutState()
        this.factory = new EntityFactory(idGenerator)
        this.filter = new EntityFilterManager()

        this.selection = new SelectionHistoryManager({
            onEntityNameChanged: (oldName: string, newName: string, id: string): void => {
                this.files.updateFileDisplayNameForEntity(oldName, newName, id)
            },
            onElementSelected: (): void => {
                this.layout.setRightSidebarCollapsed(false)
            },
            getVmReference: (): object => this,
        })

        this.files = new FileManagerState(this.layout, (): IHistoryItem | null =>
            this.selection.getSelectedItem()
        )

        this.graph = new ChoiceGraphManager({
            idGenerator: this.factory.getIdGenerator(),
            onCloseHistoryItem: (id: string): void => this.selection.closeHistoryItem(id),
            ensureStartParagraph: (paragraphs: Paragraph[]): Paragraph =>
                this.factory.ensureStartParagraph(paragraphs),
            getSelectedItem: (): IHistoryItem | null => this.selection.getSelectedItem(),
            getVmReference: (): object => this,
        })
    }
}
