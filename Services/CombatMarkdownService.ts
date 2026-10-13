import { Combat } from '../Model/Combat'
import { Paragraph } from '../Model/Paragraph'

export interface ITraitItem {
    id: string
    name: string
    kind?: 'stat' | 'parameter'
}
export type TraitItem = ITraitItem

export interface ICombatMarkdownContext {
    projectStats?: any[]
    projectParameters?: any[]
    projectParagraphs?: Paragraph[]
    projectData?: {
        projectStats?: any[]
        projectParameters?: any[]
        projectParagraphs?: Paragraph[]
    }
}
export type CombatMarkdownContext = ICombatMarkdownContext

/**
 * Service responsible for generating and formatting Combat Markdown blocks
 * and managing their insertion/removal in paragraph descriptions.
 */
export class CombatMarkdownService {
    public static readonly COMBAT_START_TAG = '<!-- COMBAT_START -->'
    public static readonly COMBAT_END_TAG = '<!-- COMBAT_END -->'
    public static readonly COMBAT_REGEX = /<!-- COMBAT_START -->[\s\S]*?<!-- COMBAT_END -->/

    /**
     * Extracts available traits (stats and parameters) from the context.
     */
    public static extractTraits(ctx: CombatMarkdownContext): TraitItem[] {
        const stats = ctx.projectStats || ctx.projectData?.projectStats || []
        const parameters = ctx.projectParameters || ctx.projectData?.projectParameters || []

        const result: TraitItem[] = []

        stats.forEach((s: any) => {
            const id =
                typeof s.getId === 'function' ? s.getId() : s.id || (s.getName ? s.getName() : '')
            const name = typeof s.getName === 'function' ? s.getName() : s.name || ''
            if (id && name) {
                result.push({ id: String(id), name: String(name), kind: 'stat' })
            }
        })

        parameters.forEach((p: any) => {
            const id =
                typeof p.getId === 'function' ? p.getId() : p.id || (p.getName ? p.getName() : '')
            const name = typeof p.getName === 'function' ? p.getName() : p.name || ''
            if (id && name) {
                result.push({ id: String(id), name: String(name), kind: 'parameter' })
            }
        })

        return result
    }

    /**
     * Generates formatted Markdown block for combat encounter.
     */
    public static generateMarkdown(entity: Paragraph, ctx: CombatMarkdownContext): string {
        const combat: Combat | null = entity.getCombat ? entity.getCombat() : null
        if (!combat) return ''

        const combatTitle =
            (typeof combat.getName === 'function' ? combat.getName() : (combat as any).name) ||
            (combat as any).getTitle?.() ||
            entity.getTitle?.() ||
            'Starcie'

        const opponents = combat.getCombatOpponents ? combat.getCombatOpponents() : []
        const outcomes = combat.getOutcomes ? combat.getOutcomes() : []
        const visibleStatIds = combat.getVisibleStatIds ? combat.getVisibleStatIds() : []

        const allTraits = this.extractTraits(ctx)
        const activeVisibleTraits = allTraits.filter(t => visibleStatIds.includes(t.id))

        // Build Opponents Table
        let opponentsMd = ''
        if (opponents.length === 0) {
            opponentsMd = '_Brak skonfigurowanych przeciwników._'
        } else {
            const headerCols = ['Przeciwnik', ...activeVisibleTraits.map(t => t.name)]
            const alignCols = [':---', ...activeVisibleTraits.map(() => ':---:')]
            const headerRow = `| ${headerCols.join(' | ')} |`
            const alignRow = `| ${alignCols.join(' | ')} |`

            const dataRows = opponents.map(opp => {
                const oppName = `👤 ${opp.name || 'Przeciwnik'}`
                const traitVals = activeVisibleTraits.map(t => {
                    const val =
                        opp.overriddenStats && opp.overriddenStats[t.id] !== undefined
                            ? opp.overriddenStats[t.id]
                            : '-'
                    return String(val)
                })
                return `| ${[oppName, ...traitVals].join(' | ')} |`
            })

            opponentsMd = [headerRow, alignRow, ...dataRows].join('\n')
        }

        // Build Outcomes List
        const allParagraphs: Paragraph[] =
            ctx.projectParagraphs || ctx.projectData?.projectParagraphs || []

        let outcomesMd = ''
        if (outcomes.length === 0) {
            outcomesMd = '_Brak zdefiniowanych wyników walki._'
        } else {
            outcomesMd = outcomes
                .map(o => {
                    const targetP = allParagraphs.find(
                        p =>
                            (typeof p.getId === 'function' ? p.getId() : (p as any).id) ===
                            o.targetParagraphId
                    )
                    const targetNum = targetP
                        ? typeof targetP.getDisplayNumber === 'function'
                            ? targetP.getDisplayNumber()
                            : (targetP as any).number || '?'
                        : '?'
                    const targetTitle = targetP
                        ? typeof targetP.getTitle === 'function'
                            ? targetP.getTitle()
                            : (targetP as any).title || ''
                        : ''
                    const pLinkText = targetTitle
                        ? `§ ${targetNum} ${targetTitle}`
                        : `§ ${targetNum}`
                    return `- **${o.name || 'Wynik'}** → [${pLinkText}](entity://paragraph/${o.targetParagraphId})`
                })
                .join('\n')
        }

        return [
            this.COMBAT_START_TAG,
            '---',
            `### ⚔️ Starcie: ${combatTitle}`,
            '',
            opponentsMd,
            '',
            '#### Możliwe wyniki starcia:',
            outcomesMd,
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
            if (this.COMBAT_REGEX.test(text)) {
                return text.replace(this.COMBAT_REGEX, combatMarkdown.trim())
            } else {
                return (text.trimEnd() + '\n\n' + combatMarkdown.trim()).trim() + '\n'
            }
        } else {
            // Combat disabled: remove block if present
            if (this.COMBAT_REGEX.test(text)) {
                text = text
                    .replace(this.COMBAT_REGEX, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim()
                if (text) text += '\n'
            }
            return text
        }
    }
}
