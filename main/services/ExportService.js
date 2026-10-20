const fs = require('fs')
const path = require('path')
const electron = require('electron')
const dialog = electron?.dialog || electron?.remote?.dialog
const BrowserWindow = electron?.BrowserWindow || electron?.remote?.BrowserWindow

let _archiver = null
async function getArchiver() {
    if (!_archiver) {
        const mod = await import('archiver')
        _archiver = mod.default || mod
    }
    return _archiver
}
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    PageBreak,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
} = require('docx')
const { resolveProjectDir } = require('../../Utils/fsSecurity')

class ExportService {
    /**
     * Exports the entire project folder to a .zip archive.
     *
     * @param {object} payload
     * @param {string} payload.projectPath
     * @param {boolean} [payload.includeImages=true]
     * @param {string} [payload.defaultName='Projekt_Gry']
     * @returns {Promise<{success: boolean, canceled?: boolean, filePath?: string, error?: string}>}
     */
    static async exportProjectZip({
        projectPath,
        includeImages = true,
        defaultName = 'Projekt_Gry',
    }) {
        try {
            const projectDir = resolveProjectDir(projectPath)
            if (!projectDir || !fs.existsSync(projectDir)) {
                return { success: false, error: 'Nie znaleziono katalogu projektu' }
            }

            const cleanName = defaultName.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_')
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Eksportuj projekt do archiwum ZIP',
                defaultPath: `${cleanName}_backup.zip`,
                filters: [{ name: 'Archiwum ZIP', extensions: ['zip'] }],
            })

            if (canceled || !filePath) {
                return { success: false, canceled: true }
            }

            const archiverFn = await getArchiver()

            return await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(filePath)
                const archive = archiverFn('zip', {
                    zlib: { level: 9 },
                })

                output.on('close', () => {
                    resolve({ success: true, filePath, bytes: archive.pointer() })
                })

                archive.on('error', err => {
                    reject(err)
                })

                archive.pipe(output)

                // Archive project files and standard entity folders
                const entityFolders = [
                    'Paragraphs',
                    'NPC',
                    'Items',
                    'Locations',
                    'Templates',
                    'CharacterClasses',
                    'Rules',
                    'PlayerCharacter',
                ]

                // Include project.json
                const projectJson = path.join(projectDir, 'project.json')
                if (fs.existsSync(projectJson)) {
                    archive.file(projectJson, { name: 'project.json' })
                }

                // Include entity folders
                for (const folder of entityFolders) {
                    const fullFolder = path.join(projectDir, folder)
                    if (fs.existsSync(fullFolder)) {
                        archive.directory(fullFolder, folder)
                    }
                }

                // Include assets if requested
                if (includeImages) {
                    const assetsDir = path.join(projectDir, 'Assets')
                    if (fs.existsSync(assetsDir)) {
                        archive.directory(assetsDir, 'Assets')
                    }
                }

