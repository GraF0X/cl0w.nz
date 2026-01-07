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
