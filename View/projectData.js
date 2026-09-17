/**
 * Project Data Provider for MainWindow.
 * Serves as the central interface for loading and switching project data
 * between development mock datasets and production live project models.
 */
export {
    createMockProjectData,
    extractProjectData,
    loadProjectData,
    loadRealProjectData,
    mockFiles,
    USE_MOCK,
} from './mockData.js'
