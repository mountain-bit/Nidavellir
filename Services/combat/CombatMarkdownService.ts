import { Paragraph } from '../../Model/Paragraph'
import { Parameter } from '../../Model/Parameter'
import { Stat } from '../../Model/Stat'
import { t } from '../../Utils/i18n/translate'
import { EntityAccessor } from '../helpers/EntityAccessor'
import {
    COMBAT_BLOCK_GLOBAL_REGEX,
    COMBAT_BLOCK_REGEX,
    COMBAT_END_TAG,
    COMBAT_START_TAG,
    LEGACY_COMBAT_FALLBACK_REGEX,
} from '../helpers/MarkdownPatterns'

export interface ITraitItem {
    id: string
    name: string
    kind?: 'stat' | 'parameter'
}
export type TraitItem = ITraitItem

export interface ITraitSource {
    getId?: () => string
    getName?: () => string
    id?: string
    name?: string
}

export interface ICombatMarkdownContext {
    projectStats?: (Stat | ITraitSource)[]
    projectParameters?: (Parameter | ITraitSource)[]
    projectParagraphs?: Paragraph[]
    projectData?: {
        projectStats?: (Stat | ITraitSource)[]
        projectParameters?: (Parameter | ITraitSource)[]
        projectParagraphs?: Paragraph[]
    }
}
export type CombatMarkdownContext = ICombatMarkdownContext

/**
 * Service responsible for generating and formatting Combat Markdown blocks
 * and managing their insertion, removal, and TipTap editor serialization.
 */
export class CombatMarkdownService {
    public static readonly COMBAT_START_TAG = COMBAT_START_TAG
    public static readonly COMBAT_END_TAG = COMBAT_END_TAG
    public static readonly COMBAT_REGEX = COMBAT_BLOCK_REGEX
    public static readonly LEGACY_COMBAT_FALLBACK_REGEX = LEGACY_COMBAT_FALLBACK_REGEX

    /**
     * Appends unique traits from a source list into the target array.
     */
    private static collectUniqueTraits(
        sources: (Stat | Parameter | ITraitSource)[],
        kind: 'stat' | 'parameter',
        target: TraitItem[],
        seenIds: Set<string>,
        seenNames: Set<string>
    ): void {
        sources.forEach(source => {
            const id = EntityAccessor.getId(source, true)
            const name = EntityAccessor.getName(source)
            const lowerName = name.toLowerCase()
            if (id && name && !seenIds.has(id) && !seenNames.has(lowerName)) {
                seenIds.add(id)
                seenNames.add(lowerName)
                target.push({ id, name, kind })
            }
        })
    }

    /**
     * Extracts available traits (stats and parameters) from the context.
     */
    public static extractTraits(ctx: CombatMarkdownContext): TraitItem[] {
        const stats = ctx.projectStats || ctx.projectData?.projectStats || []
        const parameters = ctx.projectParameters || ctx.projectData?.projectParameters || []

        const result: TraitItem[] = []
        const seenIds = new Set<string>()
        const seenNames = new Set<string>()

        this.collectUniqueTraits(stats, 'stat', result, seenIds, seenNames)
        this.collectUniqueTraits(parameters, 'parameter', result, seenIds, seenNames)

        return result
    }

    /**
     * Generates formatted Markdown block for combat encounter.
     */
    public static generateMarkdown(entity: Paragraph, ctx: CombatMarkdownContext): string {
        const combat = entity.getCombat ? entity.getCombat() : null
        if (!combat) return ''

        const defaultEncounter = t('combat.markdown_default_encounter')
        const defaultOpponent = t('combat.markdown_default_opponent')
        const defaultOutcome = t('combat.markdown_default_outcome')
        const opponentHeader = t('combat.markdown_opponent_header')
        const noOpponentsText = t('combat.markdown_no_opponents')
        const outcomesHeader = t('combat.markdown_outcomes_header')
        const noOutcomesText = t('combat.markdown_no_outcomes')

        const combatTitle = combat.getName() || entity.getTitle() || defaultEncounter
        const encounterSectionTitle = t('combat.markdown_encounter_title', { title: combatTitle })

        const opponents = combat.getCombatOpponents()
        const outcomes = combat.getOutcomes()
        const visibleStatIds = combat.getVisibleStatIds()

        const allTraits = this.extractTraits(ctx)
        const activeVisibleTraits = allTraits.filter(tr => visibleStatIds.includes(tr.id))

        // Build Opponents Table
        let opponentsMd = ''
        if (opponents.length === 0) {
            opponentsMd = noOpponentsText
        } else {
            const headerCols = [opponentHeader, ...activeVisibleTraits.map(tr => tr.name)]
            const alignCols = [':---', ...activeVisibleTraits.map(() => ':---:')]
            const headerRow = `| ${headerCols.join(' | ')} |`
            const alignRow = `| ${alignCols.join(' | ')} |`

            const dataRows = opponents.map(opp => {
                const oppName = opp.name || defaultOpponent
                const traitVals = activeVisibleTraits.map(tr => {
                    const val =
                        opp.overriddenStats && opp.overriddenStats[tr.id] !== undefined
                            ? opp.overriddenStats[tr.id]
                            : '-'
                    return String(val)
                })
                return `| ${[oppName, ...traitVals].join(' | ')} |`
            })

            opponentsMd = [headerRow, alignRow, ...dataRows].join('\n')
        }

        // Build Outcomes List
        const allParagraphs = ctx.projectParagraphs || ctx.projectData?.projectParagraphs || []

        let outcomesMd = ''
        if (outcomes.length === 0) {
            outcomesMd = noOutcomesText
        } else {
            outcomesMd = outcomes
                .map(o => {
                    const targetP = allParagraphs.find(p => p.getId() === o.targetParagraphId)
                    const targetNum = targetP ? targetP.getDisplayNumber() : '?'
                    const targetTitle = targetP ? targetP.getTitle() : ''
                    const pLinkText = targetTitle
                        ? `§ ${targetNum} ${targetTitle}`
                        : `§ ${targetNum}`
                    return `- **${o.name || defaultOutcome}** → [${pLinkText}](entity://paragraph/${o.targetParagraphId})`
                })
                .join('\n')
        }

        return [
            this.COMBAT_START_TAG,
            '',
            '---',
            '',
            `### ${encounterSectionTitle}`,
            '',
            opponentsMd,
            '',
            `#### ${outcomesHeader}`,
            '',
            outcomesMd,
            '',
            this.COMBAT_END_TAG,
        ].join('\n')
    }

