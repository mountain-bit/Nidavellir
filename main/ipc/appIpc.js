const { app, BrowserWindow, ipcMain } = require('electron')
const os = require('os')
const { getTranslations, setLocale, getLocale } = require('../../Utils/i18n')
const { createMainWindow, createStartWindow } = require('../windowManager')

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

    ipcMain.handle('close-app', event => {
        const win = event?.sender ? BrowserWindow.fromWebContents(event.sender) : null
        if (win && !win.isDestroyed()) {
            win.close()
        } else {
            app.quit()
        }
    })

    ipcMain.handle('force-close-app', event => {
        const win = event?.sender ? BrowserWindow.fromWebContents(event.sender) : null
        if (win && !win.isDestroyed()) {
            win.forceClose = true
            win.close()
        } else {
            app.quit()
        }
    })

    ipcMain.handle('load-main-window', event => {
        const callerWin = BrowserWindow.fromWebContents(event.sender)
        const mainWin = createMainWindow()
        if (callerWin && !callerWin.isDestroyed() && callerWin !== mainWin) {
            callerWin.close()
        }
        return true
    })

    ipcMain.handle('load-start-window', event => {
        const callerWin = BrowserWindow.fromWebContents(event.sender)
        const startWin = createStartWindow()
        if (callerWin && !callerWin.isDestroyed() && callerWin !== startWin) {
            callerWin.close()
        }
        return true
    })
}

module.exports = { registerAppIpc }
