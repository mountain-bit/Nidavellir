import { CustomFontsService } from './CustomFontsService'
import { getFontFamilyCss } from './fontStacks'
import { sanitizeCustomStyle, sanitizeFontFamily } from './styleSanitizer'
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
        const safeStyle = sanitizeCustomStyle(style)
        if (!safeStyle) {
            throw new Error(`Invalid custom style id: ${String(style?.id)}`)
        }

        if (!projectData) return [...DEFAULT_CUSTOM_STYLES]
        if (!Array.isArray(projectData.customStyles)) {
            projectData.customStyles = [...DEFAULT_CUSTOM_STYLES]
        }

        const existingIdx = projectData.customStyles.findIndex(
            (s: ICustomTextStyle) => s.id === safeStyle.id
        )
        if (existingIdx >= 0) {
            projectData.customStyles[existingIdx] = safeStyle
        } else {
            projectData.customStyles.push(safeStyle)
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

    /**
     * Builds a CSS rule for the style. Returns an empty string when the style id is unsafe;
     * invalid colors / fonts are silently dropped.
     */
    public static buildCssRule(rawStyle: ICustomTextStyle): string {
        const style = sanitizeCustomStyle(rawStyle)
        if (!style) return ''

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
            rules.push(`font-family: ${getFontFamilyCss(style.fontFamily)};`)
        }

        return `.gamebook-custom-style-${style.id} {\n  ${rules.join('\n  ')}\n}`
    }

    public static injectStyleSheet(styles: ICustomTextStyle[]): void {
        if (typeof document === 'undefined') return

        styles.forEach(s => {
            const fontFamily = sanitizeFontFamily(s.fontFamily)
            if (fontFamily) {
                CustomFontsService.loadFont(fontFamily)
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

        const css = styles
            .map(s => this.buildCssRule(s))
            .filter(Boolean)
            .join('\n\n')
        styleTag.textContent = css
    }
}
