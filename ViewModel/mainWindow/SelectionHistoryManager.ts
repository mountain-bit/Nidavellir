import type { Feature } from '../../Model/Feature'
import type { IItemInventoryConfig, IItemModifier } from '../../Model/Item'
import type { Location } from '../../Model/Location'
import type { NPC } from '../../Model/NPC'
import type { IParagraphItemAction, Paragraph } from '../../Model/Paragraph'
import type { Parameter } from '../../Model/Parameter'
import type { Skill } from '../../Model/Skill'
import type { Stat } from '../../Model/Stat'
import type { Tag } from '../../Model/Tag'
import { ParagraphNumberingService } from '../../Services/graph/ParagraphNumberingService'
import { EntityLinkUpdateService } from '../../Services/markdown/EntityLinkUpdateService'
import { t } from '../../Utils/i18n/translate'
import type { IHistoryItem, IIdentifiableEntity } from './types'

export interface ISelectionHistoryManagerOptions {
    onEntityNameChanged?: (oldName: string, newName: string, id: string) => void
    onElementSelected?: () => void
    getVmReference?: () => object
}

export class SelectionHistoryManager {
    private selectedItem: IHistoryItem | null = null
    private history: IHistoryItem[] = []

    private onEntityNameChanged?: (oldName: string, newName: string, id: string) => void
    private onElementSelected?: () => void
    private getVmReference?: () => object

    constructor(options: ISelectionHistoryManagerOptions = {}) {
        this.onEntityNameChanged = options.onEntityNameChanged
        this.onElementSelected = options.onElementSelected
        this.getVmReference = options.getVmReference
    }

    public getSelectedItem(): IHistoryItem | null {
        return this.selectedItem
    }

    public getHistory(): IHistoryItem[] {
        return [...this.history]
    }

    public selectElement(
        entity: IIdentifiableEntity,
        type: IHistoryItem['type'],
        parent?: unknown
    ): IHistoryItem {
        const id = entity.getId ? entity.getId() : `id_${Date.now()}`
        const name = entity.getName ? entity.getName() : entity.getTitle ? entity.getTitle() : id

        const item: IHistoryItem = {
            id,
            name,
            type,
            entity,
            parent,
        }

        this.selectedItem = item
        this.onElementSelected?.()

        this.history = this.history.filter(h => h.id !== id || h.type !== type)
        this.history.unshift(item)

        if (this.history.length > 30) {
            this.history.pop()
        }

        return item
    }

    public selectHistoryItem(id: string): IHistoryItem | null {
        const found = this.history.find(h => h.id === id)
        if (found) {
            this.selectedItem = found
            this.onElementSelected?.()
            return found
        }
        return null
    }

    public closeHistoryItem(id: string): void {
        const index = this.history.findIndex(h => h.id === id)
        if (index >= 0) {
            this.history.splice(index, 1)
            if (this.selectedItem?.id === id) {
                this.selectedItem = this.history.length > 0 ? this.history[0] : null
            }
        }
    }

    public closeAllHistory(): void {
        this.history = []
        this.selectedItem = null
    }

    public clearSelection(): void {
        this.closeAllHistory()
    }

    // --- VALIDATION & PROPERTY UPDATES ---

    public validateName(
        newName: string,
        item: IHistoryItem,
        allEntities?: IIdentifiableEntity[]
    ): { valid: boolean; message?: string } {
        const trimmed = newName.trim()
        if (!trimmed) {
            return { valid: false, message: 'Name cannot be empty.' }
        }

        if (allEntities && allEntities.length > 0) {
            const hasCollision = allEntities.some(
                e =>
                    e &&
                    (e.getId ? e.getId() : '') !== item.id &&
                    (e.getName ? e.getName() : e.getTitle ? e.getTitle() : '').toLowerCase() ===
                        trimmed.toLowerCase()
            )
            if (hasCollision) {
                return {
                    valid: false,
                    message: `An item named "${trimmed}" already exists in this scope.`,
                }
            }
        }

        return { valid: true }
    }

