/**
 * Shape overlay panel for connection creation and other shape actions
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { createConnection } from '../connections/connectionManager.js';
import { saveAppState } from '../services/storage.js';
import { setShowOverlayCallback } from '../connections/connectionInteractions.js';
import { showAlert } from '../utils/modal.js';
import { addShapeEventListeners, removeShapeEventListeners } from '../shapes/shapeEvents.js';
import {
    duplicateShape,
    moveShapeToFront,
    moveShapeToBack,
    applyShapeFill,
    applyShapeStroke,
    getShapeStyles,
} from '../shapes/shapeActions.js';

let overlaySourceShape = null;
let selectedConnection = null;
let isWaitingForTarget = false;
let connectionClickHandler = null;

// Dragging state for shape panel
let isShapePanelDragging = false;
let shapePanelDragOffsetX = 0;
let shapePanelDragOffsetY = 0;

// Dragging state for connection panel
let isConnectionPanelDragging = false;
let connectionPanelDragOffsetX = 0;
let connectionPanelDragOffsetY = 0;

/**
 * Initialize shape overlay panel
 */
export function initializeShapeOverlay() {
    // Register the callback to avoid circular dependency
    setShowOverlayCallback(showConnectionPanel);

    // Shape panel controls
    elements.closeOverlayPanel.addEventListener('click', hideShapePanel);

    // Start connection button (if it exists - may be removed in some versions)
    if (elements.startConnectionBtn) {
        elements.startConnectionBtn.addEventListener('click', startConnectionMode);
    }

    // Apply Changes button for shape attributes
    if (elements.applyShapeChanges) {
        elements.applyShapeChanges.addEventListener('click', applyShapeChanges);
    }

    // New action buttons
    const duplicateBtn = document.getElementById('duplicateShape');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', () => {
            if (overlaySourceShape) {
                const shapeId = overlaySourceShape.id;
                duplicateShape(shapeId);
                // Don't hide panel immediately - let user see the result
                setTimeout(() => hideShapePanel(), 100);
            }
        });
    }

    const moveToFrontBtn = document.getElementById('moveToFront');
    if (moveToFrontBtn) {
        moveToFrontBtn.addEventListener('click', () => {
            if (overlaySourceShape) {
                const shapeId = overlaySourceShape.id;
                moveShapeToFront(shapeId);
            }
        });
    }

    const moveToBackBtn = document.getElementById('moveToBack');
    if (moveToBackBtn) {
        moveToBackBtn.addEventListener('click', () => {
            if (overlaySourceShape) {
                const shapeId = overlaySourceShape.id;
                moveShapeToBack(shapeId);
            }
        });
    }

    // Add Enter key handler for shape panel inputs
    const shapeInputs = [elements.shapeLabelText, elements.shapeLabelFontSize];
    shapeInputs.forEach(input => {
        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyShapeChanges();
                }
            });
        }
    });

    // Connection panel controls
    elements.closeConnectionPanel.addEventListener('click', hideConnectionPanel);

    if (elements.applyConnectionChanges) {
        elements.applyConnectionChanges.addEventListener('click', applyConnectionChanges);
    }

    // Add Enter key handler for connection panel inputs
    const connectionInputs = [
        elements.connectionCenterLabel,
        elements.connectionSourceLabel,
        elements.connectionTargetLabel,
        elements.connectionLabelFontSize,
    ];
    connectionInputs.forEach(input => {
        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyConnectionChanges();
                }
            });
        }
    });

    // Make shape panel draggable by its header
    const shapePanelHeader = document.getElementById('overlayPanelHeader');
    if (shapePanelHeader) {
        shapePanelHeader.addEventListener('mousedown', startShapePanelDrag);
    }

    // Make connection panel draggable by its header
    const connectionPanelHeader = document.getElementById('connectionPanelHeader');
    if (connectionPanelHeader) {
        connectionPanelHeader.addEventListener('mousedown', startConnectionPanelDrag);
    }

    // Add global Escape key handler to close panels
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            // Close shape panel if visible
            if (elements.shapeOverlayPanel.style.display !== 'none') {
                hideShapePanel();
                e.preventDefault();
            }
            // Close connection panel if visible
            else if (elements.connectionOverlayPanel.style.display !== 'none') {
                hideConnectionPanel();
                e.preventDefault();
            }
        }
    });

    // Close panels when clicking outside
    document.addEventListener('click', e => {
        // Close shape panel if clicking outside
        if (
            elements.shapeOverlayPanel.style.display !== 'none' &&
            !elements.shapeOverlayPanel.contains(e.target) &&
            !e.target.classList.contains('canvas-shape') &&
            !e.target.classList.contains('cisco-shape') &&
            !isWaitingForTarget
        ) {
            hideShapePanel();
        }

        // Close connection panel if clicking outside
        if (
            elements.connectionOverlayPanel.style.display !== 'none' &&
            !elements.connectionOverlayPanel.contains(e.target) &&
            !e.target.classList.contains('connection-line')
        ) {
            hideConnectionPanel();
        }
    });
}

