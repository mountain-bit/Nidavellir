/**
 * Draggable window controller and viewport position clamper for floating modals.
 */

/**
 * Clamps floating window position within the current viewport boundaries.
 *
 * @param {HTMLElement} modal
 */
export function clampModalPosition(modal) {
    if (!modal) return
    const currentLeft = parseInt(modal.style.left, 10) || modal.offsetLeft || 0
    const currentTop = parseInt(modal.style.top, 10) || modal.offsetTop || 0

    const minLeft = 10
    const maxLeft = Math.max(minLeft, window.innerWidth - modal.offsetWidth - 10)
    const minTop = 10
    const maxTop = Math.max(minTop, window.innerHeight - modal.offsetHeight - 10)

    const clampedLeft = Math.min(Math.max(currentLeft, minLeft), maxLeft)
    const clampedTop = Math.min(Math.max(currentTop, minTop), maxTop)

    modal.style.left = `${clampedLeft}px`
    modal.style.top = `${clampedTop}px`
    modal.style.right = 'auto'
    modal.style.bottom = 'auto'
}

/**
 * Initializes draggable behavior on the floating window title bar.
 *
 * @param {HTMLElement} modal The floating window element
 * @param {HTMLElement} header The draggable header element
 */
export function initDraggable(modal, header) {
    if (!modal || !header) return

    let isDragging = false
    let startX = 0
    let startY = 0
    let initialLeft = 0
    let initialTop = 0

    header.addEventListener('mousedown', e => {
        // Ignore right clicks or clicks on interactive child buttons (e.g. close button)
        if (e.button !== 0 || e.target.closest('#btn-close-npc-modal')) return

        isDragging = true
        startX = e.clientX
        startY = e.clientY

        const rect = modal.getBoundingClientRect()
        initialLeft = rect.left
        initialTop = rect.top

        document.body.style.userSelect = 'none'
        header.classList.add('cursor-grabbing')

        function onMouseMove(moveEvent) {
            if (!isDragging) return
            moveEvent.preventDefault()

            const deltaX = moveEvent.clientX - startX
            const deltaY = moveEvent.clientY - startY

            let newLeft = initialLeft + deltaX
            let newTop = initialTop + deltaY

            // Constrain within viewport boundaries
            const minLeft = 10
            const maxLeft = Math.max(minLeft, window.innerWidth - modal.offsetWidth - 10)
            const minTop = 10
            const maxTop = Math.max(minTop, window.innerHeight - modal.offsetHeight - 10)

            newLeft = Math.min(Math.max(newLeft, minLeft), maxLeft)
            newTop = Math.min(Math.max(newTop, minTop), maxTop)

            modal.style.left = `${newLeft}px`
            modal.style.top = `${newTop}px`
            modal.style.right = 'auto'
            modal.style.bottom = 'auto'
        }

        function onMouseUp() {
            isDragging = false
            document.body.style.userSelect = ''
            header.classList.remove('cursor-grabbing')
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    })
}
