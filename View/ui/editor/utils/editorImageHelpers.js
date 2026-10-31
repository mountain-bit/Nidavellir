/**
 * Editor Image Drag & Drop and Double-Click Utilities
 *
 * Handles file drop onto rich text editor containers to insert gamebook images,
 * and double-click on embedded images to open the image manipulation modal.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { importDroppedImage, setupElementDropZone } from '../../assets/assetPicker.js'
import { openImageEditor } from '../../assets/imageEditorModal.js'

/**
 * Attaches image drag-and-drop support onto an editor DOM mount.
 *
 * @param {HTMLElement} mount Editor container element
 * @param {() => object|null} getEditor Callback returning current MarkdownEditor
 * @param {object} ctx Application UI Context
 * @param {object} [options]
 * @param {() => boolean} [options.canDrop] Guard function checking if drop is allowed
 */
export function setupEditorImageDropZone(mount, getEditor, ctx, options = {}) {
    if (!mount) return

    setupElementDropZone(mount, {
        highlightClass: 'ring-2 ring-blue-500 bg-blue-500/10',
        onFileDrop: async file => {
            if (options.canDrop && !options.canDrop()) {
                toast.warning(
                    t('editor.no_open_file') || 'Otwórz najpierw plik, aby wstawić grafikę'
                )
                return
            }

            const imported = await importDroppedImage(file, ctx, 'img')
            const editor = getEditor()
            if (imported && editor && typeof editor.setImage === 'function') {
                editor.setImage({
                    src: imported.relativePath,
                    alt: imported.fileName,
                })
                toast.success(t('asset.image_inserted') || 'Grafika została wstawiona')
            }
        },
    })
}

/**
 * Attaches double-click handler on embedded images in an editor container to launch ImageEditor.
 *
 * @param {HTMLElement} mount Editor container element
 * @param {() => object|null} getEditor Callback returning current MarkdownEditor
 * @param {object} ctx Application UI Context
 * @param {() => boolean} [canTrigger] Guard function
 */
export function setupEditorImageDoubleClickHandler(mount, getEditor, ctx, canTrigger = () => true) {
    if (!mount) return

    mount.addEventListener('dblclick', e => {
        if (!canTrigger()) return

        const target = e.target
        const img =
            target?.closest?.('img.gamebook-image') ||
            (target?.tagName === 'IMG' && target.closest?.('.gamebook-image-container')
                ? target
                : target?.tagName === 'IMG'
                  ? target
                  : null)

        if (!img) return

        e.preventDefault()
        e.stopPropagation()

        const rawSrc = img.getAttribute('src') || ''
        if (!rawSrc) return

        const editor = getEditor()
        let imgPos = null
        try {
            const rawEditor = editor?.getRawEditor ? editor.getRawEditor() : null
            const view = rawEditor?.view
            if (view && typeof view.posAtDOM === 'function') {
                imgPos = view.posAtDOM(img, 0)
            }
        } catch {
            imgPos = null
        }

        openImageEditor(ctx, {
            src: rawSrc,
            onSave: ({ relativePath, fileName }) => {
                if (!editor) return
                if (typeof imgPos === 'number' && typeof editor.updateImage === 'function') {
                    const success = editor.updateImage(imgPos, {
                        src: relativePath,
                        alt: fileName || img.getAttribute('alt') || '',
                    })
                    if (success) return
                }
                if (typeof editor.setImage === 'function') {
                    editor.setImage({
                        src: relativePath,
                        alt: fileName || img.getAttribute('alt') || '',
                    })
                }
            },
        })
    })
}