/**
 * Start dragging the shape panel
 * @param {MouseEvent} e - Mouse event
 */
function startShapePanelDrag(e) {
    // Don't drag if clicking the close button
    if (e.target.classList.contains('btn-close')) return;

    isShapePanelDragging = true;
    const panel = elements.shapeOverlayPanel;
    const rect = panel.getBoundingClientRect();

    shapePanelDragOffsetX = e.clientX - rect.left;
    shapePanelDragOffsetY = e.clientY - rect.top;

    document.addEventListener('mousemove', doShapePanelDrag);
    document.addEventListener('mouseup', stopShapePanelDrag);

    e.preventDefault();
}

/**
 * Drag the shape panel
 * @param {MouseEvent} e - Mouse event
 */
function doShapePanelDrag(e) {
    if (!isShapePanelDragging) return;

    const panel = elements.shapeOverlayPanel;
    let newLeft = e.clientX - shapePanelDragOffsetX;
    let newTop = e.clientY - shapePanelDragOffsetY;

    // Keep panel within viewport
    const panelRect = panel.getBoundingClientRect();
    const maxLeft = window.innerWidth - panelRect.width;
    const maxTop = window.innerHeight - panelRect.height;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
}

/**
 * Stop dragging the shape panel
 */
function stopShapePanelDrag() {
    isShapePanelDragging = false;
    document.removeEventListener('mousemove', doShapePanelDrag);
    document.removeEventListener('mouseup', stopShapePanelDrag);
}

/**
 * Start dragging the connection panel
 * @param {MouseEvent} e - Mouse event
 */
function startConnectionPanelDrag(e) {
    // Don't drag if clicking the close button
    if (e.target.classList.contains('btn-close')) return;

    isConnectionPanelDragging = true;
    const panel = elements.connectionOverlayPanel;
    const rect = panel.getBoundingClientRect();

    connectionPanelDragOffsetX = e.clientX - rect.left;
    connectionPanelDragOffsetY = e.clientY - rect.top;

    document.addEventListener('mousemove', doConnectionPanelDrag);
    document.addEventListener('mouseup', stopConnectionPanelDrag);

    e.preventDefault();
}

/**
 * Drag the connection panel
 * @param {MouseEvent} e - Mouse event
 */
function doConnectionPanelDrag(e) {
    if (!isConnectionPanelDragging) return;

    const panel = elements.connectionOverlayPanel;
    let newLeft = e.clientX - connectionPanelDragOffsetX;
    let newTop = e.clientY - connectionPanelDragOffsetY;

    // Keep panel within viewport
    const panelRect = panel.getBoundingClientRect();
    const maxLeft = window.innerWidth - panelRect.width;
    const maxTop = window.innerHeight - panelRect.height;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
}

/**
 * Stop dragging the connection panel
 */
function stopConnectionPanelDrag() {
    isConnectionPanelDragging = false;
    document.removeEventListener('mousemove', doConnectionPanelDrag);
    document.removeEventListener('mouseup', stopConnectionPanelDrag);
}

/**
 * Update shape label text
 */
