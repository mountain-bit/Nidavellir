/**
 * Mock modułu 'electron' dla testów (Vitest/Jest automatic mock).
 * Umieszczony w __mocks__/electron.js — Node.js automatycznie go używa
 * gdy Vitest mockuje moduł 'electron' przez vi.mock('electron').
 */
const path = require('path');
const os = require('os');

const app = {
    getPath: (name) => {
        if (name === 'userData') return path.join(os.tmpdir(), 'sgp-test-userData');
        return os.tmpdir();
    },
    getLocale: () => 'pl-PL',
};

module.exports = { app };
