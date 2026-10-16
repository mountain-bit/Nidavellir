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
    public static readonly COMBAT_REGEX =
        /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})[\s\S]*?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/i
    public static readonly LEGACY_COMBAT_FALLBACK_REGEX =
        /(?:---\s*\n+)?###\s*(?:⚔️\s*)?Starcie:[\s\S]*?(?:####\s*Możliwe wyniki starcia:[\s\S]*?)?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\}|$)/i

    /**
     * Extracts available traits (stats and parameters) from the context.
     */
    public static extractTraits(ctx: CombatMarkdownContext): TraitItem[] {
        const stats = ctx.projectStats || ctx.projectData?.projectStats || []
        const parameters = ctx.projectParameters || ctx.projectData?.projectParameters || []

        const result: TraitItem[] = []
        const seenIds = new Set<string>()
        const seenNames = new Set<string>()

        stats.forEach((s: any) => {
            const id = String(
                typeof s.getId === 'function'
                    ? s.getId()
                    : s.id || (s.getName ? s.getName() : '') || ''
            ).trim()
            const name = String(typeof s.getName === 'function' ? s.getName() : s.name || '').trim()
            if (id && name && !seenIds.has(id) && !seenNames.has(name.toLowerCase())) {
                seenIds.add(id)
                seenNames.add(name.toLowerCase())
                result.push({ id, name, kind: 'stat' })
            }
        })

        parameters.forEach((p: any) => {
            const id = String(
                typeof p.getId === 'function'
                    ? p.getId()
                    : p.id || (p.getName ? p.getName() : '') || ''
            ).trim()
            const name = String(typeof p.getName === 'function' ? p.getName() : p.name || '').trim()
            if (id && name && !seenIds.has(id) && !seenNames.has(name.toLowerCase())) {
                seenIds.add(id)
                seenNames.add(name.toLowerCase())
                result.push({ id, name, kind: 'parameter' })
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
                const oppName = opp.name || 'Przeciwnik'
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
            '',
            '---',
            '',
            `### Starcie: ${combatTitle}`,
            '',
            opponentsMd,
            '',
            '#### Możliwe wyniki starcia:',
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
                .replace(/\n*<!--\s*COMBAT_START\s*-->/gi, '\n\n<!-- COMBAT_START -->')
                .replace(/\n{3,}/g, '\n\n')
        } else {
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
    }
}
