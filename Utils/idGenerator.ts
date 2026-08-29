export type IdGenerator = (prefix?: string) => string

/**
 * Domyślny generator identyfikatorów oparty o timestamp i losowy ciąg znaków.
 */
export function defaultIdGenerator(prefix: string = ''): string {
    const cleanPrefix = prefix ? `${prefix}_` : ''
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    return `${cleanPrefix}${timestamp}_${randomSuffix}`
}

export const generateId = defaultIdGenerator
