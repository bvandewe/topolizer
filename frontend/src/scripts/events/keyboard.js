/**
 * Keyboard shortcuts handler
 */

import { appState } from '../state/appState.js';
import { removeResizeHandles, deselectShape } from '../shapes/shapeSelection.js';
import { zoomIn, zoomOut, resetZoom } from '../canvas/zoom.js';
import { saveAppState } from '../services/storage.js';
import { deleteShapeConnections } from '../connections/connectionManager.js';

/**
 * Setup keyboard shortcuts
 */
export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleKeyDown(e) {
    // Ignore keyboard shortcuts if user is typing in an input, textarea, or contenteditable element
    const isTyping =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable;

    if (isTyping) {
        return; // Let the input handle the key event
    }

    // Delete/Backspace key - delete selected shape
    // On macOS, the delete key sends 'Backspace', on Windows/Linux it sends 'Delete'
    if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedShape) {
        // Delete all connections for this shape first
        deleteShapeConnections(appState.selectedShape);

        // Delete associated label if it's a basic shape with sibling label
        const shapeId = appState.selectedShape.getAttribute('id');
        const siblingLabel = appState.selectedShape.parentNode?.querySelector(
            `text[data-shape-id="${shapeId}"]`
        );
        if (siblingLabel) {
            siblingLabel.remove();
        }

        appState.selectedShape.remove();
        appState.deselectShape();
        removeResizeHandles();

        // Persist state after deleting shape
        saveAppState();
        return;
    }

    // Escape key - deselect shape
    if (e.key === 'Escape') {
        deselectShape();
        return;
    }

    // Zoom shortcuts (Ctrl/Cmd + =/-/0)
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '=':
            case '+':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
                e.preventDefault();
                zoomOut();
                break;
            case '0':
                e.preventDefault();
                resetZoom();
                break;
        }
    }
}
