export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface IToastOptions {
    message: string
    title?: string
    type?: ToastType
    duration?: number
}

export type ToastOptions = IToastOptions

const ICONS: Record<ToastType, string> = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
}

const TYPE_BORDER_CLASSES: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-zinc-900/95 text-emerald-200',
    warning: 'border-amber-500/50 bg-zinc-900/95 text-amber-200',
    error: 'border-rose-500/50 bg-zinc-900/95 text-rose-200',
    info: 'border-blue-500/40 bg-zinc-900/95 text-blue-200',
}

function getOrCreateToastContainer(): HTMLElement {
    let container = document.getElementById('toast-container')
    if (!container) {
        container = document.createElement('div')
        container.id = 'toast-container'
        container.className =
            'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full'
        document.body.appendChild(container)
    }
    return container
}

export function showToast(options: string | IToastOptions): HTMLElement {
    const opts: IToastOptions =
        typeof options === 'string'
            ? { message: options, type: 'info' }
            : { type: 'info', ...options }

    const type = opts.type || 'info'
    const duration = opts.duration !== undefined ? opts.duration : type === 'error' ? 6000 : 4500
    const container = getOrCreateToastContainer()

    const toastEl = document.createElement('div')
    const borderClass = TYPE_BORDER_CLASSES[type] || TYPE_BORDER_CLASSES.info
    toastEl.className = `pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-3 opacity-0 text-sm ${borderClass}`
    toastEl.setAttribute('role', 'alert')

    const iconHtml = ICONS[type] || ICONS.info

    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'flex-1 min-w-0 pr-1'

    if (opts.title) {
        const titleEl = document.createElement('div')
        titleEl.className = 'font-semibold text-zinc-100 text-xs mb-0.5 tracking-wide'
        titleEl.textContent = opts.title
        contentWrapper.appendChild(titleEl)
    }

    const messageEl = document.createElement('div')
    messageEl.className = 'text-zinc-300 text-xs leading-relaxed break-words'
    messageEl.textContent = opts.message
    contentWrapper.appendChild(messageEl)

    const closeBtn = document.createElement('button')
    closeBtn.className =
        'text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded focus:outline-none shrink-0'
    closeBtn.setAttribute('aria-label', 'Zamknij')
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`

    const iconContainer = document.createElement('div')
    iconContainer.innerHTML = iconHtml

    toastEl.appendChild(iconContainer.firstElementChild || iconContainer)
    toastEl.appendChild(contentWrapper)
    toastEl.appendChild(closeBtn)

    container.appendChild(toastEl)

    const dismiss = (): void => {
        toastEl.classList.add('opacity-0', 'translate-y-2')
        setTimeout(() => {
            if (toastEl.parentNode) {
                toastEl.parentNode.removeChild(toastEl)
            }
        }, 300)
    }

    closeBtn.addEventListener('click', dismiss)

    requestAnimationFrame(() => {
        toastEl.classList.remove('translate-y-3', 'opacity-0')
    })

    if (duration > 0) {
        setTimeout(dismiss, duration)
    }

    return toastEl
}

export const toast = {
    success: (message: string, title?: string, duration?: number): HTMLElement =>
        showToast({ message, title, type: 'success', duration }),
    warning: (message: string, title?: string, duration?: number): HTMLElement =>
        showToast({ message, title, type: 'warning', duration }),
    error: (message: string, title?: string, duration?: number): HTMLElement =>
        showToast({ message, title, type: 'error', duration }),
    info: (message: string, title?: string, duration?: number): HTMLElement =>
        showToast({ message, title, type: 'info', duration }),
}
