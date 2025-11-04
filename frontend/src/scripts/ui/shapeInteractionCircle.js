/**
 * Interactive circle overlay for shape actions
 * Shows a semi-transparent circle around a shape with left/right action zones
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { getShapeBounds } from '../shapes/shapeFactory.js';
import { showOverlayPanel } from './shapeOverlay.js';
import { startConnectionFromShape } from './shapeOverlay.js';

let interactionCircle = null;
let leftHalfPath = null;
let rightHalfPath = null;
let currentShape = null;
let isInitializing = false; // Flag to prevent immediate dismissal
const CIRCLE_RADIUS = 80; // Larger than connection label constraint circle

/**
 * Show the interactive circle overlay around a shape
 * @param {SVGElement} shape - The shape to show the circle around
 */
export function showInteractionCircle(shape) {
    console.log('showInteractionCircle called:', {
        shapeId: shape?.id,
        hasExistingCircle: !!interactionCircle,
        currentShapeId: currentShape?.id,
        isSameShape: currentShape === shape,
        isInitializing,
    });

    // If the circle is already showing for this shape, don't reinitialize
    if (currentShape === shape && (interactionCircle || isInitializing)) {
        console.log('Interaction circle already showing/initializing for this shape, ignoring');
        return;
    }

    hideInteractionCircle();

    isInitializing = true; // Set flag before showing
    currentShape = shape;

    // Get shape bounds and calculate center
    const bounds = getShapeBounds(shape);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Get shape type to determine overlay style
    const dataType = shape.getAttribute('data-shape-type');
    const isCiscoShape = shape.getAttribute('data-cisco') === 'true';
    const isBasicShape =
        shape.tagName === 'rect' ||
        shape.tagName === 'ellipse' ||
        (shape.tagName === 'g' && shape.querySelector('rect, ellipse'));
    const isCircle =
        shape.tagName === 'circle' || (shape.tagName === 'g' && shape.querySelector('circle'));
    const isLine = dataType === 'line' || dataType === 'arrow';

    // Create SVG group for the interaction overlay
    interactionCircle = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    interactionCircle.id = 'interaction-circle';
    interactionCircle.style.pointerEvents = 'auto';

    // Create shape-specific overlay
    // Cisco shapes ALWAYS use circular overlay regardless of their actual shape
    if (isCiscoShape) {
        createCircularOverlay(centerX, centerY);
    } else if (isLine) {
        createLineOverlay(shape, bounds, centerX, centerY);
    } else if (isBasicShape || isCircle) {
        createShapeMatchingOverlay(shape, bounds, centerX, centerY);
    } else {
        // Default: circular overlay for text and other shapes
        createCircularOverlay(centerX, centerY);
    }

    // Insert the overlay BEFORE the shape so it appears behind it
    const shapesLayer = document.getElementById('shapesLayer');
    if (shapesLayer && shape.parentNode === shapesLayer) {
        // Insert before the shape in the shapes layer
        shapesLayer.insertBefore(interactionCircle, shape);
    } else {
        // Fallback: Insert before the shape in its current parent
        const parent = shape.parentNode;
        if (parent) {
            parent.insertBefore(interactionCircle, shape);
        } else {
            // Last resort: add to canvas
            elements.canvas.appendChild(interactionCircle);
        }
    }

    // Set up click-outside handler after a delay to avoid catching the initial click
    setTimeout(() => {
        isInitializing = false;
        console.log('Interaction circle initialized, adding click-outside handler');
        document.addEventListener('click', handleClickOutside, true);
    }, 300);
}

/**
 * Create circular overlay (for Cisco shapes and text)
 */
