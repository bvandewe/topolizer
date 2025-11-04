/**
 * Toolbar drag and drop functionality
 */

import { elements } from '../utils/dom.js';

/**
 * Setup drag and drop for shape tools in toolbar
 */
export function setupToolDragAndDrop() {
    const shapeTools = document.querySelectorAll('.shape-tool');

    shapeTools.forEach(tool => {
        tool.addEventListener('dragstart', e => {
            const shapeType = tool.getAttribute('data-shape');
            const isCisco = tool.getAttribute('data-cisco') === 'true';
            e.dataTransfer.setData('text/plain', shapeType);
            e.dataTransfer.setData('cisco', isCisco ? 'true' : 'false');
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
}
