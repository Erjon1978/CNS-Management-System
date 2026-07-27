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

// Create incident modal
function showCreateIncidentModal() {
    showToast('Create incident functionality coming soon', 'info');
}

// Edit incident
function editIncident(id) {
    showToast('Edit incident functionality coming soon', 'info');
}