function createCircularOverlay(centerX, centerY) {
    // Create background circle (full circle for visual reference)
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', centerX);
    bgCircle.setAttribute('cy', centerY);
    bgCircle.setAttribute('r', CIRCLE_RADIUS);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#007bff');
    bgCircle.setAttribute('stroke-width', '2');
    bgCircle.setAttribute('stroke-dasharray', '5,5');
    bgCircle.setAttribute('opacity', '0.3');

    // Create left half (Edit action) - clickable
    leftHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const leftHalfD = `M ${centerX},${
        centerY - CIRCLE_RADIUS
    } A ${CIRCLE_RADIUS},${CIRCLE_RADIUS} 0 0,0 ${centerX},${centerY + CIRCLE_RADIUS} Z`;
    leftHalfPath.setAttribute('d', leftHalfD);
    leftHalfPath.setAttribute('fill', '#28a745');
    leftHalfPath.setAttribute('opacity', '0.2');
    leftHalfPath.setAttribute('stroke', '#28a745');
    leftHalfPath.setAttribute('stroke-width', '2');
    leftHalfPath.style.cursor = 'pointer';

    // Create right half (Connect action) - clickable
    rightHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const rightHalfD = `M ${centerX},${
        centerY - CIRCLE_RADIUS
    } A ${CIRCLE_RADIUS},${CIRCLE_RADIUS} 0 0,1 ${centerX},${centerY + CIRCLE_RADIUS} Z`;
    rightHalfPath.setAttribute('d', rightHalfD);
    rightHalfPath.setAttribute('fill', '#007bff');
    rightHalfPath.setAttribute('opacity', '0.2');
    rightHalfPath.setAttribute('stroke', '#007bff');
    rightHalfPath.setAttribute('stroke-width', '2');
    rightHalfPath.style.cursor = 'pointer';

    // Add hover effects
    addHoverEffects();

    // Add click handlers
    addClickHandlers();

    // Add Bootstrap tooltips
    addTooltips();

    // Assemble the overlay
    interactionCircle.appendChild(bgCircle);
    interactionCircle.appendChild(leftHalfPath);
    interactionCircle.appendChild(rightHalfPath);
}

/**
 * Create shape-matching overlay (for basic shapes: rect, ellipse, circle)
 */
function createShapeMatchingOverlay(shape, bounds, centerX, centerY) {
    const padding = 25; // Padding around the shape for easier clicking
    const x = bounds.x - padding;
    const y = bounds.y - padding;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    // Determine if it's a circle/ellipse or rectangle
    const isCircular =
        shape.tagName === 'circle' ||
        shape.tagName === 'ellipse' ||
        (shape.tagName === 'g' &&
            (shape.querySelector('circle') || shape.querySelector('ellipse')));

    if (isCircular) {
        // Use ellipse for circular shapes
        const rx = width / 2;
        const ry = height / 2;

        // Background outline
        const bgEllipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        bgEllipse.setAttribute('cx', centerX);
        bgEllipse.setAttribute('cy', centerY);
        bgEllipse.setAttribute('rx', rx);
        bgEllipse.setAttribute('ry', ry);
        bgEllipse.setAttribute('fill', 'none');
        bgEllipse.setAttribute('stroke', '#007bff');
        bgEllipse.setAttribute('stroke-width', '2');
        bgEllipse.setAttribute('stroke-dasharray', '5,5');
        bgEllipse.setAttribute('opacity', '0.3');

        // Left half (Edit)
        leftHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        leftHalfPath.setAttribute(
            'd',
            `M ${centerX},${centerY - ry} A ${rx},${ry} 0 0,0 ${centerX},${centerY + ry} Z`
        );
        leftHalfPath.setAttribute('fill', '#28a745');
        leftHalfPath.setAttribute('opacity', '0.2');
        leftHalfPath.setAttribute('stroke', '#28a745');
        leftHalfPath.setAttribute('stroke-width', '2');
        leftHalfPath.style.cursor = 'pointer';

        // Right half (Connect)
        rightHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        rightHalfPath.setAttribute(
            'd',
            `M ${centerX},${centerY - ry} A ${rx},${ry} 0 0,1 ${centerX},${centerY + ry} Z`
        );
        rightHalfPath.setAttribute('fill', '#007bff');
        rightHalfPath.setAttribute('opacity', '0.2');
        rightHalfPath.setAttribute('stroke', '#007bff');
        rightHalfPath.setAttribute('stroke-width', '2');
        rightHalfPath.style.cursor = 'pointer';

        interactionCircle.appendChild(bgEllipse);
    } else {
        // Use rectangle for rectangular shapes
        // Background outline
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', x);
        bgRect.setAttribute('y', y);
        bgRect.setAttribute('width', width);
        bgRect.setAttribute('height', height);
        bgRect.setAttribute('fill', 'none');
        bgRect.setAttribute('stroke', '#007bff');
        bgRect.setAttribute('stroke-width', '2');
        bgRect.setAttribute('stroke-dasharray', '5,5');
        bgRect.setAttribute('opacity', '0.3');
        bgRect.setAttribute('rx', '3');

        // Left half (Edit)
        leftHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftHalfPath.setAttribute('x', x);
        leftHalfPath.setAttribute('y', y);
        leftHalfPath.setAttribute('width', width / 2);
        leftHalfPath.setAttribute('height', height);
        leftHalfPath.setAttribute('fill', '#28a745');
        leftHalfPath.setAttribute('opacity', '0.2');
        leftHalfPath.setAttribute('stroke', '#28a745');
        leftHalfPath.setAttribute('stroke-width', '2');
        leftHalfPath.setAttribute('rx', '3');
        leftHalfPath.style.cursor = 'pointer';

        // Right half (Connect)
        rightHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightHalfPath.setAttribute('x', centerX);
        rightHalfPath.setAttribute('y', y);
        rightHalfPath.setAttribute('width', width / 2);
        rightHalfPath.setAttribute('height', height);
        rightHalfPath.setAttribute('fill', '#007bff');
        rightHalfPath.setAttribute('opacity', '0.2');
        rightHalfPath.setAttribute('stroke', '#007bff');
        rightHalfPath.setAttribute('stroke-width', '2');
        rightHalfPath.setAttribute('rx', '3');
        rightHalfPath.style.cursor = 'pointer';

        interactionCircle.appendChild(bgRect);
    }

    // Add hover effects
    addHoverEffects();

    // Add click handlers
    addClickHandlers();

    // Add Bootstrap tooltips
    addTooltips();

    // Assemble the overlay
    interactionCircle.appendChild(leftHalfPath);
    interactionCircle.appendChild(rightHalfPath);
}

