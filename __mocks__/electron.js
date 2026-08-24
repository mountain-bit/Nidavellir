const path = require('path')
const os = require('os')

const app = {
    getPath: name => {
        if (name === 'userData') return path.join(os.tmpdir(), 'sgp-test-userData')
        return os.tmpdir()
    },
    getLocale: () => 'pl-PL',
}

module.exports = { app }
