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
