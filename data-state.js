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
