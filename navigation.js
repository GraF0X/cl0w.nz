// #SECTION_NAVIGATION - Навігація та глобальні змінні
// ═══════════════════════════════════════════════════════════════════════════════

/** Глобальні змінні стану додатка */
let isTyping = false; let currentObsCat = 'SECURITY'; let currentObsFile = '';
let currentGalCat = 'ASCII_ART'; let logoClicks = 0; let clownClicks = 0;
let currentLang = 'uk'; let adminAuth = false;
let admNoteCat = ''; let admNoteFile = '';
let glitchTriggered = false; let mintEvaClicks = 0; let evaCount = 0;
let dataReady = false;
let pendingNavId = null;

/**
 * nav - Головна функція навігації між секціями
 * @param {string} id - ID секції (home, about, resume, work, тощо)
 * Оновлює заголовок вікна, активну кнопку та рендерить контент
 */
function nav(id) {
    if (isTyping) return;
    stopSaverPreview();

    if (!dataReady) {
        pendingNavId = id;
        const v = document.getElementById('view');
        if (v) v.innerHTML = '<div style="padding:20px; opacity:0.7;">Loading data...</div>';
        return;
    }

    if (typeof pcScrollCleanup === 'function') {
        pcScrollCleanup();
        pcScrollCleanup = null;
    }

    // Dynamic Title Update
    const baseTitle = systemData.home.browserTitle || "vvs@cl0w.nz";
    const dir = id === 'home' ? ':~$' : ':~/' + id;
    document.title = baseTitle + dir;

    playSfx(440, 'triangle', 0.05);
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('nav-' + id); if (btn) btn.classList.add('active');
    const v = document.getElementById('view'); stopGames();

    if (id === 'home') renderHome();
    else if (id === 'about') renderAbout();
    else if (id === 'resume') renderResume();
    else if (id === 'work') renderWork();
    else if (id === 'obsidian') { currentObsFile = ''; renderObsidian(); }
    else if (id === 'blog') { activeBlogTag = null; renderBlog(); }
    else if (id === 'todo') renderTodo();
    else if (id === 'gallery') renderGallery();
    else if (id === 'draw') renderAsciiDraw();
    else if (id === 'pc') renderPlaygroundPolygon();
    else if (id === 'screensaver') renderScreensaverMenu();
    else if (id === 'game') renderGameMenu();
    else if (id === 'contact') renderLinks();
    else if (id === 'admin') renderAdmin();
}

let playgroundFiles = [];
let playgroundCurrentFileId = '';
let foxRenderer = null;
let foxScene = null;
let foxCamera = null;
let foxGroup = null;
let foxAnimHandle = null;
let foxResizeHandler = null;
let threeLoading = false;
let threeQueue = [];

function loadPlaygroundFiles() {
    if (playgroundFiles && playgroundFiles.length) return playgroundFiles;
    try {
        const raw = localStorage.getItem('playground-files');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                playgroundFiles = parsed;
                return playgroundFiles;
            }
        }
    } catch (e) { /* ignore */ }
    playgroundFiles = [
        { id: 'readme.txt', name: 'readme.txt', content: 'PLAYGROUND_POLYGON\nЛаскаво просимо до полігону — тестуйте UI, ефекти та міні-інструменти без ризику.' },
        { id: 'fox-notes.txt', name: 'fox-notes.txt', content: 'Fox Lab: low-poly fox built with Three.js primitives. Rotate with time, lit by dual lights.' },
        { id: 'ideas.md', name: 'ideas.md', content: '- Toggle shaders\n- Try new sound cues\n- Prototype UI micro-interactions' }
    ];
    return playgroundFiles;
}

function savePlaygroundFiles() {
    try { localStorage.setItem('playground-files', JSON.stringify(playgroundFiles)); } catch (e) { /* ignore */ }
}

function ensureThree(callback) {
    if (window.THREE) { callback(); return; }
    threeQueue.push(callback);
    if (threeLoading) return;
    threeLoading = true;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
    s.onload = function () {
        threeLoading = false;
        const queue = threeQueue.slice();
        threeQueue = [];
        queue.forEach(fn => { if (typeof fn === 'function') fn(); });
    };
    s.onerror = function () { threeLoading = false; threeQueue = []; showToast('Three.js failed to load', 'error'); };
    document.head.appendChild(s);
}

