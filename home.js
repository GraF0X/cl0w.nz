// #SECTION_HOME - Головна сторінка
// ═══════════════════════════════════════════════════════════════════════════════

/** Активний профіль та тег на головній сторінці */
let activeHomeProfile = null;
let activeHomeTag = null;

/**
 * renderHome - Рендерить головну сторінку з профілями та посиланнями
 * Відображає ASCII лого, список профілів, теги та відфільтровані посилання
 */
function renderHome() {
    const v = document.getElementById('view');
    let html = `<div style="text-align:center; margin-top:40px;"><pre style="font-size:1rem; line-height:1; display:inline-block; text-align:left; font-family:monospace; opacity:0.9;">${systemData.home.ascii}</pre><h1 style="font-size:2.2rem; margin-top:10px;">${systemData.home.title}</h1><p>${systemData.home.text}</p></div>`;

    html += `<h3 class="underline" style="margin-top:30px">PROFILES</h3><div class="home-profile-grid">`;
    systemData.homeLinks.profiles.forEach(p => {
        const isActive = activeHomeProfile === p.id ? 'active' : '';
        const isLocked = p.password && p.password.length > 0;
        const lockIcon = isLocked ? '🔒 ' : '';
        html += `<button class="home-profile-btn ${isActive}" onclick="selectHomeProfile('${p.id}')">[ ${lockIcon}${p.name} ]</button>`;
    });
    html += `</div>`;

    if (activeHomeProfile) {
        const profile = systemData.homeLinks.profiles.find(p => p.id === activeHomeProfile);
        if (profile) {
            html += `<div class="home-tags-area">`;
            html += `<span style="opacity:0.5; padding:5px;">TAGS:</span>`;
            profile.tags.forEach(tag => {
                const isActive = activeHomeTag === tag ? 'active' : '';
                html += `<button class="home-tag-btn ${isActive}" onclick="selectHomeTag('${tag}')">#${tag}</button>`;
            });
            html += `</div>`;
        }
    }

    if (activeHomeTag) {
        const filteredLinks = systemData.homeLinks.links.filter(l => l.tags.includes(activeHomeTag));
        html += `<h3 class="underline">LINKS [${activeHomeTag}]</h3><div class="home-links-grid">`;
        if (filteredLinks.length > 0) {
            filteredLinks.forEach(l => {
                html += `<a href="${l.u}" target="_blank" class="home-link-card">
                            <span class="title">${l.t}</span>
                            <span class="url">${l.u}</span>
                            <div class="home-link-tags">${l.tags.map(t => `#${t}`).join(' ')}</div>
                        </a>`;
            });
        } else {
            html += `<div style="opacity:0.5; font-style:italic; padding:10px;">No links found for this tag.</div>`;
        }
        html += `</div>`;
    }

    v.innerHTML = html;
}

/**
 * selectHomeProfile - Вибирає профіль на головній сторінці
 * @param {string} id - ID профілю
 * Перевіряє пароль якщо профіль захищений
 */
async function selectHomeProfile(id) {
    if (activeHomeProfile === id) {
        activeHomeProfile = null; // Toggle off
        activeHomeTag = null;
        renderHome();
        return;
    }

    const profile = systemData.homeLinks.profiles.find(p => p.id === id);
    const hasPass = profile && profile.password && profile.password.trim().length > 0;

    if (hasPass) {
        if (!adminAuth) {
            const att = await showPrompt({ title: 'ENTER PASSWORD', placeholder: '********' });
            const hash = await hashPass(att || '');
            if (hash !== profile.password) {
                playSfx(100, 'sawtooth', 0.5);
                showModal({ title: 'ACCESS DENIED', body: 'Wrong password for this profile.' });
                return;
            }
        } else {
            playSfx(800, 'sine', 0.1);
            showToast('ADMIN: PASSWORD BYPASSED', 'info');
        }
    }

    activeHomeProfile = id;
    activeHomeTag = null;
    playSfx(600, 'sine');
    renderHome();
}

/**
 * selectHomeTag - Вибирає тег для фільтрації посилань
 * @param {string} tag - Назва тегу
 */
function selectHomeTag(tag) {
    if (activeHomeTag === tag) {
        activeHomeTag = null;
    } else {
        activeHomeTag = tag;
        playSfx(800, 'square', 0.05);
    }
    renderHome();
}

// ═══════════════════════════════════════════════════════════════════════════════
