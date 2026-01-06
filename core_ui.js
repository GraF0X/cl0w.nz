
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
let lastQRDataUrl = '';
let lastQRSvgMarkup = '';
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
            if (!systemData.screensaver) systemData.screensaver = JSON.parse(JSON.stringify(defaultData.screensaver));
            if (!systemData.screensaver.catalog) systemData.screensaver.catalog = JSON.parse(JSON.stringify(defaultData.screensaver.catalog));
            if (!systemData.screensaver.type) systemData.screensaver.type = 'matrix';
            if (typeof systemData.screensaver.enabled === 'undefined') systemData.screensaver.enabled = true;
            if (!systemData.screensaver.timeout) systemData.screensaver.timeout = 60;

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
let playgroundWindowState = null;

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

function loadPlaygroundWindowState() {
    if (playgroundWindowState) return playgroundWindowState;
    playgroundWindowState = {
        system: { open: true, x: 24, y: 24 },
        files: { open: true, x: 360, y: 28 },
        console: { open: true, x: 24, y: 320 },
        three: { open: true, x: 360, y: 320 }
    };
    try {
        const raw = localStorage.getItem('playground-windows');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') playgroundWindowState = Object.assign(playgroundWindowState, parsed);
        }
    } catch (e) { /* ignore */ }
    return playgroundWindowState;
}

function savePlaygroundWindowState() {
    if (!playgroundWindowState) return;
    try { localStorage.setItem('playground-windows', JSON.stringify(playgroundWindowState)); } catch (e) { /* ignore */ }
}

function savePlaygroundFiles() {
    try { localStorage.setItem('playground-files', JSON.stringify(playgroundFiles)); } catch (e) { /* ignore */ }
}

function getPlaygroundThreeExamples() {
    if (window.threeLab && typeof window.threeLab.getExamples === 'function') {
        return window.threeLab.getExamples();
    }
    return [];
}

