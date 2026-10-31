/**
 * Editor Entity Extraction Helpers
 *
 * Provides shared utilities for reading and resolving project entities
 * (characters, locations, tags, items, descriptions) from project data contexts.
 */

/**
 * Extracts a list of raw objects from project context or projectData using multiple fallback keys.
 *
 * @param {object} source Application context or projectData object
 * @param {...string} propNames Property names or method names to probe
 * @returns {any[]}
 */
export function getProjectEntityList(source, ...propNames) {
    if (!source) return []
    const data = source.projectData || source

    for (const p of propNames) {
        if (Array.isArray(data[p])) return data[p]
        if (Array.isArray(source[p])) return source[p]
        if (typeof data[p] === 'function') {
            try {
                const res = data[p]()
                if (Array.isArray(res)) return res
            } catch {
                // Ignore accessor error
            }
        }
        if (typeof source[p] === 'function') {
            try {
                const res = source[p]()
                if (Array.isArray(res)) return res
            } catch {
                // Ignore accessor error
            }
        }
    }
    return []
}

/**
 * Safely extracts textual narrative description and summary from an entity.
 *
 * @param {object} obj Entity object
 * @returns {{ text: string, summary: string }}
 */
export function extractEntityDescription(obj) {
    if (!obj) return { text: '', summary: '' }

    const descObj =
        typeof obj.getDescription === 'function'
            ? obj.getDescription()
            : obj.description ||
              (typeof obj.getContent === 'function' ? obj.getContent() : obj.content)

    if (!descObj) return { text: '', summary: '' }
    if (typeof descObj === 'string') return { text: descObj.trim(), summary: '' }

    const text = typeof descObj.getText === 'function' ? descObj.getText() : descObj.text || ''
    const summary =
        typeof descObj.getSummary === 'function' ? descObj.getSummary() : descObj.summary || ''

    return { text: String(text).trim(), summary: String(summary).trim() }
}
