/* global cytoscape */
const files = {
    'Wprowadzenie.md':
        '# Wprowadzenie\n\nWitaj w nowej grze paragrafowej.\n\nWybierz scenę, aby rozpocząć tworzenie historii.',
    'Scena 1':
        '# Scena 1: Stary trakt\n\nBohater dociera na rozstaje dróg.\n\n- Idź do miasta → Scena 2\n- Zbadaj las → Scena 3',
    'Scena 2': '# Scena 2: Brama miasta\n\nStrażnik zatrzymuje podróżnego przy bramie.',
}

const openFiles = ['Wprowadzenie.md', 'Scena 1']
let activeFile = 'Wprowadzenie.md'
let graph

const editor = document.getElementById('file-editor')
const tabs = document.getElementById('editor-tabs')
const textEditor = document.getElementById('text-editor')
const graphPanel = document.getElementById('graph-panel')
const activeFileLabel = document.getElementById('active-file-label')
const saveStatus = document.getElementById('save-status')
const shell = document.querySelector('.app-shell')
const gridClasses = [
    'grid-cols-[260px_minmax(360px,1fr)_280px]',
    'grid-cols-[0_minmax(360px,1fr)_280px]',
    'grid-cols-[260px_minmax(360px,1fr)_0]',
    'grid-cols-[0_minmax(360px,1fr)_0]',
]
let leftCollapsed = false
let rightCollapsed = false

function updateDetails(fileName) {
    document.getElementById('selected-element').textContent = fileName
    document.getElementById('selected-type').textContent = fileName.startsWith('Scena')
        ? 'Scena'
        : 'Dokument'
}

function renderTabs() {
    tabs.replaceChildren(
        ...openFiles.map(fileName => {
            const tab = document.createElement('button')
            tab.className =
                'flex min-w-[148px] items-center gap-2 border-0 border-r border-[#1e1e1e] bg-[#2d2d2d] px-3 text-left text-[#ababab] hover:bg-[#37373d]'
            if (fileName === activeFile) {
                tab.classList.add('border-t', 'border-t-[#58a6ff]', 'bg-[#1e1e1e]', 'text-white')
            }
            tab.type = 'button'
            tab.role = 'tab'
            tab.ariaSelected = String(fileName === activeFile)
            tab.innerHTML = `<span>${fileName}</span><span class="ml-auto text-[#b9b9b9]" aria-hidden="true">×</span>`
            tab.addEventListener('click', () => openFile(fileName))
            return tab
        })
    )
}

function openFile(fileName) {
    if (!files[fileName]) return showGraph()
    if (!openFiles.includes(fileName)) openFiles.push(fileName)
    activeFile = fileName
    textEditor.hidden = false
    graphPanel.hidden = true
    editor.value = files[fileName]
    activeFileLabel.textContent = fileName
    updateDetails(fileName)
    renderTabs()
}

function showGraph() {
    textEditor.hidden = true
    graphPanel.hidden = false
    updateDetails('Graf historii')
    if (!graph) {
        graph = cytoscape({
            container: document.getElementById('story-graph'),
            elements: [
                { data: { id: 'start', label: 'Wprowadzenie' } },
                { data: { id: 'scene1', label: 'Scena 1' } },
                { data: { id: 'scene2', label: 'Scena 2' } },
                { data: { id: 'scene3', label: 'Scena 3' } },
                { data: { source: 'start', target: 'scene1' } },
                { data: { source: 'scene1', target: 'scene2' } },
                { data: { source: 'scene1', target: 'scene3' } },
            ],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#238636',
                        label: 'data(label)',
                        color: '#d4d4d4',
                        'font-size': 12,
                        'text-valign': 'center',
                        'text-halign': 'center',
                        width: 110,
                        height: 42,
                        shape: 'round-rectangle',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': '#6e7681',
                        'target-arrow-color': '#6e7681',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                    },
                },
            ],
            layout: { name: 'breadthfirst', directed: true, padding: 55 },
        })
    }
    requestAnimationFrame(() => graph.resize().fit(undefined, 45))
}

editor.addEventListener('input', () => {
    files[activeFile] = editor.value
    saveStatus.textContent = 'Niezapisane zmiany'
})

document
    .querySelectorAll('[data-file]')
    .forEach(button => button.addEventListener('click', () => openFile(button.dataset.file)))
document
    .querySelectorAll('[data-action="show-graph"]')
    .forEach(button => button.addEventListener('click', showGraph))
document.querySelector('[data-action="save"]').addEventListener('click', () => {
    saveStatus.textContent = 'Zapisano przed chwilą'
})
document.querySelector('[data-action="new-file"]').addEventListener('click', () => {
    const name = `Nowa scena ${Object.keys(files).length - 1}`
    files[name] = '# Nowa scena\n\nWpisz treść sceny.'
    openFile(name)
})

function updateSidebarLayout() {
    shell.classList.remove(...gridClasses)
    shell.classList.add(gridClasses[(leftCollapsed ? 1 : 0) + (rightCollapsed ? 2 : 0)])
}

document.querySelectorAll('[data-toggle]').forEach(button =>
    button.addEventListener('click', () => {
        const id = button.dataset.toggle
        const isLeft = id === 'left-sidebar'
        if (isLeft) leftCollapsed = !leftCollapsed
        else rightCollapsed = !rightCollapsed
        updateSidebarLayout()
        document.querySelector(`[data-reopen="${id}"]`).hidden = !(isLeft
            ? leftCollapsed
            : rightCollapsed)
    })
)

openFile(activeFile)
