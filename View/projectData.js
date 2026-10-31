/**
 * Project Data Provider for MainWindow.
 * Serves as the central interface for extracting, loading, and switching project data
 * between live project models and development mock datasets.
 */

import { ProjectManager } from '../dist/ViewModel/MainWindowViewModel.js'
import { createMockProjectData } from './mockData.js'

/**
 * Global default flag controlling whether MainWindow should initialize with mock data.
 * Set to false when ready to switch to live project data by default.
 */
export const USE_MOCK = false

/**
 * Extracts entities and files from a domain Project model instance into the
 * structure expected by MainWindow and its modular UI controllers.
 *
 * @param {import('../Model/Project').Project} project
 * @param {Record<string, string>} [files={}]
 * @returns {{
 *   files: Record<string, string>,
 *   projectTags: Array<any>,
 *   projectCharacters: Array<any>,
 *   playerCharacter: any,
 *   playerCharacters: Array<any>,
 *   projectTemplates: Array<any>,
 *   projectLocations: Array<any>,
 *   projectItems: Array<any>,
 *   items: Array<any>,
 *   projectStats: Array<any>,
 *   projectSkills: Array<any>,
 *   projectParameters: Array<any>,
 *   projectFeatures: Array<any>,
 *   projectParagraphs: Array<any>,
 *   projectScenes: Array<any>
 * }}
 */
export function extractProjectData(project, files = {}) {
    if (!project) {
        return {
            files: {},
            projectTags: [],
            projectCharacters: [],
            playerCharacter: null,
            playerCharacters: [],
            projectTemplates: [],
            projectLocations: [],
            projectStats: [],
            projectSkills: [],
            projectParameters: [],
            projectFeatures: [],
            projectParagraphs: [],
            projectScenes: [],
        }
    }

    const scenes = typeof project.getScenes === 'function' ? project.getScenes() : []
    let paragraphs = []
    if (typeof project.getParagraphs === 'function' && project.getParagraphs().length > 0) {
        paragraphs = [...project.getParagraphs()]
    } else {
        paragraphs = scenes.flatMap(s =>
            typeof s.getParagraphs === 'function' ? s.getParagraphs() : []
        )
    }
    const tags =
        typeof project.getAllTags === 'function'
            ? project.getAllTags()
            : typeof project.getTagList === 'function'
              ? project.getTagList()
              : []
    const characters = typeof project.getCharacters === 'function' ? project.getCharacters() : []
    const templates = typeof project.getTemplates === 'function' ? project.getTemplates() : []
    const locations = typeof project.getLocations === 'function' ? project.getLocations() : []
    const stats = typeof project.getGlobalStats === 'function' ? project.getGlobalStats() : []
    const skills = typeof project.getGlobalSkills === 'function' ? project.getGlobalSkills() : []
    const parameters =
        typeof project.getGlobalParameters === 'function' ? project.getGlobalParameters() : []
    const features =
        typeof project.getGlobalFeatures === 'function' ? project.getGlobalFeatures() : []
    const items = typeof project.getItems === 'function' ? project.getItems() : project.items || []
    const playerCharacter =
        typeof project.getPlayerCharacter === 'function'
            ? project.getPlayerCharacter()
            : project.playerCharacter || null
    const playerCharacters =
        typeof project.getPlayerCharacters === 'function'
            ? project.getPlayerCharacters()
            : project.playerCharacters || (playerCharacter ? [playerCharacter] : [])

    return {
        files: files || {},
        projectTags: tags,
        projectCharacters: characters,
        playerCharacter,
        playerCharacters,
        projectTemplates: templates,
        projectLocations: locations,
        projectItems: items,
        items,
        projectStats: stats,
        projectSkills: skills,
        projectParameters: parameters,
        projectFeatures: features,
        projectParagraphs: paragraphs,
        projectScenes: scenes,
    }
}

/**
 * Adapter scaffold for loading live project data.
 * Can accept an existing project instance via options.project, or connect
 * to ProjectManager / window.electronAPI.
 *
 * @param {import('../ViewModel/MainWindowViewModel').MainWindowViewModel} vm
 * @param {{ project?: any, projectPath?: string, files?: Record<string, string> }} [options={}]
 * @returns {Promise<{
 *   files: Record<string, string>,
 *   projectTags: Array<any>,
 *   projectCharacters: Array<any>,
 *   projectLocations: Array<any>,
 *   projectStats: Array<any>,
 *   projectSkills: Array<any>,
 *   projectParameters: Array<any>,
 *   projectFeatures: Array<any>,
 *   projectParagraphs: Array<any>,
 *   projectScenes: Array<any>
 * }>}
 */
export async function loadRealProjectData(vm, options = {}) {
    if (options.project) {
        return extractProjectData(options.project, options.files)
    }

    if (
        typeof ProjectManager !== 'undefined' &&
        ProjectManager &&
        typeof ProjectManager.getInstance === 'function'
    ) {
        const curProj = ProjectManager.getInstance().getProject()
        if (curProj) {
            return extractProjectData(curProj, options.files)
        }
    }

    // Default empty scaffold when no real project is provided yet
    return {
        files: options.files || {},
        projectTags: [],
        projectCharacters: [],
        projectTemplates: [],
        projectLocations: [],
        projectStats: [],
        projectSkills: [],
        projectParameters: [],
        projectFeatures: [],
        projectParagraphs: [],
        projectScenes: [],
    }
}

/**
 * Loads project data based on the provided configuration.
 * When useMock is true (or not specified, using USE_MOCK), returns mock data.
 * When useMock is false, switches to live project data.
 *
 * @param {import('../ViewModel/MainWindowViewModel').MainWindowViewModel} vm
 * @param {{ useMock?: boolean, project?: any, projectPath?: string, files?: Record<string, string> }} [options={}]
 * @returns {{
 *   files: Record<string, string>,
 *   projectTags: Array<any>,
 *   projectCharacters: Array<any>,
 *   projectLocations: Array<any>,
 *   projectStats: Array<any>,
 *   projectParagraphs: Array<any>,
 *   projectScenes: Array<any>
 * }}
 */
export function loadProjectData(vm, options = {}) {
    const useMock = options.useMock !== undefined ? options.useMock : USE_MOCK

    if (useMock) {
        return createMockProjectData(vm)
    }

    if (options.project) {
        return extractProjectData(options.project, options.files)
    }

    if (
        typeof ProjectManager !== 'undefined' &&
        ProjectManager &&
        typeof ProjectManager.getInstance === 'function'
    ) {
        const curProj = ProjectManager.getInstance().getProject()
        if (curProj) {
            return extractProjectData(curProj, options.files)
        }
    }

    return extractProjectData(null, options.files)
}

export { createMockProjectData, mockFiles } from './mockData.js'
