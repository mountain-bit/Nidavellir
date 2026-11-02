/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const virtualStoreDir = path.join(rootDir, 'node_modules', '.pnpm')
const allowedLicenses = new Set([
    'MIT',
    'ISC',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    '0BSD',
    'CC0-1.0',
    'MPL-2.0',
    'Python-2.0',
    'Zlib',
    'BlueOak-1.0.0',
    'WTFPL',
])

const normalizedAllowed = new Map(Array.from(allowedLicenses).map(lic => [lic.toLowerCase(), lic]))

function isLicenseAllowed(licenseStr, allowedSet = allowedLicenses) {
    if (!licenseStr || typeof licenseStr !== 'string') return false

    const tokens = licenseStr.match(/\(|\)|OR|AND|[^\s()]+/gi)
    if (!tokens || tokens.length === 0) return false

    let pos = 0
    function peek() {
        return tokens[pos]
    }
    function consume() {
        return tokens[pos++]
    }

    function checkIdentifier(id) {
        if (allowedSet.has(id)) return true
        const canonical = normalizedAllowed.get(id.toLowerCase())
        return Boolean(canonical && allowedSet.has(canonical))
    }

    function parsePrimary() {
        const token = peek()
        if (token === '(') {
            consume()
            const result = parseOr()
            if (peek() === ')') {
                consume()
            }
            return result
        }
        if (token === ')' || !token) {
            return false
        }
        const id = consume()
        return checkIdentifier(id)
    }

    function parseAnd() {
        let result = parsePrimary()
        while (peek() && peek().toUpperCase() === 'AND') {
            consume()
            const next = parsePrimary()
            result = result && next
        }
        return result
    }

    function parseOr() {
        let result = parseAnd()
        while (peek() && peek().toUpperCase() === 'OR') {
            consume()
            const next = parseAnd()
            result = result || next
        }
        return result
    }

    return Boolean(parseOr())
}

function extractLicense(manifest) {
    if (!manifest) return null

    let license =
        typeof manifest.license === 'string'
            ? manifest.license
            : (manifest.license?.type ?? manifest.license?.name)

    if (!license && Array.isArray(manifest.licenses)) {
        license = manifest.licenses
            .map(l => (typeof l === 'string' ? l : (l?.type ?? l?.name)))
            .filter(Boolean)
            .join(' OR ')
    }

    return license || null
}

function collectPackageManifests(
    directory,
    checkedPackages = new Set(),
    invalidPackages = [],
    allowedSet = allowedLicenses
) {
    let entries
    try {
        entries = fs.readdirSync(directory, { withFileTypes: true })
    } catch (err) {
        invalidPackages.push(`${directory}: błąd odczytu katalogu (${err.message})`)
        return
    }

    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === '.bin') continue

        const entryPath = path.join(directory, entry.name)
        if (entry.name.startsWith('@')) {
            collectPackageManifests(entryPath, checkedPackages, invalidPackages, allowedSet)
            continue
        }

        const manifestPath = path.join(entryPath, 'package.json')
        if (!fs.existsSync(manifestPath)) {
            invalidPackages.push(`${entryPath}: brak package.json`)
            continue
        }

        let manifest
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        } catch (err) {
            invalidPackages.push(
                `${manifestPath}: błąd odczytu lub parsowania JSON (${err.message})`
            )
            continue
        }

        const packageId = `${manifest.name ?? entry.name}@${manifest.version ?? '?'}`
        if (checkedPackages.has(packageId)) continue
        checkedPackages.add(packageId)

        const license = extractLicense(manifest)
        const isAllowed = isLicenseAllowed(license, allowedSet)
        if (!isAllowed) {
            invalidPackages.push(`${packageId}: ${license ?? 'brak licencji'}`)
        }
    }
}

function checkLicenses(options = {}) {
    const storeDir = options.virtualStoreDir ?? virtualStoreDir
    const allowedSet = options.allowedLicenses ?? allowedLicenses
    const invalidPackages = []
    const checkedPackages = new Set()

    if (!fs.existsSync(storeDir)) {
        return {
            success: false,
            error: 'pnpm dependencies not found. Please run pnpm install first.',
            invalidPackages: [],
            checkedCount: 0,
        }
    }

    let storeEntries
    try {
        storeEntries = fs.readdirSync(storeDir, { withFileTypes: true })
    } catch (err) {
        return {
            success: false,
            error: `Nie można odczytać katalogu ${storeDir}: ${err.message}`,
            invalidPackages: [],
            checkedCount: 0,
        }
    }

    for (const storeEntry of storeEntries) {
        if (!storeEntry.isDirectory()) continue
        const modulesDir = path.join(storeDir, storeEntry.name, 'node_modules')
        if (fs.existsSync(modulesDir)) {
            collectPackageManifests(modulesDir, checkedPackages, invalidPackages, allowedSet)
        }
    }

    return {
        success: invalidPackages.length === 0,
        invalidPackages,
        checkedCount: checkedPackages.size,
    }
}

function run() {
    const result = checkLicenses()
    if (!result.success) {
        if (result.error) {
            console.error(result.error)
        } else {
            console.error('Found dependencies with disallowed or unknown license:')
            for (const packageInfo of result.invalidPackages) {
                console.error(`- ${packageInfo}`)
            }
        }
        process.exit(1)
    }

    console.log(
        `Checked licenses for all dependencies (${result.checkedCount} packages): allowed licenses conform to project policy.`
    )
}

if (require.main === module) {
    run()
}

module.exports = {
    rootDir,
    virtualStoreDir,
    allowedLicenses,
    isLicenseAllowed,
    extractLicense,
    collectPackageManifests,
    checkLicenses,
    run,
}
