/* playground.js */
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
