// Users management functions

let currentUserPage = 1;
let userFilters = {};

// Load users page
async function loadUsers(container) {
    try {
        // Check if user is admin
        if (!isAdmin()) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    Access denied. Admin privileges required.
                </div>
            `;
            return;
        }

        const params = new URLSearchParams({
            page: currentUserPage,
            limit: 20,
            ...userFilters
        });
        
        const response = await API.get(`/users?${params}`);
        const users = response.users || [];

        // Get user stats
        const stats = await API.get('/users/stats');

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex gap-2">
                    <input type="text" class="form-control" id="userSearch" placeholder="Search users..." style="width: 300px;">
                    <button class="btn btn-outline-secondary" onclick="applyUserFilters()">
                        <i class="bi bi-search"></i>
                    </button>
                    <select class="form-select" id="userRoleFilter" style="width: 150px;">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="engineer">Engineer</option>
                        <option value="technician">Technician</option>
                    </select>
                    <select class="form-select" id="userStatusFilter" style="width: 150px;">
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="showCreateUserModal()">
                    <i class="bi bi-plus-circle"></i> Add User
                </button>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon blue">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="stat-number">${stats.total || 0}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon green">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="stat-number">${stats.active || 0}</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon red">
                            <i class="bi bi-x-circle"></i>
                        </div>
                        <div class="stat-number">${stats.inactive || 0}</div>
                        <div class="stat-label">Inactive Users</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon purple">
                            <i class="bi bi-shield-lock"></i>
                        </div>
                        <div class="stat-number">${stats.byRole?.find(r => r._id === 'admin')?.count || 0}</div>
                        <div class="stat-label">Admins</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Group</th>
                                    <th>Certifications</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.length > 0 ?
                                    users.map(user => `
                                        <tr>
                                            <td>
                                                <strong>${user.firstName} ${user.lastName}</strong>
                                                <br>
                                                <small class="text-muted">@${user.username}</small>
                                            </td>
                                            <td>${user.email}</td>
                                            <td>
                                                <span class="badge bg-${user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : user.role === 'engineer' ? 'primary' : 'secondary'}">
                                                    ${user.role}
                                                </span>
                                            </td>
                                            <td>${user.group?.name || 'N/A'}</td>
                                            <td>
                                                ${user.certifications && user.certifications.length > 0 ?
                                                    user.certifications.slice(0, 2).map(c => 
                                                        `<span class="badge bg-info me-1">${c}</span>`
                                                    ).join('') +
                                                    (user.certifications.length > 2 ? `<span class="badge bg-secondary">+${user.certifications.length - 2}</span>` : '')
                                                    :
                                                    '<span class="text-muted">None</span>'
                                                }
                                            </td>
                                            <td>
                                                <span class="badge bg-${user.isActive ? 'success' : 'danger'}">
                                                    ${user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewUser('${user._id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary" onclick="editUser('${user._id}')">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-${user.isActive ? 'warning' : 'success'}" 
                                                        onclick="toggleUserStatus('${user._id}')">
                                                    <i class="bi bi-${user.isActive ? 'pause' : 'play'}"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user._id}')">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('') :
                                    `<tr><td colspan="7" class="text-center">No users found</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                    
                    ${response.pagination ? `
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                Showing ${((response.pagination.currentPage - 1) * response.pagination.itemsPerPage) + 1} 
                                to ${Math.min(response.pagination.currentPage * response.pagination.itemsPerPage, response.pagination.totalItems)} 
                                of ${response.pagination.totalItems} items
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-secondary" onclick="changeUserPage(${response.pagination.currentPage - 1})" 
                                        ${response.pagination.currentPage === 1 ? 'disabled' : ''}>
                                    Previous
                                </button>
                                <span class="mx-2">Page ${response.pagination.currentPage} of ${response.pagination.totalPages}</span>
                                <button class="btn btn-sm btn-outline-secondary" onclick="changeUserPage(${response.pagination.currentPage + 1})" 
                                        ${response.pagination.currentPage === response.pagination.totalPages ? 'disabled' : ''}>
                                    Next
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add search event listeners
        document.getElementById('userSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyUserFilters();
            }
        });

        document.getElementById('userRoleFilter')?.addEventListener('change', applyUserFilters);
        document.getElementById('userStatusFilter')?.addEventListener('change', applyUserFilters);

    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load users: ${error.message}
            </div>
        `;
    }
}

// Apply user filters
function applyUserFilters() {
    const search = document.getElementById('userSearch')?.value || '';
    const role = document.getElementById('userRoleFilter')?.value || '';
    const isActive = document.getElementById('userStatusFilter')?.value || '';
    
    userFilters = {
        search: search,
        role: role,
        isActive: isActive
    };
    
    currentUserPage = 1;
    loadUsers(document.getElementById('page-content'));
}

// Change user page
function changeUserPage(page) {
    if (page < 1) return;
    currentUserPage = page;
    loadUsers(document.getElementById('page-content'));
}

// View user details
async function viewUser(id) {
    try {
        const user = await API.get(`/users/${id}`);
        showUserDetailsModal(user);
    } catch (error) {
        showToast('Error loading user details: ' + error.message, 'danger');
    }
}

// Show user details modal
function showUserDetailsModal(user) {
    const modalHtml = `
        <div class="modal fade" id="userDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${user.firstName} ${user.lastName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Personal Information</h6>
                                <p><strong>Username:</strong> ${user.username}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Employee ID:</strong> ${user.employeeId || 'N/A'}</p>
                                <p><strong>Role:</strong> <span class="badge bg-${user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : user.role === 'engineer' ? 'primary' : 'secondary'}">${user.role}</span></p>
                                <p><strong>Group:</strong> ${user.group?.name || 'N/A'}</p>
                                <p><strong>Status:</strong> <span class="badge bg-${user.isActive ? 'success' : 'danger'}">${user.isActive ? 'Active' : 'Inactive'}</span></p>
                            </div>
                            <div class="col-md-6">
                                <h6>Contact Information</h6>
                                <p><strong>Phone:</strong> ${user.contactInfo?.phone || 'N/A'}</p>
                                <p><strong>Mobile:</strong> ${user.contactInfo?.mobile || 'N/A'}</p>
                                ${user.contactInfo?.address ? `
                                    <p><strong>Address:</strong><br>
                                    ${user.contactInfo.address.street || ''}<br>
                                    ${user.contactInfo.address.city || ''} ${user.contactInfo.address.state || ''} ${user.contactInfo.address.zipCode || ''}<br>
                                    ${user.contactInfo.address.country || ''}</p>
                                ` : ''}
                                ${user.contactInfo?.emergencyContact ? `
                                    <p><strong>Emergency Contact:</strong><br>
                                    ${user.contactInfo.emergencyContact.name} (${user.contactInfo.emergencyContact.relationship})<br>
                                    ${user.contactInfo.emergencyContact.phone}</p>
                                ` : ''}
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Certifications</h6>
                                ${user.certifications && user.certifications.length > 0 ?
                                    `<div class="d-flex flex-wrap gap-2">
                                        ${user.certifications.map(cert => `
                                            <span class="badge bg-primary fs-6">${cert}</span>
                                        `).join('')}
                                    </div>` :
                                    '<p class="text-muted">No certifications</p>'
                                }
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Trainings</h6>
                                ${user.trainings && user.trainings.length > 0 ?
                                    `<div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Provider</th>
                                                    <th>Date</th>
                                                    <th>Expiry</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${user.trainings.map(training => `
                                                    <tr>
                                                        <td>${training.name}</td>
                                                        <td>${training.provider || 'N/A'}</td>
                                                        <td>${training.date ? new Date(training.date).toLocaleDateString() : 'N/A'}</td>
                                                        <td>${training.expiryDate ? new Date(training.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>` :
                                    '<p class="text-muted">No trainings</p>'
                                }
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('userDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();
}

// Show create user modal
// Certifications fetched from the admin-managed config API (Settings > System Configuration)
let cachedCertifications = [];

async function loadUserCertOptions() {
    cachedCertifications = await API.get('/config/certifications');
    return cachedCertifications;
}

function showCreateUserModal() {
    // Load groups for the dropdown and refresh certification options
    Promise.all([API.get('/groups'), loadUserCertOptions()]).then(([response]) => {
        const groups = response.groups || [];
        
        const modalHtml = `
            <div class="modal fade" id="createUserModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create New User</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="createUserForm" onsubmit="handleCreateUser(event)">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Username *</label>
                                            <input type="text" class="form-control" name="username" required minlength="3">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Email *</label>
                                            <input type="email" class="form-control" name="email" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">First Name *</label>
                                            <input type="text" class="form-control" name="firstName" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Last Name *</label>
                                            <input type="text" class="form-control" name="lastName" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Password *</label>
                                            <input type="password" class="form-control" name="password" required minlength="8">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Role</label>
                                            <select class="form-select" name="role">
                                                <option value="engineer">Engineer</option>
                                                <option value="technician">Technician</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Group</label>
                                            <select class="form-select" name="group">
                                                <option value="">No Group</option>
                                                ${groups.map(group => `
                                                    <option value="${group._id}">${group.name}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Certifications</label>
                                    <select class="form-select" name="certifications" multiple>
                                        ${cachedCertifications.map(cert => `
                                            <option value="${cert.value}">${cert.label}</option>
                                        `).join('')}
                                    </select>
                                    <small class="form-text">Hold Ctrl/Cmd to select multiple</small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('createUserModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
        modal.show();
    }).catch(error => {
        showToast('Error loading groups: ' + error.message, 'danger');
    });
}

// Handle create user
async function handleCreateUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Handle multiple certifications
    if (data.certifications) {
        data.certifications = Array.from(formData.getAll('certifications'));
    }
    
    try {
        await API.post('/auth/register', data);
        showToast('User created successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createUserModal'));
        modal.hide();
        
        // Reload page
        loadUsers(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error creating user: ' + error.message, 'danger');
    }
}

// Toggle user status
async function toggleUserStatus(id) {
    try {
        const response = await API.patch(`/users/${id}/toggle-status`);
        showToast(`User ${response.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        loadUsers(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error toggling user status: ' + error.message, 'danger');
    }
}

// Edit user
async function editUser(id) {
    try {
        const [user, groupsResponse] = await Promise.all([
            API.get(`/users/${id}`),
            API.get('/groups'),
            loadUserCertOptions()
        ]);
        const groups = groupsResponse.groups || [];
        const userGroupId = user.group ? (user.group._id || user.group) : '';
        const certSet = new Set(user.certifications || []);

        const modalHtml = `
            <div class="modal fade" id="editUserModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit User</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editUserForm" onsubmit="handleEditUser(event, '${id}')">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Username *</label>
                                            <input type="text" class="form-control" name="username" value="${user.username}" required minlength="3">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Email *</label>
                                            <input type="email" class="form-control" name="email" value="${user.email}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">First Name *</label>
                                            <input type="text" class="form-control" name="firstName" value="${user.firstName}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Last Name *</label>
                                            <input type="text" class="form-control" name="lastName" value="${user.lastName}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Employee ID</label>
                                            <input type="text" class="form-control" value="${user.employeeId || 'N/A'}" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Role</label>
                                            <select class="form-select" name="role">
                                                ${['engineer', 'technician', 'manager', 'admin'].map(r => `
                                                    <option value="${r}" ${user.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Group</label>
                                            <select class="form-select" name="group">
                                                <option value="">No Group</option>
                                                ${groups.map(group => `
                                                    <option value="${group._id}" ${String(userGroupId) === String(group._id) ? 'selected' : ''}>${group.name}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Certifications</label>
                                    <select class="form-select" name="certifications" multiple>
                                        ${cachedCertifications.map(cert => `
                                            <option value="${cert.value}" ${certSet.has(cert.value) ? 'selected' : ''}>${cert.label}</option>
                                        `).join('')}
                                    </select>
                                    <small class="form-text">Hold Ctrl/Cmd to select multiple</small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('editUserModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading user: ' + error.message, 'danger');
    }
}

// Handle edit user submit
async function handleEditUser(event, id) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.certifications = Array.from(formData.getAll('certifications'));
    if (!data.group) delete data.group;

    try {
        await API.put(`/users/${id}`, data);
        showToast('User updated successfully', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();

        loadUsers(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating user: ' + error.message, 'danger');
    }
}

// Delete user
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        await API.delete(`/users/${id}`);
        showToast('User deleted successfully', 'success');
        loadUsers(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error deleting user: ' + error.message, 'danger');
    }
}