function loadThreeExample(id) {
    if (window.threeLab && typeof window.threeLab.loadExample === 'function') {
        window.threeLab.loadExample(id);
        return;
    }
    const status = document.getElementById('pg-demo-status');
    if (status) status.innerText = '3D lab unavailable';
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

function wirePlaygroundDesktop() {
    loadPlaygroundWindowState();
    updatePlaygroundWindowVisibility();
    const wins = document.querySelectorAll('.pg-window');
    wins.forEach(w => makePlaygroundWindowDraggable(w));
    const toggles = document.querySelectorAll('[data-pg-window]');
    toggles.forEach(btn => {
        btn.onclick = function () { togglePlaygroundWindow(btn.getAttribute('data-pg-window')); };
    });
}

function togglePlaygroundWindow(id) {
    if (!playgroundWindowState || !id) return;
    if (!playgroundWindowState[id]) playgroundWindowState[id] = { open: true, x: 30, y: 30 };
    playgroundWindowState[id].open = !playgroundWindowState[id].open;
    updatePlaygroundWindowVisibility();
    savePlaygroundWindowState();
}

function updatePlaygroundWindowVisibility() {
    const state = loadPlaygroundWindowState();
    const wins = document.querySelectorAll('.pg-window');
    wins.forEach(w => {
        const id = w.getAttribute('data-pg-id');
        const info = state[id] || {};
        w.style.display = info.open === false ? 'none' : 'flex';
        if (typeof info.x === 'number' && typeof info.y === 'number') {
            w.style.left = info.x + 'px';
            w.style.top = info.y + 'px';
        }
    });

    document.querySelectorAll('[data-pg-window]').forEach(btn => {
        const id = btn.getAttribute('data-pg-window');
        const info = state[id] || {};
        if (info.open === false) btn.classList.remove('active'); else btn.classList.add('active');
    });
}

function makePlaygroundWindowDraggable(win) {
    if (!win) return;
    const bar = win.querySelector('.pg-titlebar');
    if (!bar) return;
    bar.onpointerdown = function (e) {
        if (e.button !== 0) return;
        const id = win.getAttribute('data-pg-id');
        const area = document.getElementById('pg-window-area');
        const areaRect = area ? area.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const rect = win.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const move = function (ev) {
            let x = ev.clientX - areaRect.left - offsetX;
            let y = ev.clientY - areaRect.top - offsetY;
            x = Math.max(0, Math.min(areaRect.width - rect.width, x));
            y = Math.max(0, Math.min(areaRect.height - rect.height, y));
            win.style.left = x + 'px';
            win.style.top = y + 'px';
            if (id && playgroundWindowState && playgroundWindowState[id]) {
                playgroundWindowState[id].x = x;
                playgroundWindowState[id].y = y;
            }
        };
        const up = function () {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            savePlaygroundWindowState();
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    };
}

function submitPlaygroundCommand(evt) {
    if (!evt || evt.key !== 'Enter') return;
    evt.preventDefault();
    const cmd = evt.target.value;
    const codeBox = document.getElementById('code-in');
    if (codeBox) codeBox.value = cmd;
    runPlayground();
    evt.target.value = '';
}

function playgroundPosStyle(id) {
    const state = loadPlaygroundWindowState();
    const info = state[id] || {};
    const x = typeof info.x === 'number' ? info.x : 20;
    const y = typeof info.y === 'number' ? info.y : 20;
    return `style="left:${x}px; top:${y}px;"`;
}

function renderPlaygroundPolygon() {
    const main = document.querySelector('main');
    if (main) {
        if (!main.dataset.prevOverflow) main.dataset.prevOverflow = main.style.overflow || '';
        main.style.overflow = 'hidden';
        pcScrollCleanup = function () {
            main.style.overflow = main.dataset.prevOverflow || '';
            if (window.threeLab && typeof window.threeLab.teardownFoxLab === 'function') {
                window.threeLab.teardownFoxLab();
            }
        };
    }

    loadPlaygroundFiles();
    loadPlaygroundWindowState();
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
    const threeDemos = getPlaygroundThreeExamples();

    v.innerHTML = `
    <div class="pg-desktop">
        <div class="pg-toolbar">
            <div class="pg-title">🎛️ Playground Polygon</div>
            <div class="pg-toggle-row">
                <button class="btn btn-sm" data-pg-window="system">System</button>
                <button class="btn btn-sm" data-pg-window="files">Files</button>
                <button class="btn btn-sm" data-pg-window="console">Console</button>
                <button class="btn btn-sm" data-pg-window="three">3D Lab</button>
                <button class="btn btn-sm" onclick="nav('home')">Exit</button>
            </div>
        </div>
        <div class="pg-window-area" id="pg-window-area">
            <section class="pg-window" data-pg-id="system" ${playgroundPosStyle('system')}>
                <div class="pg-titlebar">
                    <div class="pg-titletext">System Monitor</div>
                    <div class="pg-title-actions">
                        <button class="pg-mini" onclick="togglePlaygroundWindow('system')">×</button>
                    </div>
                </div>
                <div class="pg-body">
                    <div class="stat-row"><span>Platform</span><strong>${platform}</strong></div>
                    <div class="stat-row"><span>Cores</span><strong>${cores}</strong></div>
                    <div class="stat-row"><span>RAM</span><strong>${mem} GB</strong></div>
                    <div class="stat-row"><span>Network</span><strong>${navigator.onLine ? 'ONLINE' : 'OFFLINE'} / ${net}</strong></div>
                    <div class="panel-sub">Live counts</div>
                    <div class="hud-grid">
                        <div class="hud-card">Saver: <strong>${saverName}</strong></div>
                        <div class="hud-card">Theme: <strong>${themeActive}</strong></div>
                        <div class="hud-card">Games: <strong>${gamesCount}</strong></div>
                        <div class="hud-card">Todos: <strong>${todoCount}</strong></div>
                    </div>
                    <div class="panel-note">Drag any window by its header. Use the toolbar to reopen closed panels.</div>
                </div>
            </section>

            <section class="pg-window" data-pg-id="files" ${playgroundPosStyle('files')}>
                <div class="pg-titlebar">
                    <div class="pg-titletext">File System</div>
                    <div class="pg-title-actions">
                        <button class="pg-mini" onclick="togglePlaygroundWindow('files')">×</button>
                    </div>
                </div>
                <div class="pg-body fs-manager">
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

            <section class="pg-window" data-pg-id="console" ${playgroundPosStyle('console')}>
                <div class="pg-titlebar">
                    <div class="pg-titletext">Console</div>
                    <div class="pg-title-actions">
                        <button class="pg-mini" onclick="togglePlaygroundWindow('console')">×</button>
                    </div>
                </div>
                <div class="pg-body">
                    <textarea id="code-in" class="playground-code" placeholder="console.log('Hello polygon')"></textarea>
                    <input id="pg-lab-terminal" class="playground-term" placeholder=":> type and press Enter" onkeydown="submitPlaygroundCommand(event)">
                    <div class="btn-row">
                        <button class="btn" onclick="runPlayground()">RUN</button>
                        <button class="btn" onclick="document.getElementById('code-out').innerText='>> cleared'">CLEAR</button>
                    </div>
                    <pre id="code-out" class="playground-output">>> ready</pre>
                </div>
            </section>

            <section class="pg-window pg-window-wide" data-pg-id="three" ${playgroundPosStyle('three')}>
                <div class="pg-titlebar">
                    <div class="pg-titletext">3D Lab</div>
                    <div class="pg-title-actions">
                        <button class="pg-mini" onclick="togglePlaygroundWindow('three')">×</button>
                    </div>
                </div>
                <div class="pg-body pg-three">
                    <div class="pg-fox-shell">
                        <div class="panel-sub">Skeletal preview</div>
                        <div id="fox-stage" class="fox-stage"></div>
                        <div class="panel-note">Rigged demo loaded inline with theme-aware chrome.</div>
                    </div>
                    <div class="pg-three-demos">
                        <div class="panel-sub">WebGL demos</div>
                        <div class="pg-demo-list">
                            ${threeDemos.map(d => `<button class="btn btn-sm" onclick="loadThreeExample('${d.id}')">${d.label}</button>`).join('') || '<div class="panel-note">No demos available</div>'}
                        </div>
                        <div class="pg-demo-frame" id="pg-demo-frame">
                            <canvas id="pg-demo-canvas"></canvas>
                            <div id="pg-demo-status" class="panel-note">Select a demo to load it inline.</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>`;

    renderPlaygroundFilesList();
    fillPlaygroundEditor();
    if (window.threeLab && typeof window.threeLab.setupFoxLab === 'function') {
        window.threeLab.setupFoxLab();
    } else {
        const holder = document.getElementById('fox-stage');
        if (holder) holder.innerHTML = '<div class="fox-loading">3D lab unavailable</div>';
    }
    loadThreeExample('skeletal');
    wirePlaygroundDesktop();
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

