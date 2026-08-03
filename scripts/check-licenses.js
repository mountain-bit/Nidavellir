const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const lockfilePath = path.join(rootDir, 'package-lock.json')
const allowedLicenses = new Set([
    'MIT',
    'ISC',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    '0BSD',
    'CC0-1.0',
    'Python-2.0',
])

if (!fs.existsSync(lockfilePath)) {
    console.error('Nie znaleziono package-lock.json. Uruchom najpierw instalację zależności.')
    process.exit(1)
}

const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'))
const invalidPackages = []

for (const packagePath of Object.keys(lockfile.packages ?? {})) {
    if (!packagePath.startsWith('node_modules/')) {
        continue
    }

    const lockPackage = lockfile.packages[packagePath]
    const manifestPath = path.join(rootDir, packagePath, 'package.json')
    if (!fs.existsSync(manifestPath)) {
        if (lockPackage.optional) {
            continue
        }
        invalidPackages.push(`${packagePath}: brak package.json`)
        continue
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const license = typeof manifest.license === 'string' ? manifest.license : manifest.license?.type
    const licenses = license?.replace(/[()]/g, '').split(/\s+(?:OR|AND)\s+/) ?? []
    const isAllowed = licenses.length > 0 && licenses.every(item => allowedLicenses.has(item))

    if (!isAllowed) {
        invalidPackages.push(`${manifest.name ?? packagePath}@${manifest.version ?? '?'}: ${license ?? 'brak licencji'}`)
    }
}

if (invalidPackages.length > 0) {
    console.error('Znaleziono zależności z niedozwoloną lub nieznaną licencją:')
    for (const packageInfo of invalidPackages) {
        console.error(`- ${packageInfo}`)
    }
    process.exit(1)
}

console.log('Sprawdzono licencje wszystkich zależności: dozwolone licencje są zgodne z polityką projektu.')
