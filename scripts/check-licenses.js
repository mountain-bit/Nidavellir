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
])

if (!fs.existsSync(virtualStoreDir)) {
    console.error('Nie znaleziono zależności pnpm. Uruchom najpierw pnpm install.')
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

        const license = typeof manifest.license === 'string' ? manifest.license : manifest.license?.type
        const licenses = license?.replace(/[()]/g, '').split(/\s+(?:OR|AND)\s+/) ?? []
        const isAllowed = licenses.length > 0 && licenses.every(item => allowedLicenses.has(item))
        if (!isAllowed) invalidPackages.push(`${packageId}: ${license ?? 'brak licencji'}`)
    }
}

for (const storeEntry of fs.readdirSync(virtualStoreDir, { withFileTypes: true })) {
    if (!storeEntry.isDirectory()) continue
    const modulesDir = path.join(virtualStoreDir, storeEntry.name, 'node_modules')
    if (fs.existsSync(modulesDir)) collectPackageManifests(modulesDir)
}

if (invalidPackages.length > 0) {
    console.error('Znaleziono zależności z niedozwoloną lub nieznaną licencją:')
    for (const packageInfo of invalidPackages) {
        console.error(`- ${packageInfo}`)
    }
    process.exit(1)
}

console.log('Sprawdzono licencje wszystkich zależności: dozwolone licencje są zgodne z polityką projektu.')
