// Dashboard functions

async function loadDashboard(container) {
    try {
        // Fetch dashboard data
        const stats = await API.get('/dashboard/stats');
        const recentTasks = await API.get('/tasks?limit=5');
        const recentIncidents = await API.get('/incidents?limit=5');
        const systemStats = await API.get('/systems/stats');

        let html = `
            <!-- Stats Cards -->
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card card-stat">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1">Total Systems</h6>
                                    <h3 class="mb-0">${stats.totalSystems || 0}</h3>
                                    <small class="text-muted">${stats.activeSystems || 0} active</small>
                                </div>
                                <div class="card-icon">
                                    <i class="bi bi-server"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stat">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1">Open Tasks</h6>
                                    <h3 class="mb-0">${stats.openTasks || 0}</h3>
                                    <small class="text-muted">${stats.tasksInProgress || 0} in progress</small>
                                </div>
                                <div class="card-icon">
                                    <i class="bi bi-list-task"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stat">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1">Active Incidents</h6>
                                    <h3 class="mb-0">${stats.activeIncidents || 0}</h3>
                                    <small class="text-muted">${stats.criticalIncidents || 0} critical</small>
                                </div>
                                <div class="card-icon">
                                    <i class="bi bi-exclamation-triangle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stat">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1">Team Members</h6>
                                    <h3 class="mb-0">${stats.teamMembers || 0}</h3>
                                    <small class="text-muted">${stats.activeUsers || 0} active</small>
                                </div>
                                <div class="card-icon">
                                    <i class="bi bi-people"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">System Status Distribution</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="systemStatusChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Task Overview</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="taskOverviewChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Recent Tasks</h5>
                            <a href="#tasks" class="btn btn-sm btn-link">View All</a>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
                                ${recentTasks.tasks && recentTasks.tasks.length > 0 ? 
                                    recentTasks.tasks.map(task => `
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-0">${task.title}</h6>
                                                <small class="text-muted">${task.system?.name || 'No system'}</small>
                                            </div>
                                            <span class="badge bg-${getPriorityColor(task.priority)}">${task.priority}</span>
                                        </div>
                                    `).join('') : 
                                    '<p class="text-muted text-center">No recent tasks</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Recent Incidents</h5>
                            <a href="#incidents" class="btn btn-sm btn-link">View All</a>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
                                ${recentIncidents.incidents && recentIncidents.incidents.length > 0 ?
                                    recentIncidents.incidents.map(incident => `
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-0">${incident.title}</h6>
                                                <small class="text-muted">${incident.system?.name || 'No system'}</small>
                                            </div>
                                            <span class="badge bg-${getSeverityColor(incident.severity)}">${incident.severity}</span>
                                        </div>
                                    `).join('') :
                                    '<p class="text-muted text-center">No recent incidents</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Load charts after DOM update
        setTimeout(() => {
            loadSystemStatusChart(systemStats);
            loadTaskOverviewChart();
        }, 100);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load dashboard data: ${error.message}
            </div>
        `;
    }
}

// Helper functions for colors
function getPriorityColor(priority) {
    const colors = {
        critical: 'danger',
        high: 'warning',
        medium: 'info',
        low: 'success'
    };
    return colors[priority] || 'secondary';
}

function getSeverityColor(severity) {
    const colors = {
        critical: 'danger',
        high: 'warning',
        medium: 'info',
        low: 'success'
    };
    return colors[severity] || 'secondary';
}

// Load system status chart
function loadSystemStatusChart(data) {
    const canvas = document.getElementById('systemStatusChart');
    if (!canvas) return;

    // Group by type and status
    const types = {};
    data.forEach(item => {
        const type = item._id || 'Unknown';
        if (!types[type]) {
            types[type] = {};
        }
        item.statuses.forEach(status => {
            types[type][status.status] = status.count;
        });
    });

    // This is a placeholder - in production, use a chart library like Chart.js
    // For now, we'll create a simple bar chart using divs
    const ctx = canvas.getContext('2d');
    // Implement chart rendering with Chart.js or similar
}

// Load task overview chart
function loadTaskOverviewChart() {
    const canvas = document.getElementById('taskOverviewChart');
    if (!canvas) return;
    // Implement chart rendering
}