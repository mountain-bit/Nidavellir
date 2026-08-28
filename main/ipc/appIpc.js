const { app, BrowserWindow, ipcMain } = require('electron')
const os = require('os')
const { getTranslations, setLocale, getLocale } = require('../../Utils/i18n')

function registerAppIpc() {
    ipcMain.handle('get-translations', () => {
        return getTranslations()
    })

    ipcMain.handle('get-locale', () => {
        return getLocale()
    })

    ipcMain.handle('set-locale', async (_event, locale) => {
        return await setLocale(locale)
    })

    ipcMain.handle('get-system-username', () => {
        try {
            const userInfo = os.userInfo()
            if (userInfo && userInfo.username) {
                return userInfo.username
            }
        } catch (err) {
            console.error('Error getting system username:', err)
        }
        return process.env.USERNAME || process.env.USER || ''
    })

    ipcMain.handle('close-app', () => {
        app.quit()
    })

    ipcMain.handle('load-main-window', event => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
            win.loadFile('index.html')
        }
    })
}

module.exports = { registerAppIpc }
