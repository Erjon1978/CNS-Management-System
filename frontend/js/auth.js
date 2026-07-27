// Authentication functions

// Login
async function login(username, password) {
    try {
        const response = await API.post('/auth/login', { username, password });
        setAuthToken(response.token);
        
        // Store user info
        localStorage.setItem('user', JSON.stringify({
            id: response._id,
            username: response.username,
            firstName: response.firstName,
            lastName: response.lastName,
            role: response.role,
            group: response.group
        }));
        
        showToast('Login successful!', 'success');
        return response;
    } catch (error) {
        showToast(error.message || 'Login failed', 'danger');
        throw error;
    }
}

// Logout
async function logout() {
    try {
        await API.post('/auth/logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeAuthToken();
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    }
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

// Check if user has role
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Check if user is admin
function isAdmin() {
    return hasRole('admin');
}

// Check if user is manager
function isManager() {
    return hasRole('admin') || hasRole('manager');
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getCurrentUser() && !!localStorage.getItem('token');
}

// Change password
async function changePassword(currentPassword, newPassword) {
    try {
        await API.put('/auth/change-password', { currentPassword, newPassword });
        showToast('Password changed successfully!', 'success');
        return true;
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'danger');
        return false;
    }
}

// Initialize auth check on page load
function initAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        setAuthToken(token);
        // Verify token is valid
        API.get('/auth/me').catch(() => {
            // Token invalid
            removeAuthToken();
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/pages/login.html';
            }
        });
    } else if (!window.location.pathname.includes('login')) {
        window.location.href = '/pages/login.html';
    }
}