function updateShapeLabel() {
    if (!overlaySourceShape) return;

    const dataType = overlaySourceShape.getAttribute('data-shape-type');
    const isTextShape = dataType === 'text';
    const isCiscoShape = overlaySourceShape.getAttribute('data-cisco') === 'true';
    const isBasicShape =
        overlaySourceShape.tagName === 'circle' ||
        overlaySourceShape.tagName === 'rect' ||
        overlaySourceShape.tagName === 'ellipse';

    // For text shapes, update the text-content element
    if (isTextShape) {
        const labelEl = overlaySourceShape.querySelector('.text-content');
        if (labelEl) {
            labelEl.textContent = elements.shapeLabelText.value;
            const { updateTextBackground } = require('../shapes/shapeFactory.js');
            updateTextBackground(overlaySourceShape);
        }
        return;
    }

    // Find the label element based on shape type
    // For basic shapes: look for sibling label with matching shape-id
    // For Cisco shapes: look for child text without data-label
    // For groups: look for child text with data-label="true"
    let labelEl;
    if (isBasicShape) {
        const shapeId = overlaySourceShape.getAttribute('id');
        labelEl = overlaySourceShape.parentNode.querySelector(`text[data-shape-id="${shapeId}"]`);
    } else {
        labelEl = isCiscoShape
            ? overlaySourceShape.querySelector('text:not([data-label])')
            : overlaySourceShape.querySelector('text[data-label="true"]');
    }

    const labelText = elements.shapeLabelText.value;

    // If label element doesn't exist and text is provided, create it
    if (!labelEl && labelText) {
        // For basic shapes (circle, rect, ellipse), add label as a sibling element
        if (isBasicShape) {
            console.log('Adding label to basic shape as sibling element');

            // Create label element
            labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelEl.setAttribute('data-label', 'true');
            labelEl.setAttribute('fill', elements.shapeLabelColor.value || '#333333');
            labelEl.setAttribute('font-size', elements.shapeLabelFontSize.value || '14');
            labelEl.setAttribute('font-weight', 'normal');
            labelEl.setAttribute('data-position', elements.shapeLabelPosition.value || 'below');
            labelEl.setAttribute('text-anchor', 'middle');
            labelEl.textContent = labelText;

            // Store reference to label on shape and vice versa
            const shapeId = overlaySourceShape.getAttribute('id');
            labelEl.setAttribute('data-shape-id', shapeId);
            overlaySourceShape.setAttribute('data-has-label', 'true');

            // Add label to the same parent (canvas layer)
            overlaySourceShape.parentNode.appendChild(labelEl);

            // Position the label based on shape dimensions and position
            updateShapeLabelPosition();

            console.log('Label added as sibling to basic shape');
            return; // Exit early, label is created
        }

        // For Cisco shapes and groups, add label as child (existing behavior)
        labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelEl.setAttribute('data-label', 'true');
        labelEl.setAttribute('fill', elements.shapeLabelColor.value || '#333333');
        labelEl.setAttribute('font-size', elements.shapeLabelFontSize.value || '14');
        labelEl.setAttribute('font-weight', 'normal');
        labelEl.setAttribute('data-position', elements.shapeLabelPosition.value || 'below');
        labelEl.setAttribute('text-anchor', 'middle');
        overlaySourceShape.appendChild(labelEl);

        // Position the label based on shape
        updateShapeLabelPosition();
    }

    if (labelEl) {
        // If text is empty and it's not a Cisco shape (which should keep default label), remove the label
        if (!labelText && !isCiscoShape) {
            labelEl.remove();
            return;
        }

        labelEl.textContent = labelText;
    }
}

/**
 * Update shape label position
 */