    public updateName(
        newName: string,
        allEntities?: IIdentifiableEntity[],
        projectScope?: unknown
    ): boolean {
        if (!this.selectedItem?.entity) return false
        const validation = this.validateName(newName, this.selectedItem, allEntities)
        if (!validation.valid) return false

        const oldName =
            this.selectedItem.name ||
            (this.selectedItem.entity.getName
                ? this.selectedItem.entity.getName()
                : this.selectedItem.entity.getTitle
                  ? this.selectedItem.entity.getTitle()
                  : '')

        const trimmed = newName.trim()
        if (this.selectedItem.entity.setName) {
            this.selectedItem.entity.setName(trimmed)
        } else if (this.selectedItem.entity.setTitle) {
            this.selectedItem.entity.setTitle(trimmed)
        }

        const id =
            this.selectedItem.id ||
            (this.selectedItem.entity.getId ? this.selectedItem.entity.getId() : '')
        const type = this.selectedItem.type

        this.selectedItem.name = trimmed
        const hist = this.history.find(h => h.id === this.selectedItem!.id)
        if (hist) {
            hist.name = trimmed
        }

        if (oldName && oldName !== trimmed) {
            this.onEntityNameChanged?.(oldName, trimmed, id)
            const fallbackScope = this.getVmReference ? this.getVmReference() : undefined
            EntityLinkUpdateService.updateEntityReferences(
                {
                    id,
                    oldName,
                    newName: trimmed,
                    type,
                },
                projectScope || allEntities || fallbackScope
            )
        }

        return true
    }

    public updateSummary(summary: string): void {
        if (!this.selectedItem?.entity) return
        const entity = this.selectedItem.entity
        const desc =
            typeof entity.getContent === 'function'
                ? entity.getContent()
                : typeof entity.getDescription === 'function'
                  ? entity.getDescription()
                  : null
        if (desc) {
            if (typeof desc.setSummary === 'function') desc.setSummary(summary)
            if (typeof desc.setText === 'function') desc.setText(summary)
        }
    }

    public toggleNumberLock(locked: boolean, paragraphs?: Paragraph[]): void {
        if (
            this.selectedItem?.type === 'paragraph' &&
            this.selectedItem.entity &&
            this.selectedItem.entity.setIsNumberLocked
        ) {
            this.selectedItem.entity.setIsNumberLocked(locked)
            if (paragraphs && paragraphs.length > 0) {
                this.ensureParagraphNumbers(paragraphs)
            }
        }
    }

    public updateCustomNumber(numberVal: number, paragraphs?: Paragraph[]): void {
        if (
            this.selectedItem?.type === 'paragraph' &&
            this.selectedItem.entity &&
            this.selectedItem.entity.setNumber
        ) {
            this.selectedItem.entity.setNumber(numberVal)
            const isLocked =
                typeof this.selectedItem.entity.getIsNumberLocked === 'function' &&
                this.selectedItem.entity.getIsNumberLocked()
            if (isLocked && paragraphs && paragraphs.length > 0) {
                this.ensureParagraphNumbers(paragraphs)
            }
        }
    }

    public validateParagraphNumber(
        numVal: number,
        paragraphId: string,
        allParagraphs?: Paragraph[]
    ): { valid: boolean; message?: string } {
        if (!numVal || numVal <= 0 || isNaN(numVal)) {
            return { valid: true }
        }

        if (allParagraphs && allParagraphs.length > 0) {
            const hasCollision = allParagraphs.some(
                p => p && p.getId() !== paragraphId && p.getNumber() === numVal
            )
            if (hasCollision) {
                return {
                    valid: false,
                    message: t('details.number_taken'),
                }
            }
        }

        return { valid: true }
    }

    public ensureParagraphNumbers(paragraphs?: Paragraph[]): void {
        const list = paragraphs || []
        ParagraphNumberingService.ensureUniqueNumbers(list)
    }

    public reshuffleParagraphNumbers(paragraphs?: Paragraph[]): void {
        const list = paragraphs || []
        ParagraphNumberingService.reshuffleAllNumbers(list)
    }

    public rerollParagraphNumber(paragraph: Paragraph, paragraphs?: Paragraph[]): number {
        const list = paragraphs || []
        return ParagraphNumberingService.rerollSingleParagraph(paragraph, list)
    }

    public getParagraphDisplayNumber(paragraph: Paragraph | null | undefined): number {
        return ParagraphNumberingService.getDisplayNumber(paragraph)
    }

