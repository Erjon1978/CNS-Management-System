// Calendar management functions

let currentView = 'month';
let currentDate = new Date();
let calendarEvents = [];

// Load calendar page
async function loadCalendar(container) {
    try {
        // Fetch tasks for calendar
        const response = await API.get('/tasks');
        calendarEvents = response.tasks || [];

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <div>
                        <h4 class="calendar-title" id="calendarTitle">${formatMonthYear(currentDate)}</h4>
                    </div>
                    <div>
                        <div class="calendar-view-selector">
                            <button class="${currentView === 'month' ? 'active' : ''}" onclick="changeCalendarView('month')">Month</button>
                            <button class="${currentView === 'week' ? 'active' : ''}" onclick="changeCalendarView('week')">Week</button>
                            <button class="${currentView === 'day' ? 'active' : ''}" onclick="changeCalendarView('day')">Day</button>
                        </div>
                    </div>
                    <div class="calendar-nav">
                        <button onclick="navigateCalendar('prev')">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <button onclick="navigateCalendar('today')">Today</button>
                        <button onclick="navigateCalendar('next')">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div id="calendarGrid" class="calendar-grid">
                    ${renderCalendarView(currentView, currentDate, calendarEvents)}
                </div>
            </div>

            <!-- Event Modal -->
            <div class="modal fade event-modal" id="eventModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Event Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="eventModalBody">
                            <!-- Event details will be rendered here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${isManager() ? `
                                <button class="btn btn-primary" onclick="editEventFromModal()">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-danger" onclick="deleteEventFromModal()">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create Event Modal -->
            <div class="modal fade" id="createEventModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Task</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="createEventForm" onsubmit="handleCreateEvent(event)">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Title *</label>
                                            <input type="text" class="form-control" name="title" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Task Type *</label>
                                            <select class="form-select" name="taskType" required>
                                                <option value="preventive_maintenance">Preventive Maintenance</option>
                                                <option value="corrective_maintenance">Corrective Maintenance</option>
                                                <option value="predictive_maintenance">Predictive Maintenance</option>
                                                <option value="emergency_repair">Emergency Repair</option>
                                                <option value="calibration">Calibration</option>
                                                <option value="software_update">Software Update</option>
                                                <option value="firmware_update">Firmware Update</option>
                                                <option value="configuration_change">Configuration Change</option>
                                                <option value="testing">Testing</option>
                                                <option value="inspection">Inspection</option>
                                                <option value="certification">Certification</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3"></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Start Date *</label>
                                            <input type="datetime-local" class="form-control" name="startDate" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Due Date *</label>
                                            <input type="datetime-local" class="form-control" name="dueDate" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Priority</label>
                                            <select class="form-select" name="priority">
                                                <option value="low">Low</option>
                                                <option value="medium" selected>Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">System *</label>
                                            <select class="form-select" name="system" required id="eventSystemSelect">
                                                <!-- Systems will be loaded dynamically -->
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Assign To</label>
                                            <select class="form-select" name="assignedTo" id="eventUserSelect">
                                                <option value="">Unassigned</option>
                                                <!-- Users will be loaded dynamically -->
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Schedule Type</label>
                                            <select class="form-select" name="scheduleType">
                                                <option value="one_time">One Time</option>
                                                <option value="recursive">Recursive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div id="recursiveOptions" style="display: none;">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label class="form-label">Frequency</label>
                                                <select class="form-select" name="recursiveFrequency">
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="biweekly">Bi-weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="quarterly">Quarterly</option>
                                                    <option value="biannual">Biannual</option>
                                                    <option value="annual">Annual</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label class="form-label">Interval</label>
                                                <input type="number" class="form-control" name="recursiveInterval" value="1" min="1">
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label class="form-label">End Date</label>
                                                <input type="datetime-local" class="form-control" name="recursiveEndDate">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Estimated Duration (hours)</label>
                                            <input type="number" class="form-control" name="estimatedDuration" min="0.5" step="0.5">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Required Certifications</label>
                                            <select class="form-select" name="requiredCertifications" multiple>
                                                <option value="electrical">Electrical</option>
                                                <option value="mechanical">Mechanical</option>
                                                <option value="electronics">Electronics</option>
                                                <option value="rf">RF</option>
                                                <option value="software">Software</option>
                                                <option value="safety">Safety</option>
                                            </select>
                                            <small class="form-text">Hold Ctrl/Cmd to select multiple</small>
                                        </div>
                                    </div>
                                </div>
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

        container.innerHTML = html;

        // Load systems and users for create event form
        if (isManager()) {
            loadSystemsForEvent();
            loadUsersForEvent();
        }

        // Add schedule type change listener
        document.querySelector('[name="scheduleType"]')?.addEventListener('change', function() {
            const recursiveOptions = document.getElementById('recursiveOptions');
            if (this.value === 'recursive') {
                recursiveOptions.style.display = 'block';
            } else {
                recursiveOptions.style.display = 'none';
            }
        });

        // Add double-click to create event
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('dblclick', function() {
                if (isManager()) {
                    const date = this.dataset.date;
                    if (date) {
                        showCreateEventModal(new Date(date));
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error loading calendar:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load calendar: ${error.message}
            </div>
        `;
    }
}

// Render calendar view
function renderCalendarView(view, date, events) {
    switch(view) {
        case 'month':
            return renderMonthView(date, events);
        case 'week':
            return renderWeekView(date, events);
        case 'day':
            return renderDayView(date, events);
        default:
            return renderMonthView(date, events);
    }
}

// Render month view
function renderMonthView(date, events) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    let html = '';
    
    // Weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day other-month"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const isToday = new Date().toDateString() === currentDate.toDateString();
        
        // Get events for this day
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.toDateString() === currentDate.toDateString();
        });

        html += `
            <div class="calendar-day${isToday ? ' today' : ''}" data-date="${dateStr}">
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${dayEvents.slice(0, 3).map(event => `
                        <div class="day-event ${event.priority} ${event.status === 'completed' ? 'completed' : ''}" 
                             onclick="showEventDetails('${event._id}')"
                             title="${event.title}">
                            ${event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                        </div>
                    `).join('')}
                    ${dayEvents.length > 3 ? `
                        <div class="day-event" style="background: #6c757d; color: white; text-align: center;">
                            +${dayEvents.length - 3} more
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    return html;
}