/**
 * Create line/arrow overlay (rotated rectangle following the line)
 */
function createLineOverlay(shape, bounds, centerX, centerY) {
    const padding = 30; // Padding around the line for easier clicking

    // Get line endpoints
    let x1, y1, x2, y2;
    const dataType = shape.getAttribute('data-shape-type');

    if (dataType === 'line') {
        const line = shape.tagName === 'line' ? shape : shape.querySelector('line');
        if (line) {
            x1 = parseFloat(line.getAttribute('x1'));
            y1 = parseFloat(line.getAttribute('y1'));
            x2 = parseFloat(line.getAttribute('x2'));
            y2 = parseFloat(line.getAttribute('y2'));
        }
    } else if (dataType === 'arrow') {
        const line = shape.querySelector('.arrow-line');
        if (line) {
            x1 = parseFloat(line.getAttribute('x1'));
            y1 = parseFloat(line.getAttribute('y1'));
            x2 = parseFloat(line.getAttribute('x2'));
            y2 = parseFloat(line.getAttribute('y2'));
        }
    }

    if (x1 === undefined) return createCircularOverlay(centerX, centerY); // Fallback

    // Calculate angle
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const width = 40; // Width of the overlay box

    // Create a rotated rectangle
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', -length / 2 - padding);
    bgRect.setAttribute('y', -width / 2);
    bgRect.setAttribute('width', length + padding * 2);
    bgRect.setAttribute('height', width);
    bgRect.setAttribute('fill', 'none');
    bgRect.setAttribute('stroke', '#007bff');
    bgRect.setAttribute('stroke-width', '2');
    bgRect.setAttribute('stroke-dasharray', '5,5');
    bgRect.setAttribute('opacity', '0.3');
    bgRect.setAttribute('rx', '5');
    bgRect.setAttribute('transform', `translate(${centerX}, ${centerY}) rotate(${angle})`);

    // Left half (Edit)
    leftHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leftHalfPath.setAttribute('x', -length / 2 - padding);
    leftHalfPath.setAttribute('y', -width / 2);
    leftHalfPath.setAttribute('width', (length + padding * 2) / 2);
    leftHalfPath.setAttribute('height', width);
    leftHalfPath.setAttribute('fill', '#28a745');
    leftHalfPath.setAttribute('opacity', '0.2');
    leftHalfPath.setAttribute('stroke', '#28a745');
    leftHalfPath.setAttribute('stroke-width', '2');
    leftHalfPath.setAttribute('rx', '5');
    leftHalfPath.setAttribute('transform', `translate(${centerX}, ${centerY}) rotate(${angle})`);
    leftHalfPath.style.cursor = 'pointer';

    // Right half (Connect)
    rightHalfPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rightHalfPath.setAttribute('x', 0);
    rightHalfPath.setAttribute('y', -width / 2);
    rightHalfPath.setAttribute('width', (length + padding * 2) / 2);
    rightHalfPath.setAttribute('height', width);
    rightHalfPath.setAttribute('fill', '#007bff');
    rightHalfPath.setAttribute('opacity', '0.2');
    rightHalfPath.setAttribute('stroke', '#007bff');
    rightHalfPath.setAttribute('stroke-width', '2');
    rightHalfPath.setAttribute('rx', '5');
    rightHalfPath.setAttribute('transform', `translate(${centerX}, ${centerY}) rotate(${angle})`);
    rightHalfPath.style.cursor = 'pointer';

    // Add hover effects
    addHoverEffects();

    // Add click handlers
    addClickHandlers();

    // Add hover effects
    addHoverEffects();

    // Add click handlers
    addClickHandlers();

    // Add Bootstrap tooltips
    addTooltips();

    // Assemble the overlay
    interactionCircle.appendChild(bgRect);
    interactionCircle.appendChild(leftHalfPath);
    interactionCircle.appendChild(rightHalfPath);
}