    public updateColor(color: string): boolean {
        if (!this.selectedItem?.entity) return false
        const entity = this.selectedItem.entity
        if (typeof entity.setColor === 'function') {
            entity.setColor(color)
            return true
        }
        return false
    }

    public validateColor(color: string): { valid: boolean; message?: string } {
        const trimmed = (color || '').trim()
        const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
        if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
            return { valid: true }
        }
        return { valid: false, message: 'Invalid HEX color' }
    }

    public addTagToSelected(tag: Tag): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addTag) {
            this.selectedItem.entity.addTag(tag)
        }
    }

    public removeTagFromSelected(tagIdOrName: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeTag) {
            this.selectedItem.entity.removeTag(tagIdOrName)
        }
    }

    public addStatToSelected(stat: Stat): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addStat) {
            this.selectedItem.entity.addStat(stat)
        }
    }

    public removeStatFromSelected(statId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeStat) {
            this.selectedItem.entity.removeStat(statId)
        }
    }

    public addSkillToSelected(skill: Skill): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addSkill) {
            this.selectedItem.entity.addSkill(skill)
        }
    }

    public removeSkillFromSelected(skillId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeSkill) {
            this.selectedItem.entity.removeSkill(skillId)
        }
    }

    public addParameterToSelected(parameter: Parameter): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addParameter) {
            this.selectedItem.entity.addParameter(parameter)
        }
    }

    public removeParameterFromSelected(parameterId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeParameter) {
            this.selectedItem.entity.removeParameter(parameterId)
        }
    }

    public addFeatureToSelected(feature: Feature): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addFeature) {
            this.selectedItem.entity.addFeature(feature)
        }
    }

    public removeFeatureFromSelected(featureId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeFeature) {
            this.selectedItem.entity.removeFeature(featureId)
        }
    }

    public addCharacterToSelected(character: NPC): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addCharacter) {
            this.selectedItem.entity.addCharacter(character)
        }
    }

    public removeCharacterFromSelected(characterId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeCharacter) {
            this.selectedItem.entity.removeCharacter(characterId)
        }
    }

    public addLocationToSelected(location: Location): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addLocation) {
            this.selectedItem.entity.addLocation(location)
        } else if (this.selectedItem.entity.setLocation) {
            this.selectedItem.entity.setLocation(location)
        }
    }

    public removeLocationFromSelected(locationIdOrName?: string): void {
        if (!this.selectedItem?.entity) return
        if (locationIdOrName && this.selectedItem.entity.removeLocation) {
            this.selectedItem.entity.removeLocation(locationIdOrName)
        } else if (this.selectedItem.entity.setLocation) {
            this.selectedItem.entity.setLocation(null)
        }
    }

    public setLocationToSelected(location: Location | null): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.setLocation) {
            this.selectedItem.entity.setLocation(location)
        }
    }

    public addTagToSelectedItem(tag: Tag): void {
        this.addTagToSelected(tag)
    }

    public removeTagFromSelectedItem(tagIdOrName: string): void {
        this.removeTagFromSelected(tagIdOrName)
    }

    public addModifierToSelectedItem(modifier: IItemModifier): void {
        if (!this.selectedItem?.entity) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.selectedItem.entity as any).addModifier === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.selectedItem.entity as any).addModifier(modifier)
        }
    }

    public removeModifierFromSelectedItem(id: string): void {
        if (!this.selectedItem?.entity) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.selectedItem.entity as any).removeModifier === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.selectedItem.entity as any).removeModifier(id)
        }
    }

    public updateSelectedItemInventoryConfig(config: Partial<IItemInventoryConfig>): void {
        if (!this.selectedItem?.entity) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.selectedItem.entity as any).setInventoryConfig === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.selectedItem.entity as any).setInventoryConfig(config)
        }
    }

    public addItemActionToSelectedParagraph(action: IParagraphItemAction): void {
        if (!this.selectedItem?.entity) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.selectedItem.entity as any).addItemAction === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.selectedItem.entity as any).addItemAction(action)
        }
    }

    public removeItemActionFromSelectedParagraph(idOrItemId: string): void {
        if (!this.selectedItem?.entity) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.selectedItem.entity as any).removeItemAction === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.selectedItem.entity as any).removeItemAction(idOrItemId)
        }
    }
}
