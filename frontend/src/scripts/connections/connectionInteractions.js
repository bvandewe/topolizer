/**
 * Connection and label selection, editing, and deletion
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { saveAppState } from '../services/storage.js';
import { deselectShape } from '../shapes/shapeSelection.js';

let selectedConnection = null;
let selectedLabel = null;
let editingLabel = null;
let showOverlayCallback = null;

/**
 * Set the callback function for showing overlay (avoids circular dependency)
 * @param {Function} callback - The function to call to show overlay
 */
export function setShowOverlayCallback(callback) {
    showOverlayCallback = callback;
}

/**
 * Initialize connection and label interactions
 */
export function initializeConnectionInteractions() {
    // Add click handlers to existing connections and labels
    setupConnectionListeners();

    // Set up mutation observer to handle dynamically added connections/labels
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.classList) {
                    if (node.classList.contains('connection')) {
                        addConnectionListeners(node);
                    } else if (node.classList.contains('connection-label')) {
                        addLabelListeners(node);
                    }
                }
            });
        });
    });

    observer.observe(elements.canvas, { childList: true, subtree: true });

    // Global delete key handler
    document.addEventListener('keydown', handleDeleteKey);
}

/**
 * Setup listeners for all existing connections and labels
 */
function setupConnectionListeners() {
    // Connections
    document.querySelectorAll('.connection').forEach(addConnectionListeners);

    // Labels
    document.querySelectorAll('.connection-label').forEach(addLabelListeners);
}

/**
 * Add listeners to a connection
 * @param {SVGElement} connection - The connection element
 */
function addConnectionListeners(connection) {
    const line = connection.querySelector('.connection-line');
    const hitTarget = connection.querySelector('.connection-hit-target');

    if (!line) return;

    // Make the line interactive
    line.style.pointerEvents = 'auto';
    line.style.cursor = 'pointer';

    const clickHandler = e => {
        e.stopPropagation();
        selectConnectionAndShowOverlay(connection);
    };

    line.addEventListener('click', clickHandler);

    // Also add listener to hit target if it exists
    if (hitTarget) {
        hitTarget.addEventListener('click', clickHandler);
    }
}

/**
 * Select a connection and show overlay to edit labels
 * @param {SVGElement} connection - The connection to select
 */
function selectConnectionAndShowOverlay(connection) {
    // Deselect everything else
    deselectAll();
    deselectShape();

    selectedConnection = connection;
    connection.classList.add('selected');

    console.log('Selected connection:', connection.id);

    // Get the connection's labels
    const sourceLabelId = connection.getAttribute('data-source-label-id');
    const targetLabelId = connection.getAttribute('data-target-label-id');
    const centerLabelId = connection.getAttribute('data-center-label-id');

    const sourceLabel = document.getElementById(sourceLabelId);
    const targetLabel = document.getElementById(targetLabelId);
    const centerLabel = document.getElementById(centerLabelId);

    // Show connection panel with current properties (use callback to avoid circular dependency)
    if (showOverlayCallback) {
        showOverlayCallback(
            connection,
            sourceLabel ? sourceLabel.textContent : '',
            targetLabel ? targetLabel.textContent : '',
            centerLabel ? centerLabel.textContent : ''
        );
    }
}

/**
 * Add listeners to a label
 * @param {SVGElement} label - The label element
 */
function addLabelListeners(label) {
    // Labels are edited via the Connection Details modal, not inline
    // Just make them look interactive
    label.style.cursor = 'pointer';
}

/**
 * Select a connection
 * @param {SVGElement} connection - The connection to select
 */
function selectConnection(connection) {
    // Deselect everything else
    deselectAll();
    deselectShape();

    selectedConnection = connection;
    connection.classList.add('selected');

    console.log('Selected connection:', connection.id);
}

/**
 * Select a label
 * @param {SVGElement} label - The label to select
 */
