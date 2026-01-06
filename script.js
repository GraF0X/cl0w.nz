
let audioCtx = null; let soundOn = true;
function playSfx(f, t = 'sine', d = 0.1, v = 0.05) {
    if (!soundOn) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
        g.gain.setValueAtTime(v, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + d);
    } catch (e) { }
}
/** toggleSound - Перемикає звук увімкнено/вимкнено */
function toggleSound() { soundOn = !soundOn; document.getElementById('sound-toggle').innerText = soundOn ? '🕪' : '🕩'; }

function openIRC() {
    if (document.getElementById('irc-window')) return; // Already open

    const w = document.createElement('div');
    w.id = 'irc-window';
    w.style.cssText = `position:fixed; bottom:50px; right:50px; width:350px; height:400px; 
        background:var(--bg); border:2px solid var(--text); z-index:9000; 
        display:flex; flex-direction:column; box-shadow:5px 5px 0 var(--dim);`;

    w.innerHTML = `
        <div id="irc-header" style="background:var(--text); color:var(--bg); padding:5px; font-weight:bold; cursor:grab; display:flex; justify-content:space-between; align-items:center;">
            <span>[ #general ]</span>
            <div style="display:flex; gap:5px;">
                <input id="irc-nick-set" placeholder="Nick" value="${systemData.resume.name || ''}"
                       style="background:var(--bg); color:var(--text); border:1px solid var(--bg); width:80px; padding:2px; font-size:0.8rem;"
                       onchange="systemData.resume.name=this.value; saveData(); addIRCMessage('System', 'Nick changed to '+this.value, 'yellow');">
                <button onclick="closeIRC()" class="btn btn-sm btn-ghost">X</button>
            </div>
        </div>
        <div id="irc-log" style="flex-grow:1; overflow-y:auto; padding:5px; font-size:0.85rem; font-family:monospace;">
            <div style="opacity:0.6;">* Connecting to 127.0.0.1...</div>
            <div style="opacity:0.6;">* Connected.</div>
            <div style="opacity:0.6;">* Joining #general...</div>
            <div style="color:yellow;">* Topic: Welcome to new CyberSpace. Be nice.</div>
        </div>
        <div style="display:flex; border-top:1px solid var(--text);">
            <input type="text" id="irc-input" style="flex-grow:1; background:rgba(0,0,0,0.1); border:none; color:var(--text); padding:5px; font-family:inherit; outline:none;" placeholder="Type /help..." onkeypress="if(event.key==='Enter') sendIRC()">
            <button onclick="sendIRC()" class="btn btn-sm">SEND</button>
        </div>
    `;

    document.body.appendChild(w);
    dragElement(w);

    // Auto-bot messages
    setTimeout(() => addIRCMessage("System", "Welcome, " + (systemData.resume.name || "Guest") + "!", "magenta"), 1000);
}

window.closeIRC = function () {
    const w = document.getElementById('irc-window');
    if (w) document.body.removeChild(w);
}

window.sendIRC = function () {
    const inp = document.getElementById('irc-input');
    const txt = inp.value.trim();
    if (!txt) return;

    addIRCMessage("Me", txt);
    inp.value = '';

    // Bot logic
    if (txt.startsWith('/')) {
        const cmd = txt.split(' ')[0];
        const arg = txt.split(' ').slice(1).join(' ');

        if (cmd === '/help') addIRCMessage("System", "Commands: /nick [name], /whois, /slap [user], /clear", "gray");
        else if (cmd === '/clear') document.getElementById('irc-log').innerHTML = '';
        else if (cmd === '/nick') {
            if (arg) {
                const old = systemData.resume.name || "Guest";
                systemData.resume.name = arg;
                saveData();
                addIRCMessage("System", `Nickname changed to ${arg}`, "yellow");
            }
        }
        else if (cmd === '/slap') {
            const target = arg || "someone";
            addIRCMessage("*", "slaps " + target + " around a bit with a large trout", "cyan");
        }
    } else {
        // Random replies
        if (Math.random() > 0.7) {
            setTimeout(() => {
                const replies = ["Interesting...", "LOL", "AFK", "brb", ":)", "Does it run Doom?", "pwned"];
                const users = ["Neo", "Morpheus", "Trinity", "Cypher", "Guest84"];
                const u = users[Math.floor(Math.random() * users.length)];
                const r = replies[Math.floor(Math.random() * replies.length)];
                addIRCMessage(u, r, "lime");
            }, 1000 + Math.random() * 2000);
        }
    }
}