/**
 * Add hover effects to the half paths
 */
function addHoverEffects() {
    if (leftHalfPath) {
        leftHalfPath.addEventListener('mouseenter', () => {
            leftHalfPath.setAttribute('opacity', '0.4');
        });
        leftHalfPath.addEventListener('mouseleave', () => {
            leftHalfPath.setAttribute('opacity', '0.2');
        });
    }

    if (rightHalfPath) {
        rightHalfPath.addEventListener('mouseenter', () => {
            rightHalfPath.setAttribute('opacity', '0.4');
        });
        rightHalfPath.addEventListener('mouseleave', () => {
            rightHalfPath.setAttribute('opacity', '0.2');
        });
    }
}

/**
 * Add click handlers to the half paths
 */
function addClickHandlers() {
    if (leftHalfPath) {
        leftHalfPath.addEventListener('click', e => {
            e.stopPropagation();
            hideTooltips();
            if (currentShape) {
                showOverlayPanel(currentShape);
            }
        });
    }

    if (rightHalfPath) {
        rightHalfPath.addEventListener('click', e => {
            e.stopPropagation();
            hideTooltips();
            if (currentShape) {
                startConnectionFromShape(currentShape);
                hideInteractionCircle();
            }
        });
    }
}

/**
 * Add Bootstrap tooltips to the half paths
 */
function addTooltips() {
    if (leftHalfPath) {
        leftHalfPath.setAttribute('data-bs-toggle', 'tooltip');
        leftHalfPath.setAttribute('data-bs-placement', 'top');
        leftHalfPath.setAttribute('data-bs-title', 'Edit');
        leftHalfPath.setAttribute('data-bs-trigger', 'hover');

        // Initialize Bootstrap tooltip
        new window.bootstrap.Tooltip(leftHalfPath, {
            container: 'body',
            trigger: 'hover',
        });
    }

    if (rightHalfPath) {
        rightHalfPath.setAttribute('data-bs-toggle', 'tooltip');
        rightHalfPath.setAttribute('data-bs-placement', 'top');
        rightHalfPath.setAttribute('data-bs-title', 'Connect');
        rightHalfPath.setAttribute('data-bs-trigger', 'hover');

        // Initialize Bootstrap tooltip
        new window.bootstrap.Tooltip(rightHalfPath, {
            container: 'body',
            trigger: 'hover',
        });
    }
}

/**
 * Hide all tooltips for the interaction overlay
 */
function hideTooltips() {
    try {
        if (leftHalfPath) {
            const leftTooltipInstance = window.bootstrap.Tooltip.getInstance(leftHalfPath);
            if (leftTooltipInstance) {
                leftTooltipInstance.hide();
            }
        }
    } catch (error) {
        console.debug('Error hiding left tooltip:', error);
    }

    try {
        if (rightHalfPath) {
            const rightTooltipInstance = window.bootstrap.Tooltip.getInstance(rightHalfPath);
            if (rightTooltipInstance) {
                rightTooltipInstance.hide();
            }
        }
    } catch (error) {
        console.debug('Error hiding right tooltip:', error);
    }
}

