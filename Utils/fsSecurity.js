const fs = require('fs')
const path = require('path')

/**
 * Resolves the directory path for a given project path.
 * If a path points to a file (like project.json), returns its parent directory.
 * Returns null if the path is invalid or does not exist.
 *
 * @param {string} projectPath
 * @returns {string|null}
 */
function resolveProjectDir(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') return null
    if (!fs.existsSync(projectPath)) return null
    try {
        const stat = fs.statSync(projectPath)
        return stat.isDirectory() ? projectPath : path.dirname(projectPath)
    } catch {
        return null
    }
}

/**
 * Validates whether targetPath is strictly inside basePath (or equal to basePath).
 * Prevents Directory Traversal attacks (e.g., ../../etc).
 *
 * @param {string} basePath
 * @param {string} targetPath
 * @returns {boolean}
 */
function isPathInsideBase(basePath, targetPath) {
    if (
        !basePath ||
        !targetPath ||
        typeof basePath !== 'string' ||
        typeof targetPath !== 'string'
    ) {
        return false
    }
    const resolvedBase = path.resolve(basePath)
    const resolvedTarget = path.resolve(targetPath)
    return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase
}

/**
 * Validates the core schema of project.json data.
 *
 * @param {any} data
 * @returns {boolean}
 */
function validateProjectData(data) {
    if (typeof data !== 'object' || data === null) return false
    const name = data.name !== undefined ? data.name : data.nazwa
    if (typeof name !== 'string') return false
    const descriptionPaths =
        data.descriptionPaths !== undefined ? data.descriptionPaths : data.sciezkiOpisow
    if (!Array.isArray(descriptionPaths)) return false
    const dataPaths = data.dataPaths !== undefined ? data.dataPaths : data.sciezkiDanych
    if (!Array.isArray(dataPaths)) return false
    return true
}

/**
 * Atomically writes string content to a target file via a temporary file and rename.
 *
 * @param {string} targetPath
 * @param {string} content
 */
function atomicWriteStringSync(targetPath, content) {
    const parentDir = path.dirname(targetPath)
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true })
    }
    const tempPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
    fs.writeFileSync(tempPath, content || '', 'utf8')
    fs.renameSync(tempPath, targetPath)
}

/**
 * Atomically writes JSON content to a target file.
 *
 * @param {string} targetPath
 * @param {any} data
 * @param {number} indent
 */
function atomicWriteJsonSync(targetPath, data, indent = 2) {
    atomicWriteStringSync(targetPath, JSON.stringify(data, null, indent))
}

module.exports = {
    resolveProjectDir,
    isPathInsideBase,
    validateProjectData,
    atomicWriteStringSync,
    atomicWriteJsonSync,
}