function teardownFoxLab() {
    if (foxResizeHandler) {
        window.removeEventListener('resize', foxResizeHandler);
        foxResizeHandler = null;
    }
    if (foxAnimHandle) {
        cancelAnimationFrame(foxAnimHandle);
        foxAnimHandle = null;
    }
    if (foxRenderer) {
        foxRenderer.dispose();
        foxRenderer = null;
    }
    foxScene = null; foxCamera = null; foxGroup = null;
}

function resizeFoxLab(container) {
    if (!foxRenderer || !foxCamera || !container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    foxCamera.aspect = w / h;
    foxCamera.updateProjectionMatrix();
    foxRenderer.setSize(w, h);
}

function setupFoxLab() {
    const holder = document.getElementById('fox-lab');
    if (!holder) return;
    ensureThree(() => {
        if (!holder) return;
        teardownFoxLab();
        const THREE = window.THREE;
        foxRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        foxRenderer.setPixelRatio(window.devicePixelRatio || 1);
        foxRenderer.setSize(holder.clientWidth, holder.clientHeight);
        holder.innerHTML = '';
        holder.appendChild(foxRenderer.domElement);

        foxScene = new THREE.Scene();
        foxCamera = new THREE.PerspectiveCamera(50, holder.clientWidth / holder.clientHeight, 0.1, 100);
        foxCamera.position.set(2, 1.4, 3);

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const spot = new THREE.DirectionalLight(0xffb000, 0.8);
        spot.position.set(3, 4, 2);
        foxScene.add(ambient);
        foxScene.add(spot);

        foxGroup = new THREE.Group();
        const orange = new THREE.MeshStandardMaterial({ color: 0xffa040, roughness: 0.6, metalness: 0.1 });
        const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const black = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.6), orange);
        body.position.set(0, 0.3, 0);
        foxGroup.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), orange);
        head.position.set(0.9, 0.55, 0);
        foxGroup.add(head);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.2), black);
        nose.position.set(1.3, 0.45, 0);
        foxGroup.add(nose);

        const earL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), white);
        earL.position.set(0.75, 0.85, 0.2);
        const earR = earL.clone(); earR.position.z = -0.2;
        foxGroup.add(earL); foxGroup.add(earR);

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.2), orange);
        tail.position.set(-1.0, 0.35, 0);
        tail.rotation.z = 0.25;
        foxGroup.add(tail);

        const legs = new THREE.BoxGeometry(0.15, 0.3, 0.15);
        const legOffsets = [ [0.4, 0, 0.2], [0.4, 0, -0.2], [-0.4, 0, 0.2], [-0.4, 0, -0.2] ];
        legOffsets.forEach((p, i) => {
            const leg = new THREE.Mesh(legs, black);
            leg.position.set(p[0], 0.15, p[2]);
            foxGroup.add(leg);
        });

        foxScene.add(foxGroup);
        const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 40), new THREE.MeshBasicMaterial({ color: 0x101010 }));
        ground.rotation.x = -Math.PI / 2;
        foxScene.add(ground);

        const animateFox = function () {
            if (!foxRenderer || !foxScene || !foxCamera) return;
            foxGroup.rotation.y += 0.01;
            foxGroup.position.y = 0.05 + Math.sin(Date.now() / 500) * 0.02;
            foxRenderer.render(foxScene, foxCamera);
            foxAnimHandle = requestAnimationFrame(animateFox);
        };
        animateFox();

        foxResizeHandler = function () { resizeFoxLab(holder); };
        window.addEventListener('resize', foxResizeHandler);
        resizeFoxLab(holder);
    });
}

function renderPlaygroundFilesList() {
    const list = document.getElementById('pg-files');
    if (!list) return;
    list.innerHTML = '';
    if (!playgroundFiles.length) {
        const e = document.createElement('div');
        e.className = 'fs-empty';
        e.innerText = 'No files yet';
        list.appendChild(e);
        return;
    }
    playgroundFiles.forEach(f => {
        const b = document.createElement('button');
        b.className = 'fs-item ' + (f.id === playgroundCurrentFileId ? 'active' : '');
        b.innerText = f.name;
        b.onclick = function () { playgroundCurrentFileId = f.id; fillPlaygroundEditor(); };
        list.appendChild(b);
    });
}