function addIRCMessage(user, msg, color) {
    const log = document.getElementById('irc-log');
    if (!log) return;
    const now = new Date().toTimeString().substr(0, 5);
    const div = document.createElement('div');
    const uColor = color || (user === "Me" ? "inherit" : "lime");
    const nameDisplay = user === "Me" && systemData.resume.name ? systemData.resume.name : user;
    div.innerHTML = `<span style="opacity:0.5;">[${now}]</span> <span style="font-weight:bold; color:${uColor}">&lt;${nameDisplay}&gt;</span> ${msg}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    playSfx(1200, 'square', 0.05, 0.05);
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "-header")) {
        document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
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
// #SECTION_DATA - Ініціалізація та збереження даних
// ═══════════════════════════════════════════════════════════════════════════════

/** systemData - Глобальне сховище даних додатка */

let systemData = {};
// ASCII DRAW STATE
let adBrush = '#';
let adMode = 'draw'; // draw, erase
let adGrid = [];
let adCx = 0; let adCy = 0; // Cursor pos
const adW = 40; const adH = 15;
const adCellSize = 16;
// QR STATE
let lastQRMatrix = null;
let lastQRFormat = 'png';
let lastQRSize = 256;
let lastQRText = '';
let pcScrollCleanup = null;

/** renderAsciiDraw - Рендерить інтерфейс малювання */
function renderAsciiDraw() {
    const v = document.getElementById('view');

    // Initialize empty grid if fresh
    if (adGrid.length === 0) {
        for (let y = 0; y < adH; y++) {
            let row = [];
            for (let x = 0; x < adW; x++) row.push(' ');
            adGrid.push(row);
        }
    }

    // Extended Palette
    let chars = ['#', '@', '%', '*', '+', '=', '-', '.', ':', '/', '\\', '$', '8', '0', '&',
        '█', '▀', '▄', '▌', '▐', '░', '▒', '▓', '■'];

    let toolsHtml = `<div style="margin-bottom:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button class="btn ${adMode === 'draw' ? 'active' : ''}" onclick="adSetMode('draw')">DRAW</button>
        <button class="btn ${adMode === 'erase' ? 'active' : ''}" onclick="adSetMode('erase')">ERASE</button>
        <button class="btn btn-red" onclick="adClear()">CLEAR</button>
        <br>
        <div style="border-left:1px solid var(--dim); padding-left:10px; display:flex; gap:2px; flex-wrap:wrap; max-width:600px;">
            ${chars.map(c => `<button class="btn btn-sm ${adBrush === c ? 'active' : ''}" style="padding:0 5px; min-width:25px;" onclick="adSetBrush('${c}')">${c}</button>`).join('')}
        </div>
        <button class="btn" style="margin-left:auto" onclick="saveAsciiArt()">SAVE</button>
    </div>`;

    let gridHtml = `<div id="ascii-canvas" style="display:inline-block; border:1px solid var(--dim); background:#000; cursor:crosshair; user-select:none; line-height:1; position:relative;" onmouseleave="adIsDrawing=false">`;

    for (let y = 0; y < adH; y++) {
        gridHtml += `<div class="ascii-row" style="display:flex;">`;
        for (let x = 0; x < adW; x++) {
            const isCursor = (x === adCx && y === adCy);
            const cursorStyle = isCursor ? 'background:var(--dim); outline:1px solid var(--text);' : '';
            gridHtml += `<div class="ascii-cell" data-x="${x}" data-y="${y}" onmousedown="adStart(this)" onmouseenter="adEnter(this)" style="width:${adCellSize}px; height:${adCellSize}px; display:flex; justify-content:center; align-items:center; font-family:'JetBrains Mono', monospace; font-size:${adCellSize}px; line-height:${adCellSize}px; ${cursorStyle}">${adGrid[y][x]}</div>`;
        }
        gridHtml += `</div>`;
    }
    gridHtml += `</div>
    <div style="margin-top:10px; font-size:0.8rem; opacity:0.7;">
        [Mouse]: Shift+Click=Pick, Drag=Paint. <br>
        [Keyboard]: Arrows/WASD=Move, Space/Enter=PaintChar, Backspace=Erase.
    </div>`;

    v.innerHTML = `<h2>ASCII_DRAW STUDIO</h2>${toolsHtml}${gridHtml}`;
}

let adIsDrawing = false;

window.adSetMode = function (m) { adMode = m; renderAsciiDraw(); }
window.adSetBrush = function (b) { adBrush = b; adMode = 'draw'; renderAsciiDraw(); }
window.adClear = function () {
    showConfirm('Clear canvas?').then((ok) => {
        if (ok) {
            adGrid = [];
            renderAsciiDraw();
            playSfx(100, 'sawtooth', 0.3);
        }
    });
}

window.adStart = function (el) {
    if (event.shiftKey) {
        // Picker
        adBrush = el.innerText;
        if (adBrush === '' || adBrush === ' ') adBrush = '#';
        adMode = 'draw';
        renderAsciiDraw();
        return;
    }
    adIsDrawing = true;
    adPaint(el);
}
window.adEnter = function (el) {
    if (adIsDrawing) adPaint(el);
}
document.addEventListener('mouseup', () => { adIsDrawing = false; });

function adPaint(el) {
    const x = parseInt(el.dataset.x);
    const y = parseInt(el.dataset.y);
    adApply(x, y);
}

function adApply(x, y) {
    if (x < 0 || x >= adW || y < 0 || y >= adH) return;
    const char = adMode === 'erase' ? ' ' : adBrush;
    if (adGrid[y][x] !== char) {
        adGrid[y][x] = char;
        // Optimization: update DOM directly instead of full rerender to be faster, but renderAsciiDraw is safer for consistency
        // Let's just do renderAsciiDraw for now, it's small enough 40x15=600 elements
        renderAsciiDraw();
        playSfx(800 + Math.random() * 200, 'sine', 0.02, 0.01);
    }
}

// DRAW KEYBOARD HANDLING
document.addEventListener('keydown', (e) => {
    // Check if Draw is active
    if (!document.getElementById('ascii-canvas')) return;

    // Prevent default scrolling for Space/Arrows if canvas focused? 
    // We just check if nav buttons aren't focused.
    if (document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'INPUT') return;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (adCy > 0) adCy--; renderAsciiDraw(); }
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { if (adCy < adH - 1) adCy++; renderAsciiDraw(); }
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (adCx > 0) adCx--; renderAsciiDraw(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (adCx < adW - 1) adCx++; renderAsciiDraw(); }
    else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        adApply(adCx, adCy);
    }
    else if (e.key === 'Backspace') {
        const prevMode = adMode;
        adMode = 'erase';
        adApply(adCx, adCy);
        adMode = prevMode;
    }
});

window.saveAsciiArt = async function () {
    const name = await showPrompt({ title: 'Save ASCII Art', placeholder: 'Untitled' });
    if (!name) return;

    const artStr = adGrid.map(row => row.join('')).join('\n');

    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    systemData.gallery.ASCII_ART.push({
        n: name,
        d: dateStr,
        a: artStr
    });

    saveData();
    showToast("Saved to /gallery > ASCII_ART", 'success');
    playSfx(600, 'square', 0.2);
}
/**
 * initData - Ініціалізує дані з localStorage або встановлює default
 * Виконує міграцію даних при оновленні версії
 */
function initData() {
    const saved = localStorage.getItem('vvs_system_data_v15'); // Version bump
    if (saved) {
        try {
            systemData = JSON.parse(saved);
            // Migration checks
            if (!systemData.home) systemData.home = defaultData.home;
            if (!systemData.homeLinks) systemData.homeLinks = defaultData.homeLinks;
            systemData.homeLinks.profiles.forEach(p => { if (typeof p.password === 'undefined') p.password = ''; });

            if (!systemData.glitch) systemData.glitch = defaultData.glitch;
            if (!systemData.gallery.ASCII_ART) systemData.gallery.ASCII_ART = defaultData.gallery.ASCII_ART;
            if (!systemData.resume.summary) systemData.resume.summary = defaultData.resume.summary;
            if (!systemData.resume.titles) systemData.resume.titles = defaultData.resume.titles;
            if (!systemData.resume.templates) systemData.resume.templates = defaultData.resume.templates;

            if (!systemData.resume.education) systemData.resume.education = defaultData.resume.education;
            // SCREENSAVER DATA
            if (!systemData.screensaver) systemData.screensaver = { enabled: true, timeout: 60, type: 'matrix' };

            if (!systemData.resume.languages) systemData.resume.languages = defaultData.resume.languages;
            if (!systemData.resume.rnd) systemData.resume.rnd = defaultData.resume.rnd;
            if (typeof systemData.resume.rnd === 'string') systemData.resume.rnd = [systemData.resume.rnd];

            if (!systemData.about) systemData.about = JSON.parse(JSON.stringify(defaultData.about));
            if (!systemData.about.languages || !Array.isArray(systemData.about.languages)) {
                systemData.about.languages = JSON.parse(JSON.stringify(defaultData.about.languages));
                if (systemData.about.uk && systemData.about.uk !== defaultData.about.languages.find(l => l.code === 'uk').text) {
                    const uk = systemData.about.languages.find(l => l.code === 'uk'); if (uk) uk.text = systemData.about.uk;
                }
                if (systemData.about.en && systemData.about.en !== defaultData.about.languages.find(l => l.code === 'en').text) {
                    const en = systemData.about.languages.find(l => l.code === 'en'); if (en) en.text = systemData.about.en;
                }
            }
            if (!systemData.about.activeLang) systemData.about.activeLang = 'uk';

            if (typeof systemData.about.showPhoto === 'undefined') systemData.about.showPhoto = false;
            if (typeof systemData.about.photo === 'undefined') systemData.about.photo = defaultData.about.photo;

            if (!Array.isArray(systemData.obsidian.cats)) systemData.obsidian.cats = defaultData.obsidian.cats;
            if (!systemData.obsidian.catAuth) systemData.obsidian.catAuth = {};

            if (!systemData.resume.phone) systemData.resume.phone = defaultData.resume.phone;
            if (!systemData.resume.photo) systemData.resume.photo = defaultData.resume.photo;
            if (!systemData.contacts) systemData.contacts = defaultData.contacts;
            if (!systemData.friends) systemData.friends = defaultData.friends;
            if (!systemData.hireMe) systemData.hireMe = defaultData.hireMe;
            if (!systemData.menuVisibility) systemData.menuVisibility = defaultData.menuVisibility;

            if (!systemData.password) systemData.password = defaultData.password;
            if (!systemData.games) systemData.games = defaultData.games;
            if (!systemData.picoCarts) systemData.picoCarts = JSON.parse(JSON.stringify(defaultData.picoCarts));
            if (typeof systemData.todoEditable === 'undefined') systemData.todoEditable = defaultData.todoEditable;

            if (!systemData.effects) systemData.effects = JSON.parse(JSON.stringify(defaultData.effects));
            else {
                systemData.effects = Object.assign({}, JSON.parse(JSON.stringify(defaultData.effects)), systemData.effects);
            }

            if (!systemData.home.logoText) systemData.home.logoText = defaultData.home.logoText;
            if (!systemData.home.browserTitle) systemData.home.browserTitle = defaultData.home.browserTitle || systemData.home.logoText.replace(':~$', '');

            if (!systemData.themes) systemData.themes = JSON.parse(JSON.stringify(defaultData.themes));
            if (!systemData.themes.adminTriggerTheme) systemData.themes.adminTriggerTheme = 'mix-eva';
            if (!systemData.themes.font) systemData.themes.font = 'modern';

            updateCustomThemeCSS();

            const savedTheme = localStorage.getItem('vvs_theme_v13');
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                setTheme(systemData.themes.defaultId);
            }
            applyFontChoice(systemData.themes.font);

        } catch (e) { systemData = JSON.parse(JSON.stringify(defaultData)); }
    } else {
        systemData = JSON.parse(JSON.stringify(defaultData));
        setTheme(systemData.themes.defaultId);
        applyFontChoice(systemData.themes.font);
    }
    applyMenuVisibility();
    applyEffects();
    resetIdleTimer();
    renderDynamicLogo();
    dataReady = true;
    if (pendingNavId) {
        const next = pendingNavId; pendingNavId = null; nav(next);
    }
}

/** saveData - Зберігає systemData в localStorage */
function saveData() { localStorage.setItem('vvs_system_data_v15', JSON.stringify(systemData)); }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_MENU - Видимість меню
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * applyMenuVisibility - Застосовує налаштування видимості пунктів меню
 * Керує відображенням секцій: work, notes, blog, todo, gallery, game
 */

// --- MENU VISIBILITY LOGIC ---
function applyMenuVisibility() {
    const mv = systemData.menuVisibility;
    const toggle = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'block' : 'none';

        // Also toggle SVG icons if they exist in buttons
        // Note: New request asked for toggling icons GLOBALLY via Themes, not Admin per Item.
        // Admin controls ITEM visibility. Themes control ICON visibility. Valid.
    };

    toggle('nav-work', mv.work);
    toggle('nav-obsidian', mv.notes);
    toggle('nav-blog', mv.blog);
    toggle('nav-todo', mv.todo);
    toggle('nav-gallery', mv.gallery);
    toggle('nav-game', mv.game);
    // New ones:
    toggle('nav-draw', mv.draw !== false); // default true
    toggle('nav-pc', mv.pc !== false);
    toggle('nav-saver', mv.saver !== false);
}

/**
 * hexToRgba - Конвертує HEX колір у RGBA формат
 * @param {string} hex - HEX колір (#RRGGBB)
 * @param {number} alpha - Прозорість (0.0 - 1.0)
 * @returns {string} RGBA рядок
 */
// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_THEMES - Система тем оформлення
// ═══════════════════════════════════════════════════════════════════════════════

/** themesList - Список доступних тем оформлення */
const themesList = [
    { id: 'amber', name: 'Amber Classic', c: '#ffb000' },
    { id: 'amber-light', name: 'Amber Day', c: '#ffb000' },
    { id: 'green', name: 'Matrix Green', c: '#00ff41' },
    { id: 'green-light', name: 'Eco Light', c: '#00ff41' },
    { id: 'teal', name: 'Cyber Teal', c: '#00ffff' },
    { id: 'teal-light', name: 'Aqua', c: '#00ffff' },
    { id: 'eva', name: 'EVA-01', c: '#a7ff00' },
    { id: 'mix-eva', name: 'Mint Evangelion', c: '#57f2cc' },
    { id: 'bw', name: 'Mono Noir', c: '#ffffff' },
    { id: 'paper', name: 'E-Ink', c: '#000000' },
    { id: 'gruvbox-dark', name: 'Gruvbox Dark', c: '#fabd2f' },
    { id: 'gruvbox-light', name: 'Gruvbox Light', c: '#3c3836' },
    { id: 'kanagawa-dark', name: 'Kanagawa', c: '#DCA561' },
    { id: 'kanagawa-light', name: 'Lotus', c: '#54546D' },
    { id: 'zorin-dark', name: 'Zorin Dark', c: '#00d084' },
    { id: 'zorin-light', name: 'Zorin Light', c: '#176f4c' }
];

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateCustomThemeCSS() {
    let css = '';
    systemData.themes.custom.forEach(t => {
        const dim = hexToRgba(t.text, 0.2);
        css += `.theme-${t.id} { --bg: ${t.bg}; --text: ${t.text}; --dim: ${dim}; --invert: ${t.bg}; }\n`;
    });
    document.getElementById('custom-theme-style').innerHTML = css;
}

/** toggleThemeMenu - Відкриває/закриває меню тем */
function toggleThemeMenu() {
    const pop = document.getElementById('theme-popup');
    const isOpen = pop.classList.contains('show');
    if (isOpen) {
        pop.classList.remove('show');
        pop.style.display = '';
        return;
    }

    // BUILD MENU
    let html = '';
    themesList.forEach(t => {
        html += `<div class="theme-item" onclick="setTheme('${t.id}')">
            <div class="color-preview" style="background:${t.c}"></div> ${t.name}
        </div>`;
    });

    // EFFECTS SECTION
    const fx = systemData.effects || { glow: false, flicker: false, scanline: false, svgGlow: true, screenPulse: false };
    const fxBtn = (key, label) => {
        const on = !!fx[key];
        const indicator = on ? '✔' : '✖';
        return `<button class="btn btn-sm ${on ? 'active' : 'btn-ghost'}" onclick="toggleEffect('${key}')">${label}: ${indicator}</button>`;
    };

    const fontChoice = (systemData.themes && systemData.themes.font) ? systemData.themes.font : 'modern';
    html += `<div class="theme-extras">
        <div class="theme-toggle-row">
            ${fxBtn('glow', 'Glow')}
            ${fxBtn('flicker', 'Flicker')}
            ${fxBtn('scanline', 'Scanlines')}
            ${fxBtn('svgGlow', 'SVG Icons')}
            ${fxBtn('screenPulse', 'Screen Pulse')}
            <button class="btn btn-sm ${systemData.home.showIcons !== false ? 'active' : 'btn-ghost'}" onclick="toggleIcons()">Icons: ${systemData.home.showIcons !== false ? '✔' : '✖'}</button>
        </div>
        <div class="font-switcher">
            <div style="font-size:0.75rem; opacity:0.75;">Font</div>
            <button class="btn btn-sm ${fontChoice === 'modern' ? 'active' : ''}" onclick="setFontChoice('modern')">Mono</button>
            <button class="btn btn-sm ${fontChoice === 'pixel' ? 'active' : ''}" onclick="setFontChoice('pixel')">Pixel</button>
        </div>
    </div>`;

    pop.innerHTML = html;
    pop.style.display = '';
    pop.classList.add('show');
}

/**
 * setTheme - Встановлює тему оформлення
 * @param {string} t - ID теми
 */
function setTheme(t) {
    document.body.className = `theme-${t}`;
    playSfx(1000, 'sine', 0.05);
    localStorage.setItem('vvs_theme_v13', t);

    // USE CUSTOM ADMIN TRIGGER THEME
    if (t === systemData.themes.adminTriggerTheme) {
        mintEvaClicks++; checkAdminUnlock();
    }
    if (t === 'eva') {
        evaCount++;
        if (evaCount >= 5) {
            const sound = new Audio('xero.wav');
            sound.play().catch(e => console.log(e));
            evaCount = 0;
        }
    }
    document.getElementById('theme-popup').classList.remove('show');
}

/** toggleEffect - Перемикає візуальні ефекти */
window.toggleEffect = function (type) {
    if (!systemData.effects) systemData.effects = { glow: false, flicker: false, scanline: false, svgGlow: true, screenPulse: false };
    systemData.effects[type] = !systemData.effects[type];
    applyEffects();
    saveData();
}

/** applyEffects - Застосовує класи ефектів до body */
function applyEffects() {
    if (!systemData.effects) return;
    document.body.classList.toggle('fx-glow', systemData.effects.glow);
    document.body.classList.toggle('fx-flicker', systemData.effects.flicker);
    document.body.classList.toggle('fx-scanline', systemData.effects.scanline);
    document.body.classList.toggle('fx-svg', systemData.effects.svgGlow !== false);
    document.body.classList.toggle('fx-screen-pulse', !!systemData.effects.screenPulse);

    // Apply Icons (OnInit)
    document.body.classList.toggle('no-icons', systemData.home.showIcons === false);
}

/** applyFontChoice - Застосовує вибір шрифту до документа */
function applyFontChoice(fontId) {
    const target = fontId === 'pixel'
        ? "'Press Start 2P', 'VT323', 'Courier New', monospace"
        : "'JetBrains Mono', 'Fira Code', monospace";
    document.documentElement.style.setProperty('--font-main', target);
    document.body.classList.toggle('pixel-font', fontId === 'pixel');
}

/** setFontChoice - Змінює вибір шрифту в темах */
window.setFontChoice = function (fontId) {
    if (!systemData.themes) systemData.themes = { font: 'modern', defaultId: 'amber', custom: [] };
    systemData.themes.font = fontId;
    applyFontChoice(fontId);
    saveData();
};

window.toggleIcons = function (show) {
    if (!systemData.home) systemData.home = {};
    const next = typeof show === 'boolean' ? show : systemData.home.showIcons === false ? true : false;
    systemData.home.showIcons = next;
    saveData();
    document.body.classList.toggle('no-icons', !next);
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_KEYBOARD - Keyboard Navigation
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
    // If typing in input, ignore nav keys (except Esc)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
    }

    // CLOSE OVERLAYS
    if (e.key === 'Escape') {
        // Close Theme Menu
        const pop = document.getElementById('theme-popup');
        if (pop) { pop.classList.remove('show'); pop.style.display = ''; }
        // Close Gallery Overlay
        const overlay = document.querySelector('div[style*="position:fixed; top:0; left:0; width:100%; height:100%"]');
        if (overlay) overlay.click();
        return;
    }

    const modalOpen = document.querySelector('.modal-window');
    const gameActive = (() => { const area = document.getElementById('game-area'); return area && area.style.display !== 'none'; })();
    const drawActive = !!document.getElementById('ascii-canvas');
    if (modalOpen || gameActive || drawActive) return;

    // MENU NAV
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const navBtns = Array.from(document.querySelectorAll('nav button')).filter(b => b.style.display !== 'none');
        const currentFocus = document.activeElement;
        let idx = navBtns.indexOf(currentFocus);

        if (idx === -1) {
            // Focus first active nav button
            const active = document.querySelector('nav button.active');
            idx = navBtns.indexOf(active);
            if (idx === -1) idx = 0;
        } else {
            if (e.key === 'ArrowDown') idx = (idx + 1) % navBtns.length;
            else idx = (idx - 1 + navBtns.length) % navBtns.length;
        }

        navBtns[idx].focus();
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_SCREENSAVER - Screensavers
// ═══════════════════════════════════════════════════════════════════════════════

let ssTimer = null;
let ssActive = false;
let ssCanvas = null;
let ssCtx = null;
let ssReq = null;

function resetIdleTimer() {
    if (ssActive) stopScreensaver();
    clearTimeout(ssTimer);
    if (systemData.screensaver && systemData.screensaver.enabled) {
        ssTimer = setTimeout(startScreensaver, systemData.screensaver.timeout * 1000);
    }
}

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);

window.startScreensaver = function (previewType) {
    if (ssActive) stopScreensaver();
    if (!systemData.screensaver) systemData.screensaver = { enabled: true, timeout: 60, type: 'matrix' };
    const type = previewType || (systemData.screensaver ? systemData.screensaver.type : 'matrix');
    systemData.screensaver.type = type;
    saveData();

    if (ssReq) cancelAnimationFrame(ssReq);

    let overlay = document.getElementById('screensaver-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'screensaver-overlay';
        document.body.appendChild(overlay);
        overlay.onclick = stopScreensaver;
    }

    overlay.style.display = 'flex';
    overlay.innerHTML = '<canvas id="screensaver-canvas"></canvas>';
    ssCanvas = overlay.querySelector('#screensaver-canvas');
    ssCtx = ssCanvas ? ssCanvas.getContext('2d') : null;
    ssCanvas.width = window.innerWidth;
    ssCanvas.height = window.innerHeight;

    if (!ssCanvas || !ssCtx) {
        showToast('Screensaver canvas unavailable', 'error');
        return;
    }

    ssActive = true;

    if (type === 'matrix') runMatrixSS();
    else if (type === 'fire') runFireSS();
    else if (type === 'pipes') runPipesSS();
    else if (type === 'dvd') runDvdSS();
    else if (type === 'trees') runTreesSS();
}

window.stopScreensaver = function () {
    ssActive = false;
    cancelAnimationFrame(ssReq);
    const overlay = document.getElementById('screensaver-overlay');
    if (overlay) overlay.style.display = 'none';
};

window.addEventListener('resize', () => {
    if (ssActive && ssCanvas) {
        ssCanvas.width = window.innerWidth;
        ssCanvas.height = window.innerHeight;
    }
});

function runMatrixSS() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
    const fontSize = 16;
    const columns = ssCanvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    function draw() {
        if (!ssActive) return;
        ssCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ssCtx.fillRect(0, 0, ssCanvas.width, ssCanvas.height);
        ssCtx.fillStyle = "#0F0";
        ssCtx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ssCtx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > ssCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
        ssReq = requestAnimationFrame(draw);
    }
    draw();
}

function runFireSS() {
    const w = 100; const h = 60;
    const fw = ssCanvas.width / w; const fh = ssCanvas.height / h;
    const firePixels = new Array(w * h).fill(0);
    const palette = ["#000", "#070707", "#1f0707", "#2f0f07", "#470f07", "#571707", "#671f07", "#771f07", "#8f2707", "#9f2f07", "#af3f07", "#bf4707", "#c74707", "#DF4F07", "#DF5707", "#DF5707", "#D75F07", "#D7670F", "#cf6f0f", "#cf770f", "#cf7f0f", "#CF8717", "#C78717", "#C78F17", "#C7971F", "#BF9F1F", "#BF9F1F", "#BFA727", "#BFA727", "#BFAF2F", "#B7AF2F", "#B7B72F", "#B7B737", "#CFCF6F", "#DFDF9F", "#EFEFC7", "#FFFFFF"];

    function draw() {
        if (!ssActive) return;
        // Calc
        for (let x = 0; x < w; x++) {
            for (let y = 1; y < h; y++) {
                const src = y * w + x;
                const decay = Math.floor(Math.random() * 3);
                const dst = src - w + 1; // wind
                if (dst >= 0) firePixels[dst < 0 ? 0 : dst] = Math.max(0, firePixels[src] - (decay & 1));
            }
        }
        // Seed
        for (let x = 0; x < w; x++) {
            if (Math.random() > 0.5) firePixels[(h - 1) * w + x] = 36;
            else firePixels[(h - 1) * w + x] = Math.max(0, firePixels[(h - 1) * w + x] - 1);
        }

        // Render
        ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = firePixels[y * w + x];
                ssCtx.fillStyle = palette[idx];
                ssCtx.fillRect(x * fw, y * fh, fw + 1, fh + 1);
            }
        }
        ssReq = requestAnimationFrame(draw);
    }
    draw();
}

function runDvdSS() {
    let x = 10, y = 10, dx = 3, dy = 3;
    const txt = "DVD";
    ssCtx.font = "bold 60px monospace";

    function draw() {
        if (!ssActive) return;
        ssCtx.fillStyle = "rgba(0,0,0,0.2)";
        ssCtx.fillRect(0, 0, ssCanvas.width, ssCanvas.height);

        // Bounce
        x += dx; y += dy;
        if (x + 100 > ssCanvas.width || x < 0) dx = -dx;
        if (y > ssCanvas.height || y < 50) dy = -dy;

        ssCtx.fillStyle = `hsl(${Date.now() % 360}, 100%, 50%)`;
        ssCtx.fillText(txt, x, y);

        ssReq = requestAnimationFrame(draw);
    }
    draw();
}

// Pipes placeholder
function runPipesSS() {
    ssCtx.fillStyle = "#000"; ssCtx.fillRect(0, 0, ssCanvas.width, ssCanvas.height);
    let x = ssCanvas.width / 2, y = ssCanvas.height / 2;
    let dir = 0; // 0:up, 1:right, 2:down, 3:left

    function draw() {
        if (!ssActive) return;
        if (Math.random() < 0.05) dir = Math.floor(Math.random() * 4);
        ssCtx.fillStyle = `hsl(${Date.now() / 10 % 360}, 100%, 50%)`;
        const step = 5;
        if (dir === 0) y -= step; else if (dir === 1) x += step; else if (dir === 2) y += step; else x -= step;

        if (x < 0) x = ssCanvas.width; if (x > ssCanvas.width) x = 0;
        if (y < 0) y = ssCanvas.height; if (y > ssCanvas.height) y = 0;

        ssCtx.fillRect(x, y, step, step);
        ssReq = requestAnimationFrame(draw);
    }
    draw();
}

function runTreesSS() {
    const maxDepth = 10;

    function drawBranch(x, y, len, angle, depth) {
        if (depth === 0) return;

        const x2 = x + Math.cos(angle * Math.PI / 180) * len;
        const y2 = y + Math.sin(angle * Math.PI / 180) * len;

        ssCtx.beginPath();
        ssCtx.moveTo(x, y);
        ssCtx.lineTo(x2, y2);
        ssCtx.strokeStyle = `hsl(${(depth / maxDepth) * 120}, 100%, 50%)`;
        ssCtx.lineWidth = depth;
        ssCtx.stroke();

        // requestAnimationFrame for "animated" growth isn't easy with recursive stack
        // So we just draw one static tree per frame or something?
        // Let's do a "growing" tree effect by redrawing slightly different each time
    }

    // Actually, let's just draw random trees popping up
    let trees = [];

    function reset() {
        trees = [];
        ssCtx.fillStyle = "#000";
        ssCtx.fillRect(0, 0, ssCanvas.width, ssCanvas.height);
    }
    reset();

    function grow(t) {
        if (t.done) return;
        // Draw segment
        const x2 = t.x + Math.cos(t.a) * t.len;
        const y2 = t.y + Math.sin(t.a) * t.len;

        ssCtx.beginPath();
        ssCtx.moveTo(t.x, t.y);
        ssCtx.lineTo(x2, y2);
        ssCtx.strokeStyle = `hsl(${t.d * 10}, 70%, 50%)`;
        ssCtx.lineWidth = t.w;
        ssCtx.stroke();

        t.x = x2; t.y = y2; t.len *= 0.99;

        if (t.len < 2 || t.w < 0.5) { t.done = true; return; }

        // Branch chance
        if (Math.random() < 0.05) {
            trees.push({ x: t.x, y: t.y, a: t.a - 0.4, len: t.len * 0.8, w: t.w * 0.7, d: t.d + 1, done: false });
            trees.push({ x: t.x, y: t.y, a: t.a + 0.4, len: t.len * 0.8, w: t.w * 0.7, d: t.d + 1, done: false });
            t.done = true;
        }
    }

    // Plant initial seed
    trees.push({ x: ssCanvas.width / 2, y: ssCanvas.height, a: -Math.PI / 2, len: 10, w: 10, d: 0, done: false });

    function draw() {
        if (!ssActive) return;
        // Fade bg
        ssCtx.fillStyle = "rgba(0,0,0,0.02)";
        ssCtx.fillRect(0, 0, ssCanvas.width, ssCanvas.height);

        if (Math.random() < 0.02) {
            trees.push({ x: Math.random() * ssCanvas.width, y: ssCanvas.height, a: -Math.PI / 2 + (Math.random() - 0.5), len: 5 + Math.random() * 5, w: 5 + Math.random() * 5, d: 0, done: false });
        }

        trees.forEach(grow);
        trees = trees.filter(t => !t.done);

        ssReq = requestAnimationFrame(draw);
    }
    draw();
}

function renderScreensaverMenu() {
    const v = document.getElementById('view');
    const current = (systemData.screensaver && systemData.screensaver.type) || 'matrix';
    const timeout = systemData.screensaver && systemData.screensaver.timeout ? systemData.screensaver.timeout : 60;
    const list = [
        { id: 'matrix', name: 'Matrix Rain', desc: 'Green code rain inspired by classic terminals.' },
        { id: 'fire', name: 'Pixel Fire', desc: 'Retro fire simulation with palette cycling.' },
        { id: 'pipes', name: 'Pipes', desc: 'Colorful wandering pipes across the screen.' },
        { id: 'dvd', name: 'DVD', desc: 'Bouncing DVD logo with rainbow tints.' },
        { id: 'trees', name: 'Fractal Trees', desc: 'Procedural trees growing across the canvas.' }
    ];

    const cards = list.map(l => `<label class="saver-card ${current === l.id ? 'active' : ''}">
        <input type="radio" name="saver-type" value="${l.id}" ${current === l.id ? 'checked' : ''}>
        <div class="saver-name">${l.name}</div>
        <div class="saver-desc">${l.desc}</div>
        <div class="saver-badge">${l.id}</div>
    </label>`).join('');

    v.innerHTML = `<h2>SCREENSAVER</h2>
        <div class="saver-grid">${cards}</div>
        <div class="saver-actions">
            <label class="opt-check">
                <input type="checkbox" id="saver-enabled" ${(systemData.screensaver && systemData.screensaver.enabled !== false) ? 'checked' : ''}>
                Enable idle trigger (${timeout}s)
            </label>
            <div class="saver-action-buttons">
                <button class="btn" onclick="previewSaver()">PREVIEW</button>
                <button class="btn btn-green" onclick="applySaverChoice()">APPLY & START</button>
            </div>
        </div>`;

    v.querySelectorAll('.saver-card input').forEach(inp => {
        inp.addEventListener('change', () => {
            v.querySelectorAll('.saver-card').forEach(c => c.classList.remove('active'));
            inp.closest('.saver-card').classList.add('active');
        });
    });
}

window.previewSaver = function () {
    const typeEl = document.querySelector('input[name="saver-type"]:checked');
    const type = typeEl && typeEl.value ? typeEl.value : 'matrix';
    startScreensaver(type);
};

window.applySaverChoice = function () {
    const typeEl = document.querySelector('input[name="saver-type"]:checked');
    const type = typeEl && typeEl.value ? typeEl.value : 'matrix';
    if (!systemData.screensaver) systemData.screensaver = { enabled: true, timeout: 60, type: 'matrix' };
    systemData.screensaver.type = type;
    const saverToggle = document.getElementById('saver-enabled');
    systemData.screensaver.enabled = saverToggle ? saverToggle.checked !== false : true;
    saveData();
    resetIdleTimer();
    startScreensaver(type);
    showToast(`Screensaver ${type.toUpperCase()} launched`, 'success');
};

// ═══════════════════════════════════════════════════════════════════════════════
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
    else if (id === 'pc') renderAboutPC();
    else if (id === 'screensaver') renderScreensaverMenu();
    else if (id === 'game') renderGameMenu();
    else if (id === 'contact') renderLinks();
    else if (id === 'admin') renderAdmin();
}

/** renderAboutPC - Виводить статистику комп'ютера з віджетами */
function renderAboutPC() {
    const v = document.getElementById('view');
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const cores = navigator.hardwareConcurrency || '?';
    const mem = navigator.deviceMemory || '?';

    // Physics Container
    let physicsHtml = `
    <div id="pc-physics-world" style="height:150px; border:1px solid var(--text); position:relative; overflow:hidden; margin-bottom:20px; background:rgba(0,0,0,0.2);">
        <div style="position:absolute; top:5px; left:5px; opacity:0.6; font-size:0.7rem;">[ SCROLLME: UP=PORTAL, DOWN=CRASH ]</div>
        <div id="pc-avatar" style="font-size:3rem; position:absolute; top:50px; left:50%; transform:translate(-50%, 0); will-change: transform;">💻</div>
        <div id="pc-portal" style="font-size:3rem; position:absolute; top:-40px; left:50%; transform:translateX(-50%) rotate(180deg); color:cyan; display:none;">🌀</div>
        <div id="pc-fire" style="font-size:3rem; position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); color:orange; display:none;">🔥</div>
    </div>`;

    // Code Playground
    let codeHtml = `
    <div class="work-card draggable-card" style="min-width:300px;">
        <div class="card-header" style="cursor:grab; border-bottom:1px dashed var(--dim); margin-bottom:10px; font-weight:bold;">:: JS_PLAYGROUND ::</div>
        <textarea id="code-in" style="width:100%; height:80px; background:rgba(0,0,0,0.3); color:var(--text); border:1px solid var(--dim); font-family:monospace; padding:5px;" placeholder="alert('Hello');"></textarea>
        <button class="btn btn-sm" onclick="runPlayground()">EXECUTE</button>
        <div id="code-out" style="margin-top:5px; font-size:0.8rem; color: #0f0;"></div>
    </div>`;

    v.innerHTML = `<h2>SYSTEM_MONITOR_V2</h2>
    ${physicsHtml}
    
    <div id="pc-widgets-area" style="position:relative; height:600px; border:1px dashed var(--dim); padding:10px; overflow:hidden;">
        <div class="work-card draggable-card" style="position:absolute; top:10px; left:10px; width:250px;">
            <div class="card-header" style="cursor:grab; border-bottom:1px dashed var(--dim); margin-bottom:5px; font-weight:bold;">HOST_INFO</div>
            <div>PLATFORM: ${platform}</div>
            <div>CORES: ${cores}</div>
            <div>RAM: ~${mem} GB</div>
        </div>
        
        <div class="work-card draggable-card" style="position:absolute; top:10px; left:280px; width:250px;">
            <div class="card-header" style="cursor:grab; border-bottom:1px dashed var(--dim); margin-bottom:5px; font-weight:bold;">NETWORK</div>
            <div>STATUS: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</div>
            <div>DL: ${navigator.connection ? navigator.connection.downlink + 'Mbps' : '?'}</div>
        </div>
        
        <div class="work-card draggable-card" style="position:absolute; top:150px; left:10px; width:300px;">
             <div class="card-header" style="cursor:grab; border-bottom:1px dashed var(--dim); margin-bottom:5px; font-weight:bold;">PROCESS_LIST</div>
             <div class="scroll-area" style="height:100px; font-size:0.7rem;">
                <table style="width:100%">${generateFakeProcesses()}</table>
             </div>
        </div>
        
        <div style="position:absolute; top:150px; left:330px;">
            ${codeHtml}
        </div>
    </div>`;

    initDraggables();
    initPhysics();
}

// PHYSICS
function initPhysics() {
    const av = document.getElementById('pc-avatar');
    const port = document.getElementById('pc-portal');
    const fire = document.getElementById('pc-fire');
    if (!av) return;

    const main = document.querySelector('main');
    if (!main) return;

    let lastScroll = main.scrollTop;
    let offset = 0;
    let ticking = false;

    const applyMotion = () => {
        ticking = false;
        if (!document.getElementById('pc-avatar') || !port || !fire) {
            return;
        }

        const diff = main.scrollTop - lastScroll;
        lastScroll = main.scrollTop;
        offset += diff * 1.5;

        const currentPos = 50 + offset;
        av.style.transform = `translate(-50%, ${offset}px)`;

        if (currentPos < -20) {
            port.style.display = 'block';
            port.style.transform = 'translate(-50%, 10px) rotate(180deg)';
            if (currentPos < -50) {
                playSfx(1000, 'sawtooth', 0.2);
                offset = 90; // 50 base + 90 => 140px
                av.style.transform = `translate(-50%, ${offset}px)`;
                port.style.display = 'none';
            }
        } else {
            port.style.display = 'none';
        }

        if (currentPos > 140) {
            fire.style.display = 'block';
            fire.style.transform = 'translate(-50%, -10px)';
            if (currentPos > 170) {
                playSfx(100, 'noise', 0.3);
                av.innerText = '💥';
                setTimeout(() => { av.innerText = '💻'; offset = 0; av.style.transform = 'translate(-50%, 0px)'; fire.style.display = 'none'; }, 1000);
            }
        } else {
            fire.style.display = 'none';
        }
    };

    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(applyMotion);
    };

    main.addEventListener('scroll', onScroll, { passive: true });
    pcScrollCleanup = () => {
        main.removeEventListener('scroll', onScroll);
    };
}

// DRAGGABLE
function initDraggables() {
    const cards = document.querySelectorAll('.draggable-card');
    cards.forEach(c => {
        const header = c.querySelector('.card-header');
        if (!header) return;

        header.onmousedown = function (e) {
            e.preventDefault();
            let pos3 = e.clientX;
            let pos4 = e.clientY;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;

            // Bring to front
            c.style.zIndex = 100;

            function elementDrag(e) {
                e.preventDefault();
                let pos1 = pos3 - e.clientX;
                let pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                c.style.top = (c.offsetTop - pos2) + "px";
                c.style.left = (c.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                c.style.zIndex = '';
            }
        };
    });
}

// PLAYGROUND
window.runPlayground = function () {
    const code = document.getElementById('code-in').value;
    const out = document.getElementById('code-out');
    try {
        const res = eval(code);
        out.innerText = ">> " + res;
        playSfx(600);
    } catch (e) {
        out.innerText = "!! " + e.message;
        out.style.color = 'red';
        playSfx(100, 'sawtooth');
    }
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
        let label = contactBtn.querySelector('.nav-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'nav-label';
            label.textContent = ' /link';
            contactBtn.appendChild(label);
        } else {
            label.textContent = ' /link';
        }
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
// #SECTION_WORK - Робочі інструменти
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderWork - Рендерить сторінку робочих інструментів
 * Включає генератор паролів та транслітерацію UA↔EN
 */
function renderWork() {
    const v = document.getElementById('view');
    const rememberedQR = lastQRText || '';
    v.innerHTML = `
        <h2>WORK_TOOLS</h2>
        <div class="work-grid">
            <div class="work-card">
                <h3>SECURE_PASS_GEN</h3>
                <div id="pass-out" class="pass-result">...</div>
                <div class="opts-grid">
                    <label class="opt-check"><input type="checkbox" id="p-upper" checked> A-Z</label>
                    <label class="opt-check"><input type="checkbox" id="p-nums" checked> 0-9</label>
                    <label class="opt-check"><input type="checkbox" id="p-syms"> !@#</label>
                    <label class="opt-check"><input type="checkbox" id="p-phrase"> PHRASE</label>
                </div>
                <div class="form-group" style="margin-bottom:10px;">
                    <label style="font-size:0.8rem">Length: <span id="p-len-val">16</span></label>
                    <input type="range" id="p-len" min="8" max="64" value="16" style="width:100%" oninput="document.getElementById('p-len-val').innerText=this.value">
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn btn-green" onclick="generatePass()">GENERATE</button>
                    <button class="btn" onclick="copyPass()">COPY</button>
                </div>
            </div>

            <div class="work-card">
                <h3>QR CODE GENERATOR</h3>
                <div class="form-group">
                    <label>Text / URL <span style="opacity:0.6; font-size:0.8rem;">(up to 5KB, paged)</span></label>
                    <textarea id="qr-text" class="translit-area" style="height:80px;" maxlength="5120" placeholder="https://example.com" oninput="autoPreviewQR(); document.getElementById('qr-limit').innerText=this.value.length + '/5120';"></textarea>
                    <div id="qr-limit" style="font-size:0.8rem; opacity:0.6; text-align:right;">0/5120</div>
                </div>
                <div class="form-group" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <label class="opt-check">Size:
                        <input type="range" id="qr-size" min="120" max="420" value="256" oninput="document.getElementById('qr-size-val').innerText=this.value; autoPreviewQR();">
                        <span id="qr-size-val">256</span>px
                    </label>
                    <label class="opt-check">Format:
                        <select id="qr-format" onchange="autoPreviewQR()"><option value="png">PNG</option><option value="svg">SVG</option></select>
                    </label>
                    <div class="muted" id="qr-page-info" style="margin-left:auto;">SINGLE QR</div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
                    <button class="btn" onclick="generateQR()">GENERATE</button>
                    <button class="btn" onclick="downloadQR()">DOWNLOAD</button>
                    <button class="btn btn-sm" onclick="shiftQRPage(-1)">PREV</button>
                    <button class="btn btn-sm" onclick="shiftQRPage(1)">NEXT</button>
                </div>
                <div id="qr-preview" class="qr-preview">
                    <canvas id="qr-canvas" width="256" height="256" aria-label="QR preview"></canvas>
                    <div id="qr-svg" style="display:none;"></div>
                </div>
            </div>

            <div class="work-card">
                <h3>TRANSLITERATION (KMU 55)</h3>
                <div style="margin-bottom:5px; font-size:0.8rem">Ukrainian (Cyrillic):</div>
                <textarea id="tr-ua" class="translit-area" placeholder="Введіть текст..." oninput="doTranslit('ua')"></textarea>
                <div style="margin-bottom:5px; font-size:0.8rem">English (Latin):</div>
                <textarea id="tr-en" class="translit-area" placeholder="Output..." oninput="doTranslit('en')"></textarea>
                <div style="font-size:0.7rem; opacity:0.6; margin-top:5px;">*Reverse translit is best-effort estimate.</div>
            </div>
        </div>`;

    const qrInput = document.getElementById('qr-text');
    if (qrInput) {
        qrInput.value = rememberedQR;
        const limitBox = document.getElementById('qr-limit');
        if (limitBox) limitBox.innerText = `${qrInput.value.length}/5120`;
    }
    generatePass();
    autoPreviewQR();
}
/** words - Слова для генерації парольних фраз */
const words = ["cyber", "secure", "hack", "node", "core", "linux", "root", "admin", "flux", "neon", "grid", "data", "byte", "bit", "net", "web", "cloud", "void", "null", "zero"];
/** generatePass - Генерує випадковий пароль за налаштуваннями */
function generatePass() { const isPhrase = document.getElementById('p-phrase').checked; const len = parseInt(document.getElementById('p-len').value); const useUp = document.getElementById('p-upper').checked; const useNum = document.getElementById('p-nums').checked; const useSym = document.getElementById('p-syms').checked; let res = ""; if (isPhrase) { let wCount = Math.floor(len / 4); if (wCount < 3) wCount = 3; let arr = []; for (let i = 0; i < wCount; i++) { let w = words[Math.floor(Math.random() * words.length)]; if (useUp) w = w.charAt(0).toUpperCase() + w.slice(1); arr.push(w); } res = arr.join(useSym ? "-" : ""); if (useNum) res += Math.floor(Math.random() * 100); } else { let chars = "abcdefghijklmnopqrstuvwxyz"; if (useUp) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; if (useNum) chars += "0123456789"; if (useSym) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"; for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length)); } document.getElementById('pass-out').innerText = res; }
/** copyPass - Копіює згенерований пароль у буфер обміну */
function copyPass() {
    const txt = document.getElementById('pass-out').innerText;
    if (txt !== "...") {
        navigator.clipboard.writeText(txt);
        showToast('Password copied', 'success');
    }
}

/** mapUA - Таблиця транслітерації українських літер у латинські (КМУ 55) */
const mapUA = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', '\'': '', '’': '', 'ю': 'iu', 'я': 'ia', 'є': 'ie', 'ї': 'i', 'й': 'i' };
/** mapUA_Start - Спеціальна транслітерація для літер на початку слова */
const mapUA_Start = { 'є': 'ye', 'ї': 'yi', 'й': 'y', 'ю': 'yu', 'я': 'ya' };
/**
 * doTranslit - Виконує транслітерацію тексту
 * @param {string} dir - Напрямок ('ua' - UA→EN, 'en' - EN→UA)
 */
function doTranslit(dir) { if (dir === 'ua') { let src = document.getElementById('tr-ua').value; let out = ""; let temp = src.replace(/зг/g, "zgh").replace(/Зг/g, "Zgh").replace(/ЗГ/g, "ZGH"); for (let i = 0; i < temp.length; i++) { const c = temp[i]; const low = c.toLowerCase(); const isUp = c !== low; const isStart = (i === 0 || /[\s\n\t\.,!?]/.test(temp[i - 1])); let tr = ""; if (isStart && mapUA_Start[low]) tr = mapUA_Start[low]; else if (mapUA[low] !== undefined) tr = mapUA[low]; else tr = c; if (tr.length > 0) { if (isUp) { if (tr.length > 1 && temp[i + 1] && temp[i + 1] === temp[i + 1].toUpperCase()) tr = tr.toUpperCase(); else tr = tr.charAt(0).toUpperCase() + tr.slice(1); } } out += tr; } document.getElementById('tr-en').value = out; } else { let src = document.getElementById('tr-en').value; src = src.replace(/zgh/gi, "зг"); const revMapMulti = [{ k: 'shch', v: 'щ' }, { k: 'zh', v: 'ж' }, { k: 'kh', v: 'х' }, { k: 'ts', v: 'ц' }, { k: 'ch', v: 'ч' }, { k: 'sh', v: 'ш' }, { k: 'ye', v: 'є' }, { k: 'yi', v: 'ї' }, { k: 'yu', v: 'ю' }, { k: 'ya', v: 'я' }, { k: 'ia', v: 'я' }, { k: 'ie', v: 'є' }, { k: 'iu', v: 'ю' }]; for (let pair of revMapMulti) { const reg = new RegExp(pair.k, "gi"); src = src.replace(reg, (match) => { const isUp = match[0] === match[0].toUpperCase(); return isUp ? pair.v.toUpperCase() : pair.v; }); } const revMapSingle = { 'a': 'а', 'b': 'б', 'v': 'в', 'h': 'г', 'g': 'ґ', 'd': 'д', 'e': 'е', 'z': 'з', 'y': 'и', 'i': 'і', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф' }; let out = ""; for (let i = 0; i < src.length; i++) { const c = src[i]; const low = c.toLowerCase(); const isUp = c !== low; if (revMapSingle[low]) out += isUp ? revMapSingle[low].toUpperCase() : revMapSingle[low]; else out += c; } document.getElementById('tr-ua').value = out; } }

// --- QR GENERATOR (VERSION 1-L, OFFLINE, PAGED UP TO 5KB) ---
const qrEncoder = (() => {
    const gfExp = new Array(512);
    const gfLog = new Array(256);
    (function initGalois() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            gfExp[i] = x;
            gfLog[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11d;
        }
        for (let i = 255; i < 512; i++) gfExp[i] = gfExp[i - 255];
    })();
    function gfMul(a, b) { if (a === 0 || b === 0) return 0; return gfExp[gfLog[a] + gfLog[b]]; }
    function rsGeneratorPoly(ec) {
        let poly = [1];
        for (let i = 0; i < ec; i++) {
            poly = polyMultiply(poly, [1, gfExp[i]]);
        }
        return poly;
    }
    function polyMultiply(p, q) {
        const res = new Array(p.length + q.length - 1).fill(0);
        for (let i = 0; i < p.length; i++) {
            for (let j = 0; j < q.length; j++) res[i + j] ^= gfMul(p[i], q[j]);
        }
        return res;
    }
    function reedSolomon(data, ec) {
        const gen = rsGeneratorPoly(ec);
        const res = new Array(ec).fill(0);
        data.forEach((byte) => {
            const factor = byte ^ res[0];
            res.shift(); res.push(0);
            gen.slice(1).forEach((coef, idx) => { res[idx] ^= gfMul(coef, factor); });
        });
        return res;
    }

    function encodeQRBytes(data) {
        const bytes = Array.isArray(data) || data instanceof Uint8Array
            ? Array.from(data)
            : Array.from(new TextEncoder().encode(data));
        const chunkLimit = 17;
        if (bytes.length > chunkLimit) throw new Error('Chunk too long for offline QR page (17 bytes max).');
        const bits = [];
        const pushBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
        pushBits(0b0100, 4); // Byte mode
        pushBits(bytes.length, 8);
        bytes.forEach((b) => pushBits(b, 8));
        pushBits(0, Math.min(4, 152 - bits.length));
        while (bits.length % 8 !== 0) bits.push(0);
        const dataWords = [];
        for (let i = 0; i < bits.length; i += 8) dataWords.push(parseInt(bits.slice(i, i + 8).join(''), 2));
        const pad = [0xec, 0x11]; let padIdx = 0;
        while (dataWords.length < 19) { dataWords.push(pad[padIdx % 2]); padIdx++; }
        return dataWords;
    }

    function buildQRMatrix(text) {
        const data = encodeQRBytes(text);
        const ecc = reedSolomon(data, 7);
        const codewords = data.concat(ecc);
        const size = 21;
        const m = Array.from({ length: size }, () => Array(size).fill(null));

        const placeFinder = (x, y) => {
            for (let dy = 0; dy < 7; dy++) {
                for (let dx = 0; dx < 7; dx++) {
                    const on = (dx === 0 || dx === 6 || dy === 0 || dy === 6) || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
                    m[y + dy][x + dx] = on;
                }
            }
        };
        placeFinder(0, 0); placeFinder(size - 7, 0); placeFinder(0, size - 7);
        for (let i = 0; i < 8; i++) { m[7][i] = false; m[i][7] = false; m[7][size - 1 - i] = false; m[size - 1 - i][7] = false; m[i][size - 8] = false; m[size - 8][i] = false; }
        for (let i = 0; i < size; i++) { if (m[6][i] === null) m[6][i] = i % 2 === 0; if (m[i][6] === null) m[i][6] = i % 2 === 0; }
        m[size - 8][8] = true; // Dark module

        const dataBits = [];
        codewords.forEach((cw) => { for (let i = 7; i >= 0; i--) dataBits.push((cw >> i) & 1); });
        let bitIdx = 0; let upward = true;
        for (let col = size - 1; col > 0; col -= 2) {
            if (col === 6) col--;
            for (let rowOffset = 0; rowOffset < size; rowOffset++) {
                const row = upward ? size - 1 - rowOffset : rowOffset;
                for (let dx = 0; dx < 2; dx++) {
                    const c = col - dx;
                    if (m[row][c] !== null) continue;
                    const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
                    const masked = bit ^ ((row + c) % 2 === 0 ? 1 : 0);
                    m[row][c] = !!masked;
                }
            }
            upward = !upward;
        }

        const formatBits = 0b111011111000100; // Level L + mask 0
        const fmtCoordsA = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
        const fmtCoordsB = [[20, 8], [19, 8], [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [8, 13], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18], [8, 19]];
        const fmtBit = (idx) => ((formatBits >> (14 - idx)) & 1) === 1;
        fmtCoordsA.forEach(([r, c], idx) => m[r][c] = fmtBit(idx));
        fmtCoordsB.forEach(([r, c], idx) => m[r][c] = fmtBit(idx));
        return m;
    }

    return { buildQRMatrix };
})();

let lastQRPages = [];
let lastQRIndex = 0;

function drawQRToCanvas(matrix, size, canvas) {
    const ctx = canvas.getContext('2d');
    const dim = matrix.length;
    const scale = Math.floor(size / dim);
    const pad = 2 * scale;
    const finalSize = dim * scale + pad * 2;
    canvas.width = finalSize; canvas.height = finalSize;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, finalSize, finalSize);
    ctx.fillStyle = '#000';
    for (let y = 0; y < dim; y++) {
        for (let x = 0; x < dim; x++) {
            if (matrix[y][x]) ctx.fillRect(pad + x * scale, pad + y * scale, scale, scale);
        }
    }
}

function matrixToSVG(matrix, size) {
    const dim = matrix.length;
    const scale = size / dim;
    let path = '';
    for (let y = 0; y < dim; y++) {
        for (let x = 0; x < dim; x++) {
            if (matrix[y][x]) path += `M${(x * scale).toFixed(2)} ${(y * scale).toFixed(2)}h${scale.toFixed(2)}v${scale.toFixed(2)}h-${scale.toFixed(2)}z`;
        }
    }
    const view = size.toFixed(2);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" width="${view}" height="${view}"><rect width="100%" height="100%" fill="white"/>${path ? `<path d="${path}" fill="black"/>` : ''}</svg>`;
}

