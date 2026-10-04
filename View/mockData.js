import {
    Choice,
    DEFAULT_SCENE_COLOR,
    Description,
    Paragraph,
    Scene,
    TextCondition,
} from '../dist/ViewModel/MainWindowViewModel.js'

/**
 * Mock files state representing Markdown documents in development mode.
 */
export const mockFiles = {
    'Wprowadzenie.md': '# Wprowadzenie\n\nWitaj w edytorze gry paragrafowej...',
    'Zasady.md': '# Zasady Gry\n\nTwój bohater posiada cechy oraz ekwipunek...',
}

/**
 * Creates and initializes mock project entities (tags, characters, locations,
 * stats, paragraphs with choices/conditions, and scenes).
 *
 * @param {import('../ViewModel/MainWindowViewModel').MainWindowViewModel} vm
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
export function createMockProjectData(vm) {
    const projectTags = [
        vm.createTag('Ważne', '#ef4444'),
        vm.createTag('Walka', '#dc2626'),
        vm.createTag('Magia', '#8b5cf6'),
    ]

    const projectCharacters = [
        vm.createCharacter('Strażnik miejski'),
        vm.createCharacter('Kupiec Jan'),
    ]

    const projectTemplates = [
        vm.createTemplate('Archetyp Strażnika'),
        vm.createTemplate('Bandyta leśny (szablon)'),
    ]

    const projectLocations = [
        vm.createLocation('Karczma Pod Różą'),
        vm.createLocation('Mroczny Las'),
    ]

    const projectStats = [vm.createStat('Siła'), vm.createStat('Zręczność')]
    const projectSkills = [
        vm.createSkill('Walka wręcz', 'Skill', 'direct', '+3'),
        vm.createSkill('Skradanie', 'Skill', 'stat_mod', '', 'Zręczność', '+2'),
    ]
    const projectParameters = [
        vm.createParameter('Punkty Życia (HP)', 'Param', 'direct', 100),
        vm.createParameter('Mana', 'Param', 'formula', '', 'Inteligencja * 2', 20),
    ]
    const projectFeatures = [vm.createFeature('Noktowizja', 'Pozwala widzieć w ciemnościach')]

    const projectParagraphs = [
        new Paragraph(
            'p1',
            'Prolog: Przebudzenie',
            new Description(
                'Budzisz się w starej karczmie. Za oknem szaleje burza.',
                'Przebudzenie w gospodzie podczas nocnej nawałnicy.'
            ),
            [
                new Choice(
                    'c1',
                    'Idź do lasu',
                    'p1',
                    'p2',
                    new TextCondition('cond1', 'Pochodnia', 'Wymagana zapalona pochodnia')
                ),
                new Choice('c2', 'Zbadaj komnatę', 'p1', 'p3'),
            ],
            false,
            undefined,
            [projectTags[0]]
        ),
        new Paragraph(
            'p2',
            'Mroczny trakt leśny',
            new Description(
                'Ścieżka prowadzi przez gęsty las pełen niebezpieczeństw.',
                'Wkroczenie na niebezpieczny trakt w leśnych ostępach.'
            ),
            [],
            false,
            undefined,
            [projectTags[1]]
        ),
        new Paragraph(
            'p3',
            'Komnata runiczna',
            new Description(
                'Blask runów oświetla starożytne zwoje i artefakty.',
                'Odnalezienie sekretnej komnaty z mistycznymi runami.'
            ),
            [],
            false,
            undefined,
            [projectTags[2]]
        ),
    ]

    projectParagraphs[0].setPosition({ x: 180, y: 180 })
    projectParagraphs[1].setPosition({ x: 480, y: 90 })
    projectParagraphs[2].setPosition({ x: 480, y: 290 })

    const projectScenes = [
        new Scene(
            's1',
            'Wstęp do przygody',
            new Description(),
            [projectParagraphs[0]],
            [projectCharacters[0]],
            null,
            [],
            '',
            { x: 50, y: 70 },
            260,
            220,
            DEFAULT_SCENE_COLOR || '#3b82f6'
        ),
        new Scene(
            's2',
            'Eksploracja lasu',
            new Description(),
            [projectParagraphs[1], projectParagraphs[2]],
            [projectCharacters[1]],
            null,
            [],
            '',
            { x: 350, y: 20 },
            260,
            360,
            '#10b981'
        ),
    ]

    return {
        files: { ...mockFiles },
        projectTags,
        projectCharacters,
        projectTemplates,
        projectLocations,
        projectStats,
        projectSkills,
        projectParameters,
        projectFeatures,
        projectParagraphs,
        projectScenes,
    }
}

/**
 * Global default flag controlling whether MainWindow should initialize with mock data.
 * Set to false when ready to switch to live project data by default.
 */
export const USE_MOCK = true

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
 *   projectLocations: Array<any>,
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
    const paragraphs = scenes.flatMap(s =>
        typeof s.getParagraphs === 'function' ? s.getParagraphs() : []
    )
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

    return {
        files: files || {},
        projectTags: tags,
        projectCharacters: characters,
        projectTemplates: templates,
        projectLocations: locations,
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

    return extractProjectData(options.project, options.files)
}
