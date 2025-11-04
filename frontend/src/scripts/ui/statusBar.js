/**
 * Status bar functionality
 * Updates canvas info and pointer position in the footer
 */

import { elements } from '../utils/dom.js';
import { appState } from '../state/appState.js';
import { CANVAS_CONFIG } from '../config/constants.js';

/**
 * Initialize the status bar with canvas size and pointer tracking
 */
export function initializeStatusBar() {
    // Set canvas size from constants
    updateCanvasInfo();

    // Setup pointer position tracking
    setupPointerTracking();
}

/**
 * Update canvas info display with values from constants
 */
function updateCanvasInfo() {
    if (elements.canvasInfo) {
        elements.canvasInfo.textContent = `${CANVAS_CONFIG.WIDTH}x${CANVAS_CONFIG.HEIGHT}`;
    }
}

/**
 * Setup pointer position tracking on canvas
 */
function setupPointerTracking() {
    if (!elements.topologyCanvas || !elements.pointerPosition) return;

    elements.topologyCanvas.addEventListener('mousemove', e => {
        const canvasRect = elements.topologyCanvas.getBoundingClientRect();

        // Calculate position accounting for zoom
        const x = (e.clientX - canvasRect.left) / appState.currentZoom;
        const y = (e.clientY - canvasRect.top) / appState.currentZoom;

        // Round to whole numbers for cleaner display
        const roundedX = Math.round(x);
        const roundedY = Math.round(y);

        // Update display
        elements.pointerPosition.textContent = `(${roundedX}, ${roundedY})`;
    });

    // Clear position when mouse leaves canvas
    elements.topologyCanvas.addEventListener('mouseleave', () => {
        elements.pointerPosition.textContent = '(--, --)';
    });
}