function updateShapeLabelPosition() {
    if (!overlaySourceShape) return;

    const dataType = overlaySourceShape.getAttribute('data-shape-type');
    const isTextShape = dataType === 'text';
    const isCiscoShape = overlaySourceShape.getAttribute('data-cisco') === 'true';
    const isBasicShape =
        overlaySourceShape.tagName === 'circle' ||
        overlaySourceShape.tagName === 'rect' ||
        overlaySourceShape.tagName === 'ellipse';

    // Don't reposition text shapes (they are the label itself)
    if (isTextShape) return;

    // Find the label element
    let labelEl;
    if (isBasicShape) {
        // For basic shapes, find sibling label
        const shapeId = overlaySourceShape.getAttribute('id');
        labelEl = overlaySourceShape.parentNode?.querySelector(`text[data-shape-id="${shapeId}"]`);
    } else {
        // For Cisco shapes and groups, find child label
        labelEl = isCiscoShape
            ? overlaySourceShape.querySelector('text:not([data-label])')
            : overlaySourceShape.querySelector('text[data-label="true"]');
    }

    if (!labelEl) return;

    const position = elements.shapeLabelPosition.value;

    let width, height, x, y;
    const offset = 20;

    // Get shape dimensions based on shape type
    if (isBasicShape) {
        // Handle basic shapes directly (not in a group)
        if (overlaySourceShape.tagName === 'circle') {
            const r = parseFloat(overlaySourceShape.getAttribute('r')) || 30;
            const cx = parseFloat(overlaySourceShape.getAttribute('cx')) || 0;
            const cy = parseFloat(overlaySourceShape.getAttribute('cy')) || 0;
            width = r * 2;
            height = r * 2;
            x = cx;
            y = cy;
        } else if (overlaySourceShape.tagName === 'ellipse') {
            const rx = parseFloat(overlaySourceShape.getAttribute('rx')) || 40;
            const ry = parseFloat(overlaySourceShape.getAttribute('ry')) || 30;
            const cx = parseFloat(overlaySourceShape.getAttribute('cx')) || 0;
            const cy = parseFloat(overlaySourceShape.getAttribute('cy')) || 0;
            width = rx * 2;
            height = ry * 2;
            x = cx;
            y = cy;
        } else if (overlaySourceShape.tagName === 'rect') {
            width = parseFloat(overlaySourceShape.getAttribute('width')) || 60;
            height = parseFloat(overlaySourceShape.getAttribute('height')) || 40;
            x = parseFloat(overlaySourceShape.getAttribute('x')) || 0;
            y = parseFloat(overlaySourceShape.getAttribute('y')) || 0;
        }
    } else if (overlaySourceShape.tagName === 'g') {
        // For groups, check if it's a Cisco shape or a converted basic shape
        const svg = overlaySourceShape.querySelector('svg');
        if (svg) {
            // Cisco shape - SVG child with viewBox coordinates
            width = parseFloat(svg.getAttribute('width')) || 60;
            height = parseFloat(svg.getAttribute('height')) || 60;
            x = 0; // Cisco shapes use transform on the group
            y = 0;
        } else {
            // Converted basic shape - get dimensions from child shape
            const childShape = overlaySourceShape.querySelector('circle, rect, ellipse');
            if (childShape) {
                if (childShape.tagName === 'circle') {
                    const r = parseFloat(childShape.getAttribute('r')) || 30;
                    const cx = parseFloat(childShape.getAttribute('cx')) || 0;
                    const cy = parseFloat(childShape.getAttribute('cy')) || 0;
                    width = r * 2;
                    height = r * 2;
                    x = cx;
                    y = cy;
                } else if (childShape.tagName === 'ellipse') {
                    const rx = parseFloat(childShape.getAttribute('rx')) || 40;
                    const ry = parseFloat(childShape.getAttribute('ry')) || 30;
                    const cx = parseFloat(childShape.getAttribute('cx')) || 0;
                    const cy = parseFloat(childShape.getAttribute('cy')) || 0;
                    width = rx * 2;
                    height = ry * 2;
                    x = cx;
                    y = cy;
                } else if (childShape.tagName === 'rect') {
                    width = parseFloat(childShape.getAttribute('width')) || 60;
                    height = parseFloat(childShape.getAttribute('height')) || 40;
                    x = parseFloat(childShape.getAttribute('x')) || 0;
                    y = parseFloat(childShape.getAttribute('y')) || 0;
                }
            } else {
                // Fallback
                width = 60;
                height = 60;
                x = 0;
                y = 0;
            }
        }
    } else {
        // Default fallback for other shape types
        width = 60;
        height = 60;
        x = 0;
        y = 0;
    }

    // Calculate label position
    // For circles/ellipses, x and y are center coords; for rects, they're top-left
    let labelX, labelY;
    const isCircular =
        overlaySourceShape.tagName === 'circle' ||
        overlaySourceShape.tagName === 'ellipse' ||
        (overlaySourceShape.tagName === 'g' && overlaySourceShape.querySelector('circle, ellipse'));

    switch (position) {
        case 'above':
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y - height / 2 - offset : y - offset;
            labelEl.setAttribute('text-anchor', 'middle');
            break;
        case 'below':
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y + height / 2 + offset : y + height + offset;
            labelEl.setAttribute('text-anchor', 'middle');
            break;
        case 'left':
            labelX = isCircular ? x - width / 2 - offset : x - offset;
            labelY = isCircular ? y : y + height / 2;
            labelEl.setAttribute('text-anchor', 'end');
            break;
        case 'right':
            labelX = isCircular ? x + width / 2 + offset : x + width + offset;
            labelY = isCircular ? y : y + height / 2;
            labelEl.setAttribute('text-anchor', 'start');
            break;
        case 'center':
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y + 5 : y + height / 2 + 5; // Slightly offset for better centering
            labelEl.setAttribute('text-anchor', 'middle');
            labelEl.setAttribute('dominant-baseline', 'middle');
            break;
        default:
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y + height / 2 + offset : y + height + offset;
            labelEl.setAttribute('text-anchor', 'middle');
    }

    labelEl.setAttribute('x', labelX);
    labelEl.setAttribute('y', labelY);
    labelEl.setAttribute('data-position', position);
}

/**
 * Update shape label color
 */
function updateShapeLabelColor() {
    if (!overlaySourceShape) return;

    const dataType = overlaySourceShape.getAttribute('data-shape-type');
    const isTextShape = dataType === 'text';
    const isCiscoShape = overlaySourceShape.getAttribute('data-cisco') === 'true';

    let labelEl;
    if (isTextShape) {
        labelEl = overlaySourceShape.querySelector('.text-content');
    } else if (isCiscoShape) {
        labelEl = overlaySourceShape.querySelector('text:not([data-label])');
    } else {
        labelEl = overlaySourceShape.querySelector('text[data-label="true"]');
    }

    if (labelEl) {
        labelEl.setAttribute('fill', elements.shapeLabelColor.value);
    }
}

/**
 * Update shape label font size
 */
