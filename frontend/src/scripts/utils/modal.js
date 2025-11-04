/**
 * Bootstrap modal utility functions
 */

/**
 * Show an alert modal with a message
 * @param {string} message - The message to display
 * @param {string} title - The title (optional, defaults to "Alert")
 * @param {string} type - The type: 'info', 'warning', 'error', 'success' (optional)
 */
export function showAlert(message, title = 'Alert', type = 'info') {
    const modal = document.getElementById('alertModal');
    const modalHeader = document.getElementById('alertModalHeader');
    const modalTitle = document.getElementById('alertModalTitle');
    const modalMessage = document.getElementById('alertModalMessage');
    const titleIcon = modalTitle.previousElementSibling;

    // Set title
    modalTitle.textContent = title;

    // Set message
    modalMessage.textContent = message;

    // Set icon and header color based on type
    modalHeader.className = 'modal-header';
    switch (type) {
        case 'warning':
            modalHeader.classList.add('bg-warning', 'text-dark');
            titleIcon.className = 'bi bi-exclamation-triangle';
            break;
        case 'error':
            modalHeader.classList.add('bg-danger', 'text-white');
            titleIcon.className = 'bi bi-exclamation-circle';
            break;
        case 'success':
            modalHeader.classList.add('bg-success', 'text-white');
            titleIcon.className = 'bi bi-check-circle';
            break;
        default: // info
            modalHeader.classList.add('bg-info', 'text-white');
            titleIcon.className = 'bi bi-info-circle';
    }

    // Show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Show a confirmation modal
 * @param {string} message - The message to display
 * @param {string} title - The title
 * @param {Function} onConfirm - Callback function when confirmed
 * @param {string} confirmBtnText - Text for confirm button (optional)
 * @param {string} confirmBtnClass - Bootstrap class for confirm button (optional)
 */
export function showConfirm(
    message,
    title,
    onConfirm,
    confirmBtnText = 'Confirm',
    confirmBtnClass = 'btn-primary'
) {
    // For now, we'll use the newTopologyModal pattern
    // In a more robust implementation, you'd create a reusable confirm modal
    // For this specific case, we're handling it in the fileOperations.js
    console.warn('showConfirm is not yet implemented as a generic function');
}
