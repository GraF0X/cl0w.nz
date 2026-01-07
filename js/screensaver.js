/* screensaver.js */
// #SECTION_SCREENSAVER - Screensavers
// ═══════════════════════════════════════════════════════════════════════════════

const saverCatalogDefaults = (defaultData && defaultData.screensaver && defaultData.screensaver.catalog)
    ? JSON.parse(JSON.stringify(defaultData.screensaver.catalog))
    : [
        { id: 'matrix', name: 'Matrix Rain', desc: 'Green code rain inspired by classic terminals.' },
        { id: 'fire', name: 'Pixel Fire', desc: 'Retro fire simulation with palette cycling.' },
        { id: 'pipes', name: 'Pipes', desc: 'Colorful wandering pipes across the screen.' },
        { id: 'dvd', name: 'DVD', desc: 'Bouncing DVD logo with rainbow tints.' },
        { id: 'trees', name: 'Fractal Trees', desc: 'Procedural trees growing across the canvas.' }
    ];

let ssTimer = null;
let ssActive = false;
let ssCanvas = null;
let ssCtx = null;
let ssReq = null;
const saverSlowdown = 2;

let saverPreviewReq = null;
let saverPreviewActive = false;
let saverPreviewCanvas = null;
let saverPreviewCtx = null;
let saverPreviewType = 'matrix';

function resetIdleTimer() {
    if (ssActive) stopScreensaver();
    clearTimeout(ssTimer);
    if (systemData.screensaver && systemData.screensaver.enabled) {
        ssTimer = setTimeout(startScreensaver, systemData.screensaver.timeout * 1000);
    }
}

function getSaverCatalog() {
    if (!systemData.screensaver) systemData.screensaver = JSON.parse(JSON.stringify(defaultData.screensaver));
    if (!Array.isArray(systemData.screensaver.catalog)) systemData.screensaver.catalog = JSON.parse(JSON.stringify(saverCatalogDefaults));
    if (systemData.screensaver.catalog.length === 0) systemData.screensaver.catalog = JSON.parse(JSON.stringify(saverCatalogDefaults));
    return systemData.screensaver.catalog;
}

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);

