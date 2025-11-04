/**
 * Shape creation and management utilities
 */

import { SHAPE_TEMPLATES, CISCO_SHAPES } from '../config/constants.js';
import { appState } from '../state/appState.js';
import { addShapeEventListeners } from './shapeEvents.js';

/**
 * Create a new shape on the canvas
 * @param {string} shapeType - Type of shape (circle, oval, rectangle, square, or cisco shape)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} isCisco - Whether this is a Cisco shape
 * @returns {SVGElement|null} The created shape element
 */
export function createShape(shapeType, x, y, isCisco = false) {
    // Check if it's a Cisco shape
    if (isCisco || CISCO_SHAPES[shapeType]) {
        return createCiscoShape(shapeType, x, y);
    }

    // Handle line and arrow shapes separately
    if (shapeType === 'line') {
        return createLineShape(x, y);
    }
    if (shapeType === 'arrow') {
        return createArrowShape(x, y);
    }
    if (shapeType === 'text') {
        return createTextShape(x, y);
    }

    const template = SHAPE_TEMPLATES[shapeType];
    if (!template) return null;

    const shape = document.createElementNS('http://www.w3.org/2000/svg', template.element);
    const shapeId = appState.getNextShapeId();

    // Set basic attributes
    shape.setAttribute('id', shapeId);
    shape.setAttribute('class', 'canvas-shape');
    shape.setAttribute('data-shape-type', shapeType);

    // Set position based on shape type
    if (template.element === 'circle') {
        shape.setAttribute('cx', x);
        shape.setAttribute('cy', y);
    } else if (template.element === 'ellipse') {
        shape.setAttribute('cx', x);
        shape.setAttribute('cy', y);
    } else if (template.element === 'rect') {
        shape.setAttribute('x', x - template.attributes.width / 2);
        shape.setAttribute('y', y - template.attributes.height / 2);
    }

    // Set template attributes
    Object.entries(template.attributes).forEach(([attr, value]) => {
        shape.setAttribute(attr, value);
    });

    // Add event listeners for selection and dragging
    addShapeEventListeners(shape);

    return shape;
}

/**
 * Create a Cisco network device shape
 * @param {string} shapeType - Type of Cisco shape
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {SVGElement} The created shape group
 */
function createCiscoShape(shapeType, x, y) {
    const ciscoTemplate = CISCO_SHAPES[shapeType];
    if (!ciscoTemplate) return null;

    const shapeId = appState.getNextShapeId();

    // Parse viewBox to get original dimensions
    const viewBoxParts = ciscoTemplate.viewBox.split(' ').map(Number);
    const [vbX, vbY, vbWidth, vbHeight] = viewBoxParts;

    // Scale to fit within 60x60 while maintaining aspect ratio
    const targetSize = 60;
    const scale = Math.min(targetSize / vbWidth, targetSize / vbHeight);
    const scaledWidth = vbWidth * scale;
    const scaledHeight = vbHeight * scale;

    // Create a group element to hold the shape
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', shapeId);
    group.setAttribute('class', 'canvas-shape cisco-shape');
    group.setAttribute('data-shape-type', shapeType);
    group.setAttribute('data-cisco', 'true');
    group.setAttribute('transform', `translate(${x - scaledWidth / 2}, ${y - scaledHeight / 2})`);

    // Create an SVG element to properly handle viewBox
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', scaledWidth);
    svg.setAttribute('height', scaledHeight);
    svg.setAttribute('viewBox', ciscoTemplate.viewBox);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Add a white background rectangle for visibility
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', vbX);
    bgRect.setAttribute('y', vbY);
    bgRect.setAttribute('width', vbWidth);
    bgRect.setAttribute('height', vbHeight);
    bgRect.setAttribute('fill', '#ffffff');
    bgRect.setAttribute('rx', '3');
    svg.appendChild(bgRect);

    // Create the shape path with proper fill
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ciscoTemplate.svgPath);
    path.setAttribute('fill', ciscoTemplate.attributes.fill);
    path.setAttribute('stroke', ciscoTemplate.attributes.stroke || 'none');
    svg.appendChild(path);

    group.appendChild(svg);

    // Add label text below the shape
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', scaledWidth / 2);
    text.setAttribute('y', scaledHeight + 12);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#333');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.textContent = ciscoTemplate.label;
    group.appendChild(text);

    // Add event listeners
    addShapeEventListeners(group);

    return group;
}

/**
 * Create a line shape
 * @param {number} x - X coordinate (start point)
 * @param {number} y - Y coordinate (start point)
 * @returns {SVGElement} The created line element
 */
