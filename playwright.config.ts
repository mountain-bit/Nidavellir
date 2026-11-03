import { defineConfig } from '@playwright/test'

// Usuwamy ELECTRON_RUN_AS_NODE, który może być ustawiony w terminalu IDE
delete process.env.ELECTRON_RUN_AS_NODE

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 45000,
    expect: {
        timeout: 10000,
    },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
})
