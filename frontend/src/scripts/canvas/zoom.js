/**
 * Canvas zoom functionality
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { ZOOM_CONFIG } from '../config/constants.js';
import { saveZoom, saveScrollPosition } from '../services/storage.js';

/**
 * Zoom in on the canvas
 */
export function zoomIn() {
    appState.currentZoom = Math.min(appState.currentZoom * ZOOM_CONFIG.STEP, ZOOM_CONFIG.MAX);
    updateZoom();
}

/**
 * Zoom out on the canvas
 */
export function zoomOut() {
    appState.currentZoom = Math.max(appState.currentZoom / ZOOM_CONFIG.STEP, ZOOM_CONFIG.MIN);
    updateZoom();
}

/**
 * Reset zoom to default level
 */
export function resetZoom() {
    appState.currentZoom = ZOOM_CONFIG.DEFAULT;
    updateZoom();
    // Center the canvas
    elements.canvasWrapper.scrollLeft =
        (elements.topologyCanvas.clientWidth - elements.canvasWrapper.clientWidth) / 2;
    elements.canvasWrapper.scrollTop =
        (elements.topologyCanvas.clientHeight - elements.canvasWrapper.clientHeight) / 2;
}

/**
 * Update the canvas zoom level and display
 */
function updateZoom() {
    elements.canvas.style.transform = `scale(${appState.currentZoom})`;

    if (elements.zoomLevel) {
        elements.zoomLevel.textContent = `${Math.round(appState.currentZoom * 100)}%`;
    }

    // Persist zoom level
    saveZoom();
}
