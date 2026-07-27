// Groups management functions

let currentGroupPage = 1;
let groupFilters = {};

// The system types a group can be responsible for. Kept in sync with the
// backend's SYSTEM_TYPES constant (src/config/constants.js).
const SYSTEM_TYPE_OPTIONS = [
    { value: 'communication', label: 'Communication' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'surveillance', label: 'Surveillance' },
    { value: 'data_processing', label: 'Data Processing' },
    { value: 'meteorological', label: 'Meteorological' }
];

// Load groups page
async function loadGroups(container) {
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
            page: currentGroupPage,
            limit: 20,
            ...groupFilters
        });
        
        const response = await API.get(`/groups?${params}`);
        const groups = response.groups || [];

        // Get group stats
        const stats = await API.get('/groups/stats');

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex gap-2">
                    <input type="text" class="form-control" id="groupSearch" placeholder="Search groups..." style="width: 300px;">
                    <button class="btn btn-outline-secondary" onclick="applyGroupFilters()">
                        <i class="bi bi-search"></i>
                    </button>
                    <select class="form-select" id="groupTypeFilter" style="width: 200px;">
                        <option value="">All System Types</option>
                        ${SYSTEM_TYPE_OPTIONS.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" onclick="showCreateGroupModal()">
                    <i class="bi bi-plus-circle"></i> Create Group
                </button>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon blue">
                            <i class="bi bi-people-fill"></i>
                        </div>
                        <div class="stat-number">${stats.total || 0}</div>
                        <div class="stat-label">Total Groups</div>
                    </div>
                </div>
                ${stats.byType ? stats.byType.filter(type => type._id).map(type => `
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon ${getGroupIconColor(type._id)}">
                                <i class="bi ${getGroupIcon(type._id)}"></i>
                            </div>
                            <div class="stat-number">${type.count}</div>
                            <div class="stat-label">${formatGroupType(type._id)}</div>
                        </div>
                    </div>
                `).join('') : ''}
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>System Responsibility</th>
                                    <th>Team Lead</th>
                                    <th>Members</th>
                                    <th>Systems</th>
                                    <th>Certifications</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${groups.length > 0 ?
                                    groups.map(group => `
                                        <tr>
                                            <td>
                                                <strong>${group.name}</strong>
                                                <br>
                                                <small class="text-muted">${group.description || ''}</small>
                                            </td>
                                            <td>
                                                ${group.responsibleSystemTypes && group.responsibleSystemTypes.length > 0 ?
                                                    group.responsibleSystemTypes.map(t => `
                                                        <span class="badge bg-${getGroupBadgeColor(t)} me-1">${formatGroupType(t)}</span>
                                                    `).join('') :
                                                    '<span class="text-muted">None</span>'
                                                }
                                            </td>
                                            <td>${group.teamLead ? `${group.teamLead.firstName} ${group.teamLead.lastName}` : 'N/A'}</td>
                                            <td>
                                                <span class="badge bg-primary">${group.members?.length || 0}</span>
                                                ${group.members && group.members.length > 0 ? 
                                                    group.members.slice(0, 2).map(m => 
                                                        `<span class="badge bg-secondary me-1">${m.firstName} ${m.lastName}</span>`
                                                    ).join('') +
                                                    (group.members.length > 2 ? `<span class="badge bg-secondary">+${group.members.length - 2}</span>` : '')
                                                    : ''
                                                }
                                            </td>
                                            <td>
                                                <span class="badge bg-info">${group.assignedSystems?.length || 0}</span>
                                            </td>
                                            <td>
                                                ${group.certifications && group.certifications.length > 0 ?
                                                    group.certifications.slice(0, 2).map(c => 
                                                        `<span class="badge bg-success me-1">${c}</span>`
                                                    ).join('') +
                                                    (group.certifications.length > 2 ? `<span class="badge bg-secondary">+${group.certifications.length - 2}</span>` : '')
                                                    :
                                                    '<span class="text-muted">None</span>'
                                                }
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewGroup('${group._id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary" onclick="editGroup('${group._id}')">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="deleteGroup('${group._id}')">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('') :
                                    `<tr><td colspan="7" class="text-center">No groups found</td></tr>`
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
                                <button class="btn btn-sm btn-outline-secondary" onclick="changeGroupPage(${response.pagination.currentPage - 1})" 
                                        ${response.pagination.currentPage === 1 ? 'disabled' : ''}>
                                    Previous
                                </button>
                                <span class="mx-2">Page ${response.pagination.currentPage} of ${response.pagination.totalPages}</span>
                                <button class="btn btn-sm btn-outline-secondary" onclick="changeGroupPage(${response.pagination.currentPage + 1})" 
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
        document.getElementById('groupSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyGroupFilters();
            }
        });

        document.getElementById('groupTypeFilter')?.addEventListener('change', applyGroupFilters);

    } catch (error) {
        console.error('Error loading groups:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load groups: ${error.message}
            </div>
        `;
    }
}

// Helper functions for groups
function getGroupIcon(type) {
    const icons = {
        'communication': 'bi-wifi',
        'navigation': 'bi-compass',
        'surveillance': 'bi-radar',
        'data_processing': 'bi-hdd-stack',
        'meteorological': 'bi-cloud-sun'
    };
    return icons[type] || 'bi-building';
}

function getGroupIconColor(type) {
    const colors = {
        'communication': 'blue',
        'navigation': 'green',
        'surveillance': 'red',
        'data_processing': 'purple',
        'meteorological': 'yellow'
    };
    return colors[type] || 'secondary';
}

function getGroupBadgeColor(type) {
    const colors = {
        'communication': 'primary',
        'navigation': 'success',
        'surveillance': 'danger',
        'data_processing': 'purple',
        'meteorological': 'warning'
    };
    return colors[type] || 'secondary';
}

function formatGroupType(type) {
    const found = SYSTEM_TYPE_OPTIONS.find(opt => opt.value === type);
    return found ? found.label : type;
}

// Apply group filters
function applyGroupFilters() {
    const search = document.getElementById('groupSearch')?.value || '';
    const responsibleSystemType = document.getElementById('groupTypeFilter')?.value || '';
    
    groupFilters = {
        search: search,
        responsibleSystemType: responsibleSystemType
    };
    
    currentGroupPage = 1;
    loadGroups(document.getElementById('page-content'));
}

// Change group page
function changeGroupPage(page) {
    if (page < 1) return;
    currentGroupPage = page;
    loadGroups(document.getElementById('page-content'));
}

// View group details
async function viewGroup(id) {
    try {
        const group = await API.get(`/groups/${id}`);
        showGroupDetailsModal(group);
    } catch (error) {
        showToast('Error loading group details: ' + error.message, 'danger');
    }
}

// Show group details modal
function showGroupDetailsModal(group) {
    const modalHtml = `
        <div class="modal fade" id="groupDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${group.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Group Information</h6>
                                <p><strong>System Responsibility:</strong> ${
                                    group.responsibleSystemTypes && group.responsibleSystemTypes.length > 0 ?
                                        group.responsibleSystemTypes.map(formatGroupType).join(', ') :
                                        'None'
                                }</p>
                                <p><strong>Description:</strong> ${group.description || 'N/A'}</p>
                                <p><strong>Team Lead:</strong> ${group.teamLead ? `${group.teamLead.firstName} ${group.teamLead.lastName}` : 'N/A'}</p>
                                <p><strong>Members:</strong> ${group.members?.length || 0}</p>
                                <p><strong>Assigned Systems:</strong> ${group.assignedSystems?.length || 0}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Certifications</h6>
                                ${group.certifications && group.certifications.length > 0 ?
                                    `<div class="d-flex flex-wrap gap-2">
                                        ${group.certifications.map(cert => `
                                            <span class="badge bg-success fs-6">${cert}</span>
                                        `).join('')}
                                    </div>` :
                                    '<p class="text-muted">No certifications</p>'
                                }
                                ${group.shiftSchedule ? `
                                    <hr>
                                    <h6>Shift Schedule</h6>
                                    <p><strong>Start:</strong> ${group.shiftSchedule.startTime || 'N/A'}</p>
                                    <p><strong>End:</strong> ${group.shiftSchedule.endTime || 'N/A'}</p>
                                    <p><strong>Days:</strong> ${group.shiftSchedule.daysOfWeek?.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') || 'N/A'}</p>
                                ` : ''}
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Members</h6>
                                ${group.members && group.members.length > 0 ?
                                    `<div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${group.members.map(member => `
                                                    <tr>
                                                        <td>${member.firstName} ${member.lastName}</td>
                                                        <td>${member.email}</td>
                                                        <td><span class="badge bg-secondary">${member.role}</span></td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>` :
                                    '<p class="text-muted">No members</p>'
                                }
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Assigned Systems</h6>
                                ${group.assignedSystems && group.assignedSystems.length > 0 ?
                                    `<div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${group.assignedSystems.map(system => `
                                                    <tr>
                                                        <td>${system.name}</td>
                                                        <td>${system.systemType}</td>
                                                        <td><span class="badge bg-${system.status === 'operational' ? 'success' : system.status === 'maintenance' ? 'warning' : 'danger'}">${system.status}</span></td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>` :
                                    '<p class="text-muted">No systems assigned</p>'
                                }
                            </div>
                        </div>
                        ${group.performanceMetrics ? `
                            <hr>
                            <div class="row">
                                <div class="col-12">
                                    <h6>Performance Metrics</h6>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <p><strong>Tasks Completed:</strong> ${group.performanceMetrics.tasksCompleted || 0}</p>
                                        </div>
                                        <div class="col-md-4">
                                            <p><strong>Avg Response Time:</strong> ${group.performanceMetrics.averageResponseTime ? `${group.performanceMetrics.averageResponseTime} min` : 'N/A'}</p>
                                        </div>
                                        <div class="col-md-4">
                                            <p><strong>Incidents Resolved:</strong> ${group.performanceMetrics.incidentsResolved || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('groupDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('groupDetailsModal'));
    modal.show();
}

// Build the inner form fields shared by the create and edit modals.
// `group` is null for create, or an existing group object for edit.
function buildGroupFormFields(users, group) {
    const g = group || {};
    const responsibleSet = new Set(g.responsibleSystemTypes || []);
    const certSet = new Set(g.certifications || []);
    const teamLeadId = g.teamLead ? (g.teamLead._id || g.teamLead) : '';

    return `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Group Name *</label>
                    <input type="text" class="form-control" name="name" value="${g.name || ''}" required>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">System Responsibility</label>
                    <select class="form-select" name="responsibleSystemTypes" multiple>
                        ${SYSTEM_TYPE_OPTIONS.map(opt => `
                            <option value="${opt.value}" ${responsibleSet.has(opt.value) ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                    <small class="form-text">Hold Ctrl/Cmd to select multiple. Which system type(s) this group maintains.</small>
                </div>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" rows="3">${g.description || ''}</textarea>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Team Lead</label>
                    <select class="form-select" name="teamLead">
                        <option value="">None</option>
                        ${users.map(user => `
                            <option value="${user._id}" ${String(teamLeadId) === String(user._id) ? 'selected' : ''}>${user.firstName} ${user.lastName}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Certifications</label>
                    <select class="form-select" name="certifications" multiple>
                        ${['electrical', 'mechanical', 'electronics', 'rf', 'software', 'safety', 'radar', 'navigation', 'communication'].map(cert => `
                            <option value="${cert}" ${certSet.has(cert) ? 'selected' : ''}>${cert.charAt(0).toUpperCase() + cert.slice(1)}</option>
                        `).join('')}
                    </select>
                    <small class="form-text">Hold Ctrl/Cmd to select multiple</small>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Shift Start</label>
                    <input type="time" class="form-control" name="shiftStart" value="${g.shiftSchedule?.startTime || ''}">
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Shift End</label>
                    <input type="time" class="form-control" name="shiftEnd" value="${g.shiftSchedule?.endTime || ''}">
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Rotation Pattern</label>
                    <input type="text" class="form-control" name="rotationPattern" placeholder="e.g., 4 on 2 off" value="${g.shiftSchedule?.rotationPattern || ''}">
                </div>
            </div>
        </div>
    `;
}

// Read the shared form fields (create + edit) into a plain data object.
function readGroupFormData(form) {
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        teamLead: formData.get('teamLead') || null,
        responsibleSystemTypes: Array.from(form.querySelector('[name="responsibleSystemTypes"]').selectedOptions).map(o => o.value),
        certifications: Array.from(form.querySelector('[name="certifications"]').selectedOptions).map(o => o.value),
        shiftSchedule: {
            startTime: formData.get('shiftStart') || '',
            endTime: formData.get('shiftEnd') || '',
            rotationPattern: formData.get('rotationPattern') || ''
        }
    };
    return data;
}

// Show create group modal
function showCreateGroupModal() {
    // First, load users for team lead dropdown
    API.get('/users').then(response => {
        const users = response.users || [];
        
        const modalHtml = `
            <div class="modal fade" id="createGroupModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Group</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="createGroupForm" onsubmit="handleCreateGroup(event)">
                            <div class="modal-body">
                                ${buildGroupFormFields(users, null)}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('createGroupModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('createGroupModal'));
        modal.show();
    }).catch(error => {
        showToast('Error loading users: ' + error.message, 'danger');
    });
}

// Handle create group
async function handleCreateGroup(event) {
    event.preventDefault();
    
    const form = event.target;
    const data = readGroupFormData(form);
    
    try {
        await API.post('/groups', data);
        showToast('Group created successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createGroupModal'));
        modal.hide();
        
        // Reload page
        loadGroups(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error creating group: ' + error.message, 'danger');
    }
}

// Edit group
async function editGroup(id) {
    try {
        const [group, usersResponse] = await Promise.all([
            API.get(`/groups/${id}`),
            API.get('/users')
        ]);
        const users = usersResponse.users || [];

        const modalHtml = `
            <div class="modal fade" id="editGroupModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Group</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editGroupForm" onsubmit="handleEditGroup(event, '${id}')">
                            <div class="modal-body">
                                ${buildGroupFormFields(users, group)}
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

        const existingModal = document.getElementById('editGroupModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('editGroupModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading group: ' + error.message, 'danger');
    }
}

// Handle edit group submit
async function handleEditGroup(event, id) {
    event.preventDefault();

    const form = event.target;
    const data = readGroupFormData(form);

    try {
        await API.put(`/groups/${id}`, data);
        showToast('Group updated successfully', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editGroupModal'));
        modal.hide();

        loadGroups(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating group: ' + error.message, 'danger');
    }
}

// Delete group
async function deleteGroup(id) {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    try {
        await API.delete(`/groups/${id}`);
        showToast('Group deleted successfully', 'success');
        loadGroups(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error deleting group: ' + error.message, 'danger');
    }
}
