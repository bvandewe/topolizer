/**
 * Event listener setup for UI elements
 */

import { elements } from '../utils/dom.js';
import { testApiConnection } from '../services/api.js';
import {
    newTopology,
    exportTopology,
    importTopology,
    clearCanvas,
} from '../topology/fileOperations.js';
import { exportCanvasAsPNG } from '../topology/pngExport.js';
import { zoomIn, zoomOut, resetZoom } from '../canvas/zoom.js';

/**
 * Setup all event listeners for UI elements
 */
export function setupEventListeners() {
    setupApiListeners();
    setupMenuListeners();
    setupCanvasControlListeners();
}

/**
 * Setup API-related event listeners
 */
function setupApiListeners() {
    elements.testApiBtn.addEventListener('click', testApiConnection);
}

/**
 * Setup menu event listeners
 */
function setupMenuListeners() {
    elements.newTopologyBtn.addEventListener('click', newTopology);
    elements.exportBtn.addEventListener('click', exportTopology);
    elements.exportPngBtn.addEventListener('click', exportCanvasAsPNG);
    elements.importBtn.addEventListener('click', importTopology);
}

/**
 * Setup canvas control event listeners
 */
function setupCanvasControlListeners() {
    // Sidebar controls (only if they exist)
    if (elements.zoomInBtn) elements.zoomInBtn.addEventListener('click', zoomIn);
    if (elements.zoomOutBtn) elements.zoomOutBtn.addEventListener('click', zoomOut);
    if (elements.resetZoomBtn) elements.resetZoomBtn.addEventListener('click', resetZoom);
    if (elements.clearCanvasBtn) elements.clearCanvasBtn.addEventListener('click', clearCanvas);

    // Floating controls - hide tooltips on click
    elements.zoomInBtnFloating.addEventListener('click', () => {
        hideTooltip(elements.zoomInBtnFloating);
        zoomIn();
    });
    elements.zoomOutBtnFloating.addEventListener('click', () => {
        hideTooltip(elements.zoomOutBtnFloating);
        zoomOut();
    });
    elements.resetZoomBtnFloating.addEventListener('click', () => {
        hideTooltip(elements.resetZoomBtnFloating);
        resetZoom();
    });
}

/**
 * Hide Bootstrap tooltip for an element
 */
function hideTooltip(element) {
    if (element) {
        const tooltipInstance = window.bootstrap.Tooltip.getInstance(element);
        if (tooltipInstance) tooltipInstance.hide();
    }
}
