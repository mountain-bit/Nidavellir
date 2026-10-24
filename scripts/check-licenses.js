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

function isLicenseAllowed(licenseStr, allowedSet) {
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
        return allowedSet.has(id)
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

if (!fs.existsSync(virtualStoreDir)) {
    console.error('pnpm dependencies not found. Please run pnpm install first.')
    process.exit(1)
}

const invalidPackages = []
const checkedPackages = new Set()

function collectPackageManifests(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === '.bin') continue

        const entryPath = path.join(directory, entry.name)
        if (entry.name.startsWith('@')) {
            collectPackageManifests(entryPath)
            continue
        }

        const manifestPath = path.join(entryPath, 'package.json')
        if (!fs.existsSync(manifestPath)) {
            invalidPackages.push(`${entryPath}: brak package.json`)
            continue
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const packageId = `${manifest.name ?? entry.name}@${manifest.version ?? '?'}`
        if (checkedPackages.has(packageId)) continue
        checkedPackages.add(packageId)

        let license =
            typeof manifest.license === 'string' ? manifest.license : manifest.license?.type
        if (!license && Array.isArray(manifest.licenses)) {
            license = manifest.licenses
                .map(l => (typeof l === 'string' ? l : l?.type))
                .filter(Boolean)
                .join(' OR ')
        }

        const isAllowed = isLicenseAllowed(license, allowedLicenses)
        if (!isAllowed) invalidPackages.push(`${packageId}: ${license ?? 'brak licencji'}`)
    }
}

for (const storeEntry of fs.readdirSync(virtualStoreDir, { withFileTypes: true })) {
    if (!storeEntry.isDirectory()) continue
    const modulesDir = path.join(virtualStoreDir, storeEntry.name, 'node_modules')
    if (fs.existsSync(modulesDir)) collectPackageManifests(modulesDir)
}

if (invalidPackages.length > 0) {
    console.error('Found dependencies with disallowed or unknown license:')
    for (const packageInfo of invalidPackages) {
        console.error(`- ${packageInfo}`)
    }
    process.exit(1)
}

console.log('Checked licenses for all dependencies: allowed licenses conform to project policy.')
