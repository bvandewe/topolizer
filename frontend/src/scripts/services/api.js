/**
 * API service for backend communication
 */

import { API_BASE_URL } from '../config/constants.js';
import { elements } from '../utils/dom.js';

export async function testApiConnection() {
    try {
        elements.apiResponse.textContent = 'Connecting...';
        elements.apiResponse.className = 'response loading';

        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();

        elements.apiResponse.textContent = `API Connected`;
        elements.apiResponse.className = 'response success';

        setTimeout(() => {
            elements.apiResponse.textContent = '';
            elements.apiResponse.className = '';
        }, 3000);
    } catch (error) {
        elements.apiResponse.textContent = `API Error: ${error.message}`;
        elements.apiResponse.className = 'response error';

        setTimeout(() => {
            elements.apiResponse.textContent = '';
            elements.apiResponse.className = '';
        }, 5000);
    }
}