function selectLabel(label) {
    // Deselect everything else
    deselectAll();
    deselectShape();

    selectedLabel = label;
    label.classList.add('selected');

    console.log('Selected label:', label.id);
}

/**
 * Deselect all connections and labels
 */
export function deselectAll() {
    // Deselect connection
    if (selectedConnection) {
        selectedConnection.classList.remove('selected');
        selectedConnection = null;
    }

    // Deselect label - clear from tracked variable
    if (selectedLabel) {
        selectedLabel.classList.remove('selected');
        selectedLabel = null;
    }

    // Also remove 'selected' class from any other labels that might have it
    // (defensive programming to prevent orphaned selections)
    document.querySelectorAll('.connection-label.selected').forEach(label => {
        label.classList.remove('selected');
    });

    // Stop editing if active
    if (editingLabel) {
        stopEditingLabel(false);
    }
}

/**
 * Start editing a label's text
 * @param {SVGElement} label - The label to edit
 */
function startEditingLabel(label) {
    if (editingLabel) {
        // Set the cleanup flag before calling stopEditingLabel to prevent blur handler from firing
        if (editingLabel._editorCleanupFlag) {
            // Get the closure and set it to true
            const previousLabel = editingLabel;
            const previousForeignObject = editingLabel._editorElement;
            if (previousForeignObject && previousForeignObject._setCleaningUp) {
                previousForeignObject._setCleaningUp();
            }
        }
        stopEditingLabel(true);
    }

    editingLabel = label;
    const currentText = label.textContent;

    // Create a foreign object to hold an input
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    const x = parseFloat(label.getAttribute('x'));
    const y = parseFloat(label.getAttribute('y'));

    foreignObject.setAttribute('x', x - 50);
    foreignObject.setAttribute('y', y - 20);
    foreignObject.setAttribute('width', 200);
    foreignObject.setAttribute('height', 40);
    foreignObject.setAttribute('class', 'label-editor-foreign');

    // Add a flag to track if cleanup is in progress
    let isCleaningUp = false;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'form-control form-control-sm';
    input.style.fontSize = '12px';

    foreignObject.appendChild(input);

    // Store a function to set the cleanup flag from outside
    foreignObject._setCleaningUp = () => {
        isCleaningUp = true;
    };

    elements.canvas.appendChild(foreignObject);

    // Focus and place cursor at the end
    input.focus();
    // Set cursor position to end of text
    input.setSelectionRange(input.value.length, input.value.length);

    // Save on blur or Enter
    input.addEventListener('blur', () => {
        // Only process if this editor is still active and not already cleaning up
        if (editingLabel === label && foreignObject.parentNode && !isCleaningUp) {
            isCleaningUp = true;
            label.textContent = input.value || currentText;
            foreignObject.remove();
            delete label._editorElement;
            editingLabel = null;
            saveAppState();
        }
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            // Only process if this editor is still active and not already cleaning up
            if (editingLabel === label && foreignObject.parentNode && !isCleaningUp) {
                isCleaningUp = true;
                label.textContent = currentText;
                foreignObject.remove();
                delete label._editorElement;
                editingLabel = null;
            }
        }
    });

    // Store reference for cleanup
    label._editorElement = foreignObject;
    label._editorCleanupFlag = () => isCleaningUp;
}

/**
 * Stop editing a label
 * @param {boolean} save - Whether to save the changes
 */
function stopEditingLabel(save) {
    if (!editingLabel || !editingLabel._editorElement) return;

    const foreignObject = editingLabel._editorElement;
    const input = foreignObject.querySelector('input');

    // Check if already cleaning up (via blur/escape handler)
    if (editingLabel._editorCleanupFlag && editingLabel._editorCleanupFlag()) {
        return;
    }

    if (save && input) {
        editingLabel.textContent = input.value || editingLabel.textContent;
    }

    // Safely remove the foreign object
    try {
        if (foreignObject && foreignObject.parentNode) {
            foreignObject.remove();
        }
    } catch (e) {
        // Element already removed or not in DOM - this is fine
    }

    delete editingLabel._editorElement;
    delete editingLabel._editorCleanupFlag;
    editingLabel = null;

    if (save) {
        saveAppState();
    }
}