                archive.finalize()
            })
        } catch (error) {
            return { success: false, error: error.message || String(error) }
        }
    }

    /**
     * Extracts a clean, single font family name suitable for WordprocessingML.
     * Strips CSS font fallback lists (e.g. 'Georgia, "Times New Roman", serif' -> 'Georgia')
     * and surrounding quotes so Word recognizes the font directly.
     *
     * @param {string} [fontFamily]
     * @param {string} [fallback='Georgia']
     * @returns {string}
     */
    static extractDocxFontName(fontFamily, fallback = 'Georgia') {
        if (!fontFamily || typeof fontFamily !== 'string') return fallback
        const first = fontFamily.split(',')[0].trim()
        return first.replace(/^["']|["']$/g, '') || fallback
    }

    /**
     * Builds standardized Microsoft Word Styles configuration for DOCX export.
     * Maps typography and layout tokens to native Word paragraph and character styles
     * so that modifications made in Word apply consistently document-wide.
     *
     * @param {object} [styleConfig={}]
     * @returns {object} docx Document styles configuration
     */
    static buildDocxStyles(styleConfig = {}) {
        const primaryFont = ExportService.extractDocxFontName(styleConfig.fontFamily, 'Georgia')
        const headerFont = ExportService.extractDocxFontName(
            styleConfig.headerFontFamily,
            primaryFont
        )
        const baseSizeHalfPt = (styleConfig.fontSize || 10) * 2
        const headerSizeHalfPt = (styleConfig.headerFontSize || 14) * 2
        const textColor = styleConfig.textColor ? styleConfig.textColor.replace('#', '') : '1a1a1a'
        const accentColor = styleConfig.accentColor
            ? styleConfig.accentColor.replace('#', '')
            : '8b1e1e'
        const isJustified = styleConfig.textAlign === 'justify'
        const lineSpacing = Math.round((styleConfig.lineHeight || 1.4) * 240)
        const isChoiceBold = styleConfig.choiceStyle === 'bold'

        return {
            default: {
                document: {
                    run: {
                        font: primaryFont,
                        size: baseSizeHalfPt,
                        color: textColor,
                    },
                    paragraph: {
                        spacing: {
                            line: lineSpacing,
                            after: 120,
                        },
                        alignment: isJustified ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
                    },
                },
                heading1: {
                    run: {
                        font: headerFont,
                        size: headerSizeHalfPt + 4,
                        bold: true,
                        color: accentColor,
                    },
                    paragraph: {
                        spacing: { before: 360, after: 180 },
                        keepWithNext: true,
                    },
                },
                heading2: {
                    run: {
                        font: headerFont,
                        size: headerSizeHalfPt,
                        bold: true,
                        color: accentColor,
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 },
                        keepWithNext: true,
                    },
                },
                heading3: {
                    run: {
                        font: headerFont,
                        size: headerSizeHalfPt - 2,
                        bold: true,
                        color: accentColor,
                    },
                    paragraph: {
                        spacing: { before: 200, after: 100 },
                        keepWithNext: true,
                    },
                },
            },
            paragraphStyles: [
                {
                    id: 'GamebookParagraph',
                    name: 'Paragraf Gry',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        font: primaryFont,
                        size: baseSizeHalfPt,
                        color: textColor,
                    },
                    paragraph: {
                        spacing: {
                            line: lineSpacing,
                            after: 120,
                        },
                        alignment: isJustified ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
                    },
                },
                {
                    id: 'GamebookParagraphHeader',
                    name: 'Numer Paragrafu (§)',
                    basedOn: 'Heading 2',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        font: headerFont,
                        size: headerSizeHalfPt,
                        bold: true,
                        color: accentColor,
                    },
                    paragraph: {
                        spacing: { before: 300, after: 120 },
                        keepWithNext: true,
                    },
                },
                {
                    id: 'GamebookChoice',
                    name: 'Wybór Paragrafu',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        font: primaryFont,
                        size: baseSizeHalfPt,
                        italics: !isChoiceBold,
                        bold: isChoiceBold,
                    },
                    paragraph: {
                        indent: { left: 400 },
                        spacing: { after: 80 },
                    },
                },
                {
                    id: 'GamebookDialogue',
                    name: 'Kwestia Dialogowa',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        italics: true,
                    },
                    paragraph: {
                        indent: { left: 400 },
                        spacing: { after: 100 },
                    },
                },
                {
                    id: 'GamebookQuote',
                    name: 'Cytat',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        italics: true,
                    },
                    paragraph: {
                        indent: { left: 500 },
                        spacing: { before: 100, after: 120 },
                    },
                },
                {
                    id: 'GamebookSectionTitle',
                    name: 'Tytuł Sekcji Książki',
                    basedOn: 'Heading 1',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        font: headerFont,
                        size: headerSizeHalfPt + 4,
                        bold: true,
                        color: accentColor,
                    },
                    paragraph: {
                        spacing: { before: 400, after: 200 },
                        keepWithNext: true,
                    },
                },
                {
                    id: 'GamebookEntityItem',
                    name: 'Wpis Encyklopedii',
                    basedOn: 'Normal',
                    next: 'GamebookEntityItem',
                    quickFormat: true,
                    paragraph: {
                        spacing: { after: 140 },
                    },
                },
                {
                    id: 'GamebookList',
                    name: 'Lista Paragrafowa',
                    basedOn: 'Normal',
                    next: 'GamebookList',
                    quickFormat: true,
                    paragraph: {
                        indent: { left: 400 },
                        spacing: { after: 80 },
                    },
                },
                {
                    id: 'GamebookCombatHeader',
                    name: 'Nagłówek Starcia',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        font: headerFont,
                        size: headerSizeHalfPt - 2,
                        bold: true,
                        color: accentColor,
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 },
                        keepWithNext: true,
                    },
                },
                {
                    id: 'GamebookCombatOutcome',
                    name: 'Wynik Walki',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    paragraph: {
                        indent: { left: 400 },
                        spacing: { after: 60 },
                    },
                },
                {
                    id: 'GamebookSeparator',
                    name: 'Separator Paragrafów',
                    basedOn: 'Normal',
                    next: 'GamebookParagraph',
                    quickFormat: true,
                    run: {
                        color: '777777',
                        size: 18,
                    },
                    paragraph: {
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 180, after: 240 },
                    },
                },
            ],
            characterStyles: [
                {
                    id: 'GamebookLocationLink',
                    name: 'Odnośnik: Lokacja',
                    basedOn: 'Default Paragraph Font',
                    quickFormat: true,
                    run: {
                        bold: true,
                        color: '8A5314',
                    },
                },
                {
                    id: 'GamebookCharacterLink',
                    name: 'Odnośnik: Postać',
                    basedOn: 'Default Paragraph Font',
                    quickFormat: true,
                    run: {
                        bold: true,
                        color: '1A5675',
                    },
                },
                {
                    id: 'GamebookItemLink',
                    name: 'Odnośnik: Przedmiot',
                    basedOn: 'Default Paragraph Font',
                    quickFormat: true,
                    run: {
                        bold: true,
                        color: '7B2929',
                    },
                },
                {
                    id: 'GamebookTagLink',
                    name: 'Odnośnik: Cecha',
                    basedOn: 'Default Paragraph Font',
                    quickFormat: true,
                    run: {
                        bold: true,
                        color: '555555',
                    },
                },
                {
                    id: 'GamebookChoiceLink',
                    name: 'Odnośnik: Wybór',
                    basedOn: 'Default Paragraph Font',
                    quickFormat: true,
                    run: {
                        bold: true,
                        italics: true,
                        color: accentColor,
                    },
                },
                {
                    id: 'GamebookCode',
                    name: 'Kod źródłowy',
                    basedOn: 'Default Paragraph Font',
                    quickFormat: true,
                    run: {
                        font: 'Consolas',
                        color: '222222',
                    },
                },
            ],
        }
    }

    /**
     * Exports formatted gamebook to a native Microsoft Word (.docx) document.
     *
     * @param {object} payload
     * @param {string} payload.defaultName
     * @param {object} payload.bookData - Compiled book model
     * @param {object} payload.styleConfig - Typography and layout settings
     * @param {string} [payload.projectPath] - Absolute path to project folder
     * @returns {Promise<{success: boolean, canceled?: boolean, filePath?: string, error?: string}>}
     */
    static async exportProjectDocx({
        defaultName = 'Gra_Paragrafowa',
        bookData,
        styleConfig = {},
        projectPath,
    }) {
        try {
            const cleanName = defaultName.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_')
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Eksportuj książkę do dokumentu Word (.docx)',
                defaultPath: `${cleanName}.docx`,
                filters: [{ name: 'Dokument programu Word', extensions: ['docx'] }],
            })

            if (canceled || !filePath) {
                return { success: false, canceled: true }
            }

            const docChildren = []
            const title = bookData.title || defaultName
            const author = bookData.author || 'Autor'

            // 1. Cover / Title Page
            if (bookData.includeCoverPage !== false) {
                docChildren.push(
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 2400, after: 400 },
                    }),
                    new Paragraph({
                        text: `Autor: ${author}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        text: `Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 2400 },
                    }),
                    new Paragraph({
                        children: [new PageBreak()],
                    })
                )
            }

            // 2. Rules / Introduction
            if (bookData.rulesContent) {
                docChildren.push(
                    new Paragraph({
                        text: 'Zasady Gry i Wprowadzenie',
                        style: 'GamebookSectionTitle',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    ...parseMarkdownToDocxParagraphs(
                        bookData.rulesContent,
                        styleConfig,
                        bookData.paragraphMap || {}
                    ),
                    new Paragraph({
                        children: [new PageBreak()],
                    })
                )
            }

            // 3. Optional Character Sheet(s)
            const sheets =
                bookData.characterSheets && bookData.characterSheets.length > 0
                    ? bookData.characterSheets
                    : bookData.characterSheet
                      ? [bookData.characterSheet]
                      : []
            if (sheets.length > 0) {
                docChildren.push(...renderDocxCharacterSheets(sheets, styleConfig))
            }

            // 4. Early content: Locations / NPCs / Glossary if configured for start
            if (bookData.startSections && bookData.startSections.length > 0) {
                docChildren.push(
                    ...renderDocxEntitySections(
                        bookData.startSections,
                        styleConfig,
                        bookData,
                        projectPath
                    )
                )
            }

            // 5. Main Paragraphs
            const separatorType = styleConfig.separatorType || 'ornament'
            const separatorText = styleConfig.customSeparator || '❖ ❖ ❖'

            for (let i = 0; i < (bookData.paragraphs || []).length; i++) {
                const p = bookData.paragraphs[i]
                const pNum = p.displayNumber || i + 1

                // Paragraph Header
                docChildren.push(
                    new Paragraph({
                        text: `§ ${pNum}`,
                        style: 'GamebookParagraphHeader',
                        heading: HeadingLevel.HEADING_2,
                    })
                )

                // Paragraph Text Content: strictly use markdown narrative (or fallback to disk)
                let cleanText = (p.text || '').trim()
                if (!cleanText && p.filePath && projectPath) {
                    try {
                        const fullPath = path.resolve(projectPath, p.filePath)
                        if (fs.existsSync(fullPath)) {
                            cleanText = fs.readFileSync(fullPath, 'utf8')
                        }
                    } catch (e) {
                        // ignore read error
                    }
                }

                const mdParagraphs = parseMarkdownToDocxParagraphs(
                    cleanText,
                    styleConfig,
                    bookData.paragraphMap || {}
                )
                docChildren.push(...mdParagraphs)

                // Paragraph Choices
                if (p.choices && p.choices.length > 0) {
                    const choicePrefix = styleConfig.choicePrefix || '→ '
                    for (const ch of p.choices) {
                        let prefixTags = ''
                        if (ch.conditionSummary) {
                            prefixTags += `[Jeżeli: ${ch.conditionSummary}] `
                        }
                        if (ch.costs && ch.costs.length > 0) {
                            const costsStr = ch.costs
                                .map(c => `${c.value || 1} ${c.name}`)
                                .join(', ')
                            prefixTags += `[Tracisz: ${costsStr}] `
                        }
                        if (ch.rewards && ch.rewards.length > 0) {
                            const rewardsStr = ch.rewards
                                .map(r => `${r.value || 1} ${r.name}`)
                                .join(', ')
                            prefixTags += `[Zyskujesz: ${rewardsStr}] `
                        }

                        if (
                            ch.diceCheck &&
                            Array.isArray(ch.diceCheck.branches) &&
                            ch.diceCheck.branches.length > 0
                        ) {
                            const dc = ch.diceCheck
                            const statPart = dc.stat ? ` + ${dc.stat}` : ''
                            const descPart = dc.description ? ` (${dc.description})` : ''
                            docChildren.push(
                                new Paragraph({
                                    style: 'GamebookChoice',
                                    children: [
                                        new TextRun({
                                            text: `${choicePrefix}${prefixTags}${ch.text}`,
                                            bold: true,
                                        }),
                                    ],
                                })
                            )
                            docChildren.push(
                                new Paragraph({
                                    style: 'GamebookChoice',
                                    indent: { left: 360 },
                                    children: [
                                        new TextRun({
                                            text: `Rzuć kośćmi (${dc.dice}${statPart})${descPart}:`,
                                            italics: true,
                                        }),
                                    ],
                                })
                            )
                            for (const b of dc.branches) {
                                const bTarget = b.targetNumber
                                    ? `idź do ${b.targetNumber}`
                                    : 'pozostań'
                                const bDesc = b.description ? ` — ${b.description}` : ''
                                docChildren.push(
                                    new Paragraph({
                                        style: 'GamebookList',
                                        indent: { left: 720 },
                                        children: [
                                            new TextRun({
                                                text: `• Wynik ${b.min}–${b.max}: ${bTarget}${bDesc}`,
                                            }),
                                        ],
                                    })
                                )
                            }
                        } else {
                            const targetText = ch.targetNumber ? ` (Idź do ${ch.targetNumber})` : ''
                            docChildren.push(
                                new Paragraph({
                                    style: 'GamebookChoice',
                                    children: [
                                        new TextRun({
                                            text: `${choicePrefix}${prefixTags}${ch.text}${targetText}`,
                                        }),
                                    ],
                                })
                            )
                        }
                    }
                }

                // Paragraph Separator
                if (i < bookData.paragraphs.length - 1) {
                    if (separatorType === 'page-break') {
                        docChildren.push(new Paragraph({ children: [new PageBreak()] }))
                    } else if (separatorType === 'line') {
                        docChildren.push(
                            new Paragraph({
                                style: 'GamebookSeparator',
                                border: {
                                    bottom: {
                                        color: 'CCCCCC',
                                        space: 1,
                                        style: BorderStyle.SINGLE,
                                        size: 6,
                                    },
                                },
                            })
                        )
                    } else if (separatorType === 'ornament') {
                        docChildren.push(
                            new Paragraph({
                                style: 'GamebookSeparator',
                                children: [
                                    new TextRun({
                                        text: separatorText,
                                    }),
                                ],
                            })
                        )
                    } else {
                        // space separator
                        docChildren.push(
                            new Paragraph({
                                style: 'GamebookSeparator',
                                spacing: { before: 200, after: 200 },
                            })
                        )
                    }
                }
            }

            // 6. End Sections: Locations / NPCs / Glossary configured for end
            if (bookData.endSections && bookData.endSections.length > 0) {
                docChildren.push(
                    ...renderDocxEntitySections(
                        bookData.endSections,
                        styleConfig,
                        bookData,
                        projectPath
                    )
                )
            }

            const doc = new Document({
                styles: ExportService.buildDocxStyles(styleConfig),
                sections: [
                    {
                        properties: {
                            page: {
                                size: {
                                    orientation:
                                        styleConfig.pageOrientation === 'landscape'
                                            ? 'landscape'
                                            : 'portrait',
                                },
                                margin: {
                                    top: (styleConfig.margins?.top || 15) * 56.7,
                                    bottom: (styleConfig.margins?.bottom || 15) * 56.7,
                                    left: (styleConfig.margins?.left || 18) * 56.7,
                                    right: (styleConfig.margins?.right || 15) * 56.7,
                                },
                            },
                        },
                        children: docChildren,
                    },
                ],
            })

            const buffer = await Packer.toBuffer(doc)
            fs.writeFileSync(filePath, buffer)

            return { success: true, filePath, bytes: buffer.length }
        } catch (error) {
            return { success: false, error: error.message || String(error) }
        }
    }

    /**
     * Exports formatted gamebook to a print-ready PDF using Electron's native printToPDF.
     *
     * @param {object} payload
     * @param {string} payload.defaultName
     * @param {string} payload.htmlContent - Full HTML document with styled print layout
     * @param {object} payload.styleConfig - Page dimensions and print parameters
     * @returns {Promise<{success: boolean, canceled?: boolean, filePath?: string, error?: string}>}
     */
    static async exportProjectPdf({
        defaultName = 'Gra_Paragrafowa',
        htmlContent,
        styleConfig = {},
    }) {
        let printWin = null
        try {
            const cleanName = defaultName.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_')
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Eksportuj książkę do pliku PDF',
                defaultPath: `${cleanName}.pdf`,
                filters: [{ name: 'Dokument PDF', extensions: ['pdf'] }],
            })

            if (canceled || !filePath) {
                return { success: false, canceled: true }
            }

            printWin = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                },
            })

            const base64Html = Buffer.from(htmlContent, 'utf-8').toString('base64')
            await printWin.loadURL(`data:text/html;charset=utf-8;base64,${base64Html}`)

            // Wait brief moment for rendering and fonts
            await new Promise(r => setTimeout(r, 600))

            const pageSize =
                styleConfig.pageFormat === 'A4'
                    ? 'A4'
                    : styleConfig.pageFormat === 'B5'
                      ? 'B5'
                      : 'A5'
            const isLandscape = styleConfig.pageOrientation === 'landscape'

            const pdfBuffer = await printWin.webContents.printToPDF({
                pageSize,
                landscape: isLandscape,
                printBackground: true,
                margins: {
                    marginType: 'none', // Uses CSS @page margins embedded in htmlContent
                },
            })

            fs.writeFileSync(filePath, pdfBuffer)

            return { success: true, filePath, bytes: pdfBuffer.length }
        } catch (error) {
            return { success: false, error: error.message || String(error) }
        } finally {
            if (printWin && !printWin.isDestroyed()) {
                printWin.destroy()
            }
        }
    }
}