function updateShapeLabelFontSize() {
    if (!overlaySourceShape) return;

    const dataType = overlaySourceShape.getAttribute('data-shape-type');
    const isTextShape = dataType === 'text';
    const isCiscoShape = overlaySourceShape.getAttribute('data-cisco') === 'true';

    let labelEl;
    if (isTextShape) {
        labelEl = overlaySourceShape.querySelector('.text-content');
    } else if (isCiscoShape) {
        labelEl = overlaySourceShape.querySelector('text:not([data-label])');
    } else {
        labelEl = overlaySourceShape.querySelector('text[data-label="true"]');
    }

    if (labelEl) {
        const fontSize = elements.shapeLabelFontSize.value || '14';
        labelEl.setAttribute('font-size', fontSize);

        // If it's a text shape, update the background to fit new size
        if (isTextShape) {
            const { updateTextBackground } = require('../shapes/shapeFactory.js');
            updateTextBackground(overlaySourceShape);
        }
    }
}

/**
 * Toggle shape label style (bold, italic, underline)
 * @param {string} style - Style to toggle ('bold', 'italic', 'underline')
 */
function toggleShapeLabelStyle(style) {
    if (!overlaySourceShape) return;

    const labelEl = overlaySourceShape.querySelector('text');
    if (!labelEl) return;

    let button;
    switch (style) {
        case 'bold':
            button = elements.shapeLabelBold;
            const currentWeight = labelEl.getAttribute('font-weight') || 'normal';
            labelEl.setAttribute('font-weight', currentWeight === 'bold' ? 'normal' : 'bold');
            break;
        case 'italic':
            button = elements.shapeLabelItalic;
            const currentStyle = labelEl.getAttribute('font-style') || 'normal';
            labelEl.setAttribute('font-style', currentStyle === 'italic' ? 'normal' : 'italic');
            break;
        case 'underline':
            button = elements.shapeLabelUnderline;
            const currentDecoration = labelEl.getAttribute('text-decoration') || 'none';
            labelEl.setAttribute(
                'text-decoration',
                currentDecoration === 'underline' ? 'none' : 'underline'
            );
            break;
    }

    // Toggle button active state
    if (button) {
        button.classList.toggle('active');
    }
}

/**
 * Apply all shape changes and save state
 */
function applyShapeChanges() {
    if (!overlaySourceShape) return;

    // Apply all changes
    updateShapeLabel();
    updateShapeLabelPosition();
    updateShapeLabelColor();
    updateShapeLabelFontSize();

    // Apply shape styling
    const shapeFillInput = document.getElementById('shapeFillColor');
    const shapeStrokeInput = document.getElementById('shapeStrokeColor');
    const shapeStrokeWidthInput = document.getElementById('shapeStrokeWidth');

    if (shapeFillInput && shapeStrokeInput && shapeStrokeWidthInput) {
        applyShapeFill(overlaySourceShape.id, shapeFillInput.value);
        applyShapeStroke(
            overlaySourceShape.id,
            shapeStrokeInput.value,
            parseInt(shapeStrokeWidthInput.value)
        );
    }

    // Save state after applying all changes
    saveAppState();

    // Hide the panel
    hideShapePanel();
}

/**
 * Check if we're waiting for a target shape
 * @returns {boolean}
 */
export function isInConnectionMode() {
    return isWaitingForTarget;
}

/**
 * Handle target shape selection
 * @param {SVGElement} targetShape - The clicked shape
 */
export function handleTargetShapeClick(targetShape) {
    if (!isWaitingForTarget || !overlaySourceShape) {
        return;
    }

    if (targetShape === overlaySourceShape) {
        // Can't connect to itself - provide feedback
        console.log('Cannot connect a shape to itself');
        showAlert('Cannot connect a shape to itself', 'Invalid Connection', 'warning');
        return;
    }

    // Create the connection with default values
    finishConnectionWithTarget(targetShape);
}

/**
 * Show shape panel near a shape
 * @param {SVGElement} shape - The selected shape
 */
