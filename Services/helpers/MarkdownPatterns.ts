/**
 * Shared regular expressions and tags for Markdown parsing, transclusion,
 * entity mentions, and combat blocks across domain services.
 */

export const COMBAT_START_TAG = '<!-- COMBAT_START -->'
export const COMBAT_END_TAG = '<!-- COMBAT_END -->'

/**
 * Matches modern HTML comment combat blocks or legacy {{combat:start}}...{{combat:end}} blocks.
 */
export const COMBAT_BLOCK_REGEX =
    /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})[\s\S]*?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/i

/**
 * Global variant of COMBAT_BLOCK_REGEX for replacing all occurrences in a document.
 */
export const COMBAT_BLOCK_GLOBAL_REGEX =
    /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})[\s\S]*?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/gi

/**
 * Fallback regex matching older header-based combat blocks without explicit start tag.
 */
export const LEGACY_COMBAT_FALLBACK_REGEX =
    /(?:---\s*\n+)?###\s*(?:[^\w\s]*\s*)?Starcie:[\s\S]*?(?:####\s*Możliwe wyniki starcia:[\s\S]*?)?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\}|$)/i

/**
 * Matches inline entity mention links: [Label](entity://type/id)
 */
export const ENTITY_LINK_REGEX = /\[([^\]]*)\]\(entity:\/\/([a-zA-Z0-9_-]+)\/([^/?#)\s]+)\)/g

/**
 * Matches description transclusion links for supported embed types (item | character | location):
 * [Label](embed://type/id) or [Label](embed://type/id/variant) or [Label](embed://type/id:variant)
 */
export const EMBED_LINK_REGEX =
    /\[([^\]]+)\]\(embed:\/\/(item|character|location)\/([^/?#):]+)(?:[/:]?(text|summary))?\)/g

/**
 * Matches any embed link regardless of entity type (used when updating links on rename):
 * [Label](embed://type/id) or [Label](embed://type/id/variant)
 */
export const GENERIC_EMBED_LINK_REGEX =
    /\[([^\]]*)\]\(embed:\/\/([a-zA-Z0-9_-]+)\/([^/?#):\s]+)(?:[/:]?(text|summary))?\)/g

/**
 * Matches legacy embed macro syntax: {{embed:type:id}} or {{embed:type:id:variant}}
 */
export const EMBED_MACRO_REGEX =
    /\{\{embed:(item|character|location):([^:}]+)(?::(text|summary))?\}\}/g

/**
 * Escapes special regular expression characters in a literal string.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