/**
 * Renders entity sections (Locations, NPCs, Items, Glossary) with full Markdown descriptions into native docx elements.
 *
 * @param {Array<object>} sections
 * @param {object} styleConfig
 * @param {object} bookData
 * @param {string} [projectPath]
 * @returns {Array<object>} docx Paragraphs and elements
 */
function renderDocxEntitySections(sections, styleConfig, bookData, projectPath) {
    const elements = []
    if (!sections || sections.length === 0) return elements

    for (const section of sections) {
        elements.push(
            new Paragraph({
                text: section.title,
                style: 'GamebookSectionTitle',
                heading: HeadingLevel.HEADING_1,
            })
        )

        for (const item of section.items || []) {
            let descMarkdown = (item.description || '').trim()
            if (!descMarkdown && item.filePath && projectPath) {
                try {
                    const fullPath = path.resolve(projectPath, item.filePath)
                    if (fs.existsSync(fullPath)) {
                        descMarkdown = fs.readFileSync(fullPath, 'utf8').trim()
                    }
                } catch {
                    // ignore disk read errors
                }
            }

            if (section.type === 'glossary') {
                const descRuns = parseInlineMarkdownToRuns(
                    descMarkdown,
                    styleConfig,
                    bookData.paragraphMap || {}
                )
                elements.push(
                    new Paragraph({
                        style: 'GamebookEntityItem',
                        children: [
                            new TextRun({
                                text: item.name,
                                bold: true,
                            }),
                            ...(descRuns.length > 0
                                ? [new TextRun({ text: ' — ' }), ...descRuns]
                                : []),
                        ],
                    })
                )
            } else {
                // Locations, NPCs, Items: header and rich markdown paragraphs
                elements.push(
                    new Paragraph({
                        text: item.name,
                        style: 'GamebookParagraphHeader',
                        heading: HeadingLevel.HEADING_2,
                    })
                )

                if (descMarkdown) {
                    const mdParagraphs = parseMarkdownToDocxParagraphs(
                        descMarkdown,
                        styleConfig,
                        bookData.paragraphMap || {}
                    )
                    elements.push(...mdParagraphs)
                } else {
                    elements.push(
                        new Paragraph({
                            style: 'GamebookParagraph',
                            children: [
                                new TextRun({
                                    text: '(Brak opisu)',
                                    italics: true,
                                    color: '888888',
                                }),
                            ],
                        })
                    )
                }
            }
        }

        elements.push(new Paragraph({ children: [new PageBreak()] }))
    }

    return elements
}

