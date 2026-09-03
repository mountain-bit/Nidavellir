import path from 'path'
import { defineConfig } from 'vitest/config'

const rawHtmlPlugin = {
    name: 'raw-html-plugin',
    transform(code: string, id: string): { code: string; map: null } | undefined {
        if (id.endsWith('.html')) {
            return {
                code: `export default ${JSON.stringify(code)};`,
                map: null,
            }
        }
    },
}

export default defineConfig({
    plugins: [rawHtmlPlugin],
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