export function showOverlayPanel(shape) {
    if (!shape) return;

    // Don't show overlay if we're waiting for a target shape
    if (isWaitingForTarget) {
        console.log('Cannot show overlay - waiting for connection target');
        return;
    }

    const shapeRect = shape.getBoundingClientRect();

    // Position the panel below the shape
    const panelWidth = 320; // Increased width for two columns
    const panelHeight = 500;

    let left = shapeRect.left;
    let top = shapeRect.bottom + 10;

    // Adjust if panel goes off screen horizontally
    if (left + panelWidth > window.innerWidth) {
        left = window.innerWidth - panelWidth - 10;
    }

    // Adjust if panel goes off screen vertically (show above if needed)
    if (top + panelHeight > window.innerHeight) {
        top = shapeRect.top - panelHeight - 10;
        // If still off screen, just position at bottom of viewport
        if (top < 10) {
            top = 10;
        }
    }

    elements.shapeOverlayPanel.style.left = `${left}px`;
    elements.shapeOverlayPanel.style.top = `${top}px`;
    elements.shapeOverlayPanel.style.display = 'block';

    overlaySourceShape = shape;

    // Check if this is a text shape
    const dataType = shape.getAttribute('data-shape-type');
    const isTextShape = dataType === 'text';
    const isCiscoShape = shape.getAttribute('data-cisco') === 'true';

    // Update panel labels for text shapes
    const leftColumnTitle = document.getElementById('leftColumnTitle');
    const labelTextLabel = document.getElementById('labelTextLabel');
    const labelColorLabel = document.getElementById('labelColorLabel');
    const labelPositionContainer = document.getElementById('labelPositionContainer');

    if (isTextShape) {
        if (leftColumnTitle) leftColumnTitle.textContent = 'Text Customization';
        if (labelTextLabel) labelTextLabel.textContent = 'Text Content';
        if (labelColorLabel) labelColorLabel.textContent = 'Text Color';
        if (labelPositionContainer) labelPositionContainer.style.display = 'none';
        elements.shapeLabelText.placeholder = 'Enter text';
    } else {
        if (leftColumnTitle) leftColumnTitle.textContent = 'Label Customization';
        if (labelTextLabel) labelTextLabel.textContent = 'Label Text';
        if (labelColorLabel) labelColorLabel.textContent = 'Label Color';
        if (labelPositionContainer) labelPositionContainer.style.display = 'block';
        elements.shapeLabelText.placeholder = 'Shape label';
    }

    // Load current shape label properties
    // For text shapes, load from .text-content
    // For Cisco shapes, load from text without data-label
    // For basic shapes, load from text with data-label="true"
    let labelEl;
    if (isTextShape) {
        labelEl = shape.querySelector('.text-content');
    } else if (isCiscoShape) {
        labelEl = shape.querySelector('text:not([data-label])');
    } else {
        labelEl = shape.querySelector('text[data-label="true"]');
    }
    if (labelEl) {
        elements.shapeLabelText.value = labelEl.textContent || '';
        elements.shapeLabelColor.value = labelEl.getAttribute('fill') || '#333333';
        elements.shapeLabelFontSize.value = labelEl.getAttribute('font-size') || '14';
        elements.shapeLabelPosition.value = labelEl.getAttribute('data-position') || 'below';

        // Update style button states
        const isBold = labelEl.getAttribute('font-weight') === 'bold';
        const isItalic = labelEl.getAttribute('font-style') === 'italic';
        const isUnderline = labelEl.getAttribute('text-decoration') === 'underline';

        elements.shapeLabelBold.classList.toggle('active', isBold);
        elements.shapeLabelItalic.classList.toggle('active', isItalic);
        elements.shapeLabelUnderline.classList.toggle('active', isUnderline);
    } else {
        // No label yet - set defaults
        elements.shapeLabelText.value = '';
        elements.shapeLabelColor.value = '#333333';
        elements.shapeLabelFontSize.value = '14';
        elements.shapeLabelPosition.value = 'below';
        elements.shapeLabelBold.classList.remove('active');
        elements.shapeLabelItalic.classList.remove('active');
        elements.shapeLabelUnderline.classList.remove('active');
    }

    // Load shape styling
    const shapeFillInput = document.getElementById('shapeFillColor');
    const shapeStrokeInput = document.getElementById('shapeStrokeColor');
    const shapeStrokeWidthInput = document.getElementById('shapeStrokeWidth');

    if (shapeFillInput && shapeStrokeInput && shapeStrokeWidthInput) {
        const styles = getShapeStyles(shape.id);
        if (styles) {
            shapeFillInput.value = styles.fill;
            shapeStrokeInput.value = styles.stroke;
            shapeStrokeWidthInput.value = styles.strokeWidth;
        }
    }

    // Set focus on label text field after a short delay to ensure panel is visible
    setTimeout(() => {
        elements.shapeLabelText.focus();
        elements.shapeLabelText.select();
    }, 100);
}

/**
 * Show connection panel for editing an existing connection
 * @param {SVGElement} connection - The connection group element
 * @param {string} sourceLabel - Current source label text
 * @param {string} targetLabel - Current target label text
 * @param {string} centerLabel - Current center label text (deprecated, not used)
 */
