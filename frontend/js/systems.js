// Systems management functions

let currentSystemPage = 1;
let systemFilters = {};

// Load systems page
async function loadSystems(container) {
    try {
        const systems = await API.get('/systems');

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <input type="text" class="form-control" id="systemSearch" placeholder="Search systems..." style="width: 300px; display: inline-block;">
                    <button class="btn btn-outline-secondary" onclick="applySystemFilters()">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
                ${isManager() ? `
                    <button class="btn btn-primary" onclick="showCreateSystemModal()">
                        <i class="bi bi-plus-circle"></i> Add System
                    </button>
                ` : ''}
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Serial Number</th>
                                    <th>Status</th>
                                    <th>Service Level</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${systems.systems && systems.systems.length > 0 ?
                                    systems.systems.map(system => `
                                        <tr>
                                            <td>
                                                <strong>${system.name}</strong>
                                                <br>
                                                <small class="text-muted">${system.manufacturer} ${system.model}</small>
                                            </td>
                                            <td>
                                                <span class="badge bg-info">${system.systemType}</span>
                                                <br>
                                                <small>${system.subsystem}</small>
                                            </td>
                                            <td>${system.serialNumber || 'N/A'}</td>
                                            <td>
                                                <span class="status-indicator status-${system.status}"></span>
                                                ${system.status}
                                            </td>
                                            <td>
                                                <span class="badge bg-${system.serviceLevel === 'critical' ? 'danger' : system.serviceLevel === 'essential' ? 'warning' : 'secondary'}">
                                                    ${system.serviceLevel}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewSystem('${system._id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${isManager() ? `
                                                    <button class="btn btn-sm btn-outline-secondary" onclick="editSystem('${system._id}')">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSystem('${system._id}')">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                ` : ''}
                                            </td>
                                        </tr>
                                    `).join('') :
                                    `<tr><td colspan="6" class="text-center">No systems found</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add search event listener
        document.getElementById('systemSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applySystemFilters();
            }
        });

    } catch (error) {
        console.error('Error loading systems:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load systems: ${error.message}
            </div>
        `;
    }
}

// Apply system filters
function applySystemFilters() {
    const search = document.getElementById('systemSearch')?.value || '';
    // Reload page with filters
    loadSystems(document.getElementById('page-content'));
}

// View system details
async function viewSystem(id) {
    try {
        const system = await API.get(`/systems/${id}`);
        // Show system details modal or navigate to details page
        showSystemDetailsModal(system);
    } catch (error) {
        showToast('Error loading system details: ' + error.message, 'danger');
    }
}

// Show system details modal
function showSystemDetailsModal(system) {
    // Create and show modal with system details
    const modalHtml = `
        <div class="modal fade" id="systemDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${system.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Basic Information</h6>
                                <p><strong>Type:</strong> ${system.systemType}</p>
                                <p><strong>Subsystem:</strong> ${system.subsystem}</p>
                                <p><strong>Manufacturer:</strong> ${system.manufacturer}</p>
                                <p><strong>Model:</strong> ${system.model}</p>
                                <p><strong>Serial Number:</strong> ${system.serialNumber || 'N/A'}</p>
                                <p><strong>Status:</strong> <span class="status-indicator status-${system.status}"></span> ${system.status}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Location & Installation</h6>
                                <p><strong>Site:</strong> ${system.location?.site || 'N/A'}</p>
                                <p><strong>Building:</strong> ${system.location?.building || 'N/A'}</p>
                                <p><strong>Room:</strong> ${system.location?.room || 'N/A'}</p>
                                <p><strong>Installation Date:</strong> ${system.installationDate ? new Date(system.installationDate).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Service Level:</strong> ${system.serviceLevel}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Configuration</h6>
                                <div class="system-config-grid">
                                    ${system.configuration ? Object.entries(system.configuration).map(([key, value]) => `
                                        <div class="system-config-item">
                                            <strong>${key}</strong><br>
                                            <small>${value}</small>
                                        </div>
                                    `).join('') : '<p>No configuration data</p>'}
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Spare Parts</h6>
                                ${system.spareParts && system.spareParts.length > 0 ?
                                    `<ul class="list-group">
                                        ${system.spareParts.map(spare => `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                ${spare.part?.name || 'Unknown'}
                                                <span class="badge bg-primary">Qty: ${spare.quantity}</span>
                                            </li>
                                        `).join('')}
                                    </ul>` :
                                    '<p>No spare parts associated</p>'
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
    const existingModal = document.getElementById('systemDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('systemDetailsModal'));
    modal.show();
}

// System types (with embedded subsystems) fetched from the admin-managed
// config API. Populated whenever a create/edit modal opens.
let cachedSystemTypes = [];

async function loadSystemTypes() {
    cachedSystemTypes = await API.get('/config/system-types');
    return cachedSystemTypes;
}

function formatOptionLabel(value) {
    return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Refresh the subsystem dropdown when systemType changes
function updateSubsystemOptions(selectedSubsystem) {
    const typeSelect = document.querySelector('#systemForm [name="systemType"]');
    const subsystemSelect = document.querySelector('#systemForm [name="subsystem"]');
    if (!typeSelect || !subsystemSelect) return;

    const matchedType = cachedSystemTypes.find(t => t.value === typeSelect.value);
    const options = matchedType ? matchedType.subsystems : [];
    subsystemSelect.innerHTML = options.map(opt => `
        <option value="${opt.value}" ${opt.value === selectedSubsystem ? 'selected' : ''}>${opt.label}</option>
    `).join('');
}

// Build the shared create/edit system form. `system` is null for create.
function buildSystemFormFields(groups, system) {
    const s = system || {};
    const loc = s.location || {};
    const assignedGroupId = s.assignedGroup ? (s.assignedGroup._id || s.assignedGroup) : '';
    const matchedType = cachedSystemTypes.find(t => t.value === s.systemType) || cachedSystemTypes[0];
    const subsystemOptions = matchedType ? matchedType.subsystems : [];

    const toDateInput = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

    return `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">System Name *</label>
                    <input type="text" class="form-control" name="name" value="${s.name || ''}" required>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Serial Number</label>
                    <input type="text" class="form-control" name="serialNumber" value="${s.serialNumber || ''}">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">System Type *</label>
                    <select class="form-select" name="systemType" required onchange="updateSubsystemOptions()">
                        ${cachedSystemTypes.map(opt => `
                            <option value="${opt.value}" ${s.systemType === opt.value ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Subsystem *</label>
                    <select class="form-select" name="subsystem" required>
                        ${subsystemOptions.map(opt => `
                            <option value="${opt.value}" ${s.subsystem === opt.value ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Manufacturer *</label>
                    <input type="text" class="form-control" name="manufacturer" value="${s.manufacturer || ''}" required>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Model *</label>
                    <input type="text" class="form-control" name="model" value="${s.model || ''}" required>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Firmware Version</label>
                    <input type="text" class="form-control" name="firmwareVersion" value="${s.firmwareVersion || ''}">
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Software Version</label>
                    <input type="text" class="form-control" name="softwareVersion" value="${s.softwareVersion || ''}">
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Hardware Version</label>
                    <input type="text" class="form-control" name="hardwareVersion" value="${s.hardwareVersion || ''}">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Installation Date</label>
                    <input type="date" class="form-control" name="installationDate" value="${toDateInput(s.installationDate)}">
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Commission Date</label>
                    <input type="date" class="form-control" name="commissionDate" value="${toDateInput(s.commissionDate)}">
                </div>
            </div>
        </div>
        <hr>
        <h6>Location</h6>
        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Site *</label>
                    <input type="text" class="form-control" name="site" value="${loc.site || ''}" required>
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Building</label>
                    <input type="text" class="form-control" name="building" value="${loc.building || ''}">
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Room</label>
                    <input type="text" class="form-control" name="room" value="${loc.room || ''}">
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Service Level</label>
                    <select class="form-select" name="serviceLevel">
                        <option value="critical" ${s.serviceLevel === 'critical' ? 'selected' : ''}>Critical</option>
                        <option value="essential" ${(!s.serviceLevel || s.serviceLevel === 'essential') ? 'selected' : ''}>Essential</option>
                        <option value="supporting" ${s.serviceLevel === 'supporting' ? 'selected' : ''}>Supporting</option>
                    </select>
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Criticality</label>
                    <select class="form-select" name="criticality">
                        ${['low', 'medium', 'high', 'critical'].map(c => `
                            <option value="${c}" ${(s.criticality || 'medium') === c ? 'selected' : ''}>${formatOptionLabel(c)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Assigned Group</label>
                    <select class="form-select" name="assignedGroup">
                        <option value="">None</option>
                        ${groups.map(group => `
                            <option value="${group._id}" ${String(assignedGroupId) === String(group._id) ? 'selected' : ''}>${group.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Power Supply</label>
                    <select class="form-select" name="powerSupply">
                        ${['mains', 'redundant', 'battery', 'generator', 'ups'].map(p => `
                            <option value="${p}" ${(s.powerSupply || 'mains') === p ? 'selected' : ''}>${formatOptionLabel(p)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Redundancy Level</label>
                    <select class="form-select" name="redundancyLevel">
                        ${['none', 'local', 'site', 'regional', 'global'].map(r => `
                            <option value="${r}" ${(s.redundancyLevel || 'none') === r ? 'selected' : ''}>${formatOptionLabel(r)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;
}

function readSystemFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.location = {
        site: data.site,
        building: data.building,
        room: data.room
    };
    delete data.site;
    delete data.building;
    delete data.room;
    if (!data.assignedGroup) delete data.assignedGroup;
    if (!data.installationDate) delete data.installationDate;
    if (!data.commissionDate) delete data.commissionDate;
    return data;
}

// Create system modal
function showCreateSystemModal() {
    Promise.all([API.get('/groups'), loadSystemTypes()]).then(([response]) => {
        const groups = response.groups || [];
        const modalHtml = `
            <div class="modal fade" id="createSystemModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add System</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="systemForm" onsubmit="handleCreateSystem(event)">
                            <div class="modal-body">
                                ${buildSystemFormFields(groups, null)}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create System</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('createSystemModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('createSystemModal'));
        modal.show();
    }).catch(error => {
        showToast('Error loading groups: ' + error.message, 'danger');
    });
}

async function handleCreateSystem(event) {
    event.preventDefault();
    const data = readSystemFormData(event.target);
    try {
        await API.post('/systems', data);
        showToast('System created successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('createSystemModal')).hide();
        loadSystems(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error creating system: ' + error.message, 'danger');
    }
}

// Edit system
async function editSystem(id) {
    try {
        const [system, groupsResponse] = await Promise.all([
            API.get(`/systems/${id}`),
            API.get('/groups'),
            loadSystemTypes()
        ]);
        const groups = groupsResponse.groups || [];

        const modalHtml = `
            <div class="modal fade" id="editSystemModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit System</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="systemForm" onsubmit="handleEditSystem(event, '${id}')">
                            <div class="modal-body">
                                ${buildSystemFormFields(groups, system)}
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
        const existingModal = document.getElementById('editSystemModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editSystemModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading system: ' + error.message, 'danger');
    }
}

async function handleEditSystem(event, id) {
    event.preventDefault();
    const data = readSystemFormData(event.target);
    try {
        await API.put(`/systems/${id}`, data);
        showToast('System updated successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editSystemModal')).hide();
        loadSystems(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating system: ' + error.message, 'danger');
    }
}

// Delete system
async function deleteSystem(id) {
    if (!confirm('Are you sure you want to delete this system?')) return;
    try {
        await API.delete(`/systems/${id}`);
        showToast('System deleted successfully', 'success');
        loadSystems(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error deleting system: ' + error.message, 'danger');
    }
}