/**
 * Handle delete key press
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleDeleteKey(e) {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;

    // Don't delete if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (selectedConnection) {
        deleteConnection(selectedConnection);
    } else if (selectedLabel) {
        deleteLabel(selectedLabel);
    }
}

/**
 * Delete a connection and its labels
 * @param {SVGElement} connection - The connection to delete
 */
function deleteConnection(connection) {
    const sourceLabelId = connection.getAttribute('data-source-label-id');
    const targetLabelId = connection.getAttribute('data-target-label-id');

    // Remove labels
    if (sourceLabelId) {
        const sourceLabel = document.getElementById(sourceLabelId);
        if (sourceLabel) sourceLabel.remove();
    }
    if (targetLabelId) {
        const targetLabel = document.getElementById(targetLabelId);
        if (targetLabel) targetLabel.remove();
    }

    // Update shape connection data
    const sourceId = connection.getAttribute('data-source');
    const targetId = connection.getAttribute('data-target');
    const connectionId = connection.id;

    [sourceId, targetId].forEach(shapeId => {
        const shape = document.getElementById(shapeId);
        if (shape && shape.dataset.connections) {
            shape.dataset.connections = shape.dataset.connections
                .split(',')
                .filter(id => id !== connectionId)
                .join(',');
        }
    });

    // Remove connection
    connection.remove();
    selectedConnection = null;

    saveAppState();
    console.log('Deleted connection:', connectionId);
}

/**
 * Delete a label
 * @param {SVGElement} label - The label to delete
 */
function deleteLabel(label) {
    if (!confirm('Delete this label?')) return;

    label.remove();
    selectedLabel = null;

    saveAppState();
    console.log('Deleted label:', label.id);
}

/**
 * Add a centered label to a selected connection
 * @param {SVGElement} connection - The connection
 * @param {string} text - The label text
 */
export function addCenteredLabel(connection, text) {
    const line = connection.querySelector('.connection-line');
    if (!line) return;

    const x1 = parseFloat(line.getAttribute('x1'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y2 = parseFloat(line.getAttribute('y2'));

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const labelId = `label-${connection.id}-center`;

    label.id = labelId;
    label.setAttribute('x', centerX);
    label.setAttribute('y', centerY);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dy', '-5');
    label.setAttribute('fill', '#495057');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.classList.add('connection-label');
    label.classList.add('connection-label-center');
    label.textContent = text;
    label.style.cursor = 'move';
    label.style.userSelect = 'none';

    elements.canvas.appendChild(label);
    addLabelListeners(label);

    // Make it draggable
    makeLabelDraggable(label);

    saveAppState();
    return label;
}

/**
 * Make a label draggable
 * @param {SVGElement} label - The label element
 */
function makeLabelDraggable(label) {
    let isDragging = false;
    let startX, startY, labelX, labelY;

    label.addEventListener('mousedown', e => {
        if (e.button !== 0) return; // Only left click

        isDragging = true;
        const canvasRect = elements.canvas.getBoundingClientRect();
        startX = (e.clientX - canvasRect.left) / appState.currentZoom;
        startY = (e.clientY - canvasRect.top) / appState.currentZoom;
        labelX = parseFloat(label.getAttribute('x'));
        labelY = parseFloat(label.getAttribute('y'));

        e.stopPropagation();
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        const canvasRect = elements.canvas.getBoundingClientRect();
        const currentX = (e.clientX - canvasRect.left) / appState.currentZoom;
        const currentY = (e.clientY - canvasRect.top) / appState.currentZoom;

        const dx = currentX - startX;
        const dy = currentY - startY;

        label.setAttribute('x', labelX + dx);
        label.setAttribute('y', labelY + dy);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            saveAppState();
        }
    });
}

export { selectedConnection, selectedLabel, addLabelListeners };