// Render week view
function renderWeekView(date, events) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    let html = '';
    
    // Time slots
    const hours = Array.from({length: 24}, (_, i) => i);
    
    // Header with days
    html += `<div class="calendar-weekday">Time</div>`;
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const isToday = new Date().toDateString() === day.toDateString();
        html += `
            <div class="calendar-weekday${isToday ? ' today' : ''}">
                ${day.toLocaleDateString('en-US', { weekday: 'short' })}
                <br>
                <small>${day.getDate()}</small>
            </div>
        `;
    }

    // Time slots
    hours.forEach(hour => {
        html += `<div class="time-slot">${String(hour).padStart(2, '0')}:00</div>`;
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateStr = day.toISOString().split('T')[0];
            
            // Get events for this hour
            const hourEvents = events.filter(event => {
                const eventDate = new Date(event.startDate);
                return eventDate.toDateString() === day.toDateString() && 
                       eventDate.getHours() === hour;
            });

            html += `
                <div class="calendar-day" data-date="${dateStr}" data-hour="${hour}">
                    ${hourEvents.map(event => `
                        <div class="day-event ${event.priority} ${event.status === 'completed' ? 'completed' : ''}" 
                             onclick="showEventDetails('${event._id}')"
                             style="font-size: 9px; padding: 1px 3px;">
                            ${event.title}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    });

    return html;
}

// Render day view
function renderDayView(date, events) {
    const hours = Array.from({length: 24}, (_, i) => i);
    const dateStr = date.toISOString().split('T')[0];
    
    let html = `
        <div class="calendar-weekday">Time</div>
        <div class="calendar-weekday today">
            ${date.toLocaleDateString('en-US', { weekday: 'long' })}
            <br>
            <small>${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })} ${date.getFullYear()}</small>
        </div>
    `;

    hours.forEach(hour => {
        const hourEvents = events.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.toDateString() === date.toDateString() && 
                   eventDate.getHours() === hour;
        });

        html += `
            <div class="time-slot">${String(hour).padStart(2, '0')}:00</div>
            <div class="calendar-day" data-hour="${hour}">
                ${hourEvents.map(event => `
                    <div class="day-event ${event.priority} ${event.status === 'completed' ? 'completed' : ''}" 
                         onclick="showEventDetails('${event._id}')">
                        ${event.title}
                        <br>
                        <small>${new Date(event.startDate).toLocaleTimeString()} - ${new Date(event.dueDate).toLocaleTimeString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
    });

    return html;
}

// Format month and year
function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Change calendar view
function changeCalendarView(view) {
    currentView = view;
    loadCalendar(document.getElementById('page-content'));
}

// Navigate calendar
function navigateCalendar(direction) {
    const newDate = new Date(currentDate);
    switch(direction) {
        case 'prev':
            if (currentView === 'month') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else if (currentView === 'week') {
                newDate.setDate(newDate.getDate() - 7);
            } else {
                newDate.setDate(newDate.getDate() - 1);
            }
            break;
        case 'next':
            if (currentView === 'month') {
                newDate.setMonth(newDate.getMonth() + 1);
            } else if (currentView === 'week') {
                newDate.setDate(newDate.getDate() + 7);
            } else {
                newDate.setDate(newDate.getDate() + 1);
            }
            break;
        case 'today':
            return loadCalendar(document.getElementById('page-content'));
    }
    currentDate = newDate;
    loadCalendar(document.getElementById('page-content'));
}