/**
 * Hide the interactive circle overlay
 */
export function hideInteractionCircle() {
    if (interactionCircle) {
        // Dispose of Bootstrap tooltips before removing elements
        try {
            if (leftHalfPath) {
                const leftTooltipInstance = window.bootstrap.Tooltip.getInstance(leftHalfPath);
                if (leftTooltipInstance) {
                    leftTooltipInstance.dispose();
                }
            }
        } catch (error) {
            console.debug('Error disposing left tooltip:', error);
        }

        try {
            if (rightHalfPath) {
                const rightTooltipInstance = window.bootstrap.Tooltip.getInstance(rightHalfPath);
                if (rightTooltipInstance) {
                    rightTooltipInstance.dispose();
                }
            }
        } catch (error) {
            console.debug('Error disposing right tooltip:', error);
        }

        interactionCircle.remove();
        interactionCircle = null;
        leftHalfPath = null;
        rightHalfPath = null;
        currentShape = null;
        isInitializing = false;
        document.removeEventListener('click', handleClickOutside, true);
    }
}
/**
 * Handle click on left half (Edit action)
 */
function handleLeftHalfClick() {
    if (currentShape) {
        showOverlayPanel(currentShape);
    }
    hideInteractionCircle();
}

/**
 * Handle click on right half (Connect action)
 */
function handleRightHalfClick() {
    if (currentShape) {
        startConnectionFromShape(currentShape);
    }
    hideInteractionCircle();
}

/**
 * Handle clicks outside the circle
 * @param {MouseEvent} e - Click event
 */
function handleClickOutside(e) {
    console.log('handleClickOutside triggered:', {
        isInitializing,
        target: e.target.id || e.target.tagName,
        hasInteractionCircle: !!interactionCircle,
    });

    // Don't process if we're still initializing
    if (isInitializing) {
        console.log('Still initializing, ignoring click');
        return;
    }

    // Get the actual element at the click position (important for SVG elements)
    const clickedElement = document.elementFromPoint(e.clientX, e.clientY);

    console.log('Actual clicked element:', {
        id: clickedElement?.id,
        tagName: clickedElement?.tagName,
        classList: Array.from(clickedElement?.classList || []),
    });

    // Don't hide if clicking on the circle elements themselves
    // Don't stop propagation - let the event reach the circle half handlers
    if (clickedElement === leftHalfPath || clickedElement === rightHalfPath) {
        console.log('Clicked on circle half, ignoring in handleClickOutside');
        return;
    }

    // Don't hide if clicking within the interaction circle group
    if (interactionCircle && interactionCircle.contains(clickedElement)) {
        console.log('Clicked inside interaction circle, ignoring');
        return;
    }

    // Don't hide if clicking on the shape itself
    if (
        currentShape &&
        (clickedElement === currentShape || currentShape.contains(clickedElement))
    ) {
        console.log('Clicked on shape, ignoring');
        return;
    }

    // Don't hide if clicking on ANY shape on the canvas (not just the current one)
    const clickedOnShape = clickedElement?.closest('.canvas-shape, .cisco-shape, g[data-shape-id]');
    if (clickedOnShape) {
        console.log('Clicked on a shape, ignoring');
        return;
    }

    // Don't hide if clicking on a resize handle
    if (clickedElement?.classList.contains('resize-handle')) {
        console.log('Clicked on resize handle, ignoring');
        return;
    }

    // Hide tooltips and circle for any other click
    console.log('Hiding interaction circle - click was outside');
    hideTooltips();
    hideInteractionCircle();
}
/**
 * Update overlay position when shape moves or resizes
 * @param {SVGElement} shape - The shape that moved or resized
 */
export function updateInteractionCirclePosition(shape) {
    // If no interaction circle exists, nothing to update
    if (!interactionCircle) {
        return;
    }

    // Check if this is the same shape by ID (handles case where DOM element was replaced)
    const isSameShapeById =
        currentShape && shape && currentShape.getAttribute('id') === shape.getAttribute('id');

    // Only update if it's the current shape (by reference or ID)
    if (currentShape !== shape && !isSameShapeById) {
        return;
    }

    // Simply recreate the overlay with updated position
    hideInteractionCircle();
    showInteractionCircle(shape);
}