export function showConnectionPanel(connection, sourceLabel, targetLabel, centerLabel) {
    // Position the panel in the center of screen
    const panelWidth = 280;
    const panelHeight = 300;

    const left = (window.innerWidth - panelWidth) / 2;
    const top = (window.innerHeight - panelHeight) / 2;

    elements.connectionOverlayPanel.style.left = `${left}px`;
    elements.connectionOverlayPanel.style.top = `${top}px`;
    elements.connectionOverlayPanel.style.display = 'block';

    selectedConnection = connection;

    // Get the line element from the connection group
    const line = connection.querySelector('.connection-line');

    // Load current connection properties
    elements.connectionSourceLabel.value = sourceLabel || '';
    elements.connectionTargetLabel.value = targetLabel || '';
    elements.connectionCenterLabel.value = centerLabel || '';

    const strokeWidth = line ? line.getAttribute('stroke-width') || '3' : '3';
    const strokeColor = line ? line.getAttribute('stroke') || '#6c757d' : '#6c757d';
    const strokeDasharray = line ? line.getAttribute('stroke-dasharray') || '' : '';

    elements.connectionStrokeWidth.value = strokeWidth;
    elements.connectionStrokeColor.value = strokeColor;

    // Determine line style from stroke-dasharray
    if (!strokeDasharray || strokeDasharray === 'none') {
        elements.connectionStrokeStyle.value = 'solid';
    } else if (strokeDasharray === '10,5') {
        elements.connectionStrokeStyle.value = 'dashed';
    } else if (strokeDasharray === '2,3') {
        elements.connectionStrokeStyle.value = 'dotted';
    } else {
        elements.connectionStrokeStyle.value = 'solid';
    }

    // Get label styling from source label (both labels should have same styling)
    const sourceLabelId = selectedConnection.getAttribute('data-source-label-id');
    const sourceLabelEl = sourceLabelId ? document.getElementById(sourceLabelId) : null;

    if (sourceLabelEl) {
        elements.connectionLabelColor.value = sourceLabelEl.getAttribute('fill') || '#333333';
        elements.connectionLabelFontSize.value = sourceLabelEl.getAttribute('font-size') || '12';
    } else {
        elements.connectionLabelColor.value = '#333333';
        elements.connectionLabelFontSize.value = '12';
    }

    // Set focus on center label field after a short delay to ensure panel is visible
    setTimeout(() => {
        elements.connectionCenterLabel.focus();
        elements.connectionCenterLabel.select();
    }, 100);
}

/**
 * Apply connection changes from the connection panel
 */
function applyConnectionChanges() {
    if (!selectedConnection) {
        return;
    }

    // Update labels
    const sourceLabelId = selectedConnection.getAttribute('data-source-label-id');
    const targetLabelId = selectedConnection.getAttribute('data-target-label-id');
    const centerLabelId = selectedConnection.getAttribute('data-center-label-id');

    const sourceEl = sourceLabelId ? document.getElementById(sourceLabelId) : null;
    const targetEl = targetLabelId ? document.getElementById(targetLabelId) : null;
    const centerEl = centerLabelId ? document.getElementById(centerLabelId) : null;

    if (sourceEl) {
        // Clear existing content and set new text
        while (sourceEl.firstChild) {
            sourceEl.removeChild(sourceEl.firstChild);
        }
        const textNode = document.createTextNode(elements.connectionSourceLabel.value);
        sourceEl.appendChild(textNode);

        // Update label styling
        sourceEl.setAttribute('fill', elements.connectionLabelColor.value);
        sourceEl.setAttribute('font-size', elements.connectionLabelFontSize.value);
    }

    if (targetEl) {
        // Clear existing content and set new text
        while (targetEl.firstChild) {
            targetEl.removeChild(targetEl.firstChild);
        }
        const textNode = document.createTextNode(elements.connectionTargetLabel.value);
        targetEl.appendChild(textNode);

        // Update label styling
        targetEl.setAttribute('fill', elements.connectionLabelColor.value);
        targetEl.setAttribute('font-size', elements.connectionLabelFontSize.value);
    }

    if (centerEl) {
        // Clear existing content and set new text
        while (centerEl.firstChild) {
            centerEl.removeChild(centerEl.firstChild);
        }
        const textNode = document.createTextNode(elements.connectionCenterLabel.value);
        centerEl.appendChild(textNode);

        // Update label styling
        centerEl.setAttribute('fill', elements.connectionLabelColor.value);
        centerEl.setAttribute('font-size', elements.connectionLabelFontSize.value);
    }

    // Update line style
    const line = selectedConnection.querySelector('.connection-line');

    if (line) {
        // Use style properties to override CSS rules
        line.style.strokeWidth = elements.connectionStrokeWidth.value + 'px';
        line.style.stroke = elements.connectionStrokeColor.value;

        // Also update attributes for persistence
        line.setAttribute('stroke-width', elements.connectionStrokeWidth.value);
        line.setAttribute('stroke', elements.connectionStrokeColor.value);

        // Update stroke style (dasharray)
        const strokeStyle = elements.connectionStrokeStyle.value;
        let dasharray = 'none';

        switch (strokeStyle) {
            case 'dashed':
                dasharray = '10,5';
                break;
            case 'dotted':
                dasharray = '2,3';
                break;
            case 'solid':
            default:
                dasharray = 'none';
                break;
        }

        if (dasharray === 'none') {
            line.removeAttribute('stroke-dasharray');
            line.style.strokeDasharray = '';
        } else {
            line.setAttribute('stroke-dasharray', dasharray);
            line.style.strokeDasharray = dasharray;
        }
    }

    saveAppState();
    hideConnectionPanel();
}

