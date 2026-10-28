// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import ExportService from '../../main/services/ExportService.js'
import { RulesExportService } from '../../Services/export/RulesExportService'
import { setupCharacterSheetUI } from '../../View/ui/modals/export/exportModal.js'
import {
    deleteCustomStyle,
    getAllStyles,
    getStyleById,
    saveCustomStyle,
} from '../../View/ui/modals/export/exportStyleService.js'
import {
    compileCharacterSheet,
    compileGamebook,
    extractText,
    generatePrintHtml,
    getAvailablePlayerCharacters,
    markdownToHtml,
} from '../../View/ui/modals/export/gamebookCompiler.js'

describe('Export System Tests', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe('ExportStyleService', () => {
        it('provides default built-in styles', () => {
            const styles = getAllStyles()
            expect(styles.length).toBeGreaterThanOrEqual(4)

            const classic = getStyleById('classic-fantasy')
            expect(classic).toBeDefined()
            expect(classic.name).toBe('Klasyczne Fantasy')
            expect(classic.isBuiltIn).toBe(true)
            expect(classic.pageFormat).toBe('A5')

            const grimoire = getStyleById('dark-grimoire')
            expect(grimoire.name).toBe('Mroczny Grymuar')

            const eco = getStyleById('eco-print')
            expect(eco.columns).toBe(2)
        })

        it('allows saving, updating, and deleting custom styles', () => {
            const custom = {
                name: 'Mój Styl Gry',
                pageFormat: 'A4',
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                separatorType: 'line',
            }

            const saved = saveCustomStyle(custom)
            expect(saved.id).toBeDefined()
            expect(saved.id.startsWith('user-style-')).toBe(true)

            const fetched = getStyleById(saved.id)
            expect(fetched.name).toBe('Mój Styl Gry')
            expect(fetched.isBuiltIn).toBe(false)

            // Update
            const updated = saveCustomStyle({ ...fetched, name: 'Zaktualizowany Styl' })
            expect(updated.id).toBe(saved.id)
            expect(getStyleById(saved.id).name).toBe('Zaktualizowany Styl')

            // Delete
            const deleted = deleteCustomStyle(saved.id)
            expect(deleted).toBe(true)
            expect(getStyleById(saved.id).id).toBe('classic-fantasy') // falls back to default

            // Cannot delete built-in
            expect(deleteCustomStyle('classic-fantasy')).toBe(false)
        })
    })

    describe('GamebookCompiler', () => {
        const mockCtx = {
            projectData: {
                projectParagraphs: [
                    {
                        id: 'p1',
                        number: 1,
                        isStartNode: true,
                        isNumberLocked: false,
                        text: 'Początek przygody w lesie.',
                        choices: [{ text: 'Idź do jaskini', targetId: 'p5' }],
                    },
                    {
                        id: 'p2',
                        number: 2,
                        text: 'Polana w lesie.',
                        choices: [],
                    },
                    {
                        id: 'p3',
                        number: 3,
                        text: 'Strumień leśny.',
                        choices: [],
                    },
                    {
                        id: 'p4',
                        number: 4,
                        text: 'Górski trakt.',
                        choices: [],
                    },
                    {
                        id: 'p5',
                        number: 5,
                        isNumberLocked: true,
                        text: 'Znalazłeś tajemniczą jaskinię.',
                        choices: [{ text: 'Wróć', targetId: 'p1' }],
                    },
                ],
                locations: [{ name: 'Mroczny Las', description: 'Stary gęsty bór.' }],
                npcs: [{ name: 'Pustelnik', description: 'Mądry starzec.' }],
                tags: [{ name: 'Mana', description: 'Energia magiczna.' }],
                rules: [{ title: 'Zasady walki', content: 'Rzut 2k6.' }],
                playerCharacter: {
                    name: 'Wędrowiec',
                    characterClass: 'Wojownik',
                },
            },
        }

        it('compiles sections and places them according to placement option', () => {
            const compiledStart = compileGamebook(mockCtx, {
                includeLocations: true,
                locationsPlacement: 'start',
                includeNPCs: true,
                npcsPlacement: 'end',
                includeGlossary: true,
                glossaryPlacement: 'end',
                includeRules: true,
                includeCharacterSheet: true,
            })

            expect(compiledStart.startSections.length).toBe(1)
            expect(compiledStart.startSections[0].title).toContain('Lokacje')

            expect(compiledStart.endSections.length).toBe(2)
            expect(compiledStart.endSections[0].title).toContain('Dramatis Personae')
            expect(compiledStart.endSections[1].title).toContain('Glosariusz')

            expect(compiledStart.characterSheet).toBeDefined()
            expect(compiledStart.characterSheet.name).toBe('Wędrowiec')
            expect(compiledStart.rulesContent).toContain('Zasady walki')
        })

        it('preserves locked numbers and maps choice targets when shuffling', () => {
            const compiled = compileGamebook(
                mockCtx,
                { shuffleParagraphs: true },
                getStyleById('classic-fantasy')
            )

            // Paragraph with valid lock within 1..N (p5) must retain its locked number 5
            const p5Compiled = compiled.paragraphs.find((p: { id: string }) => p.id === 'p5')
            expect(p5Compiled).toBeDefined()
            expect(p5Compiled?.displayNumber).toBe(5)

            // Start paragraph must have number 1
            const p1Compiled = compiled.paragraphs.find((p: { id: string }) => p.id === 'p1')
            expect(p1Compiled).toBeDefined()
            expect(p1Compiled?.displayNumber).toBe(1)

            // Choice target from p1 to p5 must point to 5
            expect(p1Compiled.choices[0].targetNumber).toBe(5)
            // Choice target from p5 to p1 must point to 1
            expect(p5Compiled.choices[0].targetNumber).toBe(1)

            // All numbers must strictly form [1, 2, 3, 4, 5]
            const allNumbers = compiled.paragraphs.map(
                (p: { displayNumber: number }) => p.displayNumber
            )
            expect(allNumbers).toEqual([1, 2, 3, 4, 5])
        })

        it('strictly guarantees paragraph numbers from 1 to N without gaps or numbers exceeding N', () => {
            const tenParagraphsCtx = {
                projectData: {
                    projectParagraphs: Array.from({ length: 10 }, (_, i) => ({
                        id: `p-${i + 1}`,
                        number: (i + 1) * 73, // arbitrary large numbers from editor
                        isStartNode: i === 0,
                        text: `Treść paragrafu ${i + 1}`,
                        choices: i < 9 ? [{ text: 'Dalej', targetId: `p-${i + 2}` }] : [],
                    })),
                },
            }

            // Non-shuffled export
            const compiledSequential = compileGamebook(tenParagraphsCtx, {
                shuffleParagraphs: false,
            })
            const seqNumbers = compiledSequential.paragraphs.map(
                (p: { displayNumber: number }) => p.displayNumber
            )
            expect(seqNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

            // Shuffled export
            const compiledShuffled = compileGamebook(tenParagraphsCtx, { shuffleParagraphs: true })
            const shufNumbers = compiledShuffled.paragraphs.map(
                (p: { displayNumber: number }) => p.displayNumber
            )
            expect(shufNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

            // Start paragraph must always be 1
            expect(compiledShuffled.paragraphs[0].id).toBe('p-1')
            expect(compiledShuffled.paragraphs[0].displayNumber).toBe(1)

            // Choice targets must all be valid numbers in range 1..10
            compiledShuffled.paragraphs.forEach((p: { choices: { targetNumber: number }[] }) => {
                p.choices.forEach((ch: { targetNumber: number }) => {
                    expect(ch.targetNumber).toBeGreaterThanOrEqual(1)
                    expect(ch.targetNumber).toBeLessThanOrEqual(10)
                })
            })
        })

        it('normalizes locked numbers that exceed N to stay strictly within 1 to N', () => {
            const ctxWithInvalidLock = {
                projectData: {
                    projectParagraphs: [
                        { id: 'p1', isStartNode: true, text: 'Start' },
                        {
                            id: 'p2',
                            number: 999,
                            isNumberLocked: true,
                            text: 'Zablokowany za wysoko',
                        },
                        { id: 'p3', text: 'Koniec' },
                    ],
                },
            }

            const compiled = compileGamebook(ctxWithInvalidLock, { shuffleParagraphs: true })
            const numbers = compiled.paragraphs.map(
                (p: { displayNumber: number }) => p.displayNumber
            )
            expect(numbers).toEqual([1, 2, 3])
            expect(numbers).not.toContain(999)
        })

        it('generates well-formed print HTML with CSS @page and separators', () => {
            const style = getStyleById('classic-fantasy')
            const compiled = compileGamebook(
                mockCtx,
                {
                    includeLocations: true,
                    locationsPlacement: 'start',
                    includeGlossary: true,
                    glossaryPlacement: 'end',
                    includeCoverPage: true,
                },
                style
            )

            const html = generatePrintHtml(compiled, style)

            expect(html).toContain('<!DOCTYPE html>')
            expect(html).toContain('@page')
            expect(html).toContain('size: A5 portrait')
            expect(html).toContain('§ 1')
            expect(html).toContain('❖ ❖ ❖')
            expect(html).toContain('Początek przygody w lesie.')
            expect(html).toContain('Glosariusz i Słowniczek')
        })

        it('compiles dedicated game rules file and includes it in print HTML export', () => {
            const rulesCtx = {
                projectData: {
                    projectParagraphs: [
                        { id: 'p1', number: 1, isStartNode: true, text: 'Początek.' },
                    ],
                },
                files: {
                    'Rules/GameRules.md':
                        '# Oficjalne Zasady\n\nJak grać: Rzuć kośćmi przed walką.',
                },
            }

            const compiled = compileGamebook(rulesCtx, {
                includeRules: true,
            })

            expect(compiled.rulesContent).toContain('Oficjalne Zasady')
            expect(compiled.rulesContent).toContain('Rzuć kośćmi przed walką.')

            const html = generatePrintHtml(compiled, getStyleById('classic-fantasy'))
            expect(html).toContain('gamebook-rules-section')
            expect(html).toContain('Zasady Gry i Wprowadzenie')
            expect(html).toContain('Oficjalne Zasady')
        })

        it('RulesExportService correctly formats standalone HTML and Markdown handouts', () => {
            const htmlHandout = RulesExportService.exportToHtml({
                title: 'Zasady Świata',
                author: 'Mistrz Gry',
                version: '2.0',
                content: '# Reguły\n\n- Punkt 1\n- Punkt 2',
            })

            expect(htmlHandout).toContain('<!DOCTYPE html>')
            expect(htmlHandout).toContain('Zasady Świata')
            expect(htmlHandout).toContain('Mistrz Gry')
            expect(htmlHandout).toContain('<li>Punkt 1</li>')

            const mdHandout = RulesExportService.exportToMarkdown({
                title: 'Zasady Świata',
                author: 'Mistrz Gry',
                version: '2.0',
                content: '# Reguły\n\nTreść reguł.',
            })

            expect(mdHandout).toContain('---')
            expect(mdHandout).toContain('title: "Zasady Świata"')
            expect(mdHandout).toContain('author: "Mistrz Gry"')
            expect(mdHandout).toContain('Treść reguł.')
        })

        it('compiles choices with conditions, costs, rewards, and branching dice checks', () => {
            const ctxWithAdvancedChoices = {
                projectData: {
                    projectParagraphs: [
                        {
                            id: 'p1',
                            number: 1,
                            isStartNode: true,
                            text: 'Stoisz przed mostem strzeżonym przez trolla.',
                            choices: [
                                {
                                    text: 'Przekup trolla złotem',
                                    targetId: 'p2',
                                    condition: { getSummary: (): string => 'Posiadasz Złoto x 5' },
                                    costs: [{ name: 'Złoto', value: 5, type: 'parameter' }],
                                    rewards: [{ name: 'Przepustka', value: 1, type: 'item' }],
                                },
                                {
                                    text: 'Spróbuj przeskoczyć rozpadlinę',
                                    targetId: 'p2',
                                    diceCheck: {
                                        dice: '2k6',
                                        stat: 'Zręczność',
                                        description: 'Test skoku',
                                        branches: [
                                            {
                                                min: 2,
                                                max: 6,
                                                targetParagraphId: 'p3',
                                                description: 'Upadek w przepaść',
                                            },
                                            {
                                                min: 7,
                                                max: 12,
                                                targetParagraphId: 'p2',
                                                description: 'Udany skok',
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                        {
                            id: 'p2',
                            number: 2,
                            text: 'Dotarłeś na drugą stronę mostu.',
                            choices: [],
                        },
                        {
                            id: 'p3',
                            number: 3,
                            text: 'Spadasz w dół i giniesz.',
                            choices: [],
                        },
                    ],
                },
            }

            const compiled = compileGamebook(ctxWithAdvancedChoices, { shuffleParagraphs: false })
            const startP = compiled.paragraphs[0]
            expect(startP.choices).toHaveLength(2)

            const ch1 = startP.choices[0]
            expect(ch1.conditionSummary).toBe('Posiadasz Złoto x 5')
            expect(ch1.costs).toEqual([{ name: 'Złoto', value: 5, type: 'parameter' }])
            expect(ch1.rewards).toEqual([{ name: 'Przepustka', value: 1, type: 'item' }])
            expect(ch1.targetNumber).toBe(2)

            const ch2 = startP.choices[1]
            expect(ch2.diceCheck).toBeDefined()
            expect(ch2.diceCheck.dice).toBe('2k6')
            expect(ch2.diceCheck.branches[0].targetNumber).toBe(3)
            expect(ch2.diceCheck.branches[1].targetNumber).toBe(2)

            const style = getStyleById('classic-fantasy')
            const html = generatePrintHtml(compiled, style)

            expect(html).toContain('[Jeżeli: Posiadasz Złoto x 5]')
            expect(html).toContain('[Tracisz: 5 Złoto]')
            expect(html).toContain('[Zyskujesz: 1 Przepustka]')
            expect(html).toContain('Rzuć kośćmi (2k6 + Zręczność)')
            expect(html).toContain('Wynik 2–6: <strong>idź do 3</strong>')
            expect(html).toContain('Wynik 7–12: <strong>idź do 2</strong>')
        })
    })

    describe('Export Modal UI interaction', () => {
        it('opens export modal and updates UI statistics without throwing', async () => {
            const { openExportModal } = await import('../../View/ui/modals/export/exportModal.js')

            document.body.innerHTML = `
                <button data-action="export-game">Eksportuj</button>
                <div id="modal-export-project" class="hidden flex">
                    <select id="export-style-select"></select>
                    <select id="export-opt-separator"><option value="ornament">Winieta</option></select>
                    <span id="export-stat-count">0</span>
                    <span id="export-stat-words">0</span>
                    <span id="export-stat-pages">0</span>
                    <div id="export-mini-preview-content"></div>
                    <button id="btn-close-export-modal"></button>
                    <button id="btn-cancel-export"></button>
                    <button id="btn-confirm-export"></button>
                </div>
            `

            const modal = document.getElementById('modal-export-project')
            expect(modal?.classList.contains('hidden')).toBe(true)

            const ctxWithEntities = {
                projectData: {
                    projectParagraphs: [
                        {
                            id: 'p1',
                            getContent: (): { getText: () => string } => ({
                                getText: (): string => 'To jest treść paragrafu.',
                            }),
                            choices: [
                                {
                                    getName: (): string => 'Wybór 1',
                                    getTargetId: (): string => 'p2',
                                },
                            ],
                        },
                    ],
                },
            }

            openExportModal(ctxWithEntities)

            expect(modal?.classList.contains('hidden')).toBe(false)
            expect(document.getElementById('export-stat-count')?.textContent).toContain(
                '1 paragraf'
            )
            expect(document.getElementById('export-mini-preview-content')?.innerHTML).toContain(
                '§ 1'
            )
        })
    })

    describe('Markdown vs Summary Extraction', () => {
        it('strictly extracts markdown prose from ctx.files and ignores short summary', () => {
            const ctxWithMarkdown = {
                files: {
                    'Paragraphs/p_001_las/Description_Paragraph_Las.md':
                        '# Tajemniczy Las\n\nIdziesz przez gęsty bór. **Drzewa** szumią ponuro na wietrze.\n\n*Czy chcesz zbadać jaskinię?*',
                },
                projectData: {
                    projectParagraphs: [
                        {
                            id: 'p1',
                            number: 1,
                            name: 'Las',
                            content: {
                                summary:
                                    'Krótkie streszczenie o lesie (nie powinno trafić do eksportu)',
                                filePath: './Paragraphs/p_001_las/Description_Paragraph_Las.md',
                            },
                            choices: [],
                        },
                    ],
                },
            }

            const extracted = extractText(
                ctxWithMarkdown.projectData.projectParagraphs[0],
                ctxWithMarkdown
            )

            expect(extracted).toContain('# Tajemniczy Las')
            expect(extracted).toContain('**Drzewa** szumią ponuro')
            expect(extracted).not.toContain('Krótkie streszczenie o lesie')

            const compiled = compileGamebook(ctxWithMarkdown, { shuffleParagraphs: false })
            expect(compiled.paragraphs[0].text).toContain('# Tajemniczy Las')
            expect(compiled.paragraphs[0].text).not.toContain('Krótkie streszczenie o lesie')
        })

        it('correctly converts markdown to formatted HTML in print generation', () => {
            const md =
                '# Wstęp do walki\n\n> To jest cytat mędrca.\n\n- Miecz dwuręczny\n- Tarcza dębowa\n\n<!-- COMBAT_START -->\nWalka z goblinem\n<!-- COMBAT_END -->'
            const html = markdownToHtml(md)

            expect(html).toContain('<h2 class="gamebook-heading">Wstęp do walki</h2>')
            expect(html).toContain(
                '<blockquote class="gamebook-quote">To jest cytat mędrca.</blockquote>'
            )
            expect(html).toContain(
                '<ul class="gamebook-list"><li>Miecz dwuręczny</li><li>Tarcza dębowa</li></ul>'
            )
            expect(html).toContain('class="gamebook-combat-card')
            expect(html).toContain('Walka z goblinem')
        })

        it('renders entity mentions (locations, characters, items, tags) as elegant badges without structural syntax or emojis', () => {
            const md =
                'Docierasz do [Stara Karczma](entity://location/loc_1). Spotykasz tam [Karczmarz Jan](entity://character/npc_1). ' +
                'Kupujesz od niego [Zardzewiały Miecz](entity://item/item_1) za 5 monet. Odblokowano cechę [Odwaga](entity://tag/tag_bravery).'

            const html = markdownToHtml(md)

            // Ensure no raw structural markdown or entity:// URLs remain
            expect(html).not.toContain('entity://location')
            expect(html).not.toContain('entity://character')
            expect(html).not.toContain('entity://item')
            expect(html).not.toContain('entity://tag')
            expect(html).not.toContain('[Stara Karczma]')
            expect(html).not.toContain('[Karczmarz Jan]')

            // Strictly verify that NO emojis exist in the output
            expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u)

            // Verify elegant badges with typography, without any emojis
            expect(html).toContain('class="gamebook-entity gamebook-entity-location"')
            expect(html).toContain('Stara Karczma')

            expect(html).toContain('class="gamebook-entity gamebook-entity-character"')
            expect(html).toContain('Karczmarz Jan')

            expect(html).toContain('class="gamebook-entity gamebook-entity-item"')
            expect(html).toContain('Zardzewiały Miecz')

            expect(html).toContain('class="gamebook-entity gamebook-entity-tag"')
            expect(html).toContain('Odwaga')
        })

        it('renders rich combat blocks with styled HTML table and mapped outcomes without raw markdown or pipes', () => {
            const combatMd = `
Spotykasz wrogów.

<!-- COMBAT_START -->
---
### Starcie: Bandyci na trakcie

| Przeciwnik | Zdrowie | Siła |
| :--- | :---: | :---: |
| Herszt Bandytów | 24 | 14 |
| Złodziej | 12 | 8 |

#### Możliwe wyniki starcia:
- **Zwycięstwo** → [§ 99 Jaskinia](entity://paragraph/p_victory)
- **Porażka** → [§ 100 Śmierć](entity://paragraph/p_defeat)
<!-- COMBAT_END -->

Wybierz swój dalszy krok.
`
            const paragraphMap = {
                p_victory: 5,
                p_defeat: 12,
            }

            const html = markdownToHtml(combatMd, paragraphMap)

            // No raw pipes or tags
            expect(html).not.toContain('<!-- COMBAT_START -->')
            expect(html).not.toContain('<!-- COMBAT_END -->')
            expect(html).not.toContain('| :--- |')
            expect(html).not.toContain('entity://paragraph')
            expect(html).not.toContain('p_victory')
            expect(html).not.toContain('p_defeat')

            // Rich card header
            expect(html).toContain('class="gamebook-combat-card')
            expect(html).toContain('STARCIE: BANDYCI NA TRAKCIE')

            // Table with opponents
            expect(html).toContain('<table class="combat-opponents-table">')
            expect(html).toContain('Przeciwnik</th>')
            expect(html).toContain('Zdrowie</th>')
            expect(html).toContain('<td class="opponent-name">Herszt Bandytów</td>')
            expect(html).toContain('<td class="opponent-stat">24</td>')
            expect(html).toContain('<td class="opponent-name">Złodziej</td>')

            // Outcomes mapped to actual paragraph numbers
            expect(html).toContain('Możliwe wyniki walki:')
            expect(html).toContain('<strong>Zwycięstwo</strong>:')
            expect(html).toContain('Przejdź do § 5')
            expect(html).toContain('<strong>Porażka</strong>:')
            expect(html).toContain('Przejdź do § 12')
        })
    })

    describe('DOCX Native Word Styles Export', () => {
        it('configures document defaults and custom paragraph and character styles', () => {
            const styles = ExportService.buildDocxStyles({
                fontFamily: 'Merriweather',
                headerFontFamily: 'Cinzel',
                fontSize: 11,
                headerFontSize: 15,
                textColor: '#222222',
                accentColor: '#990000',
            })

            expect(styles.default.document.run.font).toBe('Merriweather')
            expect(styles.default.document.run.size).toBe(22)
            expect(styles.default.document.run.color).toBe('222222')

            const paragraphStyleIds = styles.paragraphStyles.map((s: { id: string }) => s.id)
            expect(paragraphStyleIds).toContain('GamebookParagraph')
            expect(paragraphStyleIds).toContain('GamebookParagraphHeader')
            expect(paragraphStyleIds).toContain('GamebookChoice')
            expect(paragraphStyleIds).toContain('GamebookDialogue')
            expect(paragraphStyleIds).toContain('GamebookQuote')
            expect(paragraphStyleIds).toContain('GamebookSectionTitle')

            const pStyle = styles.paragraphStyles.find(
                (s: { id: string }) => s.id === 'GamebookParagraph'
            )
            expect(pStyle.name).toBe('Paragraf Gry')
            expect(pStyle.run.font).toBe('Merriweather')

            const hStyle = styles.paragraphStyles.find(
                (s: { id: string }) => s.id === 'GamebookParagraphHeader'
            )
            expect(hStyle.name).toBe('Numer Paragrafu (§)')
            expect(hStyle.run.font).toBe('Cinzel')
            expect(hStyle.run.color).toBe('990000')

            const charStyleIds = styles.characterStyles.map((s: { id: string }) => s.id)
            expect(charStyleIds).toContain('GamebookLocationLink')
            expect(charStyleIds).toContain('GamebookCharacterLink')
            expect(charStyleIds).toContain('GamebookItemLink')
            expect(charStyleIds).toContain('GamebookChoiceLink')
        })

        it('assigns native Word styles to converted docx elements without hardcoding run font or size', () => {
            const md =
                'Pierwszy akapit tekstu z **pogrubieniem** oraz *kursywą*.\n\n' +
                '— Kwestia dialogowa postaci.\n\n' +
                '> Ważny cytat lub inskrypcja.\n\n' +
                'Dotarłeś do [Pradawny Las](entity://location/loc_forest).'

            const elements = ExportService.parseMarkdownToDocxParagraphs(md, {
                fontFamily: 'Georgia',
                fontSize: 10,
            })

            // 1. Regular paragraph has GamebookParagraph style
            const jsonP0 = JSON.stringify(elements[0])
            expect(jsonP0).toContain('GamebookParagraph')

            // Verify normal runs don't hardcode font/size, allowing Word style inheritance
            expect(jsonP0).not.toContain('w:rFonts')
            expect(jsonP0).not.toContain('w:sz')

            // 2. Dialogue paragraph has GamebookDialogue style
            const jsonDialogue = JSON.stringify(elements[1])
            expect(jsonDialogue).toContain('GamebookDialogue')

            // 3. Quote paragraph has GamebookQuote style
            const jsonQuote = JSON.stringify(elements[2])
            expect(jsonQuote).toContain('GamebookQuote')
        })
    })

    describe('Player Characters and Character Sheet', () => {
        it('resolves available player characters and handles missing hero', () => {
            const emptyCtx = { projectData: {} }
            expect(getAvailablePlayerCharacters(emptyCtx)).toEqual([])

            const singleHeroCtx = {
                projectData: {
                    playerCharacter: {
                        id: 'hero1',
                        getName: (): string => 'Kaelen',
                        name: 'Kaelen',
                    },
                },
            }
            const heroes1 = getAvailablePlayerCharacters(singleHeroCtx)
            expect(heroes1.length).toBe(1)
            expect(heroes1[0].name).toBe('Kaelen')

            const multiHeroCtx = {
                projectData: {
                    playerCharacters: [
                        { id: 'h1', name: 'Kaelen' },
                        { id: 'h2', name: 'Lyra' },
                    ],
                },
            }
            const heroes2 = getAvailablePlayerCharacters(multiHeroCtx)
            expect(heroes2.length).toBe(2)
            expect(heroes2.map(h => h.name)).toEqual(['Kaelen', 'Lyra'])
        })

        it('compiles detailed character sheet matching hero domain data', () => {
            const mockHero = {
                getId: (): string => 'hero-123',
                getName: (): string => 'Aleron z Rivii',
                getCharacterClass: (): { getName: () => string } => ({
                    getName: (): string => 'Zwiadowca',
                }),
                getSummary: (): string => 'Doświadczony tropiciel i łucznik.',
                getAvatar: (): string => 'archer',
                getStats: (): { getName: () => string; getValue: () => number }[] => [
                    { getName: (): string => 'Zręczność', getValue: (): number => 16 },
                    { getName: (): string => 'Siła', getValue: (): number => 12 },
                ],
                getParameters: (): {
                    getName: () => string
                    getCurrentValue?: () => number
                    getMaxValue?: () => number
                    getValue?: () => number
                }[] => [
                    {
                        getName: (): string => 'Zdrowie',
                        getCurrentValue: (): number => 20,
                        getMaxValue: (): number => 20,
                    },
                    { getName: (): string => 'Złoto', getValue: (): number => 50 },
                ],
                getSkills: (): { getName: () => string; getValue: () => string }[] => [
                    { getName: (): string => 'Strzelectwo', getValue: (): string => '+3' },
                    { getName: (): string => 'Skradanie', getValue: (): string => '+2' },
                ],
                getFeatures: (): { getName: () => string; description: string }[] => [
                    { getName: (): string => 'Sokoli Wzrok', description: 'Widzi w ciemności.' },
                ],
                getItems: (): { getName: () => string }[] => [
                    { getName: (): string => 'Długi łuk' },
                    { getName: (): string => 'Kołczan strzał' },
                ],
                getTags: (): string[] => ['Elf', 'Szybki'],
            }

            const sheet = compileCharacterSheet(mockHero)
            expect(sheet.name).toBe('Aleron z Rivii')
            expect(sheet.characterClass).toBe('Zwiadowca')
            expect(sheet.summary).toBe('Doświadczony tropiciel i łucznik.')
            expect(sheet.stats).toEqual([
                { name: 'Zręczność', value: 16 },
                { name: 'Siła', value: 12 },
            ])
            expect(sheet.parameters[0].name).toBe('Zdrowie')
            expect(sheet.parameters[0].currentValue).toBe(20)
            expect(sheet.skills[0].name).toBe('Strzelectwo')
            expect(sheet.items.map((i: { name: string }) => i.name)).toEqual([
                'Długi łuk',
                'Kołczan strzał',
            ])
        })

        it('supports multi-selection of heroes during export compilation', () => {
            const ctxWithMultiple = {
                projectData: {
                    playerCharacters: [
                        {
                            getId: (): string => 'h1',
                            getName: (): string => 'Wojownik',
                            getCharacterClass: (): string => 'Rycerz',
                        },
                        {
                            getId: (): string => 'h2',
                            getName: (): string => 'Czarodziejka',
                            getCharacterClass: (): string => 'Mag',
                        },
                        {
                            getId: (): string => 'h3',
                            getName: (): string => 'Złodziej',
                            getCharacterClass: (): string => 'Łotrzyk',
                        },
                    ],
                    projectParagraphs: [{ id: 'p1', number: 1, text: 'Start' }],
                },
            }

            // Export with selected heroes: only h1 and h3
            const compiled = compileGamebook(ctxWithMultiple, {
                includeCharacterSheet: true,
                selectedHeroIds: ['h1', 'h3'],
            })

            expect(compiled.characterSheets).toBeDefined()
            expect(compiled.characterSheets?.length).toBe(2)
            expect(compiled.characterSheets?.[0].name).toBe('Wojownik')
            expect(compiled.characterSheets?.[1].name).toBe('Złodziej')
            expect(compiled.characterSheet.name).toBe('Wojownik')
        })

        it('does not generate character sheets when project has no player character', () => {
            const ctxNoHero = {
                projectData: {
                    projectParagraphs: [{ id: 'p1', number: 1, text: 'Start' }],
                },
            }

            const compiled = compileGamebook(ctxNoHero, {
                includeCharacterSheet: true,
            })

            expect(compiled.characterSheets).toEqual([])
            expect(compiled.characterSheet).toBeNull()
        })

        it('compiles and renders multiple inventories with capacities and initial items', () => {
            const heroWithInventories = {
                id: 'hero_inv',
                getName: (): string => 'Kupiec Korzenny',
                getCharacterClass: (): string => 'Handlarz',
                getSummary: (): string => 'Zamożny podróżnik',
                getInventories: (): {
                    getId: () => string
                    getName: () => string
                    getCapacity: () => number
                    getItems: () => { getName: () => string }[]
                }[] => [
                    {
                        getId: (): string => 'inv_bag',
                        getName: (): string => 'Skórzana Torba',
                        getCapacity: (): number => 3,
                        getItems: (): { getName: () => string }[] => [
                            { getName: (): string => 'Zwój pergaminu' },
                            { getName: (): string => 'Atrament' },
                        ],
                    },
                    {
                        getId: (): string => 'inv_wagon',
                        getName: (): string => 'Wóz Kupiecki',
                        getCapacity: (): number => 0,
                        getItems: (): { getName: () => string }[] => [
                            { getName: (): string => 'Beczka piwa' },
                        ],
                    },
                ],
            }

            const ctx = {
                projectData: {
                    projectName: 'Wyprawa Handlowa',
                    projectParagraphs: [{ id: 'p1', number: 1, text: 'Początek' }],
                    playerCharacters: [heroWithInventories],
                },
            }

            const compiled = compileGamebook(ctx, {
                includeCharacterSheet: true,
            })

            expect(compiled.characterSheet).toBeDefined()
            expect(compiled.characterSheet.inventories).toBeDefined()
            expect(compiled.characterSheet.inventories.length).toBe(2)

            const inv1 = compiled.characterSheet.inventories[0]
            expect(inv1.name).toBe('Skórzana Torba')
            expect(inv1.capacity).toBe(3)
            expect(inv1.items.length).toBe(2)
            expect(inv1.items[0].name).toBe('Zwój pergaminu')

            const inv2 = compiled.characterSheet.inventories[1]
            expect(inv2.name).toBe('Wóz Kupiecki')
            expect(inv2.capacity).toBe(0)
            expect(inv2.items.length).toBe(1)
            expect(inv2.items[0].name).toBe('Beczka piwa')

            // Verify HTML output contains inventory headers and item slots
            const html = generatePrintHtml(compiled)
            expect(html).toContain('Skórzana Torba (Pojemność: 3 miejsc)')
            expect(html).toContain('Zwój pergaminu')
            expect(html).toContain('Atrament')
            expect(html).toContain('Wóz Kupiecki (Bez limitu)')
            expect(html).toContain('Beczka piwa')
        })

        it('renders only elements explicitly set by the author, without unconfigured placeholders or default fillers', () => {
            const minimalHero = {
                id: 'min_hero',
                getName: (): string => 'Samotny Wędrowiec',
            }

            const ctx = {
                projectData: {
                    projectName: 'Cicha Opowieść',
                    projectParagraphs: [{ id: 'p1', number: 1, text: 'Wstęp' }],
                    playerCharacters: [minimalHero],
                },
            }

            const compiled = compileGamebook(ctx, {
                includeCharacterSheet: true,
            })

            const html = generatePrintHtml(compiled)
            expect(html).toContain('Karta Postaci: Samotny Wędrowiec')
            expect(html).toContain('Imię:')
            expect(html).toContain('Samotny Wędrowiec')

            // Must NOT include placeholders for unset elements
            expect(html).not.toContain('Klasa:')
            expect(html).not.toContain('Zdrowie')
            expect(html).not.toContain('Złoto')
            expect(html).not.toContain('Ekwipunek max')
            expect(html).not.toContain('Plecak i Wyposażenie')
            expect(html).not.toContain('Umiejętności:')
            expect(html).not.toContain('Zdolności i Atuty:')
            expect(html).not.toContain(
                '..................................................................................'
            )
        })
    })

    describe('Locations and NPCs Markdown Descriptions in Export', () => {
        it('includes full markdown descriptions for locations and NPCs', () => {
            const locDescMd =
                '### Stara Twierdza\n\nMur z ciosanego kamienia porastają pnącza.\n\n— Kto tam idzie? — rozlega się krzyk.'
            const npcDescMd =
                '**Karczmarz Barnaba** to tęgi jegomość.\n\n- Zawsze ma ciepłą strawę\n- Wie wszystko o okolicy'

            const ctx = {
                projectData: {
                    locations: [
                        {
                            getName: (): string => 'Stara Twierdza',
                            getDescription: (): { getText: () => string } => ({
                                getText: (): string => locDescMd,
                            }),
                        },
                    ],
                    npcs: [
                        {
                            getName: (): string => 'Barnaba',
                            getDescription: (): { getText: () => string } => ({
                                getText: (): string => npcDescMd,
                            }),
                        },
                    ],
                    projectParagraphs: [{ id: 'p1', number: 1, text: 'Początek drogi.' }],
                },
            }

            const compiled = compileGamebook(ctx, {
                includeLocations: true,
                locationsPlacement: 'start',
                includeNPCs: true,
                npcsPlacement: 'end',
            })

            expect(compiled.startSections.length).toBe(1)
            expect(compiled.startSections[0].items[0].name).toBe('Stara Twierdza')
            expect(compiled.startSections[0].items[0].description).toBe(locDescMd)

            expect(compiled.endSections.length).toBe(1)
            expect(compiled.endSections[0].items[0].name).toBe('Barnaba')
            expect(compiled.endSections[0].items[0].description).toBe(npcDescMd)

            // Verify print HTML contains parsed markdown tags
            const html = generatePrintHtml(compiled)
            expect(html).toContain('Stara Twierdza')
            expect(html).toContain('Mur z ciosanego kamienia')
            expect(html).toContain('Barnaba')
            expect(html).toContain('Zawsze ma ciepłą strawę')
        })
    })

    describe('Export Modal UI Character Sheet Setup', () => {
        it('hides character sheet option when no player character exists', () => {
            document.body.innerHTML = `
                <div id="modal-export-project">
                    <div id="export-container-character-sheet">
                        <input type="checkbox" id="export-opt-character-sheet" checked />
                        <span id="export-single-hero-indicator"></span>
                        <div id="export-heroes-selection-panel" class="hidden">
                            <button id="btn-export-toggle-all-heroes"></button>
                            <div id="export-heroes-list"></div>
                        </div>
                    </div>
                </div>
            `

            setupCharacterSheetUI({ projectData: {} })

            const container = document.getElementById('export-container-character-sheet')
            const checkbox = document.getElementById(
                'export-opt-character-sheet'
            ) as HTMLInputElement

            expect(container?.classList.contains('hidden')).toBe(true)
            expect(checkbox?.checked).toBe(false)
        })

        it('shows hero selection panel and indicator when exactly 1 player character exists', () => {
            document.body.innerHTML = `
                <div id="modal-export-project">
                    <div id="export-container-character-sheet" class="hidden">
                        <input type="checkbox" id="export-opt-character-sheet" />
                        <span id="export-single-hero-indicator"></span>
                        <div id="export-heroes-selection-panel" class="hidden">
                            <span id="export-heroes-selection-title"></span>
                            <button id="btn-export-toggle-all-heroes"></button>
                            <div id="export-heroes-list"></div>
                        </div>
                    </div>
                </div>
            `

            const singleHeroCtx = {
                projectData: {
                    playerCharacter: {
                        getName: (): string => 'Thorgal',
                        getCharacterClass: (): string => 'Wojownik Północy',
                    },
                },
            }

            setupCharacterSheetUI(singleHeroCtx)

            const container = document.getElementById('export-container-character-sheet')
            const checkbox = document.getElementById(
                'export-opt-character-sheet'
            ) as HTMLInputElement
            const indicator = document.getElementById('export-single-hero-indicator')
            const panel = document.getElementById('export-heroes-selection-panel')
            const list = document.getElementById('export-heroes-list')

            expect(container?.classList.contains('hidden')).toBe(false)
            expect(checkbox?.checked).toBe(true)
            expect(indicator?.textContent).toContain('Thorgal')
            // User requested that hero selection place is always available
            expect(panel?.classList.contains('hidden')).toBe(false)

            const heroBoxes = list?.querySelectorAll(
                '.export-hero-checkbox'
            ) as NodeListOf<HTMLInputElement>
            expect(heroBoxes.length).toBe(1)
            expect(heroBoxes[0].checked).toBe(true)
            expect(list?.textContent).toContain('Thorgal')
            expect(list?.textContent).toContain('Wojownik Północy')
        })

        it('displays multi-selection list and toggle button when multiple player characters exist', () => {
            document.body.innerHTML = `
                <div id="modal-export-project">
                    <div id="export-container-character-sheet" class="hidden">
                        <input type="checkbox" id="export-opt-character-sheet" />
                        <span id="export-single-hero-indicator"></span>
                        <div id="export-heroes-selection-panel" class="hidden">
                            <span id="export-heroes-selection-title"></span>
                            <button id="btn-export-toggle-all-heroes"></button>
                            <div id="export-heroes-list"></div>
                        </div>
                    </div>
                </div>
            `

            const multiCtx = {
                projectData: {
                    playerCharacters: [
                        {
                            getId: (): string => 'h1',
                            getName: (): string => 'Geralt',
                            getCharacterClass: (): string => 'Wiedźmin',
                        },
                        {
                            getId: (): string => 'h2',
                            getName: (): string => 'Yennefer',
                            getCharacterClass: (): string => 'Czarodziejka',
                        },
                    ],
                },
            }

            setupCharacterSheetUI(multiCtx)

            const container = document.getElementById('export-container-character-sheet')
            const panel = document.getElementById('export-heroes-selection-panel')
            const list = document.getElementById('export-heroes-list')
            const btnToggle = document.getElementById('btn-export-toggle-all-heroes')

            expect(container?.classList.contains('hidden')).toBe(false)
            expect(panel?.classList.contains('hidden')).toBe(false)

            const checkboxes = list?.querySelectorAll(
                '.export-hero-checkbox'
            ) as NodeListOf<HTMLInputElement>
            expect(checkboxes.length).toBe(2)
            expect(checkboxes[0].value).toBe('h1')
            expect(checkboxes[1].value).toBe('h2')
            expect(checkboxes[0].checked).toBe(true)

            // Test Toggle All button
            btnToggle?.click()
            expect(checkboxes[0].checked).toBe(false)
            expect(checkboxes[1].checked).toBe(false)

            btnToggle?.click()
            expect(checkboxes[0].checked).toBe(true)
            expect(checkboxes[1].checked).toBe(true)
        })

        it('filters exported character sheets by selectedHeroIds', () => {
            const ctx = {
                projectData: {
                    name: 'Gra Testowa',
                    playerCharacters: [
                        { getId: (): string => 'hero-1', getName: (): string => 'Bohater A' },
                        { getId: (): string => 'hero-2', getName: (): string => 'Bohater B' },
                    ],
                },
            }

            // Select only hero-2
            const result = compileGamebook(ctx, {
                includeCharacterSheet: true,
                selectedHeroIds: ['hero-2'],
            })

            expect(result.characterSheets).toHaveLength(1)
            expect(result.characterSheets?.[0].name).toBe('Bohater B')

            // Select none (empty array)
            const resultEmpty = compileGamebook(ctx, {
                includeCharacterSheet: true,
                selectedHeroIds: [],
            })
            expect(resultEmpty.characterSheets).toHaveLength(0)

            // Include all (undefined selectedHeroIds)
            const resultAll = compileGamebook(ctx, {
                includeCharacterSheet: true,
            })
            expect(resultAll.characterSheets).toHaveLength(2)
        })
    })
})
