const path = require('path')
const fs = require('fs')
const i18next = require('i18next')
const FsBackend = require('i18next-fs-backend')

const SUPPORTED_LOCALES = ['pl', 'en', 'de']
const FALLBACK_LOCALE = 'en'

let _app = null

function getSettingsPath() {
    return path.join(_app.getPath('userData'), 'settings.json')
}

function getSavedLocale() {
    const settingsPath = getSettingsPath()
    if (!fs.existsSync(settingsPath)) return null
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
        return settings.locale || null
    } catch (err) {
        console.warn('[i18n] Could not read settings.json — using system locale.', err)
        return null
    }
}

function saveLocale(locale) {
    const settingsPath = getSettingsPath()
    let settings = {}
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch (_err) {
        // ignore error
    }
    settings.locale = locale
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
}

function detectSystemLocale() {
    const raw = _app.getLocale().toLowerCase()
    for (const supported of SUPPORTED_LOCALES) {
        if (raw === supported || raw.startsWith(supported + '-')) {
            return supported
        }
    }
    return FALLBACK_LOCALE
}

/**
 * @param {{ app?: import('electron').App }} [deps]
 */
async function initI18n(deps = {}) {
    _app = deps.app ?? require('electron').app

    const locale = getSavedLocale() || detectSystemLocale()

    if (i18next.isInitialized) {
        await i18next.changeLanguage(locale)
        return
    }

    await i18next.use(FsBackend).init({
        lng: locale,
        fallbackLng: FALLBACK_LOCALE,
        supportedLngs: SUPPORTED_LOCALES,
        backend: {
            loadPath: path.join(__dirname, '..', 'Locales', '{{lng}}', 'translation.json'),
        },
        interpolation: {
            escapeValue: false,
        },
        initImmediate: false,
    })
}

/**
 * @param {string} key
 * @param {Record<string, unknown>} [options]
 */
function t(key, options) {
    return i18next.t(key, options)
}

function getTranslations() {
    return i18next.getResourceBundle(i18next.language, 'translation')
}

function getLocale() {
    return i18next.language
}

/**
 * @param {string} locale
 * @returns {Promise<boolean>}
 */
async function setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
        console.warn(`[i18n] Unsupported locale: ${locale}`)
        return false
    }
    await i18next.changeLanguage(locale)
    saveLocale(locale)
    return true
}

module.exports = { initI18n, t, getTranslations, getLocale, setLocale }
