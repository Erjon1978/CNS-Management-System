// Navigation items based on role
function getNavItems() {
    const user = getCurrentUser();
    const items = [
        { icon: 'bi-grid-1x2-fill', label: 'Dashboard', href: '/pages/dashboard.html', page: 'dashboard' },
        { icon: 'bi-server', label: 'Systems', href: '/pages/systems.html', page: 'systems' },
        { icon: 'bi-list-task', label: 'Tasks', href: '/pages/tasks.html', page: 'tasks' },
        { icon: 'bi-calendar-event', label: 'Calendar', href: '/pages/calendar.html', page: 'calendar' },
        { icon: 'bi-exclamation-triangle', label: 'Incidents', href: '/pages/incidents.html', page: 'incidents' },
        { icon: 'bi-box-seam', label: 'Spare Parts', href: '/pages/spare-parts.html', page: 'spare-parts' }
    ];

    if (isAdmin() || isManager()) {
        items.push(
            { icon: 'bi-people', label: 'Users', href: '/pages/users.html', page: 'users' },
            { icon: 'bi-people-fill', label: 'Groups', href: '/pages/groups.html', page: 'groups' },
            { icon: 'bi-gear', label: 'Settings', href: '/pages/settings.html', page: 'settings' }
        );
    }

    return items;
}

// Render sidebar
function renderSidebar() {
    const sidebar = document.getElementById('sidebar-placeholder') || document.getElementById('sidebar');
    if (!sidebar) return;

    const user = getCurrentUser();
    const navItems = getNavItems();
    const currentPath = window.location.pathname;

    let html = `
        <div class="sidebar-sticky pt-3">
            <div class="px-3 mb-4">
                <h6 class="text-white">ATC CNS System</h6>
                <small class="text-muted">${user ? user.firstName + ' ' + user.lastName : ''}</small>
                <span class="badge bg-primary ms-2">${user ? user.role : ''}</span>
            </div>
            <ul class="nav flex-column">
    `;

    navItems.forEach(item => {
        const activeClass = currentPath === item.href ? 'active' : '';
        html += `
            <li class="nav-item">
                <a class="nav-link ${activeClass}" href="${item.href}">
                    <i class="bi ${item.icon}"></i>
                    ${item.label}
                </a>
            </li>
        `;
    });

    html += `
            </ul>
            <hr class="border-secondary">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link ${currentPath === '/pages/profile.html' ? 'active' : ''}" href="/pages/profile.html">
                        <i class="bi bi-person-circle"></i>
                        Profile
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="logout(); return false;">
                        <i class="bi bi-box-arrow-right"></i>
                        Logout
                    </a>
                </li>
            </ul>
        </div>
    `;

    sidebar.innerHTML = html;
}

// Toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
    toast.role = 'alert';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}