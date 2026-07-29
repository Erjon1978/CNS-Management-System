// Incidents management functions

// Load incidents page
async function loadIncidents(container) {
    try {
        const incidents = await API.get('/incidents');

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <select class="form-select" id="incidentFilter" style="width: 200px; display: inline-block;">
                        <option value="">All Incidents</option>
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button class="btn btn-outline-secondary" onclick="applyIncidentFilters()">
                        <i class="bi bi-funnel"></i> Filter
                    </button>
                </div>
                <button class="btn btn-danger" onclick="showCreateIncidentModal()">
                    <i class="bi bi-plus-circle"></i> Report Incident
                </button>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>System</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                    <th>Reported</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${incidents.incidents && incidents.incidents.length > 0 ?
                                    incidents.incidents.map(incident => `
                                        <tr>
                                            <td><strong>${incident.incidentNumber}</strong></td>
                                            <td>${incident.title}</td>
                                            <td>${incident.system?.name || 'N/A'}</td>
                                            <td>
                                                <span class="badge bg-${getSeverityColor(incident.severity)}">${incident.severity}</span>
                                            </td>
                                            <td>
                                                <span class="badge bg-${getIncidentStatusColor(incident.status)}">${incident.status}</span>
                                            </td>
                                            <td>${incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewIncident('${incident._id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${isManager() ? `
                                                    <button class="btn btn-sm btn-outline-secondary" onclick="editIncident('${incident._id}')">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                ` : ''}
                                            </td>
                                        </tr>
                                    `).join('') :
                                    `<tr><td colspan="7" class="text-center">No incidents found</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add filter event listener
        document.getElementById('incidentFilter')?.addEventListener('change', applyIncidentFilters);

    } catch (error) {
        console.error('Error loading incidents:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load incidents: ${error.message}
            </div>
        `;
    }
}

// Apply incident filters
function applyIncidentFilters() {
    const filter = document.getElementById('incidentFilter')?.value || '';
    loadIncidents(document.getElementById('page-content'));
}

// Get incident status color
function getSeverityColor(severity) {
    const colors = {
        critical: 'danger',
        high: 'warning',
        medium: 'info',
        low: 'success'
    };
    return colors[severity] || 'secondary';
}

function getIncidentStatusColor(status) {
    const colors = {
        reported: 'danger',
        investigating: 'warning',
        in_progress: 'primary',
        resolved: 'success',
        closed: 'secondary',
        escalated: 'danger'
    };
    return colors[status] || 'secondary';
}

// View incident details
async function viewIncident(id) {
    try {
        const incident = await API.get(`/incidents/${id}`);
        showIncidentDetailsModal(incident);
    } catch (error) {
        showToast('Error loading incident details: ' + error.message, 'danger');
    }
}

// Show incident details modal
function showIncidentDetailsModal(incident) {
    const modalHtml = `
        <div class="modal fade" id="incidentDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${incident.incidentNumber} - ${incident.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Incident Information</h6>
                                <p><strong>Type:</strong> ${incident.incidentType}</p>
                                <p><strong>Severity:</strong> <span class="badge bg-${getSeverityColor(incident.severity)}">${incident.severity}</span></p>
                                <p><strong>Status:</strong> <span class="badge bg-${getIncidentStatusColor(incident.status)}">${incident.status}</span></p>
                                <p><strong>System:</strong> ${incident.system?.name || 'N/A'}</p>
                                <p><strong>Reported By:</strong> ${incident.reportedBy?.firstName || ''} ${incident.reportedBy?.lastName || ''}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Timeline</h6>
                                <p><strong>Reported:</strong> ${incident.reportedAt ? new Date(incident.reportedAt).toLocaleString() : 'N/A'}</p>
                                <p><strong>Detected:</strong> ${incident.detectedAt ? new Date(incident.detectedAt).toLocaleString() : 'N/A'}</p>
                                <p><strong>Resolved:</strong> ${incident.resolutionDate ? new Date(incident.resolutionDate).toLocaleString() : 'Not resolved'}</p>
                                <p><strong>Downtime:</strong> ${incident.downtime ? `${incident.downtime} minutes` : 'N/A'}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Description</h6>
                                <p>${incident.description || 'No description provided'}</p>
                            </div>
                        </div>
                        ${incident.rootCause ? `
                            <hr>
                            <div class="row">
                                <div class="col-12">
                                    <h6>Root Cause</h6>
                                    <p><strong>Category:</strong> ${incident.rootCause.category}</p>
                                    <p>${incident.rootCause.description || ''}</p>
                                </div>
                            </div>
                        ` : ''}
                        ${incident.solution ? `
                            <hr>
                            <div class="row">
                                <div class="col-12">
                                    <h6>Solution</h6>
                                    <p>${incident.solution.description || ''}</p>
                                    ${incident.solution.implementedBy ? `<small class="text-muted">Implemented by: ${incident.solution.implementedBy.firstName} ${incident.solution.implementedBy.lastName}</small>` : ''}
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
    const existingModal = document.getElementById('incidentDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('incidentDetailsModal'));
    modal.show();
}

// Build the shared create/edit incident form. `incident` is null for create.
function buildIncidentFormFields(systems, users, incident) {
    const inc = incident || {};
    const systemId = inc.system ? (inc.system._id || inc.system) : '';
    const assignedToId = inc.assignedTo ? (inc.assignedTo._id || inc.assignedTo) : '';

    const incidentTypes = ['failure', 'degradation', 'alarm', 'performance_issue', 'safety_concern', 'operational_impact'];

    return `
        <div class="mb-3">
            <label class="form-label">Title *</label>
            <input type="text" class="form-control" name="title" value="${inc.title || ''}" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" rows="3">${inc.description || ''}</textarea>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">System *</label>
                    <select class="form-select" name="system" required>
                        <option value="">Select a system</option>
                        ${systems.map(sys => `
                            <option value="${sys._id}" ${String(systemId) === String(sys._id) ? 'selected' : ''}>${sys.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Incident Type *</label>
                    <select class="form-select" name="incidentType" required>
                        ${incidentTypes.map(it => `
                            <option value="${it}" ${inc.incidentType === it ? 'selected' : ''}>${it.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Severity</label>
                    <select class="form-select" name="severity">
                        ${['critical', 'high', 'medium', 'low'].map(s => `
                            <option value="${s}" ${(inc.severity || 'medium') === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Assigned To</label>
                    <select class="form-select" name="assignedTo">
                        <option value="">Unassigned</option>
                        ${users.map(u => `
                            <option value="${u._id}" ${String(assignedToId) === String(u._id) ? 'selected' : ''}>${u.firstName} ${u.lastName}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Service Impact</label>
            <textarea class="form-control" name="serviceImpact" rows="2">${inc.serviceImpact || ''}</textarea>
        </div>
    `;
}

function readIncidentFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (!data.assignedTo) delete data.assignedTo;
    return data;
}

async function loadIncidentFormDependencies() {
    const [systemsRes, usersRes] = await Promise.all([
        API.get('/systems'),
        API.get('/users')
    ]);
    return {
        systems: systemsRes.systems || [],
        users: usersRes.users || []
    };
}

// Create incident modal
function showCreateIncidentModal() {
    loadIncidentFormDependencies().then(({ systems, users }) => {
        const modalHtml = `
            <div class="modal fade" id="incidentFormModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Report Incident</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="incidentForm" onsubmit="handleCreateIncident(event)">
                            <div class="modal-body">
                                ${buildIncidentFormFields(systems, users, null)}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Report Incident</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('incidentFormModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('incidentFormModal'));
        modal.show();
    }).catch(error => {
        showToast('Error loading form data: ' + error.message, 'danger');
    });
}

async function handleCreateIncident(event) {
    event.preventDefault();
    const data = readIncidentFormData(event.target);
    try {
        await API.post('/incidents', data);
        showToast('Incident reported successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('incidentFormModal')).hide();
        loadIncidents(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error reporting incident: ' + error.message, 'danger');
    }
}

// Edit incident
async function editIncident(id) {
    try {
        const [incident, deps] = await Promise.all([
            API.get(`/incidents/${id}`),
            loadIncidentFormDependencies()
        ]);

        const modalHtml = `
            <div class="modal fade" id="incidentFormModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Incident</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="incidentForm" onsubmit="handleEditIncident(event, '${id}')">
                            <div class="modal-body">
                                ${buildIncidentFormFields(deps.systems, deps.users, incident)}
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
        const existingModal = document.getElementById('incidentFormModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('incidentFormModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading incident: ' + error.message, 'danger');
    }
}

async function handleEditIncident(event, id) {
    event.preventDefault();
    const data = readIncidentFormData(event.target);
    try {
        await API.put(`/incidents/${id}`, data);
        showToast('Incident updated successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('incidentFormModal')).hide();
        loadIncidents(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating incident: ' + error.message, 'danger');
    }
}