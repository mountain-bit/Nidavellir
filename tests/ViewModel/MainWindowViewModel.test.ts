import { beforeEach, describe, expect, it } from 'vitest'

import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('MainWindowViewModel', () => {
    let vm: MainWindowViewModel

    beforeEach(() => {
        vm = new MainWindowViewModel()
    })

    it('domyślnie posiada aktywne odpowiednie zakładki i stan widoków', () => {
        expect(vm.getActiveRibbonTab()).toBe('glowna')
        expect(vm.getActiveLeftTab()).toBe('explorer')
        expect(vm.isLeftDrawerOpen()).toBe(true)
        expect(vm.isRightSidebarCollapsed()).toBe(false)
        expect(vm.getActiveMainView()).toBe('markdown')
    })

    it('zmienia aktywną zakładkę wstążki', () => {
        vm.setActiveRibbonTab('sceny')
        expect(vm.getActiveRibbonTab()).toBe('sceny')

        vm.setActiveRibbonTab('widok')
        expect(vm.getActiveRibbonTab()).toBe('widok')
    })

    it('ponowne kliknięcie tej samej ikony na lewym pasku zamyka panel (toggle off)', () => {
        expect(vm.getActiveLeftTab()).toBe('explorer')
        expect(vm.isLeftDrawerOpen()).toBe(true)

        vm.toggleLeftTab('explorer')
        expect(vm.getActiveLeftTab()).toBeNull()
        expect(vm.isLeftDrawerOpen()).toBe(false)
    })

    it('kliknięcie innej ikony na lewym pasku zmienia otwartą zakładkę w panelu', () => {
        vm.toggleLeftTab('scenes')
        expect(vm.getActiveLeftTab()).toBe('scenes')
        expect(vm.isLeftDrawerOpen()).toBe(true)

        vm.toggleLeftTab('search')
        expect(vm.getActiveLeftTab()).toBe('search')
        expect(vm.isLeftDrawerOpen()).toBe(true)
    })

    it('zamykanie i ponowne otwieranie lewego panelu', () => {
        vm.closeLeftDrawer()
        expect(vm.isLeftDrawerOpen()).toBe(false)
        expect(vm.getActiveLeftTab()).toBeNull()

        vm.toggleLeftTab('settings')
        expect(vm.getActiveLeftTab()).toBe('settings')
        expect(vm.isLeftDrawerOpen()).toBe(true)
    })

    it('przełącza widoczność prawego panelu za pomocą strzałki toggle', () => {
        expect(vm.isRightSidebarCollapsed()).toBe(false)

        vm.toggleRightSidebar()
        expect(vm.isRightSidebarCollapsed()).toBe(true)

        vm.toggleRightSidebar()
        expect(vm.isRightSidebarCollapsed()).toBe(false)
    })

    it('zarządza otwartymi plikami i aktywnym plikiem', () => {
        expect(vm.getActiveFile()).toBeNull()
        expect(vm.getOpenFiles()).toEqual([])

        vm.setActiveFile('Scena 1')
        expect(vm.getActiveFile()).toBe('Scena 1')
        expect(vm.getOpenFiles()).toContain('Scena 1')

        vm.setActiveFile('Scena 2')
        expect(vm.getActiveFile()).toBe('Scena 2')
        expect(vm.getOpenFiles()).toEqual(['Scena 1', 'Scena 2'])

        vm.closeFile('Scena 2')
        expect(vm.getOpenFiles()).not.toContain('Scena 2')
        expect(vm.getActiveFile()).toBe('Scena 1')
    })

    it('zmienia główny widok na graf historii i z powrotem', () => {
        vm.setActiveMainView('graph')
        expect(vm.getActiveMainView()).toBe('graph')

        vm.setActiveMainView('markdown')
        expect(vm.getActiveMainView()).toBe('markdown')
    })
})
