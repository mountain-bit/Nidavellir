import { defineConfig } from 'vitest/config'

export default defineConfig({
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
