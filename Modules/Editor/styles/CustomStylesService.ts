import { CustomFontsService } from '../fonts/CustomFontsService'
import { getFontFamilyCss } from '../fonts/fontStacks'
import { ICustomTextStyle } from '../types'
import { sanitizeCustomStyle, sanitizeFontFamily } from './styleSanitizer'

/**
 * Domyślny zestaw predefiniowanych stylów narracyjnych dostępnych w nowym projekcie.
 */
export const DEFAULT_CUSTOM_STYLES: ICustomTextStyle[] = [
    {
        id: 'style_thoughts',
        name: 'Myśli bohatera',
        color: '#c084fc',
        italic: true,
        docxStyleName: 'Style_Thoughts',
    },
    {
        id: 'style_spell',
        name: 'Zaklęcie / Inskrypcja',
        color: '#f59e0b',
        bold: true,
        fontFamily: 'serif',
        docxStyleName: 'Style_Highlight',
    },
    {
        id: 'style_hint',
        name: 'Wskazówka narratora',
        color: '#34d399',
        backgroundColor: '#064e3b40',
        border: true,
        docxStyleName: 'Style_Hint',
    },
    {
        id: 'style_note',
        name: 'List / Zwój',
        color: '#fef3c7',
        italic: true,
        fontFamily: 'serif',
        docxStyleName: 'Style_Note',
    },
]

/**
 * Struktura danych projektu przechowująca niestandardowe style tekstu.
 */
export interface IProjectStylesData {
    customStyles?: ICustomTextStyle[]
}

/**
 * Serwis zarządzający niestandardowymi stylami tekstu w edytorze.
 * Zapewnia pobieranie, zapisywanie, usuwanie, generowanie bezpiecznych reguł CSS oraz
 * dynamiczne wstrzykiwanie arkusza stylów do nagłówka dokumentu.
 */
export class CustomStylesService {
    /**
     * Zwraca głęboką kopię domyślnych stylów tekstowych.
     */
    public static getDefaultStyles(): ICustomTextStyle[] {
        return DEFAULT_CUSTOM_STYLES.map(style => ({ ...style }))
    }

    /**
     * Zwraca style zdefiniowane w projekcie lub kopię stylów domyślnych, jeśli projekt ich nie posiada.
     */
    public static getStyles(projectData?: IProjectStylesData | null): ICustomTextStyle[] {
        if (
            projectData &&
            Array.isArray(projectData.customStyles) &&
            projectData.customStyles.length > 0
        ) {
            return projectData.customStyles
        }
        return this.getDefaultStyles()
    }

    /**
     * Zwraca pojedynczy styl o wskazanym identyfikatorze lub undefined, jeśli nie istnieje.
     */
    public static getStyleById(
        projectData: IProjectStylesData | null | undefined,
        styleId: string
    ): ICustomTextStyle | undefined {
        if (!styleId) return undefined
        const styles = this.getStyles(projectData)
        return styles.find(s => s.id === styleId)
    }

    /**
     * Zapisuje lub aktualizuje styl w konfiguracji projektu, sanityzuje dane i odświeża arkusz CSS.
     */
    public static saveStyle(
        projectData: IProjectStylesData | null | undefined,
        style: ICustomTextStyle
    ): ICustomTextStyle[] {
        const safeStyle = sanitizeCustomStyle(style)
        if (!safeStyle) {
            throw new Error(`Invalid custom style id: ${String(style?.id)}`)
        }

        if (!projectData) return this.getDefaultStyles()
        if (!Array.isArray(projectData.customStyles)) {
            projectData.customStyles = this.getDefaultStyles()
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

    /**
     * Usuwa styl o podanym identyfikatorze z konfiguracji projektu i odświeża arkusz CSS.
     */
    public static deleteStyle(
        projectData: IProjectStylesData | null | undefined,
        styleId: string
    ): ICustomTextStyle[] {
        if (!projectData) {
            return this.getDefaultStyles().filter(s => s.id !== styleId)
        }

        if (!Array.isArray(projectData.customStyles)) {
            projectData.customStyles = this.getDefaultStyles()
        }

        projectData.customStyles = projectData.customStyles.filter(
            (s: ICustomTextStyle) => s.id !== styleId
        )
        this.injectStyleSheet(projectData.customStyles)
        return projectData.customStyles
    }

    /**
     * Buduje bezpieczną regułę CSS dla pojedynczego stylu.
     * Zwraca pusty ciąg znaków, jeśli identyfikator stylu jest niebezpieczny.
     */
    public static buildCssRule(rawStyle: ICustomTextStyle): string {
        const style = sanitizeCustomStyle(rawStyle)
        if (!style) return ''

        const rules: string[] = []
        if (style.color) rules.push(`color: ${style.color} !important;`)
        if (style.backgroundColor) {
            rules.push(`background-color: ${style.backgroundColor};`)
        }
        if (style.italic) rules.push('font-style: italic;')
        if (style.bold) rules.push('font-weight: 700;')
        if (style.underline) rules.push('text-decoration: underline;')
        if (style.border) {
            const borderColor = style.color || '#52525b'
            rules.push(`border: 1px solid ${borderColor};`)
        }

        if (style.backgroundColor || style.border) {
            rules.push('border-radius: 0.25rem;')
            rules.push(style.backgroundColor ? 'padding: 0.1em 0.35em;' : 'padding: 0.05em 0.3em;')
        }

        if (style.fontFamily) {
            rules.push(`font-family: ${getFontFamilyCss(style.fontFamily)};`)
        }

        return `.gamebook-custom-style-${style.id} {\n  ${rules.join('\n  ')}\n}`
    }

    /**
     * Wstrzykuje wygenerowane reguły CSS do nagłówka dokumentu HTML (<style id="gamebook-custom-styles-sheet">)
     * oraz wstępnie ładuje wymagane czcionki Google Fonts.
     */
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

        if (styleTag.textContent !== css) {
            styleTag.textContent = css
        }
    }
}
