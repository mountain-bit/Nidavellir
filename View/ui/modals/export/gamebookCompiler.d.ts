/* eslint-disable @typescript-eslint/no-explicit-any */
import { IExportStyle } from './exportStyleService'

export interface ICompiledCharacterSheet {
    id: string
    name: string
    characterClass: string
    summary: string
    avatar: string
    stats: Array<{ name: string; value: string | number }>
    parameters: Array<{
        name: string
        value: string | number
        currentValue?: string | number
        maxValue?: string | number
    }>
    skills: Array<{ name: string; value: string | number }>
    features: Array<{ name: string; description: string }>
    items: Array<{ name: string }>
    inventories: Array<{
        id: string
        name: string
        capacity: number
        items: Array<{ name: string; description: string }>
    }>
    tags: string[]
    [key: string]: any
}

export interface ICompiledGamebook {
    title: string
    author: string
    includeCoverPage: boolean
    rulesContent: string
    characterSheet: any
    characterSheets?: any[]
    startSections: any[]
    endSections: any[]
    paragraphs: any[]
    paragraphMap?: Record<string, number>
    styleConfig: IExportStyle
}

export declare function getAvailablePlayerCharacters(ctx: any): any[]
export declare function compileCharacterSheet(hero: any): any

export declare function compileGamebook(
    ctx: any,
    options?: any,
    styleConfig?: any
): ICompiledGamebook

export declare function generatePrintHtml(
    bookData: ICompiledGamebook,
    styleConfig?: Partial<IExportStyle>
): string

export declare function extractText(entityOrDesc: any, ctx?: any): string

export declare function extractEntityMarkdown(entityOrDesc: any, ctx?: any): string

export declare function markdownToHtml(mdText: string, paragraphMap?: any): string

export declare function parseCombatBlock(combatText: string, paragraphMap?: any): any

export declare function renderCombatHtml(combatData: any, paragraphMap?: any): string

export declare function formatInlineMarkdown(str: string, paragraphMap?: any): string

export declare function escapeHtml(str: string): string
export declare function stripEmojis(text: string): string
