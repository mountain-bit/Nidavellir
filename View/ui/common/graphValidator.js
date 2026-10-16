/**
 * Graph Validation Engine for SilnikGierParagrafowych.
 *
 * Facade adapter providing backward-compatible access to GraphValidationService.
 *
 * Checks gamebook structural integrity:
 * 1. Missing or multiple start paragraphs
 * 2. End paragraphs (isEnd) and dead-ends without exit
 * 3. General cycles and loops in the story graph (self-loops, multi-node loops)
 * 4. True reachability (zero-indegree orphans and disconnected islands)
 * 5. Broken target references (jumps pointing to non-existent paragraph IDs)
 * 6. Scene initial paragraph integrity
 */

import { GraphValidationService } from '../../../dist/Services/GraphValidationService.js'

/**
 * @typedef {import('../../../Services/GraphValidationService').ValidationSeverity} ValidationSeverity
 * @typedef {import('../../../Services/GraphValidationService').ValidationErrorCode} ValidationErrorCode
 * @typedef {import('../../../Services/GraphValidationService').IGraphValidationIssue} ValidationIssue
 * @typedef {import('../../../Services/GraphValidationService').IGraphValidationReport} ValidationReport
 */

/**
 * Validates the project story graph structure.
 *
 * @param {object} ctx Application Context or project data
 * @returns {ValidationReport}
 */
export function validateStoryGraph(ctx) {
    return GraphValidationService.validateStoryGraph(ctx)
}

export { GraphValidationService }
