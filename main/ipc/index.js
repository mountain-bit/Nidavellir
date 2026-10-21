const { registerProjectIpc } = require('./projectIpc')
const { registerEntityIpc } = require('./entityIpc')
const { registerMarkdownIpc } = require('./markdownIpc')
const { registerRecentProjectsIpc } = require('./recentProjectsIpc')
const { registerAppIpc } = require('./appIpc')
const { registerAssetIpc } = require('./assetIpc')
const { registerExportIpc } = require('./exportIpc')

/**
 * Registers all IPC event handlers across domain modules.
 */
function registerAllIpc() {
    registerProjectIpc()
    registerEntityIpc()
    registerMarkdownIpc()
    registerRecentProjectsIpc()
    registerAppIpc()
    registerAssetIpc()
    registerExportIpc()
}

module.exports = { registerAllIpc }
