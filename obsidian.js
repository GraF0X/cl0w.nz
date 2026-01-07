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
