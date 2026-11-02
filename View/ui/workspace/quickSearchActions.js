import { toast } from '../../../dist/Utils/toast.js'
import { updateTopBarUI } from './topBar.js'
import { updateRightSidebarUI } from './workspace.js'

/**
 * Executes navigation / selection for a chosen quick search result.
 * - If paragraph: centers and focuses graph view on the paragraph node and opens right details.
 * - If location/NPC/rule: opens right sidebar details and description.
 *
 * @param {object} item
 * @param {object} ctx
 * @param {object} [options={}]
 */
export function executeQuickSearchAction(item, ctx, options = {}) {
    if (!item || !ctx) return

    const { type, entity, id } = item
    const shouldSwitchDrawerTab = options.switchDrawerTab !== false

    if (type === 'paragraph') {
        // 1. Switch to Graph View if not already active
        if (typeof ctx.showGraph === 'function') {
            ctx.showGraph(true)
        }
        if (ctx.vm && typeof ctx.vm?.layout?.setActiveMainView === 'function') {
            ctx.vm.layout.setActiveMainView('graph')
        }
        if (typeof ctx.updateMainWorkspaceUI === 'function') {
            ctx.updateMainWorkspaceUI(ctx)
        }
        if (typeof updateTopBarUI === 'function') {
            updateTopBarUI(ctx)
        }

        // 2. Open right sidebar so paragraph details and content are visible
        if (ctx.vm) {
            if (typeof ctx.vm?.layout?.setRightSidebarCollapsed === 'function') {
                ctx.vm.layout.setRightSidebarCollapsed(false)
            }
        }
        const rightSidebar = document.getElementById('right-sidebar')
        const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
        const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
        if (typeof updateRightSidebarUI === 'function' && rightSidebar) {
            updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
        }

        const targetId = id || (entity?.getId && entity.getId()) || ''

        // 3. Select paragraph entity
        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(entity, 'paragraph')
        } else if (ctx.vm && typeof ctx.vm?.selection?.selectElement === 'function') {
            ctx.vm.selection.selectElement(entity, 'paragraph')
        }

        // 4. Focus and center graph on paragraph node
        if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.focusOnElement === 'function') {
            ctx.storyGraphInstance.focusOnElement(targetId, true)
        }

        // 5. Render details & history
        if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
        if (typeof ctx.renderHistoryBar === 'function') {
            ctx.renderHistoryBar(ctx)
        }

        toast.info(`Przeniesiono do paragrafu: ${item.title}`, 'Graf historii')
    } else if (type === 'scene') {
        // Scene: switch to graph, focus on scene, open details
        if (ctx.vm && typeof ctx.vm?.layout?.setActiveMainView === 'function') {
            ctx.vm.layout.setActiveMainView('graph')
        }
        if (typeof ctx.updateMainWorkspaceUI === 'function') {
            ctx.updateMainWorkspaceUI(ctx)
        }
        if (typeof updateTopBarUI === 'function') {
            updateTopBarUI(ctx)
        }

        if (ctx.vm && typeof ctx.vm?.layout?.setRightSidebarCollapsed === 'function') {
            ctx.vm.layout.setRightSidebarCollapsed(false)
        }
        const rightSidebar = document.getElementById('right-sidebar')
        const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
        const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
        if (typeof updateRightSidebarUI === 'function' && rightSidebar) {
            updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
        }

        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(entity, 'scene')
        } else if (ctx.vm && typeof ctx.vm?.selection?.selectElement === 'function') {
            ctx.vm.selection.selectElement(entity, 'scene')
        }

        const targetId = id || (entity.getId && entity.getId()) || ''
        if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.focusOnElement === 'function') {
            ctx.storyGraphInstance.focusOnElement(targetId, true)
        }

        if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
        if (typeof ctx.renderHistoryBar === 'function') {
            ctx.renderHistoryBar(ctx)
        }

        toast.info(`Wybrano scenę: ${item.title}`, 'Scena')
    } else {
        // Location, NPC, Template, Item, Stat, Skill, Parameter, Feature, Tag, Hero:
        // Open details and description!
        if (ctx.vm) {
            if (typeof ctx.vm?.layout?.setRightSidebarCollapsed === 'function') {
                ctx.vm.layout.setRightSidebarCollapsed(false)
            }
        }
        const rightSidebar = document.getElementById('right-sidebar')
        const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
        const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
        if (typeof updateRightSidebarUI === 'function' && rightSidebar) {
            updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
        }

        // Switch left drawer to matching category tab if requested and drawer is open or available
        if (
            shouldSwitchDrawerTab &&
            ctx.vm &&
            typeof ctx.vm?.layout?.toggleLeftTab === 'function'
        ) {
            if (type === 'character' || type === 'template') {
                ctx.vm.layout.toggleLeftTab('characters')
            } else if (type === 'location') {
                ctx.vm.layout.toggleLeftTab('locations')
            } else if (
                type === 'stat' ||
                type === 'skill' ||
                type === 'parameter' ||
                type === 'feature'
            ) {
                ctx.vm.layout.toggleLeftTab('traits')
            } else if (type === 'tag') {
                ctx.vm.layout.toggleLeftTab('paragraphs')
            }
            if (typeof ctx.updateLeftDrawerUI === 'function') {
                ctx.updateLeftDrawerUI()
            }
        }

        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(entity, type)
        } else if (ctx.vm && typeof ctx.vm?.selection?.selectElement === 'function') {
            ctx.vm.selection.selectElement(entity, type)
        }

        if (typeof ctx.renderHistoryBar === 'function') {
            ctx.renderHistoryBar(ctx)
        }
        if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }

        toast.info(`Otwarto szczegóły i opis: ${item.title}`, item.typeLabel)
    }
}