function fillPlaygroundEditor() {
    if (!playgroundFiles.length) return;
    const editor = document.getElementById('pg-file-content');
    const nameInput = document.getElementById('pg-file-name');
    const header = document.getElementById('pg-file-heading');
    const current = playgroundFiles.find(f => f.id === playgroundCurrentFileId) || playgroundFiles[0];
    playgroundCurrentFileId = current.id;
    if (editor) editor.value = current.content || '';
    if (nameInput) nameInput.value = current.name || current.id;
    if (header) header.innerText = current.name;
    renderPlaygroundFilesList();
}

function newPlaygroundFile() {
    const id = 'note-' + Date.now();
    playgroundFiles.push({ id: id, name: 'note.txt', content: '' });
    playgroundCurrentFileId = id;
    savePlaygroundFiles();
    fillPlaygroundEditor();
}

function saveCurrentPlaygroundFile() {
    const editor = document.getElementById('pg-file-content');
    const nameInput = document.getElementById('pg-file-name');
    const current = playgroundFiles.find(f => f.id === playgroundCurrentFileId);
    if (!current || !editor || !nameInput) return;
    current.content = editor.value;
    current.name = nameInput.value || current.name;
    savePlaygroundFiles();
    fillPlaygroundEditor();
    showToast('File saved', 'success');
}

window.runPlayground = function () {
    const codeBox = document.getElementById('code-in');
    const out = document.getElementById('code-out');
    if (!codeBox || !out) return;
    out.style.color = '#0f0';
    try {
        // eslint-disable-next-line no-eval
        const res = eval(codeBox.value);
        out.innerText = '>> ' + res;
    } catch (e) {
        out.style.color = 'red';
        out.innerText = '!! ' + e.message;
    }
};

function submitPlaygroundCommand(evt) {
    if (!evt || evt.key !== 'Enter') return;
    evt.preventDefault();
    const cmd = evt.target.value;
    const codeBox = document.getElementById('code-in');
    if (codeBox) codeBox.value = cmd;
    runPlayground();
    evt.target.value = '';
}

function renderPlaygroundPolygon() {
    const main = document.querySelector('main');
    if (main) {
        if (!main.dataset.prevOverflow) main.dataset.prevOverflow = main.style.overflow || '';
        main.style.overflow = 'hidden';
        pcScrollCleanup = function () {
            main.style.overflow = main.dataset.prevOverflow || '';
            teardownFoxLab();
        };
    }

    loadPlaygroundFiles();
    if (!playgroundFiles.length) newPlaygroundFile();
    if (!playgroundCurrentFileId && playgroundFiles.length) playgroundCurrentFileId = playgroundFiles[0].id;

    const v = document.getElementById('view');
    const platform = navigator.platform || 'unknown';
    const cores = navigator.hardwareConcurrency || '?';
    const mem = navigator.deviceMemory || '?';
    const net = navigator.connection ? navigator.connection.downlink + 'Mbps' : 'n/a';
    const themeActive = systemData.theme && systemData.theme.active ? systemData.theme.active : 'amber';
    const saverCatalog = getSaverCatalog();
    const saverName = (systemData.screensaver && systemData.screensaver.type) || (saverCatalog[0] ? saverCatalog[0].id : 'none');
    const gamesCount = Array.isArray(systemData.games) ? systemData.games.length : (Array.isArray(defaultData.games) ? defaultData.games.length : 0);
    const todoCount = Array.isArray(systemData.todos) ? systemData.todos.length : 0;

    v.innerHTML = `<h2>PLAYGROUND_POLYGON</h2>
    <div class="playground-shell">
        <div class="playground-grid">
            <section class="playground-panel">
                <div class="panel-title">SYSTEM SNAPSHOT</div>
                <div class="stat-row"><span>PLATFORM</span><strong>${platform}</strong></div>
                <div class="stat-row"><span>CORES</span><strong>${cores}</strong></div>
                <div class="stat-row"><span>RAM</span><strong>${mem} GB</strong></div>
                <div class="stat-row"><span>NETWORK</span><strong>${navigator.onLine ? 'ONLINE' : 'OFFLINE'} / ${net}</strong></div>
                <div class="panel-sub">Quick Toggles</div>
                <div class="toggle-row"><label><input type="checkbox" id="pg-audio" checked> Sound FX</label><label><input type="checkbox" id="pg-grid" checked> Grid helpers</label></div>
                <div class="panel-sub">Desktop Shortcuts</div>
                <div class="desktop-icons">
                    <button class="desktop-icon" onclick="fillPlaygroundEditor()">🗒️ Notes</button>
                    <button class="desktop-icon" onclick="setupFoxLab()">🦊 Fox Lab</button>
                    <button class="desktop-icon" onclick="document.getElementById('pg-lab-terminal').focus()">⌨️ Console</button>
                </div>
            </section>

            <section class="playground-panel">
                <div class="panel-title">FOX LAB (three.js)</div>
                <div id="fox-lab" class="fox-stage"></div>
                <div class="panel-note">Low-poly fox spins under dual lights. Resize-safe.</div>
            </section>

            <section class="playground-panel">
                <div class="panel-title">JS CONSOLE</div>
                <textarea id="code-in" class="playground-code" placeholder="console.log('Hello polygon')"></textarea>
                <input id="pg-lab-terminal" class="playground-term" placeholder=":> type and press Enter" onkeydown="submitPlaygroundCommand(event)">
                <div class="btn-row">
                    <button class="btn" onclick="runPlayground()">RUN</button>
                    <button class="btn" onclick="document.getElementById('code-out').innerText='>> cleared'">CLEAR</button>
                </div>
                <pre id="code-out" class="playground-output">>> ready</pre>
                <div class="panel-title" style="margin-top:10px;">SENSOR HUD</div>
                <div class="hud-grid">
                    <div class="hud-card">Idle Saver: <strong>${saverName}</strong></div>
                    <div class="hud-card">Theme: <strong>${themeActive}</strong></div>
                    <div class="hud-card">Games: <strong>${gamesCount}</strong></div>
                    <div class="hud-card">Todos: <strong>${todoCount}</strong></div>
                </div>
            </section>

            <section class="playground-panel wide">
                <div class="panel-title">FILE SYSTEM</div>
                <div class="fs-manager">
                    <div class="fs-sidebar" id="pg-files"></div>
                    <div class="fs-editor">
                        <div class="fs-header">
                            <div id="pg-file-heading" class="fs-heading">notes</div>
                            <div class="fs-actions">
                                <input id="pg-file-name" class="fs-name" value="" />
                                <button class="btn btn-sm" onclick="saveCurrentPlaygroundFile()">Save</button>
                                <button class="btn btn-sm" onclick="newPlaygroundFile()">New</button>
                            </div>
                        </div>
                        <textarea id="pg-file-content" class="fs-text"></textarea>
                    </div>
                </div>
            </section>
        </div>
    </div>`;

    renderPlaygroundFilesList();
    fillPlaygroundEditor();
    setupFoxLab();
}

