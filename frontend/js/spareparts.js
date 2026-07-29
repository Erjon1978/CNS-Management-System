// Spare Parts management functions

let currentSparePartPage = 1;
let sparePartFilters = {};

// Load spare parts page
async function loadSpareParts(container) {
    try {
        const params = new URLSearchParams({
            page: currentSparePartPage,
            limit: 20,
            ...sparePartFilters
        });
        
        const response = await API.get(`/spare-parts?${params}`);
        const spareParts = response.spareParts || [];

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex gap-2">
                    <input type="text" class="form-control" id="sparePartSearch" placeholder="Search parts..." style="width: 300px;">
                    <button class="btn btn-outline-secondary" onclick="applySparePartFilters()">
                        <i class="bi bi-search"></i>
                    </button>
                    <select class="form-select" id="sparePartFilter" style="width: 150px;">
                        <option value="">All Status</option>
                        <option value="low">Low Stock</option>
                        <option value="normal">Normal Stock</option>
                    </select>
                </div>
                ${isManager() ? `
                    <button class="btn btn-primary" onclick="showCreateSparePartModal()">
                        <i class="bi bi-plus-circle"></i> Add Spare Part
                    </button>
                ` : ''}
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon blue">
                            <i class="bi bi-box-seam"></i>
                        </div>
                        <div class="stat-number">${response.pagination?.totalItems || 0}</div>
                        <div class="stat-label">Total Parts</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon yellow">
                            <i class="bi bi-exclamation-triangle"></i>
                        </div>
                        <div class="stat-number" id="lowStockCount">0</div>
                        <div class="stat-label">Low Stock Items</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon green">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="stat-number">${spareParts.filter(p => p.quantity > p.minimumQuantity).length}</div>
                        <div class="stat-label">In Stock</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon purple">
                            <i class="bi bi-building"></i>
                        </div>
                        <div class="stat-number">${new Set(spareParts.map(p => p.location)).size}</div>
                        <div class="stat-label">Locations</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Part Number</th>
                                    <th>Name</th>
                                    <th>Manufacturer</th>
                                    <th>Quantity</th>
                                    <th>Min. Stock</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${spareParts.length > 0 ?
                                    spareParts.map(part => {
                                        const isLowStock = part.quantity < part.minimumQuantity;
                                        const statusClass = isLowStock ? 'danger' : 'success';
                                        const statusText = isLowStock ? 'Low Stock' : 'In Stock';
                                        return `
                                            <tr>
                                                <td><strong>${part.partNumber}</strong></td>
                                                <td>${part.name}</td>
                                                <td>${part.manufacturer || 'N/A'}</td>
                                                <td>
                                                    <span class="badge bg-${part.quantity === 0 ? 'danger' : isLowStock ? 'warning' : 'primary'}">
                                                        ${part.quantity}
                                                    </span>
                                                </td>
                                                <td>${part.minimumQuantity}</td>
                                                <td>${part.location || 'N/A'}</td>
                                                <td>
                                                    <span class="badge bg-${statusClass}">${statusText}</span>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="viewSparePart('${part._id}')">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                    ${isManager() ? `
                                                        <button class="btn btn-sm btn-outline-secondary" onclick="editSparePart('${part._id}')">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-success" onclick="updateStock('${part._id}')">
                                                            <i class="bi bi-box-arrow-in-down"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteSparePart('${part._id}')">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    ` : ''}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('') :
                                    `<tr><td colspan="8" class="text-center">No spare parts found</td></tr>`
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
                                <button class="btn btn-sm btn-outline-secondary" onclick="changeSparePartPage(${response.pagination.currentPage - 1})" 
                                        ${response.pagination.currentPage === 1 ? 'disabled' : ''}>
                                    Previous
                                </button>
                                <span class="mx-2">Page ${response.pagination.currentPage} of ${response.pagination.totalPages}</span>
                                <button class="btn btn-sm btn-outline-secondary" onclick="changeSparePartPage(${response.pagination.currentPage + 1})" 
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

        // Load low stock count
        await loadLowStockCount();

        // Add search event listeners
        document.getElementById('sparePartSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applySparePartFilters();
            }
        });

        document.getElementById('sparePartFilter')?.addEventListener('change', applySparePartFilters);

    } catch (error) {
        console.error('Error loading spare parts:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load spare parts: ${error.message}
            </div>
        `;
    }
}

// Load low stock count
async function loadLowStockCount() {
    try {
        const response = await API.get('/spare-parts/low-stock');
        const count = response.length || 0;
        document.getElementById('lowStockCount').textContent = count;
    } catch (error) {
        console.error('Error loading low stock count:', error);
    }
}

// Apply spare part filters
function applySparePartFilters() {
    const search = document.getElementById('sparePartSearch')?.value || '';
    const filter = document.getElementById('sparePartFilter')?.value || '';
    
    sparePartFilters = {
        search: search,
        lowStock: filter === 'low' ? 'true' : ''
    };
    
    currentSparePartPage = 1;
    loadSpareParts(document.getElementById('page-content'));
}

// Change spare part page
function changeSparePartPage(page) {
    if (page < 1) return;
    currentSparePartPage = page;
    loadSpareParts(document.getElementById('page-content'));
}

// View spare part details
async function viewSparePart(id) {
    try {
        const part = await API.get(`/spare-parts/${id}`);
        showSparePartDetailsModal(part);
    } catch (error) {
        showToast('Error loading spare part details: ' + error.message, 'danger');
    }
}

// Show spare part details modal
function showSparePartDetailsModal(part) {
    const isLowStock = part.quantity < part.minimumQuantity;
    
    const modalHtml = `
        <div class="modal fade" id="sparePartDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${part.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Basic Information</h6>
                                <p><strong>Part Number:</strong> ${part.partNumber}</p>
                                <p><strong>Description:</strong> ${part.description || 'N/A'}</p>
                                <p><strong>Manufacturer:</strong> ${part.manufacturer || 'N/A'}</p>
                                <p><strong>Supplier:</strong> ${part.supplier || 'N/A'}</p>
                                <p><strong>Location:</strong> ${part.location || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Stock Information</h6>
                                <p><strong>Quantity:</strong> 
                                    <span class="badge bg-${part.quantity === 0 ? 'danger' : isLowStock ? 'warning' : 'primary'}">
                                        ${part.quantity}
                                    </span>
                                </p>
                                <p><strong>Minimum Stock:</strong> ${part.minimumQuantity}</p>
                                <p><strong>Status:</strong> 
                                    <span class="badge bg-${isLowStock ? 'danger' : 'success'}">
                                        ${isLowStock ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </p>
                                <p><strong>Price:</strong> ${part.price ? `$${part.price}` : 'N/A'}</p>
                                <p><strong>Lead Time:</strong> ${part.leadTime ? `${part.leadTime} days` : 'N/A'}</p>
                            </div>
                        </div>
                        ${part.compatibleSystems && part.compatibleSystems.length > 0 ? `
                            <hr>
                            <div class="row">
                                <div class="col-12">
                                    <h6>Compatible Systems</h6>
                                    <ul class="list-group">
                                        ${part.compatibleSystems.map(system => `
                                            <li class="list-group-item">${system.name} (${system.systemType})</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        ` : ''}
                        ${part.datasheet ? `
                            <hr>
                            <div class="row">
                                <div class="col-12">
                                    <h6>Datasheet</h6>
                                    <a href="${part.datasheet}" target="_blank" class="btn btn-sm btn-outline-primary">
                                        <i class="bi bi-file-pdf"></i> Download Datasheet
                                    </a>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        ${isManager() ? `
                            <button class="btn btn-primary" onclick="updateStock('${part._id}')">
                                <i class="bi bi-box-arrow-in-down"></i> Update Stock
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('sparePartDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('sparePartDetailsModal'));
    modal.show();
}

// Show create spare part modal
function showCreateSparePartModal() {
    const modalHtml = `
        <div class="modal fade" id="createSparePartModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Spare Part</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="createSparePartForm" onsubmit="handleCreateSparePart(event)">
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Part Name *</label>
                                        <input type="text" class="form-control" name="name" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Part Number *</label>
                                        <input type="text" class="form-control" name="partNumber" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Manufacturer</label>
                                        <input type="text" class="form-control" name="manufacturer">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Supplier</label>
                                        <input type="text" class="form-control" name="supplier">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Quantity *</label>
                                        <input type="number" class="form-control" name="quantity" min="0" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Minimum Stock *</label>
                                        <input type="number" class="form-control" name="minimumQuantity" min="0" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Price</label>
                                        <input type="number" class="form-control" name="price" step="0.01" min="0">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Location</label>
                                        <input type="text" class="form-control" name="location">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Lead Time (days)</label>
                                        <input type="number" class="form-control" name="leadTime" min="0">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Datasheet URL</label>
                                <input type="url" class="form-control" name="datasheet">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Part</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('createSparePartModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('createSparePartModal'));
    modal.show();
}

// Handle create spare part
async function handleCreateSparePart(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numbers
    data.quantity = parseInt(data.quantity);
    data.minimumQuantity = parseInt(data.minimumQuantity);
    if (data.price) data.price = parseFloat(data.price);
    if (data.leadTime) data.leadTime = parseInt(data.leadTime);
    
    try {
        await API.post('/spare-parts', data);
        showToast('Spare part created successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createSparePartModal'));
        modal.hide();
        
        // Reload page
        loadSpareParts(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error creating spare part: ' + error.message, 'danger');
    }
}

// Update stock
function updateStock(id) {
    const modalHtml = `
        <div class="modal fade" id="updateStockModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Update Stock</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="updateStockForm" onsubmit="handleUpdateStock(event, '${id}')">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Operation</label>
                                <select class="form-select" name="operation" required>
                                    <option value="set">Set Quantity</option>
                                    <option value="add">Add Quantity</option>
                                    <option value="subtract">Subtract Quantity</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Quantity</label>
                                <input type="number" class="form-control" name="quantity" min="0" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update Stock</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('updateStockModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('updateStockModal'));
    modal.show();
}

// Handle update stock
async function handleUpdateStock(event, id) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.quantity = parseInt(data.quantity);
    
    try {
        await API.patch(`/spare-parts/${id}/stock`, data);
        showToast('Stock updated successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('updateStockModal'));
        modal.hide();
        
        // Reload page
        loadSpareParts(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating stock: ' + error.message, 'danger');
    }
}

// Edit spare part
// Edit spare part
async function editSparePart(id) {
    try {
        const part = await API.get(`/spare-parts/${id}`);

        const modalHtml = `
            <div class="modal fade" id="editSparePartModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Spare Part</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editSparePartForm" onsubmit="handleEditSparePart(event, '${id}')">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Part Name *</label>
                                            <input type="text" class="form-control" name="name" value="${part.name || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Part Number *</label>
                                            <input type="text" class="form-control" name="partNumber" value="${part.partNumber || ''}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Manufacturer</label>
                                            <input type="text" class="form-control" name="manufacturer" value="${part.manufacturer || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Supplier</label>
                                            <input type="text" class="form-control" name="supplier" value="${part.supplier || ''}">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Quantity *</label>
                                            <input type="number" class="form-control" name="quantity" min="0" value="${part.quantity ?? 0}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Minimum Stock *</label>
                                            <input type="number" class="form-control" name="minimumQuantity" min="0" value="${part.minimumQuantity ?? 5}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Price</label>
                                            <input type="number" class="form-control" name="price" step="0.01" min="0" value="${part.price ?? ''}">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Location</label>
                                            <input type="text" class="form-control" name="location" value="${part.location || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Lead Time (days)</label>
                                            <input type="number" class="form-control" name="leadTime" min="0" value="${part.leadTime ?? ''}">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3">${part.description || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Datasheet URL</label>
                                    <input type="url" class="form-control" name="datasheet" value="${part.datasheet || ''}">
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

        const existingModal = document.getElementById('editSparePartModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('editSparePartModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading spare part: ' + error.message, 'danger');
    }
}

// Handle edit spare part
async function handleEditSparePart(event, id) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.quantity = parseInt(data.quantity);
    data.minimumQuantity = parseInt(data.minimumQuantity);
    if (data.price) data.price = parseFloat(data.price);
    else delete data.price;
    if (data.leadTime) data.leadTime = parseInt(data.leadTime);
    else delete data.leadTime;

    try {
        await API.put(`/spare-parts/${id}`, data);
        showToast('Spare part updated successfully', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editSparePartModal'));
        modal.hide();

        loadSpareParts(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating spare part: ' + error.message, 'danger');
    }
}

// Delete spare part
async function deleteSparePart(id) {
    if (!confirm('Are you sure you want to delete this spare part?')) return;
    
    try {
        await API.delete(`/spare-parts/${id}`);
        showToast('Spare part deleted successfully', 'success');
        loadSpareParts(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error deleting spare part: ' + error.message, 'danger');
    }
}