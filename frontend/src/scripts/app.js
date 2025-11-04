/**
 * Main application entry point
 */

import { initializeElements } from './utils/dom.js';
import { setupEventListeners } from './events/uiEvents.js';
import { setupKeyboardShortcuts } from './events/keyboard.js';
import { setupToolDragAndDrop } from './toolbar/dragDrop.js';
import { setupCanvasEvents } from './canvas/events.js';
import { resetZoom } from './canvas/zoom.js';
import { restoreAppState } from './services/restore.js';
import {
    setupConnectionMode,
    migrateExistingConnections,
} from './connections/connectionManager.js';
import { initializeConnectionInteractions } from './connections/connectionInteractions.js';
import { initializeStatusBar } from './ui/statusBar.js';
import { initializeShapeOverlay } from './ui/shapeOverlay.js';
import { initializeSidebarState } from './ui/sidebarState.js';
import { SelectionMode } from './canvas/selectionMode.js';
import { initAlignmentToolbar } from './ui/alignmentToolbar.js';
import { appState } from './state/appState.js';

/**
 * Migrate existing canvas elements to layer groups
 */
function migrateToLayerGroups() {
    const canvas = document.getElementById('topologyCanvas');
    const backgroundShapesLayer = document.getElementById('backgroundShapesLayer');
    const shapesLayer = document.getElementById('shapesLayer');
    const connectionsLayer = document.getElementById('connectionsLayer');
    const labelsLayer = document.getElementById('labelsLayer');
    const interactionLayer = document.getElementById('interactionLayer');

    if (
        !backgroundShapesLayer ||
        !shapesLayer ||
        !connectionsLayer ||
        !labelsLayer ||
        !interactionLayer
    ) {
        console.warn('Layer groups not found, skipping migration');
        return;
    }

    // Get all direct children of canvas that should be in layers
    const canvasChildren = Array.from(canvas.children);

    canvasChildren.forEach(child => {
        const id = child.id || '';

        // Skip the layer groups themselves and base elements
        if (
            id === 'backgroundShapesLayer' ||
            id === 'shapesLayer' ||
            id === 'connectionsLayer' ||
            id === 'labelsLayer' ||
            id === 'interactionLayer' ||
            id === 'selectionRect' ||
            !id ||
            child.tagName === 'defs' ||
            child.tagName === 'rect'
        ) {
            return;
        }

        // Migrate based on element type
        if (id.startsWith('shape-')) {
            shapesLayer.appendChild(child);
        } else if (id.startsWith('connection-')) {
            connectionsLayer.appendChild(child);
        } else if (id.startsWith('label-')) {
            labelsLayer.appendChild(child);
        } else if (id === 'interaction-circle') {
            interactionLayer.appendChild(child);
        }
    });

    console.log('Migrated existing elements to layer groups');
}

/**
 * Initialize Bootstrap tooltips for floating buttons
 */
function initializeTooltips() {
    // Check if Bootstrap is available
    if (typeof window.bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded yet');
        return;
    }

    // Initialize tooltips for all elements with data-bs-toggle="tooltip"
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    console.log('Found tooltip elements:', tooltipTriggerList.length);

    tooltipTriggerList.forEach(tooltipTriggerEl => {
        console.log('Initializing tooltip for:', tooltipTriggerEl.id);
        try {
            new window.bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover',
                container: 'body',
                html: false,
            });
        } catch (error) {
            console.error('Error initializing tooltip for', tooltipTriggerEl.id, error);
        }
    });
}

/**
 * Initialize the Topology Builder application
 */
function init() {
    // Initialize DOM references
    initializeElements();

    // Setup all event listeners
    setupEventListeners();
    setupKeyboardShortcuts();
    setupToolDragAndDrop();
    setupCanvasEvents();
    setupConnectionMode();
    initializeShapeOverlay();
    initializeConnectionInteractions();
    initializeSidebarState(); // Initialize sidebar panel state persistence
    initAlignmentToolbar(); // Initialize alignment toolbar for multi-shape operations

    // Initialize selection mode
    const canvas = document.getElementById('topologyCanvas');
    const selectionMode = new SelectionMode(canvas);
    appState.selectionManager = selectionMode; // Store reference in appState

    // Setup selection mode toggle button
    const toggleBtn = document.getElementById('toggleSelectionMode');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Hide tooltip on click
            const tooltipInstance = window.bootstrap.Tooltip.getInstance(toggleBtn);
            if (tooltipInstance) tooltipInstance.hide();
            selectionMode.toggle();
        });
    }

    // Initialize canvas
    resetZoom();

    // Initialize status bar
    initializeStatusBar();

    // Restore saved state (topology, zoom, scroll position)
    restoreAppState();

    // Migrate existing elements to layer groups (for backwards compatibility)
    migrateToLayerGroups();

    // Migrate existing connections to have label IDs (for backwards compatibility)
    migrateExistingConnections();

    // Initialize Bootstrap tooltips after everything is loaded
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
        initializeTooltips();
    }, 100);

    console.log('Topology Builder initialized');
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
