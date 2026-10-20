/**
 * Export Style Service
 * Manages built-in presets and user custom styles for PDF and DOCX book export.
 */

export const BUILT_IN_STYLES = [
    {
        id: 'classic-fantasy',
        name: 'Klasyczne Fantasy',
        description:
            'Tradycyjny układ książkowy z czcionką szeryfową, ozdobnymi winietami i rubinowymi akcentami.',
        isBuiltIn: true,
        pageFormat: 'A5',
        pageOrientation: 'portrait',
        columns: 1,
        margins: { top: 15, bottom: 15, left: 18, right: 15 },
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 10,
        lineHeight: 1.45,
        paragraphIndent: 4,
        paragraphSpacing: 4,
        textColor: '#1a1a1a',
        accentColor: '#8b1e1e',
        backgroundColor: '#ffffff',
        headerFontFamily: 'Cinzel, Georgia, serif',
        headerFontSize: 13,
        choiceStyle: 'italic',
        choicePrefix: '→ ',
        separatorType: 'ornament',
        customSeparator: '❖ ❖ ❖',
        grayscaleImages: false,
        showRunningHeader: true,
        showPageNumbers: true,
    },
    {
        id: 'dark-grimoire',
        name: 'Mroczny Grymuar',
        description:
            'Gotycka atmosfera, sepia pergaminu, ozdobne liście bluszczu i głęboki burgund.',
        isBuiltIn: true,
        pageFormat: 'A5',
        pageOrientation: 'portrait',
        columns: 1,
        margins: { top: 16, bottom: 16, left: 18, right: 16 },
        fontFamily: 'Baskerville, "Times New Roman", serif',
        fontSize: 10,
        lineHeight: 1.4,
        paragraphIndent: 5,
        paragraphSpacing: 4,
        textColor: '#24211e',
        accentColor: '#5c1926',
        backgroundColor: '#fbf8f2',
        headerFontFamily: 'Cinzel, Georgia, serif',
        headerFontSize: 14,
        choiceStyle: 'bold',
        choicePrefix: '▶ ',
        separatorType: 'ornament',
        customSeparator: '❦',
        grayscaleImages: true,
        showRunningHeader: true,
        showPageNumbers: true,
    },
    {
        id: 'modern-minimal',
        name: 'Nowoczesny Minimalizm',
        description:
            'Czysta, bezszeryfowa typografia, geometryczne linie i niebieskie akcenty technologiczne.',
        isBuiltIn: true,
        pageFormat: 'A5',
        pageOrientation: 'portrait',
        columns: 1,
        margins: { top: 14, bottom: 14, left: 14, right: 14 },
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 9.5,
        lineHeight: 1.5,
        paragraphIndent: 0,
        paragraphSpacing: 8,
        textColor: '#111827',
        accentColor: '#2563eb',
        backgroundColor: '#ffffff',
        headerFontFamily: 'Inter, system-ui, sans-serif',
        headerFontSize: 12.5,
        choiceStyle: 'box',
        choicePrefix: '[►] ',
        separatorType: 'line',
        customSeparator: '—',
        grayscaleImages: false,
        showRunningHeader: true,
        showPageNumbers: true,
    },
    {
        id: 'eco-print',
        name: 'Druk Ekonomiczny (B&W / E-ink)',
        description:
            'Dwukolumnowy układ oszczędzający papier, maksymalny kontrast dla drukarek domowych i czytników.',
        isBuiltIn: true,
        pageFormat: 'A5',
        pageOrientation: 'portrait',
        columns: 2,
        margins: { top: 12, bottom: 12, left: 12, right: 12 },
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: 9,
        lineHeight: 1.3,
        paragraphIndent: 3,
        paragraphSpacing: 2,
        textColor: '#000000',
        accentColor: '#000000',
        backgroundColor: '#ffffff',
        headerFontFamily: '"Times New Roman", Times, serif',
        headerFontSize: 11,
        choiceStyle: 'bullet',
        choicePrefix: '• ',
        separatorType: 'line',
        customSeparator: '—',
        grayscaleImages: true,
        showRunningHeader: false,
        showPageNumbers: true,
    },
]

const STORAGE_KEY = 'sgp_user_export_styles'

/**
 * Loads all user-defined styles from local storage.
 *
 * @returns {Array}
 */
export function getUserStyles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

/**
 * Returns all available styles (built-in + user created).
 *
 * @returns {Array}
 */
export function getAllStyles() {
    const userStyles = getUserStyles()
    return [...BUILT_IN_STYLES, ...userStyles]
}

/**
 * Finds a style by its unique identifier.
 *
 * @param {string} id
 * @returns {object}
 */
export function getStyleById(id) {
    const all = getAllStyles()
    return all.find(s => s.id === id) || BUILT_IN_STYLES[0]
}

/**
 * Saves a new custom style or updates an existing one.
 *
 * @param {object} styleConfig
 * @returns {object} The saved style
 */
export function saveCustomStyle(styleConfig) {
    const userStyles = getUserStyles()
    let savedStyle

    if (
        styleConfig.id &&
        !styleConfig.id.startsWith('builtin-') &&
        !BUILT_IN_STYLES.some(b => b.id === styleConfig.id)
    ) {
        // Update existing custom style
        const index = userStyles.findIndex(s => s.id === styleConfig.id)
        savedStyle = { ...styleConfig, isBuiltIn: false }
        if (index >= 0) {
            userStyles[index] = savedStyle
        } else {
            userStyles.push(savedStyle)
        }
    } else {
        // New custom style
        const newId = `user-style-${Date.now()}`
        savedStyle = {
            ...styleConfig,
            id: newId,
            isBuiltIn: false,
        }
        userStyles.push(savedStyle)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userStyles))
    return savedStyle
}

/**
 * Deletes a custom style by id. Built-in styles cannot be deleted.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function deleteCustomStyle(id) {
    if (BUILT_IN_STYLES.some(b => b.id === id)) {
        return false
    }
    const userStyles = getUserStyles().filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userStyles))
    return true
}
