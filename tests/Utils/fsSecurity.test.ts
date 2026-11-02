import fs from 'fs'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
    resolveProjectDir,
    isPathInsideBase,
    validateProjectData,
    atomicWriteStringSync,
    atomicWriteJsonSync,
} = require('../../Utils/fs/fsSecurity.js')

describe('fsSecurity', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgp-fs-sec-'))
    })

    afterEach(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })

    describe('resolveProjectDir', () => {
        it('returns directory path when given an existing directory', () => {
            expect(resolveProjectDir(tempDir)).toBe(tempDir)
        })

        it('returns parent directory when given an existing file path', () => {
            const filePath = path.join(tempDir, 'project.json')
            fs.writeFileSync(filePath, '{}', 'utf8')
            expect(resolveProjectDir(filePath)).toBe(tempDir)
        })

        it('returns null for non-existent or invalid paths', () => {
            expect(resolveProjectDir('')).toBeNull()
            expect(resolveProjectDir(null)).toBeNull()
            expect(resolveProjectDir(path.join(tempDir, 'missing_folder'))).toBeNull()
        })
    })

    describe('isPathInsideBase', () => {
        it('allows paths inside base directory and the base directory itself', () => {
            expect(isPathInsideBase(tempDir, tempDir)).toBe(true)
            expect(isPathInsideBase(tempDir, path.join(tempDir, 'Scenes', 'scene1.json'))).toBe(
                true
            )
        })

        it('blocks directory traversal and sibling prefix collisions', () => {
            expect(isPathInsideBase(tempDir, path.join(tempDir, '..', 'outside.txt'))).toBe(false)
            expect(isPathInsideBase(tempDir, `${tempDir}_sibling`)).toBe(false)
            expect(isPathInsideBase('', tempDir)).toBe(false)
            expect(isPathInsideBase(tempDir, '')).toBe(false)
        })
    })

    describe('validateProjectData', () => {
        it('validates minimal valid project schema', () => {
            expect(
                validateProjectData({
                    name: 'Gra',
                    descriptionPaths: [],
                    dataPaths: [],
                })
            ).toBe(true)
        })

        it('rejects malformed project payloads', () => {
            expect(validateProjectData(null)).toBe(false)
            expect(validateProjectData({})).toBe(false)
            expect(validateProjectData({ name: 123, descriptionPaths: [], dataPaths: [] })).toBe(
                false
            )
            expect(
                validateProjectData({ name: 'Gra', descriptionPaths: null, dataPaths: [] })
            ).toBe(false)
        })
    })

    describe('atomicWriteStringSync & atomicWriteJsonSync', () => {
        it('atomically writes string and JSON files and creates missing parent directories', () => {
            const targetTxt = path.join(tempDir, 'nested', 'dir', 'test.txt')
            atomicWriteStringSync(targetTxt, 'Witaj świecie!')
            expect(fs.readFileSync(targetTxt, 'utf8')).toBe('Witaj świecie!')

            const targetJson = path.join(tempDir, 'nested', 'data.json')
            atomicWriteJsonSync(targetJson, { id: 'p1', count: 5 })
            expect(JSON.parse(fs.readFileSync(targetJson, 'utf8'))).toEqual({ id: 'p1', count: 5 })

            // Ensure no .tmp files remain
            const filesInNested = fs.readdirSync(path.join(tempDir, 'nested'))
            expect(filesInNested.some(f => f.endsWith('.tmp'))).toBe(false)
        })

        it('cleans up temporary file when renameSync fails', () => {
            const targetFile = path.join(tempDir, 'fail.txt')
            const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
                throw new Error('Simulated rename error')
            })

            expect(() => atomicWriteStringSync(targetFile, 'content')).toThrow(
                'Simulated rename error'
            )

            const remainingFiles = fs.readdirSync(tempDir)
            expect(remainingFiles.filter(f => f.endsWith('.tmp'))).toEqual([])

            renameSpy.mockRestore()
        })
    })
})
