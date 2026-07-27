// Tasks management functions

let currentTaskPage = 1;

// Load tasks page
async function loadTasks(container) {
    try {
        const tasks = await API.get('/tasks');

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <select class="form-select" id="taskFilter" style="width: 200px; display: inline-block;">
                        <option value="">All Tasks</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button class="btn btn-outline-secondary" onclick="applyTaskFilters()">
                        <i class="bi bi-funnel"></i> Filter
                    </button>
                </div>
                ${isManager() ? `
                    <button class="btn btn-primary" onclick="showCreateTaskModal()">
                        <i class="bi bi-plus-circle"></i> Create Task
                    </button>
                ` : ''}
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>System</th>
                                    <th>Assigned To</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Due Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tasks.tasks && tasks.tasks.length > 0 ?
                                    tasks.tasks.map(task => `
                                        <tr>
                                            <td>
                                                <strong>${task.title}</strong>
                                                <br>
                                                <small class="text-muted">${task.taskType?.replace('_', ' ')}</small>
                                            </td>
                                            <td>${task.system?.name || 'N/A'}</td>
                                            <td>${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}</td>
                                            <td>
                                                <span class="badge bg-${getPriorityColor(task.priority)}">${task.priority}</span>
                                            </td>
                                            <td>
                                                <span class="badge bg-${getStatusColor(task.status)}">${task.status?.replace('_', ' ')}</span>
                                            </td>
                                            <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewTask('${task._id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${isManager() ? `
                                                    <button class="btn btn-sm btn-outline-secondary" onclick="editTask('${task._id}')">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                ` : ''}
                                                <button class="btn btn-sm btn-outline-${task.status === 'completed' ? 'secondary' : 'success'}" 
                                                        onclick="updateTaskStatus('${task._id}', '${task.status === 'completed' ? 'pending' : 'completed'}')">
                                                    <i class="bi bi-${task.status === 'completed' ? 'arrow-counterclockwise' : 'check-lg'}"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('') :
                                    `<tr><td colspan="7" class="text-center">No tasks found</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add filter event listener
        document.getElementById('taskFilter')?.addEventListener('change', applyTaskFilters);

    } catch (error) {
        console.error('Error loading tasks:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load tasks: ${error.message}
            </div>
        `;
    }
}

// Apply task filters
function applyTaskFilters() {
    const filter = document.getElementById('taskFilter')?.value || '';
    // Reload page with filters
    loadTasks(document.getElementById('page-content'));
}

// Get status color
function getStatusColor(status) {
    const colors = {
        draft: 'secondary',
        pending_approval: 'warning',
        approved: 'info',
        in_progress: 'primary',
        awaiting_part: 'warning',
        completed: 'success',
        cancelled: 'danger',
        on_hold: 'secondary'
    };
    return colors[status] || 'secondary';
}

// View task details
async function viewTask(id) {
    try {
        const task = await API.get(`/tasks/${id}`);
        showTaskDetailsModal(task);
    } catch (error) {
        showToast('Error loading task details: ' + error.message, 'danger');
    }
}

// Show task details modal
function showTaskDetailsModal(task) {
    const modalHtml = `
        <div class="modal fade" id="taskDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${task.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Task Information</h6>
                                <p><strong>Type:</strong> ${task.taskType?.replace('_', ' ')}</p>
                                <p><strong>Priority:</strong> <span class="badge bg-${getPriorityColor(task.priority)}">${task.priority}</span></p>
                                <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(task.status)}">${task.status}</span></p>
                                <p><strong>System:</strong> ${task.system?.name || 'N/A'}</p>
                                <p><strong>Assigned To:</strong> ${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Schedule</h6>
                                <p><strong>Start Date:</strong> ${task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Estimated Duration:</strong> ${task.estimatedDuration ? `${task.estimatedDuration} hours` : 'N/A'}</p>
                                <p><strong>Schedule Type:</strong> ${task.scheduleType?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Description</h6>
                                <p>${task.description || 'No description provided'}</p>
                            </div>
                        </div>
                        ${task.checklist && task.checklist.length > 0 ? `
                            <hr>
                            <div class="row">
                                <div class="col-12">
                                    <h6>Checklist</h6>
                                    ${task.checklist.map(item => `
                                        <div class="checklist-item ${item.completed ? 'completed' : ''}">
                                            <input type="checkbox" ${item.completed ? 'checked' : ''} disabled>
                                            ${item.item}
                                            ${item.completed ? `<small class="text-muted"> - Completed by ${item.completedBy?.firstName || ''}</small>` : ''}
                                        </div>
                                    `).join('')}
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
    const existingModal = document.getElementById('taskDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('taskDetailsModal'));
    modal.show();
}

// Update task status
async function updateTaskStatus(id, status) {
    try {
        await API.patch(`/tasks/${id}/status`, { status });
        showToast('Task status updated successfully', 'success');
        loadTasks(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating task status: ' + error.message, 'danger');
    }
}

// Create task modal
function showCreateTaskModal() {
    showToast('Create task functionality coming soon', 'info');
}

// Edit task
function editTask(id) {
    showToast('Edit task functionality coming soon', 'info');
}