/**
 * Renders structured character sheet(s) into native docx elements.
 * Generates accurate stats, parameters/vitals, skills, inventory, and notes based on the PlayerCharacter model.
 *
 * @param {Array<object>} sheets
 * @param {object} styleConfig
 * @returns {Array<object>} docx elements
 */
function renderDocxCharacterSheets(sheets, styleConfig) {
    const elements = []
    if (!sheets || sheets.length === 0) return elements

    const accentColor = styleConfig.accentColor
        ? styleConfig.accentColor.replace('#', '')
        : '8b1e1e'

    for (const sheet of sheets) {
        elements.push(
            new Paragraph({
                text: `Karta Postaci: ${sheet.name || 'Bohater Gracza'}`,
                style: 'GamebookSectionTitle',
                heading: HeadingLevel.HEADING_1,
            })
        )

        // Basic Info: Name and Class
        elements.push(
            new Paragraph({
                style: 'GamebookParagraph',
                children: [
                    new TextRun({ text: 'Imię bohatera: ', bold: true }),
                    new TextRun({ text: sheet.name || '........................................' }),
                    new TextRun({ text: '    |    Klasa: ', bold: true }),
                    new TextRun({ text: sheet.characterClass || 'Brak' }),
                ],
            })
        )

        // Summary / Narrative backstory
        if (sheet.summary) {
            elements.push(
                new Paragraph({
                    style: 'GamebookQuote',
                    children: [
                        new TextRun({
                            text: stripEmojis(sheet.summary),
                            italics: true,
                        }),
                    ],
                })
            )
        }

        // Parameters / Vitals (Zdrowie, Złoto, Zasoby)
        if (sheet.parameters && sheet.parameters.length > 0) {
            const paramRuns = []
            sheet.parameters.forEach((p, idx) => {
                if (idx > 0) paramRuns.push(new TextRun({ text: '   |   ' }))
                paramRuns.push(new TextRun({ text: `${p.name}: `, bold: true }))
                const cur =
                    p.currentValue !== undefined && p.currentValue !== ''
                        ? p.currentValue
                        : p.value || '........'
                const max = p.maxValue !== undefined && p.maxValue !== '' ? ` / ${p.maxValue}` : ''
                paramRuns.push(new TextRun({ text: `[ ${cur}${max} ]` }))
            })
            elements.push(
                new Paragraph({
                    style: 'GamebookParagraph',
                    children: paramRuns,
                })
            )
        } else {
            elements.push(
                new Paragraph({
                    style: 'GamebookParagraph',
                    text: 'Zdrowie: [ ........ / ........ ]   |   Punkty Akcji: [ ........ ]   |   Złoto: [ ........ ]',
                })
            )
        }

        // Stats (Cechy główne)
        if (sheet.stats && sheet.stats.length > 0) {
            elements.push(
                new Paragraph({
                    style: 'GamebookParagraph',
                    children: [
                        new TextRun({
                            text: 'Cechy i Statystyki:',
                            bold: true,
                            color: accentColor,
                        }),
                    ],
                    spacing: { before: 160, after: 80 },
                })
            )

            const tableRows = []
            for (let i = 0; i < sheet.stats.length; i += 2) {
                const s1 = sheet.stats[i]
                const s2 = sheet.stats[i + 1]

                const cells = [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `${s1.name}: `, bold: true }),
                                    new TextRun({ text: String(s1.value ?? '') }),
                                ],
                            }),
                        ],
                        width: { size: s2 ? 50 : 100, type: WidthType.PERCENTAGE },
                    }),
                ]

                if (s2) {
                    cells.push(
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `${s2.name}: `, bold: true }),
                                        new TextRun({ text: String(s2.value ?? '') }),
                                    ],
                                }),
                            ],
                            width: { size: 50, type: WidthType.PERCENTAGE },
                        })
                    )
                }

                tableRows.push(new TableRow({ children: cells }))
            }

            elements.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                })
            )
        }

        // Skills (Umiejętności)
        if (sheet.skills && sheet.skills.length > 0) {
            elements.push(
                new Paragraph({
                    style: 'GamebookParagraph',
                    children: [
                        new TextRun({
                            text: 'Umiejętności:',
                            bold: true,
                            color: accentColor,
                        }),
                    ],
                    spacing: { before: 160, after: 60 },
                })
            )
            for (const sk of sheet.skills) {
                const valStr = sk.value ? ` (${sk.value})` : ''
                elements.push(
                    new Paragraph({
                        style: 'GamebookList',
                        children: [new TextRun({ text: `• ${sk.name}${valStr}` })],
                    })
                )
            }
        }

        // Features (Cechy specjalne i atuty)
        if (sheet.features && sheet.features.length > 0) {
            elements.push(
                new Paragraph({
                    style: 'GamebookParagraph',
                    children: [
                        new TextRun({
                            text: 'Zdolności i Atuty:',
                            bold: true,
                            color: accentColor,
                        }),
                    ],
                    spacing: { before: 160, after: 60 },
                })
            )
            for (const f of sheet.features) {
                const descStr = f.description ? `: ${f.description}` : ''
                elements.push(
                    new Paragraph({
                        style: 'GamebookList',
                        children: [
                            new TextRun({ text: `• ${f.name}`, bold: true }),
                            new TextRun({ text: descStr }),
                        ],
                    })
                )
            }
        }

        // Inventory / Equipment
        const inventories =
            sheet.inventories && sheet.inventories.length > 0 ? sheet.inventories : null
        if (inventories) {
            for (const inv of inventories) {
                const capText =
                    inv.capacity > 0
                        ? ` (Pojemność: ${inv.capacity} miejsc)`
                        : ' (Pojemność: bez limitu)'
                elements.push(
                    new Paragraph({
                        style: 'GamebookParagraph',
                        children: [
                            new TextRun({
                                text: `${inv.name || 'Ekwipunek'}${capText}:`,
                                bold: true,
                                color: accentColor,
                            }),
                        ],
                        spacing: { before: 160, after: 60 },
                    })
                )

                const invItems = inv.items || []
                const numLines = inv.capacity > 0 ? inv.capacity : Math.max(5, invItems.length + 3)
                for (let i = 0; i < numLines; i++) {
                    const itemText = invItems[i]
                        ? `${i + 1}. ${invItems[i].name}`
                        : `${i + 1}. ............................................................................................`
                    elements.push(
                        new Paragraph({
                            style: 'GamebookList',
                            children: [new TextRun({ text: itemText })],
                        })
                    )
                }
            }
        } else {
            elements.push(
                new Paragraph({
                    style: 'GamebookParagraph',
                    children: [
                        new TextRun({
                            text: 'Ekwipunek i Wyposażenie:',
                            bold: true,
                            color: accentColor,
                        }),
                    ],
                    spacing: { before: 160, after: 60 },
                })
            )

            const startItems = sheet.items || []
            const totalLines = Math.max(6, startItems.length + 3)
            for (let i = 0; i < totalLines; i++) {
                const itemText = startItems[i]
                    ? `${i + 1}. ${startItems[i].name}`
                    : `${i + 1}. ............................................................................................`
                elements.push(
                    new Paragraph({
                        style: 'GamebookList',
                        children: [new TextRun({ text: itemText })],
                    })
                )
            }
        }

        elements.push(new Paragraph({ children: [new PageBreak()] }))
    }

    return elements
}

