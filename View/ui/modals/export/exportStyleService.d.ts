export interface IExportStyle {
    id: string
    name: string
    description?: string
    isBuiltIn?: boolean
    pageFormat?: string
    pageOrientation?: string
    columns?: number
    margins?: { top: number; bottom: number; left: number; right: number }
    fontFamily?: string
    fontSize?: number
    lineHeight?: number
    paragraphIndent?: number
    paragraphSpacing?: number
    textColor?: string
    accentColor?: string
    backgroundColor?: string
    headerFontFamily?: string
    headerFontSize?: number
    choiceStyle?: string
    choicePrefix?: string
    separatorType?: string
    customSeparator?: string
    grayscaleImages?: boolean
    showRunningHeader?: boolean
    showPageNumbers?: boolean
}

export declare const BUILT_IN_STYLES: IExportStyle[]
export declare function getUserStyles(): IExportStyle[]
export declare function getAllStyles(): IExportStyle[]
export declare function getStyleById(id: string): IExportStyle
export declare function saveCustomStyle(styleConfig: Partial<IExportStyle>): IExportStyle
export declare function deleteCustomStyle(id: string): boolean
