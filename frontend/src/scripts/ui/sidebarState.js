/**
 * Sidebar panel state management with localStorage persistence
 */

const STORAGE_KEY = 'topologyBuilder_sidebarState';

/**
 * Initialize sidebar panel state from localStorage
 */
export function initializeSidebarState() {
    const savedState = getSavedState();

    // Apply saved state or defaults
    const basicCollapse = document.getElementById('basicShapesCollapse');
    const ciscoCollapse = document.getElementById('ciscoShapesCollapse');
    const basicToggle = document.getElementById('basicShapesToggle');
    const ciscoToggle = document.getElementById('ciscoShapesToggle');

    if (!basicCollapse || !ciscoCollapse || !basicToggle || !ciscoToggle) return;

    // Import Bootstrap's Collapse class
    const Collapse = window.bootstrap?.Collapse;
    if (!Collapse) {
        console.warn('Bootstrap Collapse not available');
        return;
    }

    // Apply saved state
    if (savedState.basicExpanded) {
        basicCollapse.classList.add('show');
        basicToggle.setAttribute('aria-expanded', 'true');
        updateChevron(basicToggle, true);
    } else {
        basicCollapse.classList.remove('show');
        basicToggle.setAttribute('aria-expanded', 'false');
        updateChevron(basicToggle, false);
    }

    if (savedState.ciscoExpanded) {
        ciscoCollapse.classList.add('show');
        ciscoToggle.setAttribute('aria-expanded', 'true');
        updateChevron(ciscoToggle, true);
    } else {
        ciscoCollapse.classList.remove('show');
        ciscoToggle.setAttribute('aria-expanded', 'false');
        updateChevron(ciscoToggle, false);
    }

    // Set up event listeners to save state on changes
    basicCollapse.addEventListener('shown.bs.collapse', () => {
        saveState('basic', true);
        updateChevron(basicToggle, true);
    });

    basicCollapse.addEventListener('hidden.bs.collapse', () => {
        saveState('basic', false);
        updateChevron(basicToggle, false);
    });

    ciscoCollapse.addEventListener('shown.bs.collapse', () => {
        saveState('cisco', true);
        updateChevron(ciscoToggle, true);
    });

    ciscoCollapse.addEventListener('hidden.bs.collapse', () => {
        saveState('cisco', false);
        updateChevron(ciscoToggle, false);
    });
}

/**
 * Get saved sidebar state from localStorage
 * @returns {Object} Saved state or defaults
 */
function getSavedState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load sidebar state:', e);
    }

    // Default state: Basic collapsed, Cisco expanded
    return {
        basicExpanded: false,
        ciscoExpanded: true,
    };
}

/**
 * Save panel state to localStorage
 * @param {string} panel - 'basic' or 'cisco'
 * @param {boolean} expanded - Whether the panel is expanded
 */
function saveState(panel, expanded) {
    try {
        const state = getSavedState();

        if (panel === 'basic') {
            state.basicExpanded = expanded;
        } else if (panel === 'cisco') {
            state.ciscoExpanded = expanded;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to save sidebar state:', e);
    }
}

/**
 * Update chevron icon based on expanded state
 * @param {HTMLElement} button - Toggle button element
 * @param {boolean} expanded - Whether the panel is expanded
 */
function updateChevron(button, expanded) {
    const icon = button.querySelector('i');
    if (!icon) return;

    if (expanded) {
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-down');
    } else {
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-right');
    }
}