window.startScreensaver = function (previewType) {
    if (ssActive) stopScreensaver();
    const catalog = getSaverCatalog();
    const fallbackType = catalog[0] ? catalog[0].id : 'matrix';
    if (!systemData.screensaver) systemData.screensaver = { enabled: true, timeout: 60, type: fallbackType };
    let type = previewType || (systemData.screensaver ? systemData.screensaver.type : fallbackType);
    if (!catalog.find(c => c.id === type)) type = fallbackType;
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
    if (ssCanvas) {
        ssCanvas.style.width = '100%';
        ssCanvas.style.height = '100%';
        const bounds = overlay.getBoundingClientRect();
        ssCanvas.width = bounds.width || window.innerWidth;
        ssCanvas.height = bounds.height || window.innerHeight;
    }

    if (!ssCanvas || !ssCtx) {
        showToast('Screensaver canvas unavailable', 'error');
        return;
    }

    ssActive = true;
    saverPreviewActive = false;
    runSaverEffect(type, ssCanvas, ssCtx, false);
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
    if (document.getElementById('saver-preview-canvas')) {
        const wasActive = saverPreviewActive;
        startSaverPreview(saverPreviewType);
        if (!wasActive) stopSaverPreview();
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
    const catalog = getSaverCatalog();
    const current = (systemData.screensaver && systemData.screensaver.type) || (catalog[0] ? catalog[0].id : 'matrix');
    const timeout = systemData.screensaver && systemData.screensaver.timeout ? systemData.screensaver.timeout : 60;

    const cards = catalog.map(l => `<label class="saver-card ${current === l.id ? 'active' : ''}">
        <input type="radio" name="saver-type" value="${l.id}" ${current === l.id ? 'checked' : ''}>
        <div class="saver-name">${l.name}</div>
        <div class="saver-desc">${l.desc || ''}</div>
        <div class="saver-badge">${l.id}</div>
    </label>`).join('');

    v.innerHTML = `<h2>SCREENSAVER</h2>
        <p class="muted">Idle trigger and saver choice are managed in Admin. Preview the animations below.</p>
        <div class="saver-grid">${cards}</div>
        <div class="saver-actions">
            <div class="saver-status">Idle trigger: ${(systemData.screensaver && systemData.screensaver.enabled !== false) ? 'ON' : 'OFF'} (${timeout}s)</div>
            <div class="saver-action-buttons">
                <button class="btn" onclick="previewSaverInline()">INLINE PREVIEW</button>
                <button class="btn btn-green" onclick="previewSaver()">FULLSCREEN</button>
            </div>
        </div>
        <div class="saver-preview-shell">
            <canvas id="saver-preview-canvas" aria-label="Screensaver preview"></canvas>
        </div>`;

    v.querySelectorAll('.saver-card input').forEach(inp => {
        inp.addEventListener('change', () => {
            v.querySelectorAll('.saver-card').forEach(c => c.classList.remove('active'));
            inp.closest('.saver-card').classList.add('active');
            startSaverPreview(inp.value);
        });
    });

    startSaverPreview(current);
}

window.previewSaver = function () {
    const typeEl = document.querySelector('input[name="saver-type"]:checked');
    const type = typeEl && typeEl.value ? typeEl.value : 'matrix';
    startScreensaver(type);
};

window.previewSaverInline = function () {
    const typeEl = document.querySelector('input[name="saver-type"]:checked');
    const type = typeEl && typeEl.value ? typeEl.value : 'matrix';
    startSaverPreview(type);
};

function setupSaverPreviewCanvas() {
    saverPreviewCanvas = document.getElementById('saver-preview-canvas');
    if (saverPreviewCanvas) {
        const shell = saverPreviewCanvas.parentElement;
        const bounds = shell ? shell.getBoundingClientRect() : { width: window.innerWidth, height: 220 };
        saverPreviewCanvas.width = bounds.width || window.innerWidth;
        saverPreviewCanvas.height = Math.max(200, Math.min(bounds.height || 240, 320));
        saverPreviewCanvas.style.width = '100%';
        saverPreviewCanvas.style.height = saverPreviewCanvas.height + 'px';
        saverPreviewCtx = saverPreviewCanvas.getContext('2d');
    }
}

function stopSaverPreview() {
    saverPreviewActive = false;
    cancelAnimationFrame(saverPreviewReq);
}

function startSaverPreview(type) {
    setupSaverPreviewCanvas();
    stopSaverPreview();
    if (!saverPreviewCanvas || !saverPreviewCtx) return;
    const catalog = getSaverCatalog();
    const fallback = catalog[0] ? catalog[0].id : 'matrix';
    const finalType = catalog.find(c => c.id === type) ? type : fallback;
    saverPreviewType = finalType;
    saverPreviewCtx.clearRect(0, 0, saverPreviewCanvas.width, saverPreviewCanvas.height);
    saverPreviewActive = true;
    runSaverEffect(finalType, saverPreviewCanvas, saverPreviewCtx, true);
}

function runSaverEffect(type, canvas, ctx, isPreview) {
    const active = () => isPreview ? saverPreviewActive : ssActive;
    const makeReq = (fn) => {
        if (isPreview) saverPreviewReq = requestAnimationFrame(fn);
        else ssReq = requestAnimationFrame(fn);
    };
    const catalog = getSaverCatalog();
    const entry = catalog.find(c => c.id === type);
    const tryCustom = () => {
        if (!entry || !entry.code) return false;
        try {
            const runner = new Function('canvas', 'ctx', 'requestFrame', 'isActive', 'isPreview', entry.code);
            runner(canvas, ctx, (cb) => { if (typeof cb === 'function' && active()) makeReq(cb); }, active, !!isPreview);
            return true;
        } catch (err) {
            console.error('Custom saver failed', err);
            showToast('Failed to run custom saver', 'error');
            return false;
        }
    };
    if (tryCustom()) return;
    if (type === 'matrix') {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);
        let tick = 0;
        function draw() {
            if (!active()) return;
            if ((tick++ % saverSlowdown) !== 0) { makeReq(draw); return; }
            ctx.fillStyle = "rgba(0,0,0,0.08)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#0F0";
            ctx.font = fontSize + "px monospace";
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) drops[i] = 0;
                drops[i] += 0.5;
            }
            makeReq(draw);
        }
        draw();
    } else if (type === 'fire') {
        const w = 80; const h = 50;
        const fw = canvas.width / w; const fh = canvas.height / h;
        const firePixels = new Array(w * h).fill(0);
        const palette = ["#000", "#070707", "#1f0707", "#2f0f07", "#470f07", "#571707", "#671f07", "#771f07", "#8f2707", "#9f2f07", "#af3f07", "#bf4707", "#c74707", "#DF4F07", "#DF5707", "#DF5707", "#D75F07", "#D7670F", "#cf6f0f", "#cf770f", "#cf7f0f", "#CF8717", "#C78717", "#C78F17", "#C7971F", "#BF9F1F", "#BF9F1F", "#BFA727", "#BFA727", "#BFAF2F", "#B7AF2F", "#B7B72F", "#B7B737", "#CFCF6F", "#DFDF9F", "#EFEFC7", "#FFFFFF"];
        let tick = 0;
        function draw() {
            if (!active()) return;
            if ((tick++ % saverSlowdown) !== 0) { makeReq(draw); return; }
            for (let x = 0; x < w; x++) firePixels[(h - 1) * w + x] = Math.floor(Math.random() * 26);
            for (let y = 1; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const src = y * w + x;
                    const decay = Math.floor(Math.random() * 2);
                    const below = src + w;
                    const newVal = firePixels[below] - decay >= 0 ? firePixels[below] - decay : 0;
                    firePixels[src - decay + 1 >= 0 ? src - decay + 1 : src] = newVal;
                }
            }
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const color = palette[firePixels[y * w + x]];
                    ctx.fillStyle = color;
                    ctx.fillRect(x * fw, y * fh, fw + 1, fh + 1);
                }
            }
            makeReq(draw);
        }
        draw();
    } else if (type === 'pipes') {
        const pipes = [];
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        function addPipe() {
            pipes.push({ x: canvas.width / 2, y: canvas.height / 2, dir: dirs[Math.floor(Math.random() * dirs.length)], color: `hsl(${Math.random() * 360}, 80%, 60%)` });
        }
        addPipe();
        let tick = 0;
        function draw() {
            if (!active()) return;
            if ((tick++ % saverSlowdown) !== 0) { makeReq(draw); return; }
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            pipes.forEach(p => {
                ctx.strokeStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                p.x += p.dir.x * 4; p.y += p.dir.y * 4;
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                if (Math.random() < 0.1) p.dir = dirs[Math.floor(Math.random() * dirs.length)];
                if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) { p.x = canvas.width / 2; p.y = canvas.height / 2; }
            });
            if (pipes.length < 20 && Math.random() < 0.05) addPipe();
            makeReq(draw);
        }
        draw();
    } else if (type === 'dvd') {
        const logo = { x: 30, y: 30, dx: 1.4, dy: 1.2, w: 80, h: 40 };
        let tick = 0;
        function draw() {
            if (!active()) return;
            if ((tick++ % saverSlowdown) !== 0) { makeReq(draw); return; }
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = `hsl(${Date.now() % 360}, 80%, 60%)`;
            ctx.fillRect(logo.x, logo.y, logo.w, logo.h);
            ctx.fillStyle = '#000';
            ctx.fillText('DVD', logo.x + 20, logo.y + 24);
            logo.x += logo.dx; logo.y += logo.dy;
            if (logo.x <= 0 || logo.x + logo.w >= canvas.width) logo.dx *= -1;
            if (logo.y <= 0 || logo.y + logo.h >= canvas.height) logo.dy *= -1;
            makeReq(draw);
        }
        draw();
    } else {
        let trees = [];
        let tick = 0;
        function grow(t) {
            if (!active()) return;
            const len = (Math.random() * 0.5 + 0.5) * t.len;
            const nx = t.x + Math.cos(t.a) * len;
            const ny = t.y + Math.sin(t.a) * len;
            ctx.strokeStyle = `hsl(${120 + t.d * 10}, 50%, 70%)`;
            ctx.lineWidth = t.w;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(nx, ny);
            ctx.stroke();
            t.x = nx; t.y = ny; t.len *= 0.95; t.w *= 0.9; t.d += 1;
            if (t.len < 2 || t.w < 0.5) { t.done = true; return; }
            if (Math.random() < 0.05) {
                trees.push({ x: t.x, y: t.y, a: t.a - 0.4, len: t.len * 0.8, w: t.w * 0.7, d: t.d + 1, done: false });
                trees.push({ x: t.x, y: t.y, a: t.a + 0.4, len: t.len * 0.8, w: t.w * 0.7, d: t.d + 1, done: false });
                t.done = true;
            }
        }
        trees.push({ x: canvas.width / 2, y: canvas.height, a: -Math.PI / 2, len: 10, w: 10, d: 0, done: false });
        function draw() {
            if (!active()) return;
            if ((tick++ % saverSlowdown) !== 0) { makeReq(draw); return; }
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (Math.random() < 0.02) {
                trees.push({ x: Math.random() * canvas.width, y: canvas.height, a: -Math.PI / 2 + (Math.random() - 0.5), len: 5 + Math.random() * 5, w: 5 + Math.random() * 5, d: 0, done: false });
            }
            trees.forEach(grow);
            trees = trees.filter(t => !t.done);
            makeReq(draw);
        }
        draw();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