function generateFakeProcesses() {
    let html = '';
    const procs = [
        { cmd: 'kernel_task', u: 'root' },
        { cmd: 'systemd', u: 'root' },
        { cmd: 'chrome', u: 'user' },
        { cmd: 'code', u: 'user' },
        { cmd: 'node', u: 'user' },
        { cmd: 'ssh-agent', u: 'user' },
        { cmd: 'bash', u: 'user' },
        { cmd: 'top', u: 'user' }
    ];

    for (let i = 0; i < 15; i++) {
        const p = procs[Math.floor(Math.random() * procs.length)];
        const pid = Math.floor(Math.random() * 30000) + 100;
        const cpu = (Math.random() * 5).toFixed(1);
        const mem = (Math.random() * 10).toFixed(1);
        html += `<tr><td>${pid}</td><td>${p.u}</td><td>${cpu}</td><td>${mem}</td><td>${p.cmd}</td></tr>`;
    }
    return html;
}

function updateTreeVisuals() {
    const contactBtn = document.getElementById('nav-contact');
    if (contactBtn) {
        contactBtn.querySelectorAll('.nav-label').forEach((label, index) => {
            if (index > 0) label.remove();
        });
        contactBtn.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('/link')) {
                node.remove();
            }
        });
        let label = contactBtn.querySelector('.nav-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'nav-label';
            contactBtn.appendChild(label);
        }
        label.textContent = ' /link';
    }

    const adminBtn = document.getElementById('nav-admin');
    if (adminBtn) adminBtn.style.display = adminAuth ? 'block' : 'none';
}


/**
 * unlockResume - Розблоковує та відкриває секцію RESUME
 * Використовується через HIRE_ME_PROTOCOL
 */
function unlockResume() {
    document.getElementById('nav-resume').style.display = 'block';
    playSfx(600, 'square', 0.2);
    nav('resume');
}

// ═══════════════════════════════════════════════════════════════════════════════