/**
 * Strips emoji characters from text to ensure clean literary book typography.
 *
 * @param {string} text
 * @returns {string}
 */
function stripEmojis(text) {
    if (!text) return ''
    return String(text)
        .replace(
            /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
            ''
        )
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

/**
 * Parses raw combat markdown block into structured fields (opponents, headers, outcomes).
 *
 * @param {string} combatText
 * @param {object|Map} [paragraphMap={}]
 * @returns {object}
 */
function parseCombatBlock(combatText, paragraphMap = {}) {
    const raw = stripEmojis(combatText || '')
    const titleMatch = raw.match(/###\s*(?:Starcie:\s*)?([^\n\r]+)/i)
    const title = stripEmojis(titleMatch ? titleMatch[1].trim() : 'Starcie')

    // Extract table lines
    const lines = raw.split(/\r?\n/)
    const tableLines = lines.filter(l => {
        const t = l.trim()
        return t.startsWith('|') && t.endsWith('|')
    })

    let headers = []
    const rows = []

    if (tableLines.length >= 2) {
        headers = tableLines[0]
            .split('|')
            .map(c => stripEmojis(c.trim()))
            .filter((c, i, a) => i > 0 && i < a.length - 1)

        // Ignore separator row (index 1)
        for (let i = 2; i < tableLines.length; i++) {
            const cells = tableLines[i]
                .split('|')
                .map(c => stripEmojis(c.trim()))
                .filter((c, idx, a) => idx > 0 && idx < a.length - 1)
            if (cells.length > 0) {
                rows.push(cells)
            }
        }
    }

    // Extract outcomes
    const outcomes = []
    const outcomeRegex = /-\s*\*\*([^*]+)\*\*\s*→\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.*))/g
    let match
    while ((match = outcomeRegex.exec(raw)) !== null) {
        const name = stripEmojis(match[1].trim())
        const linkText = stripEmojis((match[2] || match[4] || '').trim())
        const targetUrl = (match[3] || '').trim()

        let targetNumber = null
        if (targetUrl) {
            const pMatch = targetUrl.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
            if (pMatch) {
                const targetId = pMatch[1]
                targetNumber =
                    paragraphMap[targetId] ||
                    (typeof paragraphMap.get === 'function' ? paragraphMap.get(targetId) : null)
            }
        }
        if (!targetNumber) {
            const numMatch = linkText.match(/§\s*(\d+)/) || linkText.match(/(\d+)/)
            if (numMatch) {
                targetNumber = parseInt(numMatch[1], 10)
            }
        }

        let cleanTarget = linkText
            .replace(/entity:\/\/[^)]+/g, '')
            .replace(/[()[\]]/g, '')
            .trim()

        if (targetNumber) {
            cleanTarget = `Przejdź do § ${targetNumber}`
        }

        outcomes.push({
            name,
            targetNumber,
            targetText:
                cleanTarget || (targetNumber ? `Przejdź do § ${targetNumber}` : 'Koniec starcia'),
        })
    }

    return {
        title,
        headers,
        rows,
        outcomes,
        hasOpponents: rows.length > 0,
        raw,
    }
}