function createLineShape(x, y) {
    const shapeId = appState.getNextShapeId();
    const template = SHAPE_TEMPLATES.line;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', shapeId);
    line.setAttribute('class', 'canvas-shape');
    line.setAttribute('data-shape-type', 'line');

    // Position the line centered at the drop point
    line.setAttribute('x1', x - 50);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x + 50);
    line.setAttribute('y2', y);

    // Set template attributes
    Object.entries(template.attributes).forEach(([attr, value]) => {
        if (!['x1', 'y1', 'x2', 'y2'].includes(attr)) {
            line.setAttribute(attr, value);
        }
    });

    // Add event listeners
    addShapeEventListeners(line);

    return line;
}

/**
 * Create an arrow shape (line with arrowhead)
 * @param {number} x - X coordinate (start point)
 * @param {number} y - Y coordinate (start point)
 * @returns {SVGElement} The created arrow group
 */
function createArrowShape(x, y) {
    const shapeId = appState.getNextShapeId();
    const template = SHAPE_TEMPLATES.arrow;

    // Create a group to hold the line and arrowhead
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', shapeId);
    group.setAttribute('class', 'canvas-shape');
    group.setAttribute('data-shape-type', 'arrow');

    // Create the line part
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x - 50);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x + 50);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', template.attributes.stroke);
    line.setAttribute('stroke-width', template.attributes['stroke-width']);
    line.setAttribute('class', 'arrow-line');
    group.appendChild(line);

    // Create the arrowhead as a polygon
    const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const headSize = 10;
    const arrowX = x + 50;
    const arrowY = y;
    arrowhead.setAttribute(
        'points',
        `${arrowX},${arrowY} ${arrowX - headSize},${arrowY - headSize / 2} ${arrowX - headSize},${
            arrowY + headSize / 2
        }`
    );
    arrowhead.setAttribute('fill', template.attributes.fill);
    arrowhead.setAttribute('class', 'arrow-head');
    group.appendChild(arrowhead);

    // Add a circle at the start point
    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', x - 50);
    startCircle.setAttribute('cy', y);
    startCircle.setAttribute('r', 4);
    startCircle.setAttribute('fill', template.attributes.fill);
    startCircle.setAttribute('class', 'arrow-start');
    group.appendChild(startCircle);

    // Add event listeners
    addShapeEventListeners(group);

    return group;
}

/**
 * Create a text shape
 * @param {number} x - X coordinate (center)
 * @param {number} y - Y coordinate (center)
 * @returns {SVGElement} The created text group element
 */
function createTextShape(x, y) {
    const shapeId = appState.getNextShapeId();
    const template = SHAPE_TEMPLATES.text;

    // Create a group to hold the text and optional background
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', shapeId);
    group.setAttribute('class', 'canvas-shape text-shape');
    group.setAttribute('data-shape-type', 'text');
    group.setAttribute('transform', `translate(${x}, ${y})`);

    // Create background rectangle (optional, can be transparent)
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('class', 'text-background');
    bgRect.setAttribute('x', 0);
    bgRect.setAttribute('y', 0);
    bgRect.setAttribute('width', 100);
    bgRect.setAttribute('height', 30);
    bgRect.setAttribute('fill', 'transparent');
    bgRect.setAttribute('stroke', 'none');
    bgRect.setAttribute('stroke-width', 0);
    bgRect.setAttribute('rx', 4);
    group.appendChild(bgRect);

    // Create the text element
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'text-content');
    text.setAttribute('x', 50);
    text.setAttribute('y', 20);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = template.defaultText;

    // Set template attributes
    Object.entries(template.attributes).forEach(([attr, value]) => {
        text.setAttribute(attr, value);
    });

    group.appendChild(text);

    // Update background size to fit text
    updateTextBackground(group);

    // Add event listeners
    addShapeEventListeners(group);

    return group;
}

/**
 * Update text background rectangle to fit text content
 * @param {SVGElement} textGroup - The text shape group
 */
export function updateTextBackground(textGroup) {
    const textEl = textGroup.querySelector('.text-content');
    const bgRect = textGroup.querySelector('.text-background');

    if (!textEl || !bgRect) return;

    try {
        const bbox = textEl.getBBox();
        const padding = 8;

        bgRect.setAttribute('x', bbox.x - padding);
        bgRect.setAttribute('y', bbox.y - padding);
        bgRect.setAttribute('width', bbox.width + padding * 2);
        bgRect.setAttribute('height', bbox.height + padding * 2);
    } catch (e) {
        // Fallback if getBBox fails
        console.warn('Could not get text bounding box:', e);
    }
}

/**
 * Get the bounding box of a shape
 * @param {SVGElement} shape - The shape element
 * @returns {Object|null} Bounds object with dimensions
 */
