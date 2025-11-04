/**
 * Canvas panning functionality
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { saveScrollPosition } from '../services/storage.js';

/**
 * Start panning the canvas
 * @param {MouseEvent} e - The mouse event
 */
export function startPanning(e) {
    appState.isPanningCanvas = true;
    appState.panStartX = e.clientX + elements.canvasWrapper.scrollLeft;
    appState.panStartY = e.clientY + elements.canvasWrapper.scrollTop;
    elements.topologyCanvas.style.cursor = 'grabbing';
    e.preventDefault();
}

/**
 * Handle canvas panning during mouse move
 * @param {MouseEvent} e - The mouse event
 */
export function handlePanning(e) {
    if (!appState.isPanningCanvas) return false;

    // Pan the canvas by adjusting scroll position
    elements.canvasWrapper.scrollLeft = appState.panStartX - e.clientX;
    elements.canvasWrapper.scrollTop = appState.panStartY - e.clientY;

    return true;
}

/**
 * Stop panning the canvas
 */
export function stopPanning() {
    if (appState.isPanningCanvas) {
        appState.isPanningCanvas = false;

        // Don't change cursor if in selection mode
        if (!appState.isSelectionMode) {
            elements.topologyCanvas.style.cursor = 'grab';
        }

        // Persist scroll position after panning
        saveScrollPosition();
    }
}
