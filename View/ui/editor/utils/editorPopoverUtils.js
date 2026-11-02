/**
 * Editor Popover Positioning Utilities
 *
 * Positions floating modals/popovers relative to a target element bounding rectangle,
 * a cursor point, or falls back to centered on screen within safe window viewport margins.
 */

/**
 * Positions a floating popover element within the visible window.
 *
 * @param {HTMLElement} popover Target DOM element to position
 * @param {DOMRect | { x: number, y: number } | null} [targetRectOrPoint] Reference anchor
 * @param {object} [options] Custom sizing and margins
 * @param {number} [options.width=380] Estimated popover width
 * @param {number} [options.height=520] Estimated popover height
 * @param {number} [options.margin=16] Minimum margin to viewport boundary
 * @param {number} [options.offsetPointY=8] Vertical offset when target is point
 * @param {number} [options.offsetRectY=6] Vertical offset when target is rect
 */
export function positionFloatingPopover(popover, targetRectOrPoint, options = {}) {
    if (!popover) return

    const popoverWidth = options.width || 380
    const popoverHeight = options.height || 520
    const margin = options.margin !== undefined ? options.margin : 16
    const offsetPointY = options.offsetPointY !== undefined ? options.offsetPointY : 8
    const offsetRectY = options.offsetRectY !== undefined ? options.offsetRectY : 6

    let left = 0
    let top = 0

    if (
        targetRectOrPoint &&
        typeof targetRectOrPoint.x === 'number' &&
        typeof targetRectOrPoint.y === 'number'
    ) {
        left = targetRectOrPoint.x
        top = targetRectOrPoint.y + offsetPointY
    } else if (
        targetRectOrPoint &&
        typeof targetRectOrPoint.left === 'number' &&
        typeof targetRectOrPoint.bottom === 'number'
    ) {
        left = targetRectOrPoint.left
        top = targetRectOrPoint.bottom + offsetRectY
    } else {
        left = (window.innerWidth - popoverWidth) / 2
        top = (window.innerHeight - popoverHeight) / 3
    }

    if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - popoverWidth - margin
    }
    if (left < margin) {
        left = margin
    }

    if (top + popoverHeight > window.innerHeight - margin) {
        if (
            targetRectOrPoint &&
            typeof targetRectOrPoint.top === 'number' &&
            targetRectOrPoint.top - popoverHeight - margin > 0
        ) {
            top = targetRectOrPoint.top - popoverHeight - offsetRectY
        } else {
            top = Math.max(margin, window.innerHeight - popoverHeight - margin)
        }
    }
    if (top < margin) {
        top = margin
    }

    popover.style.left = `${Math.round(left)}px`
    popover.style.top = `${Math.round(top)}px`
}
