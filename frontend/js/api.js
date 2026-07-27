// API Configuration
const API_BASE_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('token') || '';

// API Client
const API = {
    get: async (endpoint) => {
        return makeRequest('GET', endpoint);
    },
    post: async (endpoint, data) => {
        return makeRequest('POST', endpoint, data);
    },
    put: async (endpoint, data) => {
        return makeRequest('PUT', endpoint, data);
    },
    patch: async (endpoint, data) => {
        return makeRequest('PATCH', endpoint, data);
    },
    delete: async (endpoint) => {
        return makeRequest('DELETE', endpoint);
    }
};

async function makeRequest(method, endpoint, data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            authToken = '';
            window.location.href = '/pages/login.html';
            throw new Error('Session expired. Please login again.');
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            // Server returned something other than JSON (e.g. an HTML error
            // page for an unmatched route, or a proxy/connection failure).
            const text = await response.text();
            console.error('Non-JSON API response:', response.status, text.slice(0, 200));
            throw new Error(`Unexpected response from server (status ${response.status}). Please check that the backend is running.`);
        }

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Request failed');
        }

        return responseData;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Set auth token
function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('token', token);
}

// Remove auth token
function removeAuthToken() {
    authToken = '';
    localStorage.removeItem('token');
}

// Check if user is authenticated
function isAuthenticated() {
    return !!authToken;
}