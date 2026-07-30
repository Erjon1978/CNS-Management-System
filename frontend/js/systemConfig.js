// System Configuration admin panel — manage System Types, Subsystems, and
// Certifications, which used to be hardcoded constants.

let cachedConfigSystemTypes = [];
let cachedConfigCertifications = [];

function slugify(text) {
    return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function loadSystemConfig(container) {
    try {
        const [systemTypes, certifications] = await Promise.all([
            API.get('/config/system-types'),
            API.get('/config/certifications')
        ]);
        cachedConfigSystemTypes = systemTypes;
        cachedConfigCertifications = certifications;

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>System Configuration</h4>
            </div>
            <div class="row g-4">
                <div class="col-lg-7">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-diagram-3"></i> System Types &amp; Subsystems</span>
                            <button class="btn btn-sm btn-primary" onclick="showAddSystemTypeModal()">
                                <i class="bi bi-plus-circle"></i> Add System Type
                            </button>
                        </div>
                        <div class="card-body" id="systemTypesList"></div>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-patch-check"></i> Certifications</span>
                            <button class="btn btn-sm btn-primary" onclick="showAddCertificationModal()">
                                <i class="bi bi-plus-circle"></i> Add
                            </button>
                        </div>
                        <div class="card-body" id="certificationsList"></div>
                    </div>
                </div>
            </div>
        `;

        renderSystemTypesList();
        renderCertificationsList();
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load system configuration: ${error.message}</div>`;
    }
}

function renderSystemTypesList() {
    const el = document.getElementById('systemTypesList');
    if (!el) return;

    if (cachedConfigSystemTypes.length === 0) {
        el.innerHTML = '<p class="text-muted mb-0">No system types yet. Add one to get started.</p>';
        return;
    }

    el.innerHTML = cachedConfigSystemTypes.map(type => `
        <div class="border rounded p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${type.label}</strong>
                    <code class="ms-2 text-muted">${type.value}</code>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="showEditSystemTypeModal('${type._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSystemType('${type._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="mt-2 ps-2">
                ${type.subsystems && type.subsystems.length > 0 ? `
                    <div class="d-flex flex-wrap gap-2 mb-2">
                        ${type.subsystems.map(sub => `
                            <span class="badge bg-light text-dark border d-inline-flex align-items-center">
                                ${sub.label}
                                <a href="#" class="ms-2 text-secondary" title="Edit" onclick="showEditSubsystemModal('${type._id}', '${sub._id}'); return false;"><i class="bi bi-pencil-fill"></i></a>
                                <a href="#" class="ms-2 text-danger" title="Delete" onclick="deleteSubsystem('${type._id}', '${sub._id}'); return false;"><i class="bi bi-x-circle-fill"></i></a>
                            </span>
                        `).join('')}
                    </div>
                ` : '<p class="text-muted small mb-2">No subsystems yet.</p>'}
                <button class="btn btn-sm btn-link p-0" onclick="showAddSubsystemModal('${type._id}')">
                    <i class="bi bi-plus-circle"></i> Add Subsystem
                </button>
            </div>
        </div>
    `).join('');
}

function renderCertificationsList() {
    const el = document.getElementById('certificationsList');
    if (!el) return;

    if (cachedConfigCertifications.length === 0) {
        el.innerHTML = '<p class="text-muted mb-0">No certifications yet. Add one to get started.</p>';
        return;
    }

    el.innerHTML = `
        <div class="d-flex flex-wrap gap-2">
            ${cachedConfigCertifications.map(cert => `
                <span class="badge bg-light text-dark border d-inline-flex align-items-center p-2">
                    ${cert.label}
                    <a href="#" class="ms-2 text-secondary" title="Edit" onclick="showEditCertificationModal('${cert._id}'); return false;"><i class="bi bi-pencil-fill"></i></a>
                    <a href="#" class="ms-2 text-danger" title="Delete" onclick="deleteCertification('${cert._id}'); return false;"><i class="bi bi-x-circle-fill"></i></a>
                </span>
            `).join('')}
        </div>
    `;
}

// ---------- Generic small modal helper ----------
function showConfigFormModal({ id, title, fields, onSubmit }) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const modalHtml = `
        <div class="modal fade" id="${id}" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="${id}Form">
                        <div class="modal-body">
                            ${fields}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(id);
    const modal = new bootstrap.Modal(modalEl);
    document.getElementById(`${id}Form`).addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await onSubmit(new FormData(e.target));
            modal.hide();
        } catch (error) {
            showToast(error.message, 'danger');
        }
    });
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

// Auto-slug helper: wires a label input to auto-fill a value input until the
// user edits the value field directly.
function wireAutoSlug(modalId) {
    setTimeout(() => {
        const labelInput = document.querySelector(`#${modalId} [name="label"]`);
        const valueInput = document.querySelector(`#${modalId} [name="value"]`);
        if (!labelInput || !valueInput) return;
        let valueTouched = valueInput.value !== '';
        valueInput.addEventListener('input', () => { valueTouched = true; });
        labelInput.addEventListener('input', () => {
            if (!valueTouched) valueInput.value = slugify(labelInput.value);
        });
    }, 0);
}

