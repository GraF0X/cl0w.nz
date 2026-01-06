// #SECTION_DIALOGS - Уніфіковані модальні вікна/нотифікації
// ═══════════════════════════════════════════════════════════════════════════════

function ensureModalRoot() {
    let root = document.getElementById('ui-modal-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'ui-modal-root';
        document.body.appendChild(root);
    }
    return root;
}

function showModal({ title = 'Notice', body = '', actions = [{ label: 'OK', variant: 'primary', onClick: null }] }) {
    const root = ensureModalRoot();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.tabIndex = -1;

    const modal = document.createElement('div');
    modal.className = 'modal-window';
    modal.innerHTML = `<div class="modal-header"><span>${title}</span><button class="btn btn-sm" aria-label="Close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>`;

    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'modal-body';
    if (typeof body === 'string') bodyWrap.innerHTML = body; else bodyWrap.appendChild(body);
    modal.appendChild(bodyWrap);

    const actionsBar = document.createElement('div');
    actionsBar.className = 'modal-actions';
    actions.forEach((a, idx) => {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${a.variant === 'danger' ? 'btn-red' : a.variant === 'success' ? 'btn-green' : ''}`;
        btn.innerText = a.label || 'OK';
        btn.onclick = () => {
            overlay.remove();
            if (typeof a.onClick === 'function') a.onClick();
        };
        if (idx === 0) btn.autofocus = true;
        actionsBar.appendChild(btn);
    });
    modal.appendChild(actionsBar);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    root.appendChild(overlay);
    return overlay;
}

function showToast(message, tone = 'info') {
    const root = ensureModalRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast-${tone}`;
    toast.innerText = message;
    root.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
}

function showConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        showModal({
            title,
            body: message,
            actions: [
                { label: 'Cancel', onClick: () => resolve(false) },
                { label: 'Confirm', variant: 'success', onClick: () => resolve(true) }
            ]
        });
    });
}

function showPrompt({ title = 'Input', message = '', placeholder = '', defaultValue = '' }) {
    return new Promise((resolve) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `${message ? `<div style="margin-bottom:8px;">${message}</div>` : ''}<input type="text" class="form-control" style="width:100%;" placeholder="${placeholder}" value="${defaultValue}">`;
        const input = wrapper.querySelector('input');
        showModal({
            title,
            body: wrapper,
            actions: [
                { label: 'Cancel', onClick: () => resolve(null) },
                { label: 'Save', variant: 'success', onClick: () => resolve(input.value) }
            ]
        });
        setTimeout(() => {
            if (input && typeof input.focus === 'function') input.focus();
        }, 20);
    });
}

// Add Keyboard Shortcut for IRC (Alt+I)
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyI') openIRC();
});

// ═══════════════════════════════════════════════════════════════════════════════
