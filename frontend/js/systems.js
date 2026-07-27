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

// Create system modal
function showCreateSystemModal() {
    // Implementation for creating system
    showToast('Create system functionality coming soon', 'info');
}

// Edit system
function editSystem(id) {
    showToast('Edit system functionality coming soon', 'info');
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