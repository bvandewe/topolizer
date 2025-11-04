/**
 * PNG Export functionality
 * Exports the canvas as a PNG image with automatic cropping to content
 */

import { elements } from '../utils/dom.js';

/**
 * Calculate the bounding box that contains all shapes
 * @returns {Object} Bounding box with x, y, width, height
 */
function calculateContentBounds() {
    const shapesLayer = document.getElementById('shapesLayer');
    const connectionsLayer = document.getElementById('connectionsLayer');

    if (!shapesLayer) {
        return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Get bounds from all shapes
    const shapes = shapesLayer.querySelectorAll('.canvas-shape');
    shapes.forEach(shape => {
        const bbox = shape.getBBox();
        const transform = shape.getAttribute('transform');

        let x = bbox.x;
        let y = bbox.y;

        // Handle transform for groups (Cisco shapes)
        if (transform) {
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (match) {
                x += parseFloat(match[1]);
                y += parseFloat(match[2]);
            }
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + bbox.width);
        maxY = Math.max(maxY, y + bbox.height);
    });

    // Include text labels (sibling labels for basic shapes)
    const labels = shapesLayer.querySelectorAll('text[data-shape-id]');
    labels.forEach(label => {
        const x = parseFloat(label.getAttribute('x')) || 0;
        const y = parseFloat(label.getAttribute('y')) || 0;
        const bbox = label.getBBox();

        minX = Math.min(minX, x);
        minY = Math.min(minY, y - bbox.height);
        maxX = Math.max(maxX, x + bbox.width);
        maxY = Math.max(maxY, y);
    });

    // Include connections
    if (connectionsLayer) {
        const connections = connectionsLayer.querySelectorAll('line, path, text, circle');
        connections.forEach(element => {
            const bbox = element.getBBox();
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        });
    }

    // If no content found, return null
    if (!isFinite(minX)) {
        return null;
    }

    // Add padding
    const padding = 40;
    return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
    };
}

/**
 * Export the canvas as a PNG image
 */
export function exportCanvasAsPNG() {
    const canvas = elements.topologyCanvas;
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Calculate content bounds
    const bounds = calculateContentBounds();
    if (!bounds) {
        alert('No content to export. Please add some shapes first.');
        return;
    }

    // Create a new SVG with the cropped viewBox
    const svgClone = canvas.cloneNode(true);
    svgClone.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
    svgClone.setAttribute('width', bounds.width);
    svgClone.setAttribute('height', bounds.height);

    // Remove unwanted elements from the clone
    const resizeHandles = svgClone.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => handle.remove());

    const interactionCircles = svgClone.querySelectorAll('[id*="interaction-circle"]');
    interactionCircles.forEach(circle => circle.remove());

    const endpointHandles = svgClone.querySelectorAll('[class*="endpoint-handle"]');
    endpointHandles.forEach(handle => handle.remove());

    // Remove selection styles
    const selectedElements = svgClone.querySelectorAll('.selected');
    selectedElements.forEach(el => el.classList.remove('selected'));

    // Serialize the SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an image from the SVG
    const img = new Image();
    img.onload = function () {
        // Create a canvas to render the image at high resolution
        const scaleFactor = 4; // 4x resolution for high quality
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width * scaleFactor;
        canvas.height = bounds.height * scaleFactor;
        const ctx = canvas.getContext('2d');

        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image at scaled resolution
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to PNG and download with high quality
        canvas.toBlob(
            blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `topology-${new Date().toISOString().slice(0, 10)}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Cleanup
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(svgUrl);
            },
            'image/png',
            1.0
        ); // 1.0 = maximum quality
    };

    img.onerror = function () {
        console.error('Failed to load SVG image');
        alert('Failed to export PNG. Please try again.');
        URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
}
