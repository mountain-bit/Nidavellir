import { expect, Locator, Page } from '@playwright/test'

export class MainWindowPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    // Top Bar Locators
    readonly projectNameDisplay = (): Locator => this.page.locator('#project-name-display')
    readonly dirtyIndicator = (): Locator => this.page.locator('#project-dirty-indicator')
    readonly saveBtn = (): Locator => this.page.locator('button[data-action="save"]')
    readonly quickSearchBtn = (): Locator => this.page.locator('button[data-action="quick-search"]')
    readonly validationBadge = (): Locator => this.page.locator('#topbar-validation-badge')

    // Quick Search Modal
    readonly quickSearchModal = (): Locator => this.page.locator('#modal-quick-search')
    readonly quickSearchInput = (): Locator => this.page.locator('#quick-search-input')
    readonly quickSearchResults = (): Locator => this.page.locator('#quick-search-results')

    // Unsaved Changes Modal
    readonly unsavedChangesModal = (): Locator => this.page.locator('#unsaved-changes-modal')
    readonly unsavedSaveBtn = (): Locator => this.page.locator('#btn-unsaved-save')
    readonly unsavedDontSaveBtn = (): Locator => this.page.locator('#btn-unsaved-dont-save')
    readonly unsavedCancelBtn = (): Locator => this.page.locator('#btn-unsaved-cancel')

    // Story Graph Canvas & Controls
    readonly storyGraphCanvas = (): Locator => this.page.locator('#story-graph')
    readonly zoomInBtn = (): Locator => this.page.locator('#btn-graph-zoom-in')
    readonly zoomOutBtn = (): Locator => this.page.locator('#btn-graph-zoom-out')
    readonly zoomResetBtn = (): Locator => this.page.locator('#btn-graph-zoom-reset')
    readonly zoomFitBtn = (): Locator => this.page.locator('#btn-graph-zoom-fit')
    readonly zoomLevelBadge = (): Locator => this.page.locator('#graph-zoom-level-badge')
    readonly paragraphNodes = (): Locator => this.page.locator('paragraph-node')
    readonly firstParagraphNode = (): Locator => this.page.locator('paragraph-node').first()

    // View Mode Toggles
    readonly viewGraphBtn = (): Locator => this.page.locator('button[data-action="show-graph"]')
    readonly viewEditorBtn = (): Locator =>
        this.page.locator('button[data-action="switch-markdown"]')
    readonly graphContainer = (): Locator => this.page.locator('#graph-container')
    readonly markdownContainer = (): Locator => this.page.locator('#markdown-container')

    // Markdown Editor Locators
    readonly richEditorMount = (): Locator => this.page.locator('#rich-editor-mount')
    readonly proseMirrorEditor = (): Locator => this.page.locator('#rich-editor-mount .ProseMirror')
    readonly activeFileLabel = (): Locator => this.page.locator('#active-file-label')
    readonly editorToolbar = (): Locator => this.page.locator('#editor-toolbar')
    readonly editorEmptyState = (): Locator => this.page.locator('#editor-empty-state')
    readonly boldBtn = (): Locator => this.page.locator('#btn-editor-bold')
    readonly h2Btn = (): Locator => this.page.locator('#btn-editor-h2')

    // Right Details Panel
    readonly rightSidebar = (): Locator => this.page.locator('#right-sidebar')
    readonly detailsContent = (): Locator => this.page.locator('#details-content')
    readonly openPlayerTextBtn = (): Locator => this.page.locator('#btn-open-player-text')

    // Details Panel - Exits and Choices
    readonly detailsExitsList = (): Locator => this.page.locator('#details-exits-list')
    readonly firstInspectExitBtn = (): Locator =>
        this.page.locator('#details-exits-list .btn-inspect-exit').first()
    readonly choiceNameInput = (): Locator => this.page.locator('#details-choice-name-input')
    readonly choiceAddFeatureSelect = (): Locator => this.page.locator('#choice-add-feature-select')
    readonly choiceConditionTextInput = (): Locator => this.page.locator('#details-condition-text')
    readonly choiceDiceTypeSelect = (): Locator => this.page.locator('#choice-dice-type')
    readonly choiceDiceStatInput = (): Locator => this.page.locator('#choice-dice-stat')
    readonly choiceDiceDescInput = (): Locator => this.page.locator('#choice-dice-desc')
    readonly choiceDiceBranchesList = (): Locator => this.page.locator('#choice-dice-branches-list')

    // Combat Module Locators
    readonly combatToggleBtn = (): Locator => this.page.locator('#btn-toggle-combat-state')
    readonly combatOpponentsToggleAddBtn = (): Locator =>
        this.page.locator('#btn-toggle-add-opponent')
    readonly combatOpponentSelect = (): Locator => this.page.locator('#combat-add-opponent-select')
    readonly combatOpponentSubmitBtn = (): Locator => this.page.locator('#btn-submit-add-opponent')
    readonly combatOpponentsList = (): Locator => this.page.locator('.combat-module-container')
    readonly combatOutcomesToggleAddBtn = (): Locator =>
        this.page.locator('#btn-toggle-add-outcome')
    readonly combatOutcomeNameInput = (): Locator => this.page.locator('#combat-add-outcome-name')
    readonly combatOutcomeTargetModeNewBtn = (): Locator =>
        this.page.locator('#btn-outcome-target-mode-new')
    readonly combatOutcomeNewTitleInput = (): Locator =>
        this.page.locator('#combat-add-outcome-new-title')
    readonly combatOutcomeSubmitBtn = (): Locator => this.page.locator('#btn-submit-add-outcome')
    readonly combatOutcomesList = (): Locator => this.page.locator('[data-outcome-id]')

    // Graph Validation Locators
    readonly validateGraphBtn = (): Locator =>
        this.page.locator('button[data-action="validate-graph"]')
    readonly validationModal = (): Locator => this.page.locator('#modal-validation-report')
    readonly validationSummaryText = (): Locator => this.page.locator('#validation-summary-text')
    readonly validationIssuesContainer = (): Locator =>
        this.page.locator('#validation-issues-container')
    readonly validationGotoBtns = (): Locator => this.page.locator('.btn-goto-paragraph')
    readonly closeValidationModalBtn = (): Locator =>
        this.page.locator('#btn-close-validation-modal')
    readonly okValidationModalBtn = (): Locator => this.page.locator('#btn-validation-ok')

    // Paragraph Role Locators
    readonly paragraphRoleEndRadio = (): Locator => this.page.locator('#details-paragraph-role-end')
    readonly paragraphRoleRegularRadio = (): Locator =>
        this.page.locator('#details-paragraph-role-regular')
    readonly paragraphRoleBadge = (): Locator => this.page.locator('#details-paragraph-role-badge')

    // Playtest Simulator Locators
    readonly runGameBtn = (): Locator => this.page.locator('button[data-action="run-game"]')
    readonly playtestModal = (): Locator => this.page.locator('#modal-playtest')
    readonly playtestParagraphBadge = (): Locator => this.page.locator('#playtest-paragraph-badge')
    readonly playtestContent = (): Locator => this.page.locator('#playtest-content')
    readonly playtestChoicesContainer = (): Locator =>
        this.page.locator('#playtest-choices-container')
    readonly playtestChoiceBtns = (): Locator => this.page.locator('.btn-playtest-choice')
    readonly playtestBackBtn = (): Locator => this.page.locator('#btn-playtest-back')
    readonly playtestRestartBtn = (): Locator => this.page.locator('#btn-playtest-restart')
    readonly playtestCloseBtn = (): Locator => this.page.locator('#btn-close-playtest-modal')
    readonly playtestTeleportToggleBtn = (): Locator =>
        this.page.locator('#btn-playtest-teleport-toggle')
    readonly playtestTeleportPanel = (): Locator => this.page.locator('#playtest-teleport-panel')
    readonly playtestTeleportParagraphSelect = (): Locator =>
        this.page.locator('#playtest-teleport-paragraph-select')
    readonly playtestTeleportSubmitBtn = (): Locator =>
        this.page.locator('#btn-playtest-teleport-submit')
    readonly playtestEndRestartBtn = (): Locator => this.page.locator('#btn-playtest-end-restart')

    // Export Modal Locators
    readonly exportModalBtn = (): Locator => this.page.locator('button[data-action="export-game"]')
    readonly exportModal = (): Locator => this.page.locator('#modal-export-project')
    readonly exportFormatCard = (format: string): Locator =>
        this.page.locator(`.export-format-card[data-format="${format}"]`)
    readonly exportZipSection = (): Locator => this.page.locator('#export-section-zip-options')
    readonly exportBookSection = (): Locator => this.page.locator('#export-section-book-options')
    readonly exportStyleSelect = (): Locator => this.page.locator('#export-style-select')
    readonly exportSeparatorSelect = (): Locator => this.page.locator('#export-opt-separator')
    readonly exportShuffleCheckbox = (): Locator => this.page.locator('#export-opt-shuffle')
    readonly exportCoverCheckbox = (): Locator => this.page.locator('#export-opt-cover')
    readonly exportRulesCheckbox = (): Locator => this.page.locator('#export-opt-rules')
    readonly exportGlossaryCheckbox = (): Locator => this.page.locator('#export-opt-glossary')
    readonly exportLocationsCheckbox = (): Locator => this.page.locator('#export-opt-locations')
    readonly exportCharacterSheetContainer = (): Locator =>
        this.page.locator('#export-container-character-sheet')
    readonly exportCharacterSheetCheckbox = (): Locator =>
        this.page.locator('#export-opt-character-sheet')
    readonly exportSingleHeroIndicator = (): Locator =>
        this.page.locator('#export-single-hero-indicator')
    readonly exportStatCount = (): Locator => this.page.locator('#export-stat-count')
    readonly exportStatWords = (): Locator => this.page.locator('#export-stat-words')
    readonly exportStatPages = (): Locator => this.page.locator('#export-stat-pages')
    readonly exportMiniPreview = (): Locator => this.page.locator('#export-mini-preview-content')
    readonly exportConfirmBtn = (): Locator => this.page.locator('#btn-confirm-export')
    readonly exportCancelBtn = (): Locator => this.page.locator('#btn-cancel-export')
    readonly exportCloseBtn = (): Locator => this.page.locator('#btn-close-export-modal')

    // Asset Manager Locators
    readonly openAssetsBtn = (): Locator => this.page.locator('button[data-action="open-assets"]')
    readonly assetManagerModal = (): Locator => this.page.locator('#asset-manager-modal')
    readonly closeAssetManagerBtn = (): Locator =>
        this.page.locator('#btn-close-asset-manager-modal')
    readonly assetManagerEmpty = (): Locator => this.page.locator('#asset-manager-empty')
    readonly assetManagerCountBadge = (): Locator => this.page.locator('#asset-manager-count-badge')
    readonly assetManagerGrid = (): Locator => this.page.locator('#asset-manager-grid')
    readonly assetCards = (): Locator => this.page.locator('#asset-manager-grid [data-asset-path]')
    readonly assetCardByPath = (path: string): Locator =>
        this.page.locator(`#asset-manager-grid [data-asset-path="${path}"]`)
    readonly assetSearchInput = (): Locator => this.page.locator('#asset-manager-search')
    readonly assetFilterTypeSelect = (): Locator => this.page.locator('#asset-manager-filter-type')
    readonly assetSortSelect = (): Locator => this.page.locator('#asset-manager-sort')
    readonly assetDetailPlaceholder = (): Locator => this.page.locator('#asset-detail-placeholder')
    readonly assetDetailContent = (): Locator => this.page.locator('#asset-detail-content')
    readonly assetDetailName = (): Locator => this.page.locator('#asset-detail-name')
    readonly assetDetailPath = (): Locator => this.page.locator('#asset-detail-path')
    readonly assetDetailSize = (): Locator => this.page.locator('#asset-detail-size')
    readonly assetActionRenameBtn = (): Locator => this.page.locator('#btn-asset-action-rename')
    readonly assetActionDeleteBtn = (): Locator => this.page.locator('#btn-asset-action-delete')
    readonly assetActionCopyMdBtn = (): Locator =>
        this.page.locator('#btn-asset-action-copy-markdown')
    readonly assetRenameDialog = (): Locator => this.page.locator('#asset-rename-dialog')
    readonly assetRenameInput = (): Locator => this.page.locator('#asset-rename-input')
    readonly assetRenameConfirmBtn = (): Locator => this.page.locator('#btn-confirm-asset-rename')
    readonly assetRenameCancelBtn = (): Locator => this.page.locator('#btn-cancel-asset-rename')
    readonly assetDeleteDialog = (): Locator => this.page.locator('#asset-delete-dialog')
    readonly assetDeleteConfirmBtn = (): Locator => this.page.locator('#btn-confirm-asset-delete')
    readonly assetDeleteCancelBtn = (): Locator => this.page.locator('#btn-cancel-asset-delete')

    // Close Project Locator
    readonly closeProjectBtn = (): Locator =>
        this.page.locator('button[data-action="close-project"]')

    /**
     * Oczekuje na pełne załadowanie okna głównego i widoczność projektu.
     */
    async waitForReady(expectedProjectName?: string): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded')
        await this.page.setViewportSize({ width: 1400, height: 900 }).catch(() => {})
        await expect(this.projectNameDisplay()).toBeVisible({ timeout: 15000 })
        if (expectedProjectName) {
            await expect(this.projectNameDisplay()).toContainText(expectedProjectName)
        }
    }

    /**
     * Klika przycisk Zapisz w górnym pasku i oczekuje na potwierdzenie zapisu.
     */
    async saveProject(): Promise<void> {
        await this.saveBtn().dispatchEvent('click')
        await expect(this.dirtyIndicator()).toHaveClass(/text-emerald-400/, {
            timeout: 10000,
        })
    }

    /**
     * Otwiera modal szybkiego wyszukiwania.
     */
    async openQuickSearch(): Promise<void> {
        await this.quickSearchBtn().dispatchEvent('click')
        if (!(await this.quickSearchModal().isVisible())) {
            await this.page.keyboard.press('Control+p')
        }
        await expect(this.quickSearchModal()).toBeVisible()
    }

    /**
     * Zamyka modal szybkiego wyszukiwania klawiszem Escape.
     */
    async closeQuickSearch(): Promise<void> {
        await this.page.keyboard.press('Escape')
        await expect(this.quickSearchModal()).toBeHidden()
    }

    /**
     * Tworzy nowy paragraf połączony wyborem z wybranego węzła źródłowego.
     */
    async addNewConnectedParagraph(sourceNode: Locator, title: string): Promise<void> {
        await sourceNode.scrollIntoViewIfNeeded().catch(() => {})
        await sourceNode.evaluate((el: HTMLElement) => {
            if (typeof (el as any).openAddForm === 'function') {
                ;(el as any).openAddForm()
            }
        })
        const addInput = sourceNode.locator('.paragraph-node-add-input')
        if (!(await addInput.isVisible())) {
            const addBtn = sourceNode.locator('.paragraph-node-add-btn')
            await addBtn.dispatchEvent('click').catch(() => {})
        }
        await expect(addInput).toBeVisible({ timeout: 5000 })
        await addInput.fill(title)
        await addInput.press('Enter')
        const targetNode = this.page.locator('paragraph-node', { hasText: title })
        await expect(targetNode).toBeVisible({ timeout: 10000 })
    }

    /**
     * Zaznacza węzeł paragrafu na płótnie, otwierając prawy panel właściwości.
     */
    async selectParagraphNode(nodeLocator: Locator): Promise<void> {
        await nodeLocator.locator('.paragraph-node-header').click()
        await expect(this.rightSidebar()).toBeVisible()
    }

    /**
     * Przełącza widok na edytor Markdown.
     */
    async switchToMarkdownView(): Promise<void> {
        await this.viewEditorBtn().dispatchEvent('click')
        await expect(this.markdownContainer()).toBeVisible()
    }

    /**
     * Przełącza widok na graf historii.
     */
    async switchToGraphView(): Promise<void> {
        await this.viewGraphBtn().dispatchEvent('click')
        await expect(this.graphContainer()).toBeVisible()
    }

    /**
     * Otwiera plik opisu aktywnego paragrafu w edytorze tekstu.
     */
    async openActiveParagraphDescription(): Promise<void> {
        await this.openPlayerTextBtn().click()
    }

    /**
     * Wprowadza treść do edytora ProseMirror.
     */
    async typeIntoEditor(text: string): Promise<void> {
        await expect(this.proseMirrorEditor()).toBeVisible()
        await this.proseMirrorEditor().click()
        await this.page.keyboard.insertText(text)
    }

    /**
     * Otwiera panel szczegółów pierwszego wyjścia z aktywnego paragrafu.
     */
    async inspectFirstExit(): Promise<void> {
        await expect(this.firstInspectExitBtn()).toBeVisible()
        await this.firstInspectExitBtn().click()
        await expect(this.choiceNameInput()).toBeVisible()
    }

    /**
     * Zmienia nazwę aktualnie badanego wyboru.
     */
    async renameChoice(name: string): Promise<void> {
        await expect(this.choiceNameInput()).toBeVisible()
        await this.choiceNameInput().fill(name)
        await this.choiceNameInput().blur()
    }

    /**
     * Dodaje warunek tekstowy do aktualnie badanego wyboru.
     */
    async addTextConditionToChoice(conditionText: string): Promise<void> {
        await expect(this.choiceAddFeatureSelect()).toBeVisible()
        await this.choiceAddFeatureSelect().selectOption('cond-text')
        await expect(this.choiceConditionTextInput()).toBeVisible()
        await this.choiceConditionTextInput().fill(conditionText)
        await this.choiceConditionTextInput().blur()
    }

    /**
     * Dodaje i konfiguruje test rzutu kością w aktualnie badanym wyborze.
     */
    async addDiceCheckToChoice(options: {
        dice?: string
        stat?: string
        desc?: string
    }): Promise<void> {
        await expect(this.choiceAddFeatureSelect()).toBeVisible()
        await this.choiceAddFeatureSelect().selectOption('dice')
        await expect(this.choiceDiceTypeSelect()).toBeVisible()

        if (options.dice) {
            await this.choiceDiceTypeSelect().selectOption(options.dice)
        }
        if (options.stat) {
            await this.choiceDiceStatInput().fill(options.stat)
            await this.choiceDiceStatInput().blur()
        }
        if (options.desc) {
            await this.choiceDiceDescInput().fill(options.desc)
            await this.choiceDiceDescInput().blur()
        }
    }

    /**
     * Włącza lub wyłącza moduł walki w wybranym paragrafie.
     */
    async toggleCombat(): Promise<void> {
        await expect(this.combatToggleBtn()).toBeVisible()
        await this.combatToggleBtn().click()
    }

    /**
     * Dodaje przeciwnika do starcia z listy dostępnych NPC.
     */
    async addCombatOpponent(npcName: string): Promise<void> {
        await expect(this.combatOpponentsToggleAddBtn()).toBeVisible()
        await this.combatOpponentsToggleAddBtn().click()
        await expect(this.combatOpponentSelect()).toBeVisible()
        await this.combatOpponentSelect().selectOption({ label: npcName })
        await this.combatOpponentSubmitBtn().click()
    }

    /**
     * Dodaje nowy rezultat walki tworzący nowy paragraf docelowy na grafie.
     */
    async addCombatOutcome(outcomeName: string, newParagraphTitle: string): Promise<void> {
        await expect(this.combatOutcomesToggleAddBtn()).toBeVisible()
        await this.combatOutcomesToggleAddBtn().click()
        await expect(this.combatOutcomeNameInput()).toBeVisible()
        await this.combatOutcomeNameInput().fill(outcomeName)
        await this.combatOutcomeTargetModeNewBtn().click()
        await expect(this.combatOutcomeNewTitleInput()).toBeVisible()
        await this.combatOutcomeNewTitleInput().fill(newParagraphTitle)
        await this.combatOutcomeSubmitBtn().click()
    }

    /**
     * Otwiera modal raportu walidacji grafu.
     */
    async openValidationReport(): Promise<void> {
        await this.validateGraphBtn().dispatchEvent('click')
        await expect(this.validationModal()).toBeVisible()
    }

    /**
     * Zamyka modal raportu walidacji grafu.
     */
    async closeValidationReport(): Promise<void> {
        if (await this.closeValidationModalBtn().isVisible()) {
            await this.closeValidationModalBtn().click()
        } else if (await this.okValidationModalBtn().isVisible()) {
            await this.okValidationModalBtn().click()
        }
        await expect(this.validationModal()).toBeHidden()
    }

    /**
     * Ustawia aktywny paragraf jako węzeł finałowy (zakończenie).
     */
    async setParagraphAsEndNode(): Promise<void> {
        await expect(this.paragraphRoleEndRadio()).toBeVisible()
        await this.paragraphRoleEndRadio().click()
        await expect(this.paragraphRoleEndRadio()).toBeChecked()
    }

    /**
     * Otwiera symulator rozgrywki (Playtest).
     */
    async openPlaytest(): Promise<void> {
        await this.runGameBtn().dispatchEvent('click')
        await expect(this.playtestModal()).toBeVisible()
    }

    /**
     * Zamyka symulator rozgrywki (Playtest).
     */
    async closePlaytest(): Promise<void> {
        await this.playtestCloseBtn().click()
        await expect(this.playtestModal()).toBeHidden()
    }

    /**
     * Klika wybrany numer wyboru (1-indeksowany) w symulatorze.
     */
    async choosePlaytestOption(index: number = 0): Promise<void> {
        const choiceBtn = this.playtestChoiceBtns().nth(index)
        await expect(choiceBtn).toBeVisible()
        await choiceBtn.click()
    }

    /**
     * Cofa o jeden krok w historii rozgrywki Playtestu.
     */
    async stepBackPlaytest(): Promise<void> {
        await expect(this.playtestBackBtn()).toBeVisible()
        await this.playtestBackBtn().click()
    }

    /**
     * Restartuje rozgrywkę od początku w Playteście.
     */
    async restartPlaytest(): Promise<void> {
        if (await this.playtestRestartBtn().isVisible()) {
            await this.playtestRestartBtn().click()
        } else if (await this.playtestEndRestartBtn().isVisible()) {
            await this.playtestEndRestartBtn().click()
        }
    }

    /**
     * Dokonuje natychmiastowej teleportacji do wybranego węzła w symulatorze.
     */
    async teleportPlaytest(targetTitle: string): Promise<void> {
        await this.playtestTeleportToggleBtn().click()
        await expect(this.playtestTeleportPanel()).toBeVisible()
        const targetOption = this.playtestTeleportParagraphSelect().locator('option', {
            hasText: targetTitle,
        })
        const targetVal = await targetOption.getAttribute('value')
        if (targetVal) {
            await this.playtestTeleportParagraphSelect().selectOption(targetVal)
        }
        await this.playtestTeleportSubmitBtn().click()
        await expect(this.playtestTeleportPanel()).toBeHidden()
    }

    /**
     * Otwiera modal eksportu gry paragrafowej.
     */
    async openExportModal(): Promise<void> {
        await this.exportModalBtn().click({ force: true })
        await expect(this.exportModal()).toBeVisible({ timeout: 5000 })
    }

    /**
     * Zamyka modal eksportu (anuluj lub krzyżyk).
     */
    async closeExportModal(useCloseIcon = false): Promise<void> {
        if (useCloseIcon) {
            await this.exportCloseBtn().click()
        } else {
            await this.exportCancelBtn().click()
        }
        await expect(this.exportModal()).toBeHidden({ timeout: 5000 })
    }

    /**
     * Wybiera format docelowy eksportu (pdf, docx, zip).
     */
    async selectExportFormat(format: 'pdf' | 'docx' | 'zip'): Promise<void> {
        await this.exportFormatCard(format).click()
    }

    /**
     * Otwiera Menedżer Zasobów (Asset Manager).
     */
    async openAssetManager(): Promise<void> {
        await this.openAssetsBtn().click({ force: true })
        await expect(this.assetManagerModal()).toBeVisible({ timeout: 5000 })
    }

    /**
     * Zamyka Menedżer Zasobów.
     */
    async closeAssetManager(): Promise<void> {
        await this.closeAssetManagerBtn().click()
        await expect(this.assetManagerModal()).toBeHidden({ timeout: 5000 })
    }

    /**
     * Zaznacza kartę zasobu w siatce galerii.
     */
    async selectAssetCard(relativePath: string): Promise<void> {
        await this.assetCardByPath(relativePath).click()
        await expect(this.assetDetailContent()).toBeVisible({ timeout: 5000 })
    }

    /**
     * Zmienia nazwę wybranego assetu.
     */
    async renameSelectedAsset(newName: string): Promise<void> {
        await this.assetActionRenameBtn().click()
        await expect(this.assetRenameDialog()).toBeVisible()
        await this.assetRenameInput().fill(newName)
        await this.assetRenameConfirmBtn().click()
        await expect(this.assetRenameDialog()).toBeHidden()
    }

    /**
     * Usuwa wybrany asset.
     */
    async deleteSelectedAsset(): Promise<void> {
        await this.assetActionDeleteBtn().click()
        await expect(this.assetDeleteDialog()).toBeVisible()
        await this.assetDeleteConfirmBtn().click()
        await expect(this.assetDeleteDialog()).toBeHidden()
    }

    /**
     * Zamyka aktywny projekt (przycisk w górnym pasku) i powraca do okna startowego.
     */
    async closeProject(): Promise<void> {
        await this.closeProjectBtn().dispatchEvent('click')
    }
}
