const { registerProjectIpc } = require('./projectIpc')
const { registerEntityIpc } = require('./entityIpc')
const { registerMarkdownIpc } = require('./markdownIpc')
const { registerRecentProjectsIpc } = require('./recentProjectsIpc')
const { registerAppIpc } = require('./appIpc')

/**
 * Registers all IPC event handlers across domain modules.
 */
function registerAllIpc() {
    registerProjectIpc()
    registerEntityIpc()
    registerMarkdownIpc()
    registerRecentProjectsIpc()
    registerAppIpc()
}

module.exports = { registerAllIpc }