export function getShapeBounds(shape) {
    const shapeType = shape.tagName;

    // Handle group elements (Cisco shapes and arrows)
    if (shapeType === 'g') {
        const dataType = shape.getAttribute('data-shape-type');

        // Handle text shapes
        if (dataType === 'text') {
            const transform = shape.getAttribute('transform');
            let tx = 0,
                ty = 0;

            if (transform) {
                const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                if (match) {
                    tx = parseFloat(match[1]);
                    ty = parseFloat(match[2]);
                }
            }

            const bgRect = shape.querySelector('.text-background');
            if (bgRect) {
                const x = parseFloat(bgRect.getAttribute('x'));
                const y = parseFloat(bgRect.getAttribute('y'));
                const width = parseFloat(bgRect.getAttribute('width'));
                const height = parseFloat(bgRect.getAttribute('height'));

                return {
                    x: tx + x,
                    y: ty + y,
                    width: width,
                    height: height,
                    left: tx + x,
                    right: tx + x + width,
                    top: ty + y,
                    bottom: ty + y + height,
                    centerX: tx + x + width / 2,
                    centerY: ty + y + height / 2,
                };
            }
        }

        // Handle arrow shapes
        if (dataType === 'arrow') {
            const line = shape.querySelector('.arrow-line');
            if (line) {
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));

                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);

                // Add padding for arrowhead
                const padding = 10;

                return {
                    x: minX - padding,
                    y: minY - padding,
                    width: maxX - minX + padding * 2,
                    height: maxY - minY + padding * 2,
                    left: minX - padding,
                    right: maxX + padding,
                    top: minY - padding,
                    bottom: maxY + padding,
                    centerX: (minX + maxX) / 2,
                    centerY: (minY + maxY) / 2,
                };
            }
        }

        // Handle Cisco shapes
        const transform = shape.getAttribute('transform');
        let tx = 0,
            ty = 0;

        // Parse translate transform
        if (transform) {
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (match) {
                tx = parseFloat(match[1]);
                ty = parseFloat(match[2]);
            }
        }

        // Get dimensions from the SVG element (which has width/height attributes)
        const svg = shape.querySelector('svg');
        let width = 60; // Default
        let height = 70; // Default including label

        if (svg) {
            // Use the SVG element's width and height attributes
            // These represent the actual rendered size after viewBox scaling
            width = parseFloat(svg.getAttribute('width')) || 60;
            height = parseFloat(svg.getAttribute('height')) || 60;

            // Add space for label
            height += 10;
        }

        // The transform translate already positions the top-left corner correctly
        // No need to adjust based on getBBox() offset
        return {
            x: tx,
            y: ty,
            width: width,
            height: height,
            left: tx,
            right: tx + width,
            top: ty,
            bottom: ty + height,
            centerX: tx + width / 2,
            centerY: ty + height / 2,
        };
    }

    switch (shapeType) {
        case 'line':
            const x1 = parseFloat(shape.getAttribute('x1'));
            const y1 = parseFloat(shape.getAttribute('y1'));
            const x2 = parseFloat(shape.getAttribute('x2'));
            const y2 = parseFloat(shape.getAttribute('y2'));

            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);

            // Add some padding for easier selection
            const padding = 5;

            return {
                x: minX - padding,
                y: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2,
                left: minX - padding,
                right: maxX + padding,
                top: minY - padding,
                bottom: maxY + padding,
                centerX: (x1 + x2) / 2,
                centerY: (y1 + y2) / 2,
            };

        case 'circle':
            const cx = parseFloat(shape.getAttribute('cx'));
            const cy = parseFloat(shape.getAttribute('cy'));
            const r = parseFloat(shape.getAttribute('r'));
            return {
                x: cx - r,
                y: cy - r,
                width: r * 2,
                height: r * 2,
                left: cx - r,
                right: cx + r,
                top: cy - r,
                bottom: cy + r,
                centerX: cx,
                centerY: cy,
            };

        case 'ellipse':
            const ecx = parseFloat(shape.getAttribute('cx'));
            const ecy = parseFloat(shape.getAttribute('cy'));
            const rx = parseFloat(shape.getAttribute('rx'));
            const ry = parseFloat(shape.getAttribute('ry'));
            return {
                x: ecx - rx,
                y: ecy - ry,
                width: rx * 2,
                height: ry * 2,
                left: ecx - rx,
                right: ecx + rx,
                top: ecy - ry,
                bottom: ecy + ry,
                centerX: ecx,
                centerY: ecy,
            };

        case 'rect':
            const x = parseFloat(shape.getAttribute('x'));
            const y = parseFloat(shape.getAttribute('y'));
            const width = parseFloat(shape.getAttribute('width'));
            const height = parseFloat(shape.getAttribute('height'));
            return {
                x: x,
                y: y,
                width: width,
                height: height,
                left: x,
                right: x + width,
                top: y,
                bottom: y + height,
                centerX: x + width / 2,
                centerY: y + height / 2,
            };
    }

    return null;
}
