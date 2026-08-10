/**
 * i18n dla main process (Node.js / CommonJS)
 *
 * Używa i18next z backendem plikowym. Po wywołaniu initI18n() instancja
 * jest gotowa i można używać t() synchronicznie.
 *
 * Dependency injection: initI18n({ app }) pozwala wstrzyknąć mock w testach.
 * W produkcji wywołuj bez argumentów — domyślnie używa app z Electrona.
 */

const path = require('path');
const fs = require('fs');
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');

const SUPPORTED_LOCALES = ['pl', 'en', 'de'];
const FALLBACK_LOCALE = 'en';

// Aktualnie wstrzyknięta instancja app (ustawiana przez initI18n)
let _app = null;

// ── Persystencja ustawień ────────────────────────────────────────────────────

function getSettingsPath() {
  return path.join(_app.getPath('userData'), 'settings.json');
}

function getSavedLocale() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) return null;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return settings.locale || null;
  } catch {
    return null;
  }
}

function saveLocale(locale) {
  const settingsPath = getSettingsPath();
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch { /* ignore */ }
  }
  settings.locale = locale;
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch { /* ignore w testach */ }
}

function detectSystemLocale() {
  const raw = _app.getLocale().toLowerCase();
  for (const supported of SUPPORTED_LOCALES) {
    if (raw === supported || raw.startsWith(supported + '-')) {
      return supported;
    }
  }
  return FALLBACK_LOCALE;
}

// ── Inicjalizacja ────────────────────────────────────────────────────────────

/**
 * Inicjalizuje i18n.
 * @param {{ app?: import('electron').App }} [deps] - opcjonalne dependencje (dla testów)
 */
async function initI18n(deps = {}) {
  // Użyj wstrzykniętego app lub załaduj z Electrona (lazy — dopiero tu)
  _app = deps.app ?? require('electron').app;

  const locale = getSavedLocale() || detectSystemLocale();

  if (i18next.isInitialized) {
    await i18next.changeLanguage(locale);
    return;
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
  });
}

// ── API publiczne ────────────────────────────────────────────────────────────

/**
 * Tłumaczy klucz. Działa synchronicznie po wywołaniu initI18n().
 * @param {string} key
 * @param {Record<string, unknown>} [options] - interpolacja, count, itp.
 */
function t(key, options) {
  return i18next.t(key, options);
}

/**
 * Zwraca aktualnie załadowany słownik (cały obiekt JSON).
 * Używane przez renderer przez IPC.
 */
function getTranslations() {
  return i18next.getResourceBundle(i18next.language, 'translation');
}

/**
 * Zwraca aktualny kod języka.
 */
function getLocale() {
  return i18next.language;
}

/**
 * Ustawia język i zapisuje wybór do ustawień.
 * @param {string} locale
 * @returns {Promise<boolean>}
 */
async function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`[i18n] Unsupported locale: ${locale}`);
    return false;
  }
  await i18next.changeLanguage(locale);
  saveLocale(locale);
  return true;
}

module.exports = { initI18n, t, getTranslations, getLocale, setLocale };