// Show event details
async function showEventDetails(eventId) {
    try {
        const event = await API.get(`/tasks/${eventId}`);
        
        const modalBody = document.getElementById('eventModalBody');
        modalBody.innerHTML = `
            <div class="event-detail">
                <h4>${event.title}</h4>
                <div class="mb-3">
                    <span class="event-priority ${event.priority}">${event.priority}</span>
                    <span class="event-status ${event.status}">${event.status.replace('_', ' ')}</span>
                    <span class="badge bg-info">${event.taskType.replace('_', ' ')}</span>
                </div>
                <p><strong>Description:</strong> ${event.description || 'No description'}</p>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>System:</strong> ${event.system?.name || 'N/A'}</p>
                        <p><strong>Assigned To:</strong> ${event.assignedTo ? `${event.assignedTo.firstName} ${event.assignedTo.lastName}` : 'Unassigned'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Start:</strong> ${event.startDate ? new Date(event.startDate).toLocaleString() : 'N/A'}</p>
                        <p><strong>Due:</strong> ${event.dueDate ? new Date(event.dueDate).toLocaleString() : 'N/A'}</p>
                    </div>
                </div>
                ${event.checklist && event.checklist.length > 0 ? `
                    <hr>
                    <h6>Checklist</h6>
                    ${event.checklist.map(item => `
                        <div class="checklist-item ${item.completed ? 'completed' : ''}">
                            <input type="checkbox" ${item.completed ? 'checked' : ''} disabled>
                            ${item.item}
                            ${item.completed ? `<small class="text-muted"> - Completed by ${item.completedBy?.firstName || ''}</small>` : ''}
                        </div>
                    `).join('')}
                ` : ''}
            </div>
        `;
        
        // Store event ID for actions
        document.getElementById('eventModal').dataset.eventId = eventId;
        
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        modal.show();
    } catch (error) {
        showToast('Error loading event details: ' + error.message, 'danger');
    }
}

// Edit event from modal
function editEventFromModal() {
    const eventId = document.getElementById('eventModal').dataset.eventId;
    showToast('Edit functionality coming soon', 'info');
}

// Delete event from modal
async function deleteEventFromModal() {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const eventId = document.getElementById('eventModal').dataset.eventId;
    try {
        await API.delete(`/tasks/${eventId}`);
        showToast('Task deleted successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
        modal.hide();
        
        // Reload calendar
        loadCalendar(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error deleting task: ' + error.message, 'danger');
    }
}

// Show create event modal
function showCreateEventModal(selectedDate) {
    if (!isManager()) {
        showToast('Only managers can create tasks', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('createEventModal'));
    
    // Set default dates
    if (selectedDate) {
        const startDate = new Date(selectedDate);
        const dueDate = new Date(selectedDate);
        dueDate.setHours(selectedDate.getHours() + 4);
        
        document.querySelector('[name="startDate"]').value = startDate.toISOString().slice(0, 16);
        document.querySelector('[name="dueDate"]').value = dueDate.toISOString().slice(0, 16);
    }
    
    modal.show();
}

// Load systems for event form
async function loadSystemsForEvent() {
    try {
        const response = await API.get('/systems');
        const select = document.getElementById('eventSystemSelect');
        select.innerHTML = `
            <option value="">Select System</option>
            ${response.systems.map(system => `
                <option value="${system._id}">${system.name} (${system.systemType})</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading systems:', error);
    }
}

// Load users for event form
async function loadUsersForEvent() {
    try {
        const response = await API.get('/users');
        const select = document.getElementById('eventUserSelect');
        select.innerHTML = `
            <option value="">Unassigned</option>
            ${response.users.map(user => `
                <option value="${user._id}">${user.firstName} ${user.lastName} (${user.role})</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Handle create event
async function handleCreateEvent(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Handle multiple certifications
    if (data.requiredCertifications) {
        data.requiredCertifications = Array.from(formData.getAll('requiredCertifications'));
    } else {
        data.requiredCertifications = [];
    }
    
    // Build recursive pattern if applicable
    if (data.scheduleType === 'recursive') {
        data.recursivePattern = {
            frequency: data.recursiveFrequency,
            interval: parseInt(data.recursiveInterval),
            endDate: data.recursiveEndDate || null
        };
        delete data.recursiveFrequency;
        delete data.recursiveInterval;
        delete data.recursiveEndDate;
    }
    
    // Convert numeric fields
    if (data.estimatedDuration) {
        data.estimatedDuration = parseFloat(data.estimatedDuration);
    }
    
    try {
        await API.post('/tasks', data);
        showToast('Task created successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createEventModal'));
        modal.hide();
        
        // Reload calendar
        loadCalendar(document.getElementById('page-content'));
    } catch (error) {
        showToast('Error creating task: ' + error.message, 'danger');
    }
}