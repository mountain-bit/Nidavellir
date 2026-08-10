import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            // Przekieruj import/require('electron') na mock podczas testów
            electron: path.resolve(__dirname, '__mocks__/electron.js'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.{test,spec}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            include: ['Model/**/*.ts', 'ViewModel/**/*.ts', 'Services/**/*.ts', 'Utils/**/*.ts'],
            exclude: ['node_modules/', 'dist/'],
        },
    },
})
