// Profile management functions

// Load profile page
async function loadProfile(container) {
    try {
        const user = getCurrentUser();
        const userData = await API.get('/auth/me');

        let html = `
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <div class="profile-avatar mx-auto mb-3">
                                <i class="bi bi-person-circle" style="font-size: 120px; color: #0d6efd;"></i>
                            </div>
                            <h4>${userData.firstName} ${userData.lastName}</h4>
                            <p class="text-muted">${userData.role}</p>
                            ${userData.group ? `<p class="text-muted"><i class="bi bi-people"></i> ${userData.group.name}</p>` : ''}
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-body">
                            <h6>Contact Information</h6>
                            <p><i class="bi bi-envelope"></i> ${userData.email}</p>
                            <p><i class="bi bi-phone"></i> ${userData.contactInfo?.phone || 'Not provided'}</p>
                            ${userData.contactInfo?.address ? `
                                <p><i class="bi bi-geo-alt"></i> ${userData.contactInfo.address.street || ''} ${userData.contactInfo.address.city || ''}</p>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <!-- Change Password -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0">Change Password</h5>
                        </div>
                        <div class="card-body">
                            <form id="changePasswordForm" onsubmit="handlePasswordChange(event)">
                                <div class="mb-3">
                                    <label class="form-label">Current Password</label>
                                    <input type="password" class="form-control" id="currentPassword" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">New Password</label>
                                    <input type="password" class="form-control" id="newPassword" required minlength="8">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Confirm New Password</label>
                                    <input type="password" class="form-control" id="confirmPassword" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Change Password</button>
                            </form>
                        </div>
                    </div>

                    <!-- Certifications -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0">Certifications</h5>
                        </div>
                        <div class="card-body">
                            ${userData.certifications && userData.certifications.length > 0 ?
                                `<div class="d-flex flex-wrap gap-2">
                                    ${userData.certifications.map(cert => `
                                        <span class="badge bg-primary fs-6">${cert}</span>
                                    `).join('')}
                                </div>` :
                                '<p class="text-muted">No certifications</p>'
                            }
                        </div>
                    </div>

                    <!-- Vacation Days -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0">Vacation Days</h5>
                        </div>
                        <div class="card-body">
                            ${userData.vacationDays && userData.vacationDays.length > 0 ?
                                `<div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${userData.vacationDays.map(vacation => `
                                                <tr>
                                                    <td>${new Date(vacation.startDate).toLocaleDateString()}</td>
                                                    <td>${new Date(vacation.endDate).toLocaleDateString()}</td>
                                                    <td>${vacation.type}</td>
                                                    <td><span class="badge bg-${vacation.status === 'approved' ? 'success' : vacation.status === 'pending' ? 'warning' : 'danger'}">${vacation.status}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>` :
                                '<p class="text-muted">No vacation days recorded</p>'
                            }
                        </div>
                    </div>

                    <!-- Extra Hours -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Extra Hours</h5>
                        </div>
                        <div class="card-body">
                            ${userData.extraHours && userData.extraHours.length > 0 ?
                                `<div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Hours</th>
                                                <th>Type</th>
                                                <th>Approved</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${userData.extraHours.map(hour => `
                                                <tr>
                                                    <td>${new Date(hour.date).toLocaleDateString()}</td>
                                                    <td>${hour.hours}</td>
                                                    <td>${hour.type}</td>
                                                    <td><i class="bi bi-${hour.approved ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>` :
                                '<p class="text-muted">No extra hours recorded</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading profile:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load profile: ${error.message}
            </div>
        `;
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'danger');
        return;
    }

    if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'danger');
        return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
        document.getElementById('changePasswordForm').reset();
    }
}