// ---------- System Types ----------
function showAddSystemTypeModal() {
    const modalId = 'addSystemTypeModal';
    showConfigFormModal({
        id: modalId,
        title: 'Add System Type',
        fields: `
            <div class="mb-3">
                <label class="form-label">Label *</label>
                <input type="text" class="form-control" name="label" placeholder="e.g. Communication" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Value *</label>
                <input type="text" class="form-control" name="value" placeholder="e.g. communication" required pattern="[a-z0-9_]+">
                <small class="form-text">Lowercase letters, numbers, and underscores only. Used internally — auto-filled from the label.</small>
            </div>
        `,
        onSubmit: async (formData) => {
            await API.post('/config/system-types', {
                label: formData.get('label'),
                value: formData.get('value')
            });
            showToast('System type created', 'success');
            await loadSystemConfig(document.getElementById('systemConfigContent'));
        }
    });
    wireAutoSlug(modalId);
}

function showEditSystemTypeModal(id) {
    const type = cachedConfigSystemTypes.find(t => t._id === id);
    if (!type) return;

    showConfigFormModal({
        id: 'editSystemTypeModal',
        title: 'Edit System Type',
        fields: `
            <div class="mb-3">
                <label class="form-label">Label *</label>
                <input type="text" class="form-control" name="label" value="${type.label}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Value</label>
                <input type="text" class="form-control" value="${type.value}" disabled>
                <small class="form-text">The internal value can't be changed after creation, since existing records reference it.</small>
            </div>
        `,
        onSubmit: async (formData) => {
            await API.put(`/config/system-types/${id}`, { label: formData.get('label') });
            showToast('System type updated', 'success');
            await loadSystemConfig(document.getElementById('systemConfigContent'));
        }
    });
}

async function deleteSystemType(id) {
    const type = cachedConfigSystemTypes.find(t => t._id === id);
    if (!type) return;
    if (!confirm(`Delete system type "${type.label}"? This also removes its subsystems.`)) return;

    try {
        await API.delete(`/config/system-types/${id}`);
        showToast('System type deleted', 'success');
        await loadSystemConfig(document.getElementById('systemConfigContent'));
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// ---------- Subsystems ----------
function showAddSubsystemModal(systemTypeId) {
    const modalId = 'addSubsystemModal';
    showConfigFormModal({
        id: modalId,
        title: 'Add Subsystem',
        fields: `
            <div class="mb-3">
                <label class="form-label">Label *</label>
                <input type="text" class="form-control" name="label" placeholder="e.g. VHF Radio" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Value *</label>
                <input type="text" class="form-control" name="value" placeholder="e.g. vhf_radio" required pattern="[a-z0-9_]+">
                <small class="form-text">Lowercase letters, numbers, and underscores only.</small>
            </div>
        `,
        onSubmit: async (formData) => {
            await API.post(`/config/system-types/${systemTypeId}/subsystems`, {
                label: formData.get('label'),
                value: formData.get('value')
            });
            showToast('Subsystem added', 'success');
            await loadSystemConfig(document.getElementById('systemConfigContent'));
        }
    });
    wireAutoSlug(modalId);
}

function showEditSubsystemModal(systemTypeId, subId) {
    const type = cachedConfigSystemTypes.find(t => t._id === systemTypeId);
    const sub = type && type.subsystems.find(s => s._id === subId);
    if (!sub) return;

    showConfigFormModal({
        id: 'editSubsystemModal',
        title: 'Edit Subsystem',
        fields: `
            <div class="mb-3">
                <label class="form-label">Label *</label>
                <input type="text" class="form-control" name="label" value="${sub.label}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Value</label>
                <input type="text" class="form-control" value="${sub.value}" disabled>
                <small class="form-text">The internal value can't be changed after creation.</small>
            </div>
        `,
        onSubmit: async (formData) => {
            await API.put(`/config/system-types/${systemTypeId}/subsystems/${subId}`, { label: formData.get('label') });
            showToast('Subsystem updated', 'success');
            await loadSystemConfig(document.getElementById('systemConfigContent'));
        }
    });
}

async function deleteSubsystem(systemTypeId, subId) {
    if (!confirm('Delete this subsystem?')) return;
    try {
        await API.delete(`/config/system-types/${systemTypeId}/subsystems/${subId}`);
        showToast('Subsystem deleted', 'success');
        await loadSystemConfig(document.getElementById('systemConfigContent'));
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// ---------- Certifications ----------
function showAddCertificationModal() {
    const modalId = 'addCertificationModal';
    showConfigFormModal({
        id: modalId,
        title: 'Add Certification',
        fields: `
            <div class="mb-3">
                <label class="form-label">Label *</label>
                <input type="text" class="form-control" name="label" placeholder="e.g. Electrical" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Value *</label>
                <input type="text" class="form-control" name="value" placeholder="e.g. electrical" required pattern="[a-z0-9_]+">
                <small class="form-text">Lowercase letters, numbers, and underscores only.</small>
            </div>
        `,
        onSubmit: async (formData) => {
            await API.post('/config/certifications', {
                label: formData.get('label'),
                value: formData.get('value')
            });
            showToast('Certification created', 'success');
            await loadSystemConfig(document.getElementById('systemConfigContent'));
        }
    });
    wireAutoSlug(modalId);
}

function showEditCertificationModal(id) {
    const cert = cachedConfigCertifications.find(c => c._id === id);
    if (!cert) return;

    showConfigFormModal({
        id: 'editCertificationModal',
        title: 'Edit Certification',
        fields: `
            <div class="mb-3">
                <label class="form-label">Label *</label>
                <input type="text" class="form-control" name="label" value="${cert.label}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Value</label>
                <input type="text" class="form-control" value="${cert.value}" disabled>
                <small class="form-text">The internal value can't be changed after creation, since existing records reference it.</small>
            </div>
        `,
        onSubmit: async (formData) => {
            await API.put(`/config/certifications/${id}`, { label: formData.get('label') });
            showToast('Certification updated', 'success');
            await loadSystemConfig(document.getElementById('systemConfigContent'));
        }
    });
}

async function deleteCertification(id) {
    const cert = cachedConfigCertifications.find(c => c._id === id);
    if (!cert) return;
    if (!confirm(`Delete certification "${cert.label}"?`)) return;

    try {
        await API.delete(`/config/certifications/${id}`);
        showToast('Certification deleted', 'success');
        await loadSystemConfig(document.getElementById('systemConfigContent'));
    } catch (error) {
        showToast(error.message, 'danger');
    }
}
