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

