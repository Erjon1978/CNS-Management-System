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

// Get priority color
function getPriorityColor(priority) {
    const colors = {
        critical: 'danger',
        high: 'warning',
        medium: 'info',
        low: 'success'
    };
    return colors[priority] || 'secondary';
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

// Build the shared create/edit task form. `task` is null for create.
function buildTaskFormFields(systems, users, groups, task) {
    const t = task || {};
    const systemId = t.system ? (t.system._id || t.system) : '';
    const assignedToId = t.assignedTo ? (t.assignedTo._id || t.assignedTo) : '';
    const assignedGroupId = t.assignedGroup ? (t.assignedGroup._id || t.assignedGroup) : '';
    const toDateInput = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

    const taskTypes = ['preventive_maintenance', 'corrective_maintenance', 'predictive_maintenance',
        'emergency_repair', 'calibration', 'software_update', 'firmware_update',
        'configuration_change', 'testing', 'inspection', 'certification'];

    return `
        <div class="mb-3">
            <label class="form-label">Title *</label>
            <input type="text" class="form-control" name="title" value="${t.title || ''}" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" rows="2">${t.description || ''}</textarea>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Task Type *</label>
                    <select class="form-select" name="taskType" required>
                        ${taskTypes.map(tt => `
                            <option value="${tt}" ${t.taskType === tt ? 'selected' : ''}>${tt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
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
        </div>
        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Priority</label>
                    <select class="form-select" name="priority">
                        ${['critical', 'high', 'medium', 'low'].map(p => `
                            <option value="${p}" ${(t.priority || 'medium') === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="col-md-4">
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
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Assigned Group</label>
                    <select class="form-select" name="assignedGroup">
                        <option value="">None</option>
                        ${groups.map(g => `
                            <option value="${g._id}" ${String(assignedGroupId) === String(g._id) ? 'selected' : ''}>${g.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control" name="startDate" value="${toDateInput(t.startDate)}">
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Due Date *</label>
                    <input type="date" class="form-control" name="dueDate" value="${toDateInput(t.dueDate)}" required>
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label class="form-label">Estimated Duration (hours)</label>
                    <input type="number" step="0.5" min="0" class="form-control" name="estimatedDuration" value="${t.estimatedDuration || ''}">
                </div>
            </div>
        </div>
    `;
}

function readTaskFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (!data.assignedTo) delete data.assignedTo;
    if (!data.assignedGroup) delete data.assignedGroup;
    if (!data.startDate) delete data.startDate;
    if (data.estimatedDuration) data.estimatedDuration = Number(data.estimatedDuration);
    else delete data.estimatedDuration;
    return data;
}

async function loadTaskFormDependencies() {
    const [systemsRes, usersRes, groupsRes] = await Promise.all([
        API.get('/systems'),
        API.get('/users'),
        API.get('/groups')
    ]);
    return {
        systems: systemsRes.systems || [],
        users: usersRes.users || [],
        groups: groupsRes.groups || []
    };
}

// Create task modal
function showCreateTaskModal() {
    loadTaskFormDependencies().then(({ systems, users, groups }) => {
        const modalHtml = `
            <div class="modal fade" id="taskFormModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Task</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="taskForm" onsubmit="handleCreateTask(event)">
                            <div class="modal-body">
                                ${buildTaskFormFields(systems, users, groups, null)}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('taskFormModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('taskFormModal'));
        modal.show();
    }).catch(error => {
        showToast('Error loading form data: ' + error.message, 'danger');
    });
}

async function handleCreateTask(event) {
    event.preventDefault();
    const data = readTaskFormData(event.target);
    try {
        await API.post('/tasks', data);
        showToast('Task created successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('taskFormModal')).hide();
        loadTasks(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error creating task: ' + error.message, 'danger');
    }
}

// Edit task
async function editTask(id) {
    try {
        const [task, deps] = await Promise.all([
            API.get(`/tasks/${id}`),
            loadTaskFormDependencies()
        ]);

        const modalHtml = `
            <div class="modal fade" id="taskFormModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Task</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="taskForm" onsubmit="handleEditTask(event, '${id}')">
                            <div class="modal-body">
                                ${buildTaskFormFields(deps.systems, deps.users, deps.groups, task)}
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
        const existingModal = document.getElementById('taskFormModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('taskFormModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading task: ' + error.message, 'danger');
    }
}

async function handleEditTask(event, id) {
    event.preventDefault();
    const data = readTaskFormData(event.target);
    try {
        await API.put(`/tasks/${id}`, data);
        showToast('Task updated successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('taskFormModal')).hide();
        loadTasks(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error updating task: ' + error.message, 'danger');
    }
}