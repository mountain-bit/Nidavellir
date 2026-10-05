import { CustomFontsService } from './CustomFontsService'
import { ICustomTextStyle } from './types'

export const DEFAULT_CUSTOM_STYLES: ICustomTextStyle[] = [
    {
        id: 'style_thoughts',
        name: 'Myśli bohatera',
        color: '#c084fc',
        italic: true,
        docxStyleName: 'Styl_Mysli',
    },
    {
        id: 'style_spell',
        name: 'Zaklęcie / Inskrypcja',
        color: '#f59e0b',
        bold: true,
        fontFamily: 'serif',
        docxStyleName: 'Styl_Zaklecie',
    },
    {
        id: 'style_hint',
        name: 'Wskazówka narratora',
        color: '#34d399',
        backgroundColor: '#064e3b40',
        border: true,
        docxStyleName: 'Styl_Wskazowka',
    },
    {
        id: 'style_note',
        name: 'List / Zwój',
        color: '#fef3c7',
        italic: true,
        fontFamily: 'serif',
        docxStyleName: 'Styl_List',
    },
]

export interface IProjectStylesData {
    customStyles?: ICustomTextStyle[]
}

export class CustomStylesService {
    public static getStyles(projectData?: IProjectStylesData | null): ICustomTextStyle[] {
        if (
            projectData &&
            Array.isArray(projectData.customStyles) &&
            projectData.customStyles.length > 0
        ) {
            return projectData.customStyles
        }
        return [...DEFAULT_CUSTOM_STYLES]
    }

    public static saveStyle(
        projectData: IProjectStylesData | null | undefined,
        style: ICustomTextStyle
    ): ICustomTextStyle[] {
        if (!projectData) return [...DEFAULT_CUSTOM_STYLES]
        if (!Array.isArray(projectData.customStyles)) {
            projectData.customStyles = [...DEFAULT_CUSTOM_STYLES]
        }

        const existingIdx = projectData.customStyles.findIndex(
            (s: ICustomTextStyle) => s.id === style.id
        )
        if (existingIdx >= 0) {
            projectData.customStyles[existingIdx] = { ...style }
        } else {
            projectData.customStyles.push({ ...style })
        }

        this.injectStyleSheet(projectData.customStyles)
        return projectData.customStyles
    }

    public static deleteStyle(
        projectData: IProjectStylesData | null | undefined,
        styleId: string
    ): ICustomTextStyle[] {
        if (!projectData || !Array.isArray(projectData.customStyles)) {
            return [...DEFAULT_CUSTOM_STYLES]
        }

        projectData.customStyles = projectData.customStyles.filter(
            (s: ICustomTextStyle) => s.id !== styleId
        )
        this.injectStyleSheet(projectData.customStyles)
        return projectData.customStyles
    }

    public static buildCssRule(style: ICustomTextStyle): string {
        const rules: string[] = []
        if (style.color) rules.push(`color: ${style.color} !important;`)
        if (style.backgroundColor) {
            rules.push(`background-color: ${style.backgroundColor};`)
            rules.push('padding: 0.1em 0.35em;')
            rules.push('border-radius: 0.25rem;')
        }
        if (style.italic) rules.push('font-style: italic;')
        if (style.bold) rules.push('font-weight: 700;')
        if (style.underline) rules.push('text-decoration: underline;')
        if (style.border) {
            const borderColor = style.color || '#52525b'
            rules.push(`border: 1px solid ${borderColor};`)
            rules.push('border-radius: 0.25rem;')
            rules.push('padding: 0.05em 0.3em;')
        }
        if (style.fontFamily) {
            if (style.fontFamily === 'serif') {
                rules.push(
                    'font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;'
                )
            } else if (style.fontFamily === 'mono') {
                rules.push(
                    'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;'
                )
            } else if (style.fontFamily === 'sans') {
                rules.push('font-family: ui-sans-serif, system-ui, sans-serif;')
            } else {
                rules.push(`font-family: "${style.fontFamily}", ui-serif, serif;`)
            }
        }

        return `.gamebook-custom-style-${style.id} {\n  ${rules.join('\n  ')}\n}`
    }

    public static injectStyleSheet(styles: ICustomTextStyle[]): void {
        if (typeof document === 'undefined') return

        styles.forEach(s => {
            if (s.fontFamily) {
                CustomFontsService.loadFont(s.fontFamily)
            }
        })

        let styleTag = document.getElementById(
            'gamebook-custom-styles-sheet'
        ) as HTMLStyleElement | null
        if (!styleTag) {
            styleTag = document.createElement('style')
            styleTag.id = 'gamebook-custom-styles-sheet'
            document.head.appendChild(styleTag)
        }

        const css = styles.map(s => this.buildCssRule(s)).join('\n\n')
        styleTag.textContent = css
    }
}
