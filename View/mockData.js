import {
    Choice,
    DEFAULT_SCENE_COLOR,
    Description,
    Paragraph,
    ProjectManager,
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
    const factory = vm?.factory
    const projectTags = [
        factory.createTag('Ważne', '#ef4444'),
        factory.createTag('Walka', '#dc2626'),
        factory.createTag('Magia', '#8b5cf6'),
    ]

    const projectCharacters = [
        factory.createCharacter('Strażnik miejski'),
        factory.createCharacter('Kupiec Jan'),
    ]

    const projectTemplates = [
        factory.createTemplate('Archetyp Strażnika'),
        factory.createTemplate('Bandyta leśny (szablon)'),
    ]

    const projectLocations = [
        factory.createLocation('Karczma Pod Różą'),
        factory.createLocation('Mroczny Las'),
    ]

    const projectStats = [factory.createStat('Siła'), factory.createStat('Zręczność')]
    const projectSkills = [
        factory.createSkill('Walka wręcz', 'Skill', 'direct', '+3'),
        factory.createSkill('Skradanie', 'Skill', 'stat_mod', '', 'Zręczność', '+2'),
    ]
    const projectParameters = [
        factory.createParameter('Punkty Życia (HP)', 'Param', 'direct', 100),
        factory.createParameter('Mana', 'Param', 'formula', '', 'Inteligencja * 2', 20),
    ]
    const projectFeatures = [factory.createFeature('Noktowizja', 'Pozwala widzieć w ciemnościach')]
    const projectItems = [
        {
            id: 'item_sword',
            name: 'Miecz żelazny',
            description: {
                text: 'Ostrze wykute w krasnoludzkiej kuźni, niezastąpione w boju.',
                summary: 'Solidny miecz żelazny.',
            },
        },
        {
            id: 'item_potion',
            name: 'Mikstura leczenia',
            description: {
                text: 'Czerwony eliksir przywracający siły witalne rannemu wędrowcowi.',
                summary: 'Leczniczy wywar ziołowy.',
            },
        },
    ]

    const p1 = new Paragraph(
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
    )

    const p2 = new Paragraph(
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
    )

    const p3 = new Paragraph(
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
    )

    const startNode = new Paragraph(
        'start',
        'START',
        new Description(
            'Rozpoczynasz swoją przygodę. Przed tobą wrota przeznaczenia.',
            'Węzeł startowy opowieści.'
        ),
        [new Choice('c_start', 'Rozpocznij przygodę', 'start', 'p1')],
        false,
        undefined,
        []
    )
    startNode.setIsStart(true)
    startNode.setPosition({ x: 40, y: 180 })

    const projectParagraphs = [startNode, p1, p2, p3]

    p1.setPosition({ x: 180, y: 180 })
    p2.setPosition({ x: 480, y: 90 })
    p3.setPosition({ x: 480, y: 290 })

    const projectScenes = [
        new Scene(
            's1',
            'Wstęp do przygody',
            new Description(),
            [p1],
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
            [p2, p3],
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

    const playerCharacter = {
        id: 'hero_player',
        name: 'Geralt z Rivii',
        avatar: 'wizard',
        characterClass: 'Wędrowiec / Tropiciel',
        summary: 'Doświadczony wędrowiec przemierzający nieznane krainy.',
        description: {
            summary: 'Doświadczony wędrowiec przemierzający nieznane krainy.',
            text: '# Kronika Bohatera\n\nWędrowiec przemierzający niebezpieczne szlaki w poszukiwaniu wiedzy i przygód.',
        },
        tags: [projectTags[0]],
        stats: [projectStats[0], projectStats[1]],
        parameters: [projectParameters[0], projectParameters[1]],
        skills: [projectSkills[0], projectSkills[1]],
        customAttributes: [
            { id: 'attr_origin', name: 'Pochodzenie', value: 'Północne Królestwa' },
            { id: 'attr_destiny', name: 'Status', value: 'Wolny strzelec' },
        ],
        files: [],
        getId: () => 'hero_player',
        getName: () => 'Geralt z Rivii',
        getAvatar: () => 'wizard',
        getCharacterClass: () => 'Wędrowiec / Tropiciel',
        getContent: () => ({
            getSummary: () => 'Doświadczony wędrowiec przemierzający nieznane krainy.',
            getText: () =>
                '# Kronika Bohatera\n\nWędrowiec przemierzający niebezpieczne szlaki w poszukiwaniu wiedzy i przygód.',
        }),
        getTags: () => [projectTags[0]],
        getStats: () => [projectStats[0], projectStats[1]],
        getParameters: () => [projectParameters[0], projectParameters[1]],
        getSkills: () => [projectSkills[0], projectSkills[1]],
        getCustomAttributes: () => [
            { id: 'attr_origin', name: 'Pochodzenie', value: 'Północne Królestwa' },
            { id: 'attr_destiny', name: 'Status', value: 'Wolny strzelec' },
        ],
    }

    return {
        files: { ...mockFiles },
        projectTags,
        projectCharacters,
        playerCharacter,
        projectTemplates,
        projectLocations,
        projectStats,
        projectSkills,
        projectParameters,
        projectFeatures,
        projectItems,
        items: projectItems,
        projectParagraphs,
        projectScenes,
    }
}

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