/**
 * Hide connection panel
 */
function hideConnectionPanel() {
    elements.connectionOverlayPanel.style.display = 'none';
    selectedConnection = null;
}

/**
 * Hide shape panel
 */
function hideShapePanel() {
    elements.shapeOverlayPanel.style.display = 'none';
    overlaySourceShape = null;
    isWaitingForTarget = false;

    // Reset canvas and shape cursors
    elements.canvas.style.cursor = 'default';
    const allShapes = elements.canvas.querySelectorAll('.canvas-shape, .cisco-shape');
    allShapes.forEach(shape => {
        shape.style.cursor = 'move';
    });

    // Remove any connection mode styling
    document.querySelectorAll('.connection-source').forEach(el => {
        el.classList.remove('connection-source');
    });

    // Clean up any click handler
    if (connectionClickHandler) {
        elements.canvas.removeEventListener('click', connectionClickHandler);
        connectionClickHandler = null;
    }
}

// Export with legacy name for backward compatibility
export const hideOverlayPanel = hideShapePanel;

/**
 * Start connection mode - wait for user to click target shape
 */
function startConnectionMode() {
    if (!overlaySourceShape) return;

    // Add visual feedback to source shape
    overlaySourceShape.classList.add('connection-source');

    // Set waiting flag
    isWaitingForTarget = true;

    // Change cursor to indicate connection mode
    elements.canvas.style.cursor = 'crosshair';

    // Add hover effect to all shapes to show they're clickable
    const allShapes = elements.canvas.querySelectorAll('.canvas-shape, .cisco-shape');
    allShapes.forEach(shape => {
        if (shape !== overlaySourceShape) {
            shape.style.cursor = 'crosshair';
        }
    });
}

/**
 * Finish connection creation with target shape
 * @param {SVGElement} targetShape - The target shape
 */
function finishConnectionWithTarget(targetShape) {
    // Create the connection with default values (empty labels, default styling)
    const connectionGroup = createConnection(
        overlaySourceShape,
        targetShape,
        '',
        '',
        '',
        3,
        '#6c757d'
    );

    // Clean up
    overlaySourceShape.classList.remove('connection-source');
    isWaitingForTarget = false;
    hideShapePanel();
    saveAppState();

    // Automatically open the connection details panel
    if (connectionGroup) {
        // Get the label elements
        const sourceLabelId = connectionGroup.getAttribute('data-source-label-id');
        const targetLabelId = connectionGroup.getAttribute('data-target-label-id');

        const sourceLabel = sourceLabelId ? document.getElementById(sourceLabelId) : null;
        const targetLabel = targetLabelId ? document.getElementById(targetLabelId) : null;

        // Show the connection panel with the newly created connection
        showConnectionPanel(
            connectionGroup,
            sourceLabel ? sourceLabel.textContent : '',
            targetLabel ? targetLabel.textContent : '',
            '' // center label is empty initially
        );
    }
}

/**
 * Update overlay panel position when shape moves
 * @param {SVGElement} shape - The moved shape
 */
export function updateOverlayPosition(shape) {
    if (elements.shapeOverlayPanel.style.display !== 'none' && overlaySourceShape === shape) {
        showOverlayPanel(shape);
    }
}

/**
 * Start connection mode from a specific shape (for interaction circle)
 * @param {SVGElement} sourceShape - The source shape to connect from
 */
export function startConnectionFromShape(sourceShape) {
    // Set the source shape
    overlaySourceShape = sourceShape;

    // Add visual feedback to source shape
    sourceShape.classList.add('connection-source');

    // Set waiting flag
    isWaitingForTarget = true;

    // Change cursor to indicate connection mode
    elements.canvas.style.cursor = 'crosshair';

    // Add hover effect to all shapes to show they're clickable
    const allShapes = elements.canvas.querySelectorAll('.canvas-shape, .cisco-shape');
    allShapes.forEach(shape => {
        if (shape !== sourceShape) {
            shape.style.cursor = 'crosshair';
        }
    });
}