    /**
     * Injects or removes combat Markdown block from content text.
     */
    public static updateContentWithCombat(
        currentText: string,
        combatMarkdown: string,
        hasCombat: boolean,
        defaultTitle: string = ''
    ): string {
        let text = currentText

        if (hasCombat) {
            if (!text.trim()) {
                text = defaultTitle ? `# ${defaultTitle}\n\n` : ''
            }
            let updated: string
            if (this.COMBAT_REGEX.test(text)) {
                updated = text.replace(this.COMBAT_REGEX, combatMarkdown.trim())
            } else if (this.LEGACY_COMBAT_FALLBACK_REGEX.test(text)) {
                updated = text.replace(this.LEGACY_COMBAT_FALLBACK_REGEX, combatMarkdown.trim())
            } else {
                updated = (text.trimEnd() + '\n\n' + combatMarkdown.trim()).trim() + '\n'
            }
            // Normalize blank lines: exactly 1 blank line before combat block, no 3+ consecutive newlines
            return updated
                .replace(/\n*<!--\s*COMBAT_START\s*-->/gi, `\n\n${this.COMBAT_START_TAG}`)
                .replace(/\n{3,}/g, '\n\n')
        }

        // Combat disabled: remove block if present
        if (this.COMBAT_REGEX.test(text)) {
            text = text
                .replace(new RegExp(this.COMBAT_REGEX.source, 'gi'), '')
                .replace(/\n{3,}/g, '\n\n')
                .trim()
            if (text) text += '\n'
        } else if (this.LEGACY_COMBAT_FALLBACK_REGEX.test(text)) {
            text = text
                .replace(new RegExp(this.LEGACY_COMBAT_FALLBACK_REGEX.source, 'gi'), '')
                .replace(/\n{3,}/g, '\n\n')
                .trim()
            if (text) text += '\n'
        }
        return text
    }

    /**
     * Protects combat markdown blocks from ProseMirror table flattening and HTML comment stripping
     * by converting them into `<div data-combat-block="true" ...>` placeholders before TipTap parsing.
     */
    public static preprocessCombatForEditor(markdown: string): string {
        if (!markdown || typeof markdown !== 'string') return ''
        return markdown.replace(COMBAT_BLOCK_GLOBAL_REGEX, (rawCombatMatch: string) => {
            let cleanRaw = rawCombatMatch.trim()
            cleanRaw = cleanRaw
                .replace(/(?:<p>)?\{\{combat:start\}\}(?:<\/p>)?/gi, this.COMBAT_START_TAG)
                .replace(/(?:<p>)?\{\{combat:end\}\}(?:<\/p>)?/gi, this.COMBAT_END_TAG)
            if (!cleanRaw.includes(this.COMBAT_START_TAG)) {
                cleanRaw = `${this.COMBAT_START_TAG}\n${cleanRaw}`
            }
            if (!cleanRaw.includes(this.COMBAT_END_TAG)) {
                cleanRaw = `${cleanRaw}\n${this.COMBAT_END_TAG}`
            }
            return `\n\n<div data-combat-block="true" data-raw-combat="${encodeURIComponent(cleanRaw)}"></div>\n\n`
        })
    }

    /**
     * Restores combat markdown blocks and comments from TipTap HTML placeholders or serialized markers.
     */
    public static postprocessCombatFromEditor(content: string): string {
        if (!content || typeof content !== 'string') return ''
        const combatDivRegex =
            /<div[^>]*data-combat-block="true"[^>]*data-raw-combat="([^"]+)"[^>]*><\/div>/gi
        const result = content.replace(combatDivRegex, (_match, encoded: string) => {
            try {
                return '\n\n' + decodeURIComponent(encoded).trim() + '\n\n'
            } catch {
                return '\n\n' + encoded.trim() + '\n\n'
            }
        })

        return result
            .replace(/(?:<p>)?\{\{combat:start\}\}(?:<\/p>)?/gi, this.COMBAT_START_TAG)
            .replace(/(?:<p>)?\{\{combat:end\}\}(?:<\/p>)?/gi, this.COMBAT_END_TAG)
            .replace(/\n*<!--\s*COMBAT_START\s*-->\s*\n*/gi, `\n\n${this.COMBAT_START_TAG}\n`)
            .replace(/\n*<!--\s*COMBAT_END\s*-->\s*\n*/gi, `\n${this.COMBAT_END_TAG}\n\n`)
            .replace(/\n{3,}/g, '\n\n')
    }
}