/**
 * Splits text into docx TextRuns, resolving entity links, paragraph references, and styling without emojis.
 * Omits hardcoded run font/size overrides so that runs inherit from active Word paragraph/character styles.
 */
function parseInlineMarkdownToRuns(text, options = {}, paragraphMap = {}) {
    if (!text) return []
    const runs = []
    const accentColor = options.accentColor ? options.accentColor.replace('#', '') : '8b1e1e'

    const tokenRegex =
        /(\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|[^[*`]+)/g
    let match

    while ((match = tokenRegex.exec(text)) !== null) {
        const part = match[0]
        if (!part) continue

        // Check if markdown link [label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
            const rawLabel = stripEmojis(linkMatch[1].trim())
            const rawUrl = linkMatch[2].trim()

            // 1. Paragraph link: entity://paragraph/targetId
            const pMatch = rawUrl.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
            if (pMatch) {
                const targetId = pMatch[1]
                const targetNum =
                    paragraphMap[targetId] ||
                    (typeof paragraphMap.get === 'function' ? paragraphMap.get(targetId) : null)

                let displayText = rawLabel
                if (targetNum) {
                    if (/^§?\s*\d+/.test(rawLabel)) {
                        const clean = rawLabel.replace(/^§?\s*\d+\s*:?\s*/, '').trim()
                        displayText = clean ? `§ ${targetNum} (${clean})` : `§ ${targetNum}`
                    } else {
                        displayText = `${rawLabel} (→ § ${targetNum})`
                    }
                }
                runs.push(
                    new TextRun({
                        text: displayText,
                        style: 'GamebookChoiceLink',
                        bold: true,
                        italics: true,
                        color: accentColor,
                    })
                )
                continue
            }

            // 2. Entity link: entity://(location|character|npc|item|tag|trait)/id
            const eMatch = rawUrl.match(
                /^entity:\/\/(location|character|npc|item|tag|trait)\/([^/?#]+)$/
            )
            if (eMatch) {
                const type =
                    eMatch[1] === 'npc' ? 'character' : eMatch[1] === 'trait' ? 'tag' : eMatch[1]
                const cleanLabel = rawLabel.replace(/^Opis:\s*/i, '').trim()
                let col = '8A5314'
                let charStyle = 'GamebookLocationLink'
                if (type === 'character') {
                    col = '1A5675'
                    charStyle = 'GamebookCharacterLink'
                } else if (type === 'item') {
                    col = '7B2929'
                    charStyle = 'GamebookItemLink'
                } else if (type === 'tag') {
                    col = '555555'
                    charStyle = 'GamebookTagLink'
                }
                runs.push(
                    new TextRun({
                        text: cleanLabel,
                        style: charStyle,
                        bold: true,
                        color: col,
                    })
                )
                continue
            }

            // 3. Embed link: embed://(location|character|npc|item)/id...
            const embedMatch = rawUrl.match(/^embed:\/\/(location|character|npc|item)\/([^/?#]+)/)
            if (embedMatch) {
                const type = embedMatch[1] === 'npc' ? 'character' : embedMatch[1]
                const cleanLabel = rawLabel.replace(/^Opis:\s*/i, '').trim()
                let col = '8A5314'
                let charStyle = 'GamebookLocationLink'
                if (type === 'character') {
                    col = '1A5675'
                    charStyle = 'GamebookCharacterLink'
                } else if (type === 'item') {
                    col = '7B2929'
                    charStyle = 'GamebookItemLink'
                }
                runs.push(
                    new TextRun({
                        text: cleanLabel,
                        style: charStyle,
                        bold: true,
                        color: col,
                    })
                )
                continue
            }

            // 4. Standard external link: print label cleanly in accent color
            runs.push(
                new TextRun({
                    text: rawLabel,
                    italics: true,
                    color: accentColor,
                })
            )
            continue
        }

        // Bold & Italic
        if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
            runs.push(
                new TextRun({
                    text: stripEmojis(part.slice(3, -3)),
                    bold: true,
                    italics: true,
                })
            )
            continue
        }

        // Bold
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            runs.push(
                new TextRun({
                    text: stripEmojis(part.slice(2, -2)),
                    bold: true,
                })
            )
            continue
        }

        // Italic
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            runs.push(
                new TextRun({
                    text: stripEmojis(part.slice(1, -1)),
                    italics: true,
                })
            )
            continue
        }

        // Inline Code
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            runs.push(
                new TextRun({
                    text: stripEmojis(part.slice(1, -1)),
                    style: 'GamebookCode',
                    font: 'Consolas',
                })
            )
            continue
        }

        // Plain Text - strip any legacy macros like {{embed:...}} and emojis
        const cleanPlain = stripEmojis(
            part.replace(/\{\{embed:[^}]+\}\}/g, '').replace(/<[^>]+>/g, '')
        )
        if (cleanPlain) {
            runs.push(
                new TextRun({
                    text: cleanPlain,
                })
            )
        }
    }

    if (runs.length === 0) {
        runs.push(
            new TextRun({
                text: stripEmojis(text.replace(/<[^>]+>/g, '')),
            })
        )
    }

    return runs
}

/**
 * Converts a Markdown block into docx elements (Paragraphs and native Tables).
 * Associates appropriate native Word styles to every paragraph block.
 */
function parseMarkdownToDocxParagraphs(mdText, styleConfig = {}, paragraphMap = {}) {
    const docxElements = []
    if (!mdText) return docxElements

    const accentColor = styleConfig.accentColor
        ? styleConfig.accentColor.replace('#', '')
        : '8b1e1e'

    // Clean TipTap dialog tags
    let text = mdText.replace(/<p\s+class="gamebook-dialog"[^>]*>([\s\S]*?)<\/p>/gi, '\n\n— $1\n\n')

    // Extract combat blocks: <!-- COMBAT_START --> ... <!-- COMBAT_END -->
    const combatRegex =
        /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})([\s\S]*?)(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/gi
    const combatDataList = []

    text = text.replace(combatRegex, (_match, combatContent) => {
        const cData = parseCombatBlock(combatContent, paragraphMap)
        const idx = combatDataList.length
        combatDataList.push(cData)
        return `\n\n___DOCX_COMBAT_${idx}___\n\n`
    })

    const blocks = text.replace(/\r\n/g, '\n').split('\n\n')

    for (const block of blocks) {
        const trimmedBlock = block.trim()
        if (!trimmedBlock) continue

        // Check if combat block placeholder
        const cMatch = trimmedBlock.match(/^___DOCX_COMBAT_(\d+)___$/)
        if (cMatch) {
            const idx = parseInt(cMatch[1], 10)
            const cData = combatDataList[idx]
            if (cData) {
                // Combat Header Banner without emoji
                docxElements.push(
                    new Paragraph({
                        style: 'GamebookCombatHeader',
                        children: [
                            new TextRun({
                                text: `STARCIE: ${cData.title.toUpperCase()}`,
                            }),
                        ],
                    })
                )

                // Opponents Table
                if (cData.hasOpponents) {
                    const tableRows = []

                    // Header row
                    tableRows.push(
                        new TableRow({
                            children: cData.headers.map(
                                (h, cIdx) =>
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: h,
                                                        bold: true,
                                                    }),
                                                ],
                                                alignment:
                                                    cIdx === 0
                                                        ? AlignmentType.LEFT
                                                        : AlignmentType.CENTER,
                                            }),
                                        ],
                                        shading: { fill: 'F4F2ED' },
                                    })
                            ),
                        })
                    )

                    // Data rows
                    for (const r of cData.rows) {
                        tableRows.push(
                            new TableRow({
                                children: r.map(
                                    (cellVal, cIdx) =>
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: cellVal,
                                                            bold: cIdx === 0,
                                                            font:
                                                                cIdx === 0 ? undefined : 'Consolas',
                                                        }),
                                                    ],
                                                    alignment:
                                                        cIdx === 0
                                                            ? AlignmentType.LEFT
                                                            : AlignmentType.CENTER,
                                                }),
                                            ],
                                        })
                                ),
                            })
                        )
                    }

                    docxElements.push(
                        new Table({
                            rows: tableRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        })
                    )
                }

                // Outcomes list
                if (cData.outcomes && cData.outcomes.length > 0) {
                    docxElements.push(
                        new Paragraph({
                            style: 'GamebookParagraph',
                            children: [
                                new TextRun({
                                    text: 'Możliwe wyniki starcia:',
                                    bold: true,
                                    color: '555555',
                                }),
                            ],
                            spacing: { before: 140, after: 60 },
                        })
                    )

                    for (const o of cData.outcomes) {
                        docxElements.push(
                            new Paragraph({
                                style: 'GamebookCombatOutcome',
                                children: [
                                    new TextRun({
                                        text: `→ ${o.name}: `,
                                        bold: true,
                                    }),
                                    new TextRun({
                                        text: o.targetText,
                                        style: 'GamebookChoiceLink',
                                        bold: true,
                                        italics: true,
                                        color: accentColor,
                                    }),
                                ],
                            })
                        )
                    }
                }

                // Plain content fallback
                if (!cData.hasOpponents && (!cData.outcomes || cData.outcomes.length === 0)) {
                    const cleanPlain = cData.raw
                        .replace(/###\s*[^\n\r]+/g, '')
                        .replace(/---/g, '')
                        .trim()
                    if (cleanPlain) {
                        docxElements.push(
                            new Paragraph({
                                style: 'GamebookParagraph',
                                children: parseInlineMarkdownToRuns(
                                    cleanPlain,
                                    styleConfig,
                                    paragraphMap
                                ),
                            })
                        )
                    }
                }
            }
            continue
        }

        // Dialogue line (— or –)
        if (/^[—–]\s+/.test(trimmedBlock)) {
            const dRuns = parseInlineMarkdownToRuns(trimmedBlock, styleConfig, paragraphMap)
            for (const r of dRuns) {
                r.italics = true
            }
            docxElements.push(
                new Paragraph({
                    style: 'GamebookDialogue',
                    children: dRuns,
                })
            )
            continue
        }

        // Blockquote (> text)
        if (trimmedBlock.startsWith('>')) {
            const quoteContent = trimmedBlock
                .split('\n')
                .map(l => l.replace(/^>\s?/, ''))
                .join(' ')
            const quoteRuns = parseInlineMarkdownToRuns(quoteContent, styleConfig, paragraphMap)
            for (const r of quoteRuns) {
                r.italics = true
            }
            docxElements.push(
                new Paragraph({
                    style: 'GamebookQuote',
                    children: quoteRuns,
                })
            )
            continue
        }

        // Heading 3
        if (trimmedBlock.startsWith('### ')) {
            const hRuns = parseInlineMarkdownToRuns(
                trimmedBlock.replace(/^###\s+/, ''),
                styleConfig,
                paragraphMap
            )
            for (const r of hRuns) {
                r.bold = true
            }
            docxElements.push(
                new Paragraph({
                    children: hRuns,
                    heading: HeadingLevel.HEADING_3,
                    style: 'Heading 3',
                })
            )
            continue
        }

        // Heading 2
        if (trimmedBlock.startsWith('## ')) {
            const hRuns = parseInlineMarkdownToRuns(
                trimmedBlock.replace(/^##\s+/, ''),
                styleConfig,
                paragraphMap
            )
            for (const r of hRuns) {
                r.bold = true
            }
            docxElements.push(
                new Paragraph({
                    children: hRuns,
                    heading: HeadingLevel.HEADING_2,
                    style: 'Heading 2',
                })
            )
            continue
        }

        // Heading 1
        if (trimmedBlock.startsWith('# ')) {
            const hRuns = parseInlineMarkdownToRuns(
                trimmedBlock.replace(/^#\s+/, ''),
                styleConfig,
                paragraphMap
            )
            for (const r of hRuns) {
                r.bold = true
            }
            docxElements.push(
                new Paragraph({
                    children: hRuns,
                    heading: HeadingLevel.HEADING_1,
                    style: 'Heading 1',
                })
            )
            continue
        }

        // List
        const lines = trimmedBlock.split('\n')
        const isList = lines.every(l => /^\s*([*\-+]|\d+\.)\s+/.test(l))
        if (isList) {
            for (const line of lines) {
                const bulletText = line.replace(/^\s*([*\-+]|\d+\.)\s+/, '')
                docxElements.push(
                    new Paragraph({
                        style: 'GamebookList',
                        children: [
                            new TextRun({
                                text: '• ',
                                bold: true,
                            }),
                            ...parseInlineMarkdownToRuns(bulletText, styleConfig, paragraphMap),
                        ],
                    })
                )
            }
            continue
        }

        // Regular narrative block with potential line breaks
        const inlineRuns = []
        for (let idx = 0; idx < lines.length; idx++) {
            const line = lines[idx]
            const lineRuns = parseInlineMarkdownToRuns(line, styleConfig, paragraphMap)
            inlineRuns.push(...lineRuns)
            if (idx < lines.length - 1) {
                inlineRuns.push(new TextRun({ text: ' ', break: 1 }))
            }
        }

        docxElements.push(
            new Paragraph({
                style: 'GamebookParagraph',
                children: inlineRuns,
            })
        )
    }

    return docxElements
}

ExportService.parseMarkdownToDocxParagraphs = parseMarkdownToDocxParagraphs
ExportService.parseInlineMarkdownToRuns = parseInlineMarkdownToRuns

module.exports = ExportService
