/**
 * Alignment toolbar for multi-shape operations
 */

import {
    alignHorizontal,
    alignVertical,
    distributeHorizontal,
    distributeVertical,
} from '../shapes/multiShapeAlignment.js';
import { appState } from '../state/appState.js';

/**
 * Create and initialize the alignment toolbar
 */
export function initAlignmentToolbar() {
    createToolbarHTML();
    attachEventListeners();
}

/**
 * Create the HTML for the alignment toolbar
 */
function createToolbarHTML() {
    const existing = document.getElementById('alignmentToolbar');
    if (existing) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'alignmentToolbar';
    toolbar.className = 'alignment-toolbar';
    toolbar.style.display = 'none';

    toolbar.innerHTML = `
        <div class="btn-group" role="group" aria-label="Horizontal alignment">
            <button type="button" class="btn btn-sm btn-outline-secondary" id="alignLeft"
                    title="Align Left" data-bs-toggle="tooltip">
                <i class="bi bi-align-start"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="alignCenterH"
                    title="Align Center (Horizontal)" data-bs-toggle="tooltip">
                <i class="bi bi-align-center"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="alignRight"
                    title="Align Right" data-bs-toggle="tooltip">
                <i class="bi bi-align-end"></i>
            </button>
        </div>
        <div class="btn-group ms-2" role="group" aria-label="Vertical alignment">
            <button type="button" class="btn btn-sm btn-outline-secondary" id="alignTop"
                    title="Align Top" data-bs-toggle="tooltip">
                <i class="bi bi-align-top"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="alignMiddle"
                    title="Align Middle (Vertical)" data-bs-toggle="tooltip">
                <i class="bi bi-align-middle"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="alignBottom"
                    title="Align Bottom" data-bs-toggle="tooltip">
                <i class="bi bi-align-bottom"></i>
            </button>
        </div>
        <div class="btn-group ms-2" role="group" aria-label="Distribution">
            <button type="button" class="btn btn-sm btn-outline-secondary" id="distributeH"
                    title="Distribute Horizontally" data-bs-toggle="tooltip">
                <i class="bi bi-distribute-horizontal"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="distributeV"
                    title="Distribute Vertically" data-bs-toggle="tooltip">
                <i class="bi bi-distribute-vertical"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toolbar);

    // Initialize tooltips
    const tooltipTriggerList = toolbar.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

/**
 * Attach event listeners to toolbar buttons
 */
function attachEventListeners() {
    const toolbar = document.getElementById('alignmentToolbar');
    if (!toolbar) return;

    const buttonHandlers = {
        alignLeft: () => handleAlignment('horizontal', 'left'),
        alignCenterH: () => handleAlignment('horizontal', 'center'),
        alignRight: () => handleAlignment('horizontal', 'right'),
        alignTop: () => handleAlignment('vertical', 'top'),
        alignMiddle: () => handleAlignment('vertical', 'middle'),
        alignBottom: () => handleAlignment('vertical', 'bottom'),
        distributeH: () => handleDistribution('horizontal'),
        distributeV: () => handleDistribution('vertical'),
    };

    Object.entries(buttonHandlers).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', handler);
        }
    });
}

/**
 * Handle alignment button clicks
 * @param {string} direction - 'horizontal' or 'vertical'
 * @param {string} alignment - 'left', 'center', 'right', 'top', 'middle', 'bottom'
 */
function handleAlignment(direction, alignment) {
    const selectionManager = appState?.selectionManager;
    if (!selectionManager) return;

    const selectedShapes = selectionManager.getSelectedShapes();
    if (selectedShapes.length < 2) return;

    if (direction === 'horizontal') {
        alignHorizontal(selectedShapes, alignment);
    } else {
        alignVertical(selectedShapes, alignment);
    }
}

/**
 * Handle distribution button clicks
 * @param {string} direction - 'horizontal' or 'vertical'
 */
function handleDistribution(direction) {
    const selectionManager = appState?.selectionManager;
    if (!selectionManager) return;

    const selectedShapes = selectionManager.getSelectedShapes();
    if (selectedShapes.length < 3) {
        // Show feedback that at least 3 shapes are needed
        console.log('At least 3 shapes must be selected for distribution');
        return;
    }

    if (direction === 'horizontal') {
        distributeHorizontal(selectedShapes);
    } else {
        distributeVertical(selectedShapes);
    }
}

/**
 * Show the alignment toolbar
 */
export function showAlignmentToolbar() {
    const toolbar = document.getElementById('alignmentToolbar');
    if (toolbar) {
        toolbar.style.display = 'flex';
    }
}

/**
 * Hide the alignment toolbar
 */
export function hideAlignmentToolbar() {
    const toolbar = document.getElementById('alignmentToolbar');
    if (toolbar) {
        toolbar.style.display = 'none';
    }
}

/**
 * Update toolbar visibility based on selection
 * @param {number} selectedCount - Number of selected shapes
 */
export function updateAlignmentToolbarVisibility(selectedCount) {
    if (selectedCount >= 2) {
        showAlignmentToolbar();
    } else {
        hideAlignmentToolbar();
    }
}
