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