function autoPreviewQR() { setTimeout(generateQR, 10); }
function generateQR() {
    const txtEl = document.getElementById('qr-text');
    const sizeEl = document.getElementById('qr-size');
    const formatEl = document.getElementById('qr-format');
    const txt = txtEl && typeof txtEl.value === 'string' ? txtEl.value : '';
    const size = parseInt((sizeEl && sizeEl.value) ? sizeEl.value : '256');
    const format = formatEl && formatEl.value ? formatEl.value : 'png';
    lastQRFormat = format; lastQRSize = size; lastQRText = txt;
    const info = document.getElementById('qr-page-info');
    if (info) info.innerText = '';
    if (!txt.trim()) { const canvas = document.getElementById('qr-canvas'); if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillText('Enter text', 10, 20); } return; }
    const bytes = Array.from(new TextEncoder().encode(txt.trim()));
    const maxBytes = 5120;
    if (bytes.length > maxBytes) {
        showModal({ title: 'QR LIMIT', body: `Please keep QR content within ${maxBytes} bytes (~5KB).` });
        return;
    }

    const chunkSize = 17;
    const chunked = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const slice = bytes.slice(i, i + chunkSize);
        chunked.push(slice);
    }

    lastQRPages = [];
    lastQRIndex = 0;
    try {
        chunked.forEach((chunk) => {
            lastQRPages.push(qrEncoder.buildQRMatrix(chunk));
        });
        lastQRMatrix = lastQRPages[0];
    } catch (e) {
        showModal({ title: 'QR ERROR', body: e.message || 'Unable to build QR' });
        return;
    }

    renderQRPage(size, format);
}

