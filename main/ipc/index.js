const { registerProjectIpc } = require('./projectIpc')
const { registerEntityIpc } = require('./entityIpc')
const { registerMarkdownIpc } = require('./markdownIpc')
const { registerRecentProjectsIpc } = require('./recentProjectsIpc')
const { registerAppIpc } = require('./appIpc')
const { registerAssetIpc } = require('./assetIpc')

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
}

module.exports = { registerAllIpc }
