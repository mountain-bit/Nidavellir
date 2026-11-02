const fs = require('fs')
const path = require('path')
const {
    resolveProjectDir,
    isPathInsideBase,
    atomicWriteStringSync,
} = require('../../Utils/fs/fsSecurity')

class MarkdownService {
    /**
     * Reads a markdown file safely. If the file does not exist, returns virtual empty content.
     *
     * @param {Object} payload
     * @returns {Promise<{ success: boolean, content?: string, isVirtual?: boolean, error?: string }>}
     */
    static async readMarkdownFile(payload) {
        const { projectPath, relativePath } = payload || {}
        if (!projectPath || !relativePath) {
            return { success: false, error: 'Brak ścieżki projektu lub pliku.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Nieprawidłowa ścieżka projektu.' }
        }

        const fullPath = path.resolve(projectDir, relativePath)
        if (!isPathInsideBase(projectDir, fullPath)) {
            return { success: false, error: 'Niedozwolona ścieżka pliku.' }
        }

        if (!fs.existsSync(fullPath)) {
            return { success: true, content: '', isVirtual: true }
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf8')
            return { success: true, content: content, isVirtual: false }
        } catch (err) {
            console.error('Error reading markdown file:', err)
            return { success: false, error: err.message || 'Błąd odczytu pliku.' }
        }
    }

    /**
     * Saves a markdown file atomically, creating directories if needed.
     *
     * @param {Object} payload
     * @returns {Promise<{ success: boolean, recreated?: boolean, warning?: string, error?: string }>}
     */
    static async saveMarkdownFile(payload) {
        const { projectPath, relativePath, content } = payload || {}
        if (!projectPath || !relativePath) {
            return { success: false, error: 'Brak ścieżki projektu lub pliku.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Nieprawidłowa ścieżka projektu.' }
        }

        const fullPath = path.resolve(projectDir, relativePath)
        if (!isPathInsideBase(projectDir, fullPath)) {
            return { success: false, error: 'Niedozwolona ścieżka pliku.' }
        }

        try {
            const existed = fs.existsSync(fullPath)
            atomicWriteStringSync(fullPath, content || '')

            return {
                success: true,
                recreated: !existed,
                warning: !existed ? 'recreated' : undefined,
            }
        } catch (err) {
            console.error('Error saving markdown file:', err)
            return { success: false, error: err.message || 'Błąd zapisu pliku markdown.' }
        }
    }
}

module.exports = MarkdownService