function renderQRPage(size, format) {
    if (!lastQRPages.length) return;
    if (lastQRIndex >= lastQRPages.length) lastQRIndex = lastQRPages.length - 1;
    if (lastQRIndex < 0) lastQRIndex = 0;
    lastQRMatrix = lastQRPages[lastQRIndex];
    const canvas = document.getElementById('qr-canvas');
    const svgBox = document.getElementById('qr-svg');
    if (canvas) drawQRToCanvas(lastQRMatrix, size, canvas);
    if (svgBox) {
        if (format === 'svg') {
            svgBox.style.display = 'block';
            canvas.style.display = 'none';
            svgBox.innerHTML = matrixToSVG(lastQRMatrix, size);
        } else {
            svgBox.style.display = 'none';
            canvas.style.display = 'block';
            svgBox.innerHTML = '';
        }
    }
    const info = document.getElementById('qr-page-info');
    if (info) info.innerText = lastQRPages.length > 1 ? `PAGE ${lastQRIndex + 1} / ${lastQRPages.length}` : 'SINGLE QR';
}

function downloadQR() {
    if (!lastQRMatrix || !lastQRText.trim()) { showModal({ title: 'NO QR', body: 'Generate QR first.' }); return; }
    if (lastQRFormat === 'svg') {
        const svg = matrixToSVG(lastQRMatrix, lastQRSize);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const suffix = lastQRPages.length > 1 ? `-${lastQRIndex + 1}` : '';
        a.href = url; a.download = `qr${suffix}.svg`; a.click(); URL.revokeObjectURL(url);
    } else {
        const canvas = document.getElementById('qr-canvas');
        drawQRToCanvas(lastQRMatrix, lastQRSize, canvas);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const suffix = lastQRPages.length > 1 ? `-${lastQRIndex + 1}` : '';
            a.href = url; a.download = `qr${suffix}.png`; a.click(); URL.revokeObjectURL(url);
        });
    }
}

