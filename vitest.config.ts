import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
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