function shiftQRPage(dir) {
    if (!lastQRPages.length) return;
    lastQRIndex += dir;
    if (lastQRIndex < 0) lastQRIndex = 0;
    if (lastQRIndex >= lastQRPages.length) lastQRIndex = lastQRPages.length - 1;
    renderQRPage(lastQRSize, lastQRFormat);
}

// --- CRYPTO HELPER ---
/**
 * hashPass - Генерує SHA-256 хеш рядка
 * @param {string} str - Вхідний рядок
 * @returns {string} Хеш-сума
 */
async function hashPass(str) {
    if (!str) return '';
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- GENERATE DOC (WORD) ---
/** generateDOC - Генерує та завантажує резюме у форматі Word (DOC) */
window.generateDOC = function () {
    const r = systemData.resume;
    const t = r.titles;
    let content = r.templates.doc;

    // Placeholders Replacement
    content = content.replace(/{{name}}/g, r.name)
        .replace(/{{birth}}/g, r.birth)
        .replace(/{{email}}/g, r.email)
        .replace(/{{phone}}/g, r.phone || '')
        .replace(/{{summary}}/g, r.summary || '')
        .replace(/{{title_summary}}/g, t.summary)
        .replace(/{{title_skills}}/g, t.skills)
        .replace(/{{title_langs}}/g, t.langs)
        .replace(/{{title_jobs}}/g, t.jobs)
        .replace(/{{title_edu}}/g, t.edu)
        .replace(/{{title_rnd}}/g, t.rnd);

    // Lists
    content = content.replace('{{skills_list}}', r.skills.map(s => `<li>${s.n} (${s.p}%)</li>`).join(''));
    content = content.replace('{{langs_list}}', (r.languages || []).map(l => `<li>${l}</li>`).join(''));
    content = content.replace('{{rnd_list}}', (r.rnd || []).map(p => `<li>${p}</li>`).join(''));
    content = content.replace('{{jobs_list}}', r.jobs.map(j => `<div style="margin-bottom: 15px;"><strong>${j.co}</strong> - <em>${j.pos}</em><br><span style="color: #666;">${j.per}</span><ul>${j.tasks.map(t => `<li>${t}</li>`).join('')}</ul></div>`).join(''));
    content = content.replace('{{edu_list}}', (r.education || []).map(e => `<div style="margin-bottom: 10px;"><strong>${e.inst}</strong><br>${e.deg} (${e.year})</div>`).join(''));

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resume_${r.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_ABOUT - Про мене
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderAbout - Рендерить секцію "Про мене"
 * Відображає текст обраною мовою з ефектом друку
 */
function renderAbout() {
    const v = document.getElementById('view');
    let btns = systemData.about.languages.map(l =>
        `<button class="btn ${systemData.about.activeLang === l.code ? 'active' : ''}" onclick="switchLang('${l.code}')">${l.label}</button>`
    ).join('');

    let html = `<div style="display:flex; justify-content:flex-end; gap:10px; margin-bottom:15px;">${btns}</div>`;

    html += `<div style="overflow:hidden;">`; // Container to manage floats if needed

    if (systemData.about.showPhoto) {
        const photoSrc = systemData.about.photo || systemData.resume.photo;
        html += `<img src="${photoSrc}" style="float:right; margin-left:20px; margin-bottom:10px; width:150px; border: 2px solid var(--text); object-fit:cover;" alt="Me">`;
    }

    html += `<div id="about-txt"></div>`;
    html += `</div>`;

    v.innerHTML = html;

    const activeData = (systemData.about.languages || []).find(l => l.code === systemData.about.activeLang) || (systemData.about.languages ? systemData.about.languages[0] : null);
    if (activeData) typeEffect(activeData.text, 'about-txt');
}

/**
 * switchLang - Перемикає мову секції "Про мене"
 * @param {string} langCode - Код мови
 */
window.switchLang = function (langCode) {
    if (systemData.about.languages.find(l => l.code === langCode)) {
        systemData.about.activeLang = langCode;
        renderAbout();
    }
}
function switchLang(l) { if (currentLang === l || isTyping) return; currentLang = l; renderAbout(); }
/** typeEffect - Створює ефект поступового друку тексту */
function typeEffect(html, targetId) { const v = document.getElementById(targetId); v.innerHTML = '<div id="type-box" class="typing"></div>'; const b = document.getElementById('type-box'); isTyping = true; const startTime = Date.now(); const duration = 1000; const timer = setInterval(() => { const elapsed = Date.now() - startTime; let progress = elapsed / duration; if (progress > 1) progress = 1; let i = Math.floor(html.length * progress); const sub = html.substring(0, i); const lastOpen = sub.lastIndexOf('<'); const lastClose = sub.lastIndexOf('>'); if (lastOpen > lastClose) { const closing = html.indexOf('>', lastOpen); if (closing !== -1) i = closing + 1; } if (Math.random() > 0.8) playSfx(200 + Math.random() * 100, 'sine', 0.02, 0.02); b.innerHTML = html.substring(0, i); if (progress === 1) { clearInterval(timer); b.innerHTML = html; b.classList.remove('typing'); isTyping = false; } }, 16); }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_RESUME - Резюме (CV)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderResume - Рендерить секцію резюме
 * Використовує дані з systemData.resume та titles
 */
function renderResume() {
    const v = document.getElementById('view');
    const r = systemData.resume;
    const t = r.titles || defaultData.resume.titles; // Fallback
    const skills = r.skills.map(s => `<div>${s.n}: [${"█".repeat(Math.round(s.p / 10))}${"░".repeat(10 - Math.round(s.p / 10))}] ${s.p}%</div>`).join("");
    const langs = (r.languages || []).map(l => `<div>• ${l}</div>`).join("");
    const rnds = (r.rnd || []).map(r => `<div>● ${r}</div>`).join("");
    const birthDate = r.birth.split('-').reverse().join('.');
    let eduHTML = ''; if (r.education && r.education.length > 0) { eduHTML = `<h3 class="underline" style="margin-top:15px">${t.edu}</h3><div class="scroll-area">${r.education.map(e => `<div class="exp-item" style="margin-bottom:10px;"><h4>${e.inst}</h4><div>${e.year} | ${e.deg}</div></div>`).join("")}</div>`; }
    v.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--text); padding-bottom:10px; margin-bottom:20px;"><h1>РЕЗЮМЕ</h1><div style="display:flex; gap:10px;"><button class="btn" onclick="genMD()">[ MD ]</button><button class="btn" onclick="generateDOC()">[ DOC ]</button></div></div><div style="display:flex; gap:20px; flex-wrap:wrap"><div class="photo"><img class="photo" src="${r.photo}" alt="VVS Photo"></div><div><h2>${r.name}</h2><p>DOB: ${birthDate}</p><p>Email: ${r.email}</p><p>Phone: ${r.phone || 'N/A'}</p><div style="font-size:0.8rem; margin-top:10px;">${skills}</div><h3 style="margin-top:10px; font-size:1rem; border-bottom:1px solid var(--dim); display:inline-block;">${t.langs}</h3><div style="font-size:0.8rem; margin-top:5px;">${langs}</div></div></div><h3 class="underline" style="margin-top:25px">${t.summary}</h3><p style="margin-bottom:20px; line-height:1.5;">${r.summary || ''}</p><h3 class="underline">${t.jobs}</h3><div class="scroll-area">${r.jobs.map(j => `<div class="exp-item"><h4>${j.co}</h4><div class="meta">${j.per} | ${j.pos}</div><ul>${j.tasks.map(t => `<li>${t}</li>`).join("")}</ul></div>`).join("")}</div>${eduHTML}<h3 class="underline" style="margin-top:15px">${t.rnd}</h3><div style="font-size:0.9rem">${rnds}</div>`;
}
// --- GENERATE MD (MARKDOWN) ---
/** genMD - Генерує та завантажує резюме у форматі Markdown */
window.genMD = function () {
    const r = systemData.resume;
    const t = r.titles;
    let content = r.templates.md;

    content = content.replace(/{{name}}/g, r.name)
        .replace(/{{birth}}/g, r.birth)
        .replace(/{{email}}/g, r.email)
        .replace(/{{phone}}/g, r.phone || '')
        .replace(/{{summary}}/g, r.summary || '')
        .replace(/{{title_summary}}/g, t.summary)
        .replace(/{{title_skills}}/g, t.skills)
        .replace(/{{title_langs}}/g, t.langs)
        .replace(/{{title_jobs}}/g, t.jobs)
        .replace(/{{title_edu}}/g, t.edu)
        .replace(/{{title_rnd}}/g, t.rnd);

    // Lists
    content = content.replace('{{skills_list}}', r.skills.map(s => `- ${s.n} (${s.p}%)`).join('\n'));
    content = content.replace('{{langs_list}}', (r.languages || []).map(l => `- ${l}`).join('\n'));
    content = content.replace('{{rnd_list}}', (r.rnd || []).map(p => `- ${p}`).join('\n'));
    content = content.replace('{{jobs_list}}', r.jobs.map(j => `### ${j.co}\n*${j.pos} | ${j.per}*\n${j.tasks.map(t => `- ${t}`).join('\n')}`).join('\n\n'));
    content = content.replace('{{edu_list}}', (r.education || []).map(e => `### ${e.inst}\n${e.deg} (${e.year})`).join('\n\n'));

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resume_${r.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_OBSIDIAN - Нотатки Obsidian
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderObsidian - Рендерить інтерфейс перегляду нотаток
 * Підтримує категорії, файли та захист паролем
 */
function renderObsidian() {
    const v = document.getElementById('view');
    if (!v) return;

    const obs = (systemData && systemData.obsidian && typeof systemData.obsidian === 'object') ? systemData.obsidian : {};
    const cats = Array.isArray(obs.cats) ? obs.cats : [];

    if (!dataReady) {
        v.innerHTML = '<div style="padding:20px; opacity:0.7;">Loading Obsidian data...</div>';
        return;
    }

    // Ensure current category is valid
    if (!cats.includes(currentObsCat)) {
        currentObsCat = cats.length ? cats[0] : '';
        currentObsFile = '';
    }

    const currentCatFiles = currentObsCat && obs[currentObsCat] && typeof obs[currentObsCat] === 'object'
        ? obs[currentObsCat]
        : {};
    const fileKeys = Object.keys(currentCatFiles);

    if (currentObsFile && !fileKeys.includes(currentObsFile)) currentObsFile = '';
    const displayFile = currentObsFile || fileKeys[0] || '';

    const content = displayFile && currentCatFiles[displayFile]
        ? String(currentCatFiles[displayFile]).replace(/\\\\/g, '\\')
        : (cats.length ? "Оберіть нотатку для зчитування або створіть нову..." : "Немає доступних категорій нотаток.");

    v.innerHTML = `<h2>Obsidian.Vault</h2>
        <div class="obs-container">
            <div class="obs-tabs" id="o-t"></div>
            <div class="obs-main">
                <div class="obs-files" id="o-f"></div>
                <div class="obs-viewer" id="o-v"><pre>${content}</pre></div>
            </div>
        </div>`;

    const tabBox = document.getElementById('o-t');
    if (tabBox && cats.length) {
        cats.forEach(c => {
            const b = document.createElement('button');
            b.className = `obs-tab-btn ${c === currentObsCat ? 'active' : ''}`;
            const isLocked = obs.catAuth && obs.catAuth[c];
            b.innerText = (isLocked ? '🔒 ' : '') + c;

            b.onclick = () => {
                if (isLocked) {
                    if (!adminAuth) {
                        showPrompt({ title: 'ENTER PASSWORD', message: `Category ${c} is locked`, placeholder: '********' }).then((p) => {
                            if (p !== obs.catAuth[c]) {
                                playSfx(100, 'sawtooth', 0.5); showModal({ title: 'ACCESS DENIED', body: 'Wrong category password.' }); return;
                            }
                            currentObsCat = c; currentObsFile = ''; renderObsidian();
                        });
                        return;
                    } else {
                        playSfx(800, 'sine', 0.1);
                        showToast('ADMIN: PASSWORD BYPASSED', 'info');
                    }
                }
                currentObsCat = c; currentObsFile = ''; renderObsidian();
            };
            tabBox.appendChild(b);
        });
    } else if (tabBox) {
        tabBox.innerHTML = '<div style="opacity:0.6; padding:8px;">No note categories</div>';
    }

    const fileBox = document.getElementById('o-f');
    if (fileBox) {
        if (!fileKeys.length) {
            fileBox.innerHTML = '<div style="opacity:0.6; padding:8px;">No files in this category</div>';
        } else {
            fileKeys.forEach(f => {
                const b = document.createElement('button');
                b.className = `obs-file-item ${f === displayFile ? 'active' : ''}`;
                b.innerText = '> ' + f;
                b.onclick = () => { currentObsFile = f; playSfx(600); renderObsidian(); };
                fileBox.appendChild(b);
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_BLOG - Керування блогом
// ═══════════════════════════════════════════════════════════════════════════════

/** activeBlogTag - Поточний тег для фільтрації блогу */
let activeBlogTag = null;

/**
 * renderBlog - Рендерить список постів блогу
 * Підтримує фільтрацію за тегами
 */
function renderBlog() {
    const v = document.getElementById('view');
    // Collect all unique tags
    const allTags = new Set();
    systemData.blog.forEach(p => p.tags.forEach(t => allTags.add(t)));

    let tagsHtml = `<button class="home-tag-btn ${activeBlogTag === null ? 'active' : ''}" onclick="filterBlog(null)">[ ALL ]</button>`;
    allTags.forEach(t => {
        tagsHtml += `<button class="home-tag-btn ${activeBlogTag === t ? 'active' : ''}" onclick="filterBlog('${t}')">#${t}</button>`;
    });

    v.innerHTML = `<h2>/var/log/blog</h2>
            <div style="margin-bottom:15px; display:flex; flex-wrap:wrap; gap:5px; border-bottom:1px dashed var(--dim); padding-bottom:10px;">${tagsHtml}</div>
            <div class="blog-list" id="blog-list"></div>`;

    const list = document.getElementById('blog-list');

    const filteredPosts = activeBlogTag
        ? systemData.blog.filter(p => p.tags.includes(activeBlogTag))
        : systemData.blog;

    if (filteredPosts.length === 0) {
        list.innerHTML = `<div style="opacity:0.5; padding:10px;">No posts found for tag: ${activeBlogTag}</div>`;
    } else {
        filteredPosts.forEach(p => {
            const d = document.createElement('div');
            d.className = 'blog-entry';
            d.innerHTML = `<div class="blog-header"><span class="blog-title">>> ${p.title}</span><span class="blog-date">${p.date}</span></div><div style="margin-bottom:5px;">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div><div class="blog-snippet">${p.snippet}</div>`;
            d.onclick = () => renderBlogPost(p.id);
            list.appendChild(d);
        });
    }
}

/** filterBlog - Встановлює тег для фільтрації блогу */
function filterBlog(tag) {
    activeBlogTag = tag;
    renderBlog();
    playSfx(600, 'sine', 0.05);
}

/** renderBlogPost - Рендерить повний текст одного поста блогу */
function renderBlogPost(id) {
    const p = systemData.blog.find(x => x.id === id);
    const v = document.getElementById('view');
    playSfx(500);

    // COMMENTS LOGIC
    if (!systemData.blogComments) systemData.blogComments = {};
    const comments = systemData.blogComments[id] || [];

    let commentsHtml = `
    <div style="margin-top:40px; border-top:1px dashed var(--dim); padding-top:20px;">
        <h3>COMMENTS (${comments.length})</h3>
        <div id="blog-comments-list" style="margin-bottom:20px; max-height:300px; overflow-y:auto; padding-right:10px;">
            ${comments.length === 0 ? '<div style="opacity:0.5; font-style:italic;">No comments yet.</div>' : comments.map(c =>
        `<div style="background:rgba(0,0,0,0.1); padding:10px; margin-bottom:10px; border-left:2px solid var(--text);">
                    <div style="font-size:0.75rem; opacity:0.7; margin-bottom:5px;"><strong>${c.user}</strong> @ ${c.date}</div>
                    <div style="white-space:pre-wrap;">${c.text}</div>
                 </div>`
    ).join('')}
        </div>
        
        <div style="background:var(--dim); padding:15px; border:1px solid var(--text);">
            <div style="margin-bottom:10px;">
                <input type="text" id="com-name" placeholder="Name/Handle (Optional)" style="width:100%; border:none; background:rgba(0,0,0,0.2); color:var(--text); padding:5px; font-family:inherit;">
            </div>
            <div style="margin-bottom:10px;">
                <textarea id="com-text" placeholder="Write a comment..." style="width:100%; height:60px; border:none; background:rgba(0,0,0,0.2); color:var(--text); padding:5px; font-family:inherit; resize:vertical;"></textarea>
            </div>
            <button class="btn" onclick="addBlogComment(${id})">POST COMMENT</button>
        </div>
    </div>`;

    v.innerHTML = `<button class="btn" onclick="nav('blog')" style="margin-bottom:15px;">< BACK</button><h2 style="border-bottom:2px solid var(--text); padding-bottom:5px; margin-bottom:10px;">${p.title}</h2><div style="font-size:0.8rem; margin-bottom:20px; opacity:0.7;">DATE: ${p.date} | TAGS: ${p.tags.join(', ')}</div><div class="blog-read-view blog-full">${p.content}</div>${commentsHtml}`;
}

/** addBlogComment - Додає коментар */
window.addBlogComment = function (postId) {
    const txt = document.getElementById('com-text').value.trim();
    let name = document.getElementById('com-name').value.trim();
    if (!name) name = 'Anonymous';

    if (!txt) return; // Empty

    if (!systemData.blogComments) systemData.blogComments = {};
    if (!systemData.blogComments[postId]) systemData.blogComments[postId] = [];

    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    systemData.blogComments[postId].push({
        user: name,
        text: txt.replace(/</g, "&lt;").replace(/>/g, "&gt;"), // Basic sanitize
        date: dateStr
    });

    saveData();
    renderBlogPost(postId); // Rerender
    playSfx(800, 'square', 0.1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_TODO - Список справ
// ═══════════════════════════════════════════════════════════════════════════════

function computeTodoStats(list) {
    const todos = Array.isArray(list) ? list : [];
    const total = todos.length;
    const done = todos.filter(t => t.d).length;
    const scheduled = todos.filter(t => t.due).length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, scheduled, progress };
}

/** renderTodo - Рендерить контейнер списку справ */
function renderTodo() {
    const v = document.getElementById('view');
    const editable = systemData.todoEditable;
    const stats = computeTodoStats(systemData.todos);

    let html = `<h2>TODO_MANAGER ${editable ? '[EDIT_MODE]' : '[READ_ONLY]'}</h2>`;
    html += `<div class="todo-stats">
        <div><strong>${stats.done}/${stats.total}</strong> completed</div>
        <div class="progress"><span style="width:${stats.progress}%;"></span></div>
        <div>${stats.scheduled} scheduled</div>
    </div>`;

    if (editable) {
        html += `<div class="todo-input-group" style="margin-bottom:15px; flex-wrap:wrap;">
            <input type="text" id="new-todo-input" class="todo-input" placeholder="New task..." onkeypress="if(event.key==='Enter') addTodoItem()">
            <input type="date" id="new-todo-date" class="todo-input" style="max-width:180px;" aria-label="Due date">
            <input type="time" id="new-todo-time" class="todo-input" style="max-width:140px;" aria-label="Due time">
            <button class="btn" onclick="addTodoItem()">ADD_TASK</button>
            <button class="btn" onclick="renderCalendar()" style="margin-left:auto;">[ CALENDAR_VIEW ]</button>
            <button class="btn" onclick="renderTodoList()" id="list-view-btn" style="display:none;">[ LIST_VIEW ]</button>
        </div>
        <div style="margin-bottom:15px; display:flex; gap:10px;">
             <button class="btn" onclick="exportTodoData()">EXPORT (JSON)</button>
             <button class="btn" onclick="exportTodoICS()">EXPORT (ICS)</button>
             <label class="btn" style="cursor:pointer;">
                IMPORT (JSON) <input type="file" id="todo-imp" style="display:none" onchange="importTodoData(this)">
             </label>
        </div>`;
    } else {
        html += `<div style="margin-bottom:15px; display:flex; gap:10px;">
            <button class="btn" onclick="renderCalendar()">[ CALENDAR_VIEW ]</button>
            <button class="btn" onclick="exportTodoICS()">EXPORT (ICS)</button>
        </div>`;
    }
    html += `<div class="todo-container" id="todo-main-box"><div class="todo-list" id="todo-list"></div></div>`;
    v.innerHTML = html;
    renderTodoList();
}

/** renderTodoList - Відображає елементи списку справ */
function renderTodoList() {
    const box = document.getElementById('todo-main-box');
    const listBtn = document.getElementById('list-view-btn');
    if (listBtn) listBtn.style.display = 'none';

    box.innerHTML = `<div class="todo-list" id="todo-list"></div>`;
    const l = document.getElementById('todo-list');

    const editable = systemData.todoEditable;
    systemData.todos.forEach((t, i) => {
        const el = document.createElement('div');
        el.className = `todo-item ${t.d ? 'todo-done' : ''}`;
        const dueInfo = t.due ? `<span class="todo-due">${t.due}${t.time ? ' ' + t.time : ''}</span>` : '<span class="todo-due muted">No date</span>';
        if (editable) {
            el.innerHTML = `<span class="todo-check" onclick="toggleTodoDone(${i})" style="cursor:pointer">[${t.d ? 'x' : ' '}]</span>
                           <div class="todo-meta" onclick="openTodoDetail(${i})">
                                <div class="todo-text">${t.t}</div>
                                <div class="todo-meta-line">${dueInfo} <span class="todo-status">${t.d ? 'DONE' : 'ACTIVE'}</span></div>
                           </div>
                           <div class="todo-actions">
                                <button class="btn btn-sm" onclick="openTodoDetail(${i})">DETAILS</button>
                                <button class="btn btn-red btn-sm todo-del" onclick="removeTodoItem(${i})">X</button>
                           </div>`;
        } else {
            el.innerHTML = `<span class="todo-check">[${t.d ? 'x' : ' '}]</span> <div class="todo-meta"><div class="todo-text">${t.t}</div><div class="todo-meta-line">${dueInfo}</div></div>`;
        }
        l.appendChild(el);
    });
}

// CALENDAR LOGIC
function renderCalendar() {
    const box = document.getElementById('todo-main-box');
    const listBtn = document.getElementById('list-view-btn');
    if (listBtn) listBtn.style.display = 'inline-block';

    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay(); // 0=Sun

    const events = (systemData.todos || []).filter(t => t.due).map((t, idx) => ({ date: t.due, title: t.t, time: t.time || 'All Day', idx }));

    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="font-weight:bold;">${y}-${String(m + 1).padStart(2, '0')}</div>
        <button class="btn btn-sm" onclick="renderTodoList()">BACK TO LIST</button>
    </div>`;
    html += `<div class="calendar-grid">`;
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => html += `<div style="text-align:center; font-weight:bold; border-bottom:1px solid var(--text); padding:5px 0;">${d}</div>`);
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const hasEv = dayEvents.length > 0;
        html += `<div class="cal-day" onclick="openCalDate('${dateStr}')" style="border:1px solid var(--dim); min-height:80px; padding:5px; cursor:pointer; position:relative;">
            <div style="font-weight:bold; opacity:${hasEv ? 1 : 0.5}; margin-bottom:5px;">${i}</div>
            <div style="font-size:0.65rem; line-height:1.2;">
                ${dayEvents.map(e => `<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; background:var(--dim); margin-bottom:2px; padding:1px;">• ${e.title}</div>`).join('')}
            </div>
            ${i === now.getDate() ? '<div style="position:absolute; top:5px; right:5px; width:8px; height:8px; background:var(--text); border-radius:50%;"></div>' : ''}
        </div>`;
    }

    html += `</div>`;
    box.innerHTML = html;
}

window.openCalDate = function (date) {
    if (!systemData.todos) systemData.todos = [];
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '10px';

    const listBox = document.createElement('div');
    listBox.className = 'cal-event-list';

    const renderList = () => {
        const events = systemData.todos.filter(e => e.due === date);
        if (!events.length) {
            listBox.innerHTML = '<div style="opacity:0.6;">No events for this date</div>';
            return;
        }
        listBox.innerHTML = '';
        events.forEach((e, idx) => {
            const row = document.createElement('div');
            row.className = 'cal-event-row';
            row.innerHTML = `<span class="badge">${e.time || 'All Day'}</span><span class="cal-event-title">${e.title}</span>`;
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-red';
            delBtn.innerText = 'Delete';
            delBtn.onclick = () => {
                showConfirm('Delete this event?').then((ok) => {
                    if (!ok) return;
                    const target = systemData.todos.filter(t => t.due === date)[idx];
                    if (!target) return;
                    const realIdx = systemData.todos.indexOf(target);
                    if (realIdx > -1) systemData.todos.splice(realIdx, 1);
                    saveData();
                    renderList();
                    renderTodoList();
                });
            };
            row.appendChild(delBtn);
            listBox.appendChild(row);
        });
    };

    const form = document.createElement('div');
    form.style.display = 'flex';
    form.style.gap = '10px';
    form.style.flexWrap = 'wrap';
    form.innerHTML = `
        <label class="opt-check">Time <input type="time" id="cal-time" class="todo-input" style="max-width:140px;"></label>
        <input type="text" id="cal-title" class="todo-input" placeholder="Title..." style="flex:1; min-width:180px;">
        <button class="btn btn-green" id="cal-add-btn">Add</button>
    `;

    wrapper.appendChild(listBox);
    wrapper.appendChild(form);

    const overlay = showModal({ title: `Events for ${date}`, body: wrapper, actions: [{ label: 'Close' }] });
    const addBtn = form.querySelector('#cal-add-btn');
    addBtn.onclick = () => {
        const time = form.querySelector('#cal-time').value || 'All Day';
        const title = form.querySelector('#cal-title').value.trim() || 'Event';
        systemData.todos.push({ t: title, due: date, time, d: false });
        saveData();
        form.querySelector('#cal-title').value = '';
        renderList();
        renderTodoList();
    };

    renderList();
    setTimeout(() => {
        const firstInput = overlay ? overlay.querySelector('input') : null;
        if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
    }, 30);
};

// IMPORT / EXPORT
window.exportTodoData = function () {
    const data = {
        todos: systemData.todos,
        calendar: []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vvs_tasks.json';
    link.click();
}

window.exportTodoICS = function () {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//cl0w.nz//tasks//EN'];
    const pushEvent = (title, date, time) => {
        if (!date) return;
        const uid = `${title}-${date}-${time || 'allday'}@cl0w.nz`;
        const dt = date.replace(/-/g, '') + (time ? 'T' + time.replace(/:/g, '') + '00' : '');
        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + uid);
        lines.push('DTSTAMP:' + stamp);
        lines.push('DTSTART:' + dt);
        lines.push('SUMMARY:' + title);
        lines.push('END:VEVENT');
    };
    (systemData.todos || []).forEach((t) => pushEvent(t.t, t.due, t.time));
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tasks.ics'; a.click(); URL.revokeObjectURL(url);
};

window.importTodoData = function (acc) {
    const file = acc.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = function (e) {
        try {
            const d = JSON.parse(e.target.result);
            if (d.todos) systemData.todos = d.todos;
            if (Array.isArray(d.calendar)) {
                d.calendar.forEach(ev => {
                    if (ev && ev.date && ev.title) {
                        systemData.todos.push({ t: ev.title, due: ev.date, time: ev.time || 'All Day', d: false });
                    }
                });
            }
            saveData();
            showToast('Tasks Imported!', 'success');
            renderTodo();
        } catch (err) {
            showModal({ title: 'Import Error', body: 'Error parsing JSON' });
        }
    };
    r.readAsText(file);
}

/** addTodoItem - Додає новий елемент до списку справ */
function addTodoItem() {
    const inp = document.getElementById('new-todo-input');
    if (!inp || !inp.value.trim()) return;
    const dueInput = document.getElementById('new-todo-date');
    const timeInput = document.getElementById('new-todo-time');
    const dueDate = dueInput && dueInput.value ? dueInput.value : '';
    const dueTime = timeInput && timeInput.value ? timeInput.value : '';
    const item = { t: inp.value.trim(), d: false };
    if (dueDate) item.due = dueDate;
    if (dueTime) item.time = dueTime;
    systemData.todos.push(item);
    saveData();
    renderTodoList();
    inp.value = '';
    const dIn = document.getElementById('new-todo-date'); if (dIn) dIn.value = '';
    const tIn = document.getElementById('new-todo-time'); if (tIn) tIn.value = '';
    playSfx(800);
}
/** toggleTodoDone - Змінює статус виконання завдання */
function toggleTodoDone(i) {
    systemData.todos[i].d = !systemData.todos[i].d;
    saveData();
    renderTodoList();
    playSfx(systemData.todos[i].d ? 900 : 700);
}
/** removeTodoItem - Видаляє елемент зі списку справ */
function removeTodoItem(i) {
    showConfirm('Delete this task?').then((ok) => {
        if (!ok) return;
        systemData.todos.splice(i, 1);
        saveData();
        renderTodoList();
        playSfx(400);
    });
}

function openTodoDetail(i) {
    const item = systemData.todos[i];
    if (!item) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="form-group"><label>Title</label><input type="text" id="todo-edit-title" class="form-control" value="${item.t}"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <label class="opt-check">Due <input type="date" id="todo-edit-date" value="${item.due || ''}" class="todo-input" style="max-width:180px;"></label>
            <label class="opt-check">Time <input type="time" id="todo-edit-time" value="${item.time || ''}" class="todo-input" style="max-width:140px;"></label>
            <label class="opt-check"><input type="checkbox" id="todo-edit-done" ${item.d ? 'checked' : ''}> Done</label>
        </div>
    `;

    showModal({
        title: 'Task Details',
        body: wrapper,
        actions: [
            { label: 'Delete', variant: 'danger', onClick: () => removeTodoItem(i) },
            {
                label: 'Save', variant: 'success', onClick: () => {
                    const title = wrapper.querySelector('#todo-edit-title').value.trim() || 'Task';
                    const due = wrapper.querySelector('#todo-edit-date').value;
                    const time = wrapper.querySelector('#todo-edit-time').value;
                    const done = wrapper.querySelector('#todo-edit-done').checked;

                    const prevDue = item.due;
                    const prevTitle = item.t;
                    item.t = title;
                    item.due = due || undefined;
                    item.time = time || undefined;
                    item.d = done;

                    saveData();
                    renderTodoList();
                }
            }
        ]
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_GAMES - Ігровий центр
// ═══════════════════════════════════════════════════════════════════════════════

function renderGameMenu() {
    const v = document.getElementById('view');
    // MERGED RENDER GAME MENU
    const gameList = Array.isArray(systemData.games) ? systemData.games : [];
    const reserved = ['snake', 'tetris', 'pico8'];
    const nameFor = (id, fallback) => {
        const found = gameList.find((g) => g && g.id === id);
        if (found && found.name) return found.name;
        return fallback;
    };
    const customGames = gameList
        .filter((g) => g && g.id && reserved.indexOf(g.id) === -1)
        .map((g) => `<div class="game-card" onclick="runGame('${g.id}')">${g.name}</div>`).join('');

    v.innerHTML = `<h2>GAME_CENTER</h2>
    <div class="game-hub">
        <div class="game-card" onclick="runGame('snake')">${nameFor('snake', 'SNAKE')}</div>
        <div class="game-card" onclick="runGame('tetris')">${nameFor('tetris', 'TETRIS')}</div>
        <div class="game-card" onclick="runGame('pico8')">PICO-8 (WEB)</div>
        ${customGames}
    </div>
    <div class="game-panels">
        <div id="game-area" class="game-area" style="display:none;">
            <div class="game-stage">
                <canvas id="game-canvas" width="640" height="480"></canvas>
                <div id="arena" class="custom-game" role="presentation"></div>
            </div>
            <div id="game-hint" class="game-hint">Arrows to move. Space/Enter to rotate. Esc to exit.</div>
        </div>
        <div id="pico-area" class="pico-panel" style="display:none;">
            <div class="game-toolbar">
                <input id="pico-url" class="todo-input" placeholder="PICO-8 widget URL" value="https://www.lexaloffle.com/bbs/widget.php?pid=celeste" aria-label="PICO-8 cart url">
                <button class="btn" onclick="loadPicoCart()">LOAD CART</button>
                <button class="btn" onclick="playPicoDemo()">PLAY CELESTE</button>
            </div>
            <div class="game-toolbar">
                <input id="pico-name" class="todo-input" placeholder="Cart name" style="max-width:220px;">
                <button class="btn btn-sm" onclick="savePicoEntry()">SAVE TO LIST</button>
            </div>
            <div id="pico-list" class="pico-list"></div>
            <iframe id="pico-frame" src="" style="width:100%; height:70vh; border:1px solid var(--text); background:#000;"></iframe>
        </div>
    </div>
    <div class="game-footer">
        <div id="game-status" aria-live="polite">Select a game to start.</div>
        <button class="btn btn-red" onclick="stopGames()">EXIT_GAME</button>
    </div>`;

    renderPicoList();
}

window.loadPicoCart = function () {
    const input = document.getElementById('pico-url');
    const url = input && input.value ? input.value.trim() : '';
    if (!url) { showModal({ title: 'No URL', body: 'Paste a PICO-8 web cart URL first.' }); return; }
    document.getElementById('pico-frame').src = url;
    const status = document.getElementById('game-status');
    if (status) status.innerText = 'Loading PICO-8 cart...';
}

window.playPicoDemo = function () {
    const demo = 'https://www.lexaloffle.com/bbs/widget.php?pid=celeste';
    const input = document.getElementById('pico-url');
    if (input) input.value = demo;
    document.getElementById('pico-frame').src = demo;
    const status = document.getElementById('game-status');
    if (status) status.innerText = 'Playing Celeste demo';
}

function renderPicoList() {
    const box = document.getElementById('pico-list');
    if (!box) return;
    if (!Array.isArray(systemData.picoCarts)) systemData.picoCarts = [];
    if (!systemData.picoCarts.length) {
        box.innerHTML = '<div class="muted">No saved carts yet.</div>';
        return;
    }
    box.innerHTML = '';
    systemData.picoCarts.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'pico-item';
        row.innerHTML = `<div class="pico-title">${c.name || 'Cart ' + (idx + 1)}</div><div class="pico-url">${c.url}</div>`;
        const actions = document.createElement('div');
        actions.className = 'pico-actions';
        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-sm';
        loadBtn.innerText = 'LOAD';
        loadBtn.onclick = () => loadSavedPico(idx);
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-red';
        delBtn.innerText = 'DEL';
        delBtn.onclick = () => removePicoEntry(idx);
        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);
        row.appendChild(actions);
        box.appendChild(row);
    });
}

window.savePicoEntry = function () {
    const nameInput = document.getElementById('pico-name');
    const urlInput = document.getElementById('pico-url');
    const url = urlInput && urlInput.value ? urlInput.value.trim() : '';
    const name = nameInput && nameInput.value ? nameInput.value.trim() : 'Cart';
    if (!url) { showModal({ title: 'No URL', body: 'Paste a PICO-8 cart URL first.' }); return; }
    if (!Array.isArray(systemData.picoCarts)) systemData.picoCarts = [];
    systemData.picoCarts.push({ name, url });
    saveData();
    renderPicoList();
    showToast('PICO-8 cart saved', 'success');
};

window.loadSavedPico = function (idx) {
    if (!Array.isArray(systemData.picoCarts)) return;
    const cart = systemData.picoCarts[idx];
    if (!cart) return;
    const input = document.getElementById('pico-url');
    if (input) input.value = cart.url;
    loadPicoCart();
    const status = document.getElementById('game-status');
    if (status) status.innerText = `Loaded ${cart.name || 'cart'}`;
};

window.removePicoEntry = function (idx) {
    if (!Array.isArray(systemData.picoCarts)) return;
    systemData.picoCarts.splice(idx, 1);
    saveData();
    renderPicoList();
};

/** gameInterval - Інтервал активної гри для коректної зупинки */
var gameInterval = null; // Renamed from gameInt to match new code
var gameCleanup = null;
function setGameTimer(handle) {
    gameInterval = handle;
    window.gameInt = handle;
    return handle;
}
function stopGames() {
    if (gameInterval) clearInterval(gameInterval);
    if (window.gameInt) {
        try { clearInterval(window.gameInt); } catch (e) { }
    }
    if (typeof gameCleanup === 'function') {
        try { gameCleanup(); } catch (e) { }
    }
    gameInterval = null;
    window.gameInt = null;
    gameCleanup = null;
    const gameArea = document.getElementById('game-area');
    if (gameArea) gameArea.style.display = 'none';
    const customHost = document.getElementById('arena');
    if (customHost) { customHost.innerHTML = ''; customHost.style.display = 'none'; }
    const canvas = document.getElementById('game-canvas');
    if (canvas) { canvas.style.display = 'block'; }
    const hint = document.getElementById('game-hint');
    if (hint) { hint.innerText = 'Arrows to move. Space/Enter to rotate. Esc to exit.'; }
    const picoArea = document.getElementById('pico-area');
    if (picoArea) picoArea.style.display = 'none';
    const status = document.getElementById('game-status');
    if (status) status.innerText = 'Game stopped';
    // stopScreensaver(); // Just in case - assuming this function exists elsewhere or is a placeholder
}

function sizeGameCanvas() {
    const area = document.getElementById('game-area');
    const canvas = document.getElementById('game-canvas');
    if (!area || !canvas) return;
    const baseW = 640, baseH = 480;
    const maxW = area.parentElement ? area.parentElement.clientWidth - 20 : baseW;
    const scale = Math.min(1, maxW / baseW);
    canvas.style.width = Math.floor(baseW * scale) + 'px';
    canvas.style.height = Math.floor(baseH * scale) + 'px';
}

window.addEventListener('resize', sizeGameCanvas);

// --- BUILT-IN MINI GAMES (SAFE DEFAULTS) ---

// Predeclare handlers to avoid ReferenceErrors during resolution
function startSnake(canvas, ctx) {
    const gridSize = 20;
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    let snake = [{ x: 5, y: 5 }];
    let dir = { x: 1, y: 0 };
    let food = { x: 10, y: 10 };
    let alive = true;

    const keyHandler = (e) => {
        if (e.key === 'ArrowUp' && dir.y === 0) dir = { x: 0, y: -1 };
        if (e.key === 'ArrowDown' && dir.y === 0) dir = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft' && dir.x === 0) dir = { x: -1, y: 0 };
        if (e.key === 'ArrowRight' && dir.x === 0) dir = { x: 1, y: 0 };
    };
    document.addEventListener('keydown', keyHandler);

    const spawnFood = () => {
        food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    };

    const loop = () => {
        if (!alive) return;
        const head = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };
        // Collision with self
        if (snake.some((s) => s.x === head.x && s.y === head.y)) {
            alive = false;
            ctx.fillStyle = '#f55';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
            return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            playSfx(900, 'square', 0.05);
            spawnFood();
        } else {
            snake.pop();
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text') || '#0f0';
        snake.forEach((s) => ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2));
        ctx.fillStyle = '#f50';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    };

    setGameTimer(setInterval(loop, 120));
    gameCleanup = () => document.removeEventListener('keydown', keyHandler);
}

function startTetris(canvas, ctx) {
      const cols = 10, rows = 20, size = 24;
      canvas.width = cols * size;
      canvas.height = rows * size;
    const shapes = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [1, 1, 1]],
    ];
    const board = Array.from({ length: rows }, () => Array(cols).fill(0));
    let current = { shape: shapes[Math.floor(Math.random() * shapes.length)], x: 3, y: 0 };

    const canMove = (dx, dy, shape = current.shape) => {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {
                if (!shape[y][x]) continue;
                const nx = current.x + dx + x;
                const ny = current.y + dy + y;
                if (nx < 0 || nx >= cols || ny >= rows) return false;
                if (ny >= 0 && board[ny][nx]) return false;
            }
        }
        return true;
    };

    const mergePiece = () => {
        current.shape.forEach((row, y) => row.forEach((val, x) => {
            if (val) board[current.y + y][current.x + x] = 1;
        }));
        clearLines();
        current = { shape: shapes[Math.floor(Math.random() * shapes.length)], x: 3, y: 0 };
    };

    const clearLines = () => {
        for (let y = rows - 1; y >= 0; y--) {
            if (board[y].every((v) => v)) {
                board.splice(y, 1);
                board.unshift(Array(cols).fill(0));
                playSfx(800, 'sine', 0.05);
            }
        }
    };

    const rotate = () => {
        const rotated = current.shape[0].map((_, idx) => current.shape.map((row) => row[idx]).reverse());
        if (canMove(0, 0, rotated)) current.shape = rotated;
    };

    const keyHandler = (e) => {
        if (e.key === 'ArrowLeft' && canMove(-1, 0)) current.x -= 1;
        if (e.key === 'ArrowRight' && canMove(1, 0)) current.x += 1;
        if (e.key === 'ArrowDown' && canMove(0, 1)) current.y += 1;
        if (e.key === 'ArrowUp') rotate();
        if (e.key === ' ') {
            while (canMove(0, 1)) current.y += 1;
            mergePiece();
        }
    };
    document.addEventListener('keydown', keyHandler);

    const draw = () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text') || '#0f0';
        board.forEach((row, y) => row.forEach((val, x) => {
            if (val) ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        }));
        current.shape.forEach((row, y) => row.forEach((val, x) => {
            if (val) ctx.fillRect((current.x + x) * size + 1, (current.y + y) * size + 1, size - 2, size - 2);
        }));
    };

    const tick = () => {
        if (canMove(0, 1)) {
            current.y += 1;
        } else {
            mergePiece();
        }
        draw();
    };

    draw();
    setGameTimer(setInterval(tick, 450));
    gameCleanup = () => document.removeEventListener('keydown', keyHandler);
}

  /** runGame - Запускає обрану гру */
  function runGame(id) {
      const area = document.getElementById('game-area');
      const pico = document.getElementById('pico-area');
      const canvas = document.getElementById('game-canvas');
      const customHost = document.getElementById('arena');
      const hint = document.getElementById('game-hint');
      if (!area || !pico || !canvas) return; // Error safety
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      stopGames(); // Clear previous

      if (id === 'pico8') {
          pico.style.display = 'flex';
            const input = document.getElementById('pico-url');
            const url = input && input.value ? input.value : 'https://www.lexaloffle.com/bbs/widget.php?pid=celeste';
          document.getElementById('pico-frame').src = url;
          if (customHost) { customHost.innerHTML = ''; customHost.style.display = 'none'; }
          const status = document.getElementById('game-status');
          if (status) status.innerText = 'PICO-8 web player ready';
          return;
      }

      area.style.display = 'block';
      sizeGameCanvas();
      if (customHost) { customHost.innerHTML = ''; customHost.style.display = 'none'; }
      canvas.style.display = 'block';
      if (hint) { hint.style.display = 'block'; hint.innerText = 'Arrows to move. Space/Enter to rotate. Esc to exit.'; }
      const status = document.getElementById('game-status');
      if (status) status.innerText = `Running ${id.toUpperCase()}`;

      const customGame = (Array.isArray(systemData.games) ? systemData.games : []).find(g => g.id === id);
      const customCode = customGame && customGame.code ? customGame.code.trim() : '';
      if (customCode && customHost) {
          customHost.style.display = 'block';
          canvas.style.display = 'none';
          if (hint) hint.innerText = 'Custom game active — code comes from admin.';
          try {
              new Function('gameCanvas', 'gameCtx', 'host', 'systemData', 'helpers', customCode)(
                  canvas,
                  ctx,
                  customHost,
                  systemData,
                  {
                      stopGames: stopGames,
                      playSfx: playSfx,
                      saveData: saveData,
                      setInterval: function (fn, t) { return setGameTimer(setInterval(fn, t)); },
                      setTimeout: setTimeout,
                      requestAnimationFrame: requestAnimationFrame
                  }
              );
              return;
          } catch (err) {
              customHost.innerHTML = '<div class="game-error">Custom game failed to run.</div>';
              showModal({ title: 'Game Error', body: 'Failed to run custom game: ' + err.message });
              if (status) status.innerText = 'Custom game error';
              return;
          }
      }

      const handlers = {
          snake: typeof window.startSnake === 'function' ? window.startSnake : startSnake,
          tetris: typeof window.startTetris === 'function' ? window.startTetris : startTetris,
      };

      if (typeof handlers[id] === 'function') {
          handlers[id](canvas, ctx);
          return;
      }

      // Graceful fallback for unknown/missing games
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text') || '#fff';
      ctx.textAlign = 'center';
      ctx.font = '16px monospace';
      ctx.fillText('Game not available', canvas.width / 2, canvas.height / 2);
  }

  window.startSnake = typeof window.startSnake === 'function' ? window.startSnake : startSnake;
  window.startTetris = typeof window.startTetris === 'function' ? window.startTetris : startTetris;

/**
 * renderGallery - Рендерить сітку галереї
 * Відображає фото або ASCII-арт залежно від обраної категорії
 */
function renderGallery() {
    const v = document.getElementById('view');
    v.innerHTML = `<h2>Gallery.Manager</h2><div class="obs-tabs" id="g-t"></div><div class="gallery-grid" id="g-g"></div>`;
    systemData.gallery.cats.forEach(c => {
        const b = document.createElement('button');
        b.className = `obs-tab-btn ${c === currentGalCat ? 'active' : ''}`;
        b.innerText = c;
        b.onclick = () => { currentGalCat = c; renderGallery(); };
        document.getElementById('g-t').appendChild(b);
    });
    systemData.gallery[currentGalCat].forEach((i, idx) => {
        document.getElementById('g-g').innerHTML += `
                <div class="gallery-item">
                    <div class="gallery-thumb" onclick="expandGallery('${currentGalCat}', ${idx})" style="cursor:pointer" title="Click to Expand">
                        ${currentGalCat === 'ASCII_ART' ? '<pre style="font-size:0.6rem">' + i.a + '</pre>' : '<img src="' + i.a + '" onerror="this.parentElement.innerHTML=\'[IMAGE_NOT_FOUND]\'"/>'}
                    </div>
                    <div style="margin-top:10px; font-size:0.7rem; opacity:0.7;">NAME: ${i.n}<br>DATE: ${i.d}</div>
                </div>`;
    });
}

// EXPAND GALLERY (FIXED: Fullscreen + No Scroll + Filters)
/**
 * expandGallery - Відкриває зображення або ASCII-арт на весь екран
 * Supports MONO and PIXEL filters
 */
window.expandGallery = function (c, i) {
    const item = systemData.gallery[c][i];
    const overlay = document.createElement('div');
    overlay.id = 'gallery-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column; cursor:pointer;";

    // Disable Page Scroll
    document.body.style.overflow = 'hidden';

    // CLOSE FUNCTION
    const closeGal = function (e) {
        if (e) e.stopPropagation();
        const el = document.getElementById('gallery-overlay');
        if (el) document.body.removeChild(el);
        document.body.style.overflow = ''; // Restore Scroll
    };

    let content = '';
    let isImg = c !== 'ASCII_ART';

    if (!isImg) {
        content = `<pre style="color:var(--text); font-size:0.8rem; overflow:auto; max-width:90vw; max-height:90vh;">${item.a}</pre>`;
    } else {
        // IMAGE CONTAINER FOR FILTERS
        // We use a container to apply tint (Mono) via mix-blend-mode or absolute overlay
        content = `<div id="img-container" style="position:relative; max-width:90vw; max-height:70vh;">
            <img id="gal-img" src="${item.a}" style="max-width:100%; max-height:70vh; object-fit:contain; border:2px solid var(--text); transition:0.2s;">
            <div id="tint-layer" style="position:absolute; inset:0; background:var(--text); mix-blend-mode:color; pointer-events:none; display:none;"></div>
        </div>`;
    }

    let controls = '';
    if (isImg) {
        controls = `<div style="display:flex; gap:10px; margin-top:15px; z-index:10001;" onclick="event.stopPropagation()">
            <button class="btn" onclick="toggleGalFilter('mono')">[ MONO ]</button>
            <button class="btn" onclick="toggleGalFilter('pixel')">[ PIXEL ]</button>
            <button class="btn btn-red" onclick="closeGal()">[ CLOSE ]</button>
        </div>`;
    } else {
        controls = `<div style="margin-top:20px;" onclick="closeGal()"><button class="btn btn-red">[ CLOSE ]</button></div>`;
    }

    overlay.onclick = function (e) { if (e.target === overlay) closeGal(); };

    overlay.innerHTML = `${content}
        <div style="margin-top:10px; color:var(--text); font-family:monospace; cursor:default;" onclick="event.stopPropagation()">${item.n}</div>
        ${controls}`;

    // Expose close globally for the button
    window.closeGal = closeGal;

    document.body.appendChild(overlay);
    playSfx(600, 'square', 0.1);
}


window.toggleGalFilter = function (type) {
    const img = document.getElementById('gal-img');
    const tint = document.getElementById('tint-layer');
    if (!img) return;

    if (type === 'pixel') {
        // Toggle Pixelation
        if (img.dataset.pixelated === 'true') {
            // Restore
            if (img.dataset.origSrc) img.src = img.dataset.origSrc;
            img.style.imageRendering = 'auto';
            img.style.transform = 'scale(1)';
            img.dataset.pixelated = 'false';
        } else {
            // Apply Strong Pixelation via Canvas
            if (!img.dataset.origSrc) img.dataset.origSrc = img.src;

            const scale = 0.05; // Stronger pixelation (5%)
            const canvas = document.createElement('canvas');
            const cw = Math.floor(img.naturalWidth * scale);
            const ch = Math.floor(img.naturalHeight * scale);

            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');

            // Draw small
            ctx.drawImage(img, 0, 0, cw, ch);

            // Get data
            const pixelData = canvas.toDataURL();

            img.src = pixelData;
            img.style.imageRendering = 'pixelated';
            img.style.transform = 'scale(1)'; // Browser upscales it automatically because img tag has specific size or max-width
            img.dataset.pixelated = 'true';
        }
    } else if (type === 'mono') {
        if (tint.style.display === 'block') {
            tint.style.display = 'none';
            img.style.filter = 'none';
        } else {
            // Apply Mono
            tint.style.display = 'block';
            img.style.filter = 'grayscale(100%) contrast(1.2) brightness(0.9)';
        }
    }
    playSfx(800);
}
// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_CONTACTS - Контакти та мережевий статус
// ═══════════════════════════════════════════════════════════════════════════════

/** renderLinks - Рендерить сторінку контактів та друзів */
function renderLinks() {
    const linksHtml = systemData.contacts.map(c => `<a href="${c.url}" target="_blank" class="node-link"><span style="opacity:0.6">#</span> ${c.label}</a>`).join('');
    const friendsHtml = (systemData.friends || []).map(f => `<a href="${f.url}" target="_blank" class="node-link" style="opacity:${f.status === 'OFFLINE' ? 0.5 : 1}"><span style="opacity:0.6; color:${f.status === 'ONLINE' ? '#0f0' : 'inherit'}">●</span> ${f.label} <span style="font-size:0.7rem; margin-left:auto; opacity:0.7">[${f.status}]</span></a>`).join('');

    // HIRE BUTTON LOGIC
    let hireHtml = '';
    if (systemData.hireMe && systemData.hireMe.active) {
        hireHtml = `<div style="margin-top:30px; text-align:center; padding-top:20px; border-top:1px dashed var(--text);"><button onclick="unlockResume()" class="btn" style="border:2px solid var(--text); padding:15px 40px; font-size:1.2rem; font-weight:bold;">[ ! ] HIRE_ME_PROTOCOL [ ! ]</button></div>`;
    }

    document.getElementById('view').innerHTML = `<h2>NODE_NETWORK</h2><div class="node-grid"><div class="node-card"><div class="node-status">ONLINE</div><h3>[ ME ]</h3>${linksHtml}</div><div class="node-card"><div class="node-status">NET_SCAN</div><h3>[ FRIENDS ]</h3>${friendsHtml || '<div class="node-link" style="opacity:0.5">Scanning... No peers found.</div>'}</div></div>${hireHtml}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_EASTER - Великодні яйця (Easter Eggs)
// ═══════════════════════════════════════════════════════════════════════════════

/** easterEggLogo - Секретна анімація при кліку на логотип */
function easterEggLogo() {
    logoClicks++;
    const logo = document.getElementById('logo-text');
    if (logoClicks === 3) logo.innerText = "vvs@cl0w.nz:~$ flash warning!";
    if (logoClicks >= 5) {
        playSfx(150, 'square', 1.5);
        let count = 0;
        glitchTriggered = true; checkAdminUnlock();
        const interval = setInterval(() => {
            const steps = systemData.glitch.logoSteps;
            const randomPhrase = steps[Math.floor(Math.random() * steps.length)];
            if (logo.innerText !== randomPhrase) logo.innerText = randomPhrase;
            const rt = themesList[Math.floor(Math.random() * themesList.length)].id; setTheme(rt);
            document.getElementById('main-frame').classList.toggle('glitch-active');
            count++;
            if (count >= 8) { clearInterval(interval); logoClicks = 0; document.getElementById('main-frame').classList.remove('glitch-active'); logo.innerText = " vvs@cl0w.nz:~$"; }
        }, 120);
    }
}
/** checkAdminUnlock - Перевіряє умови прихованого розблокування адмін-панелі */
function checkAdminUnlock() {
    if (glitchTriggered && mintEvaClicks >= 10) {
        const btn = document.getElementById('nav-admin');
        if (btn.style.display !== 'block') { btn.style.display = 'block'; playSfx(800, 'square', 0.5); showToast('SYSTEM OVERRIDE: ADMIN ACCESS UNLOCKED', 'success'); }
    }
}
/** easterEggClown - Секретний оверлей з клоуном */
function easterEggClown() { clownClicks++; if (clownClicks >= 5) { playSfx(400); setTimeout(() => playSfx(300), 100); const o = document.getElementById('clown-overlay'); o.style.display = 'flex'; setTimeout(() => { o.style.display = 'none'; clownClicks = 0; }, 1000); } }
/** easterEggClock - Перемикає матричний фон */
function easterEggClock() { const m = document.getElementById('matrix-bg'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; if (m.style.display === 'block') startMatrix(); }
/** startMatrix - Запускає анімацію дощу символів Matrix */
function startMatrix() { const c = document.getElementById('matrix-bg'), x = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight; const col = Array(Math.floor(c.width / 16)).fill(1); setInterval(() => { x.fillStyle = "rgba(0,0,0,0.05)"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = getComputedStyle(document.body).getPropertyValue('--text'); col.forEach((y, i) => { x.fillText(String.fromCharCode(33 + Math.random() * 90), i * 16, y * 16); if (y * 16 > c.height && Math.random() > 0.975) col[i] = 0; col[i]++; }); }, 50); }

/** renderDynamicLogo - Оновлює текст логотипу та заголовка сторінки */
function renderDynamicLogo() {
    if (document.getElementById('matrix-bg')) startMatrix();
    if (systemData.home && systemData.home.logoText) {
        document.title = systemData.home.logoText;
        const logoEl = document.getElementById('logo-text');
        if (logoEl) logoEl.innerText = systemData.home.logoText;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_INIT - Головна ініціалізація (Entry Point)
// ═══════════════════════════════════════════════════════════════════════════════

/** window.onload - Початкове завантаження, ініціалізація даних та початкова навігація */
window.onload = () => {
    initData();
    const savedTheme = localStorage.getItem('vvs_theme_v12'); if (savedTheme) document.body.className = `theme-${savedTheme}`;
    renderDynamicLogo();

    if (sessionStorage.getItem('boot_shown')) {
        document.getElementById('boot').style.display = 'none';
        nav('home');
    } else {
        let i = 0; const logs = ["BOOTING...", "HACKING PENTAGON: OK", "STATUS: ONLINE"];
        const t = setInterval(() => {
            if (i < logs.length) {
                const l = document.createElement('div');
                l.className = 'boot-line';
                l.innerText = '> ' + logs[i];
                document.getElementById('boot-log').appendChild(l);
                i++;
                document.getElementById('boot-bar').style.width = (i / logs.length) * 100 + "%";
            } else {
                clearInterval(t);
                setTimeout(() => {
                    document.getElementById('boot').style.display = 'none';
                    sessionStorage.setItem('boot_shown', 'true');
                    nav('home');
                }, 400);
            }
        }, 250);
    }

    setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
    setInterval(() => { const p = systemData.glitch.footerPhrases; document.getElementById('funny-phrase').innerText = p[Math.floor(Math.random() * p.length)]; }, 5000);
    document.addEventListener('click', (e) => { const menu = document.getElementById('theme-popup'); const btn = document.querySelector('.theme-toggle-btn'); if (!menu.contains(e.target) && e.target !== btn && menu.classList.contains('show')) { menu.classList.remove('show'); } });
};

