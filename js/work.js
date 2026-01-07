/* work.js */
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

// --- QR GENERATOR (VERSION 1 OFFLINE FALLBACK + REMOTE SINGLE CODE) ---
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
        if (bytes.length > chunkLimit) throw new Error('Offline QR supports up to 17 bytes.');
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
                    if (m[row][col - dx] !== null) continue;
                    const c = col - dx;
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
async function generateQR() {
    const txtEl = document.getElementById('qr-text');
    const sizeEl = document.getElementById('qr-size');
    const formatEl = document.getElementById('qr-format');
    const txt = txtEl && typeof txtEl.value === 'string' ? txtEl.value : '';
    const size = parseInt((sizeEl && sizeEl.value) ? sizeEl.value : '256');
    const format = formatEl && formatEl.value ? formatEl.value : 'png';
    lastQRFormat = format; lastQRSize = size; lastQRText = txt;
    lastQRMatrix = null; lastQRDataUrl = ''; lastQRSvgMarkup = '';

    const info = document.getElementById('qr-page-info');
    if (info) info.innerText = 'SINGLE QR';
    const prevBtn = document.querySelector('button[onclick="shiftQRPage(-1)"]');
    const nextBtn = document.querySelector('button[onclick="shiftQRPage(1)"]');
    [prevBtn, nextBtn].forEach(btn => { if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; } });

    if (!txt.trim()) {
        const canvas = document.getElementById('qr-canvas');
        if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillText('Enter text', 10, 20); }
        const svgBox = document.getElementById('qr-svg');
        if (svgBox) svgBox.innerHTML = '';
        return;
    }
    const bytes = Array.from(new TextEncoder().encode(txt.trim()));
    const maxBytes = 5120;
    if (bytes.length > maxBytes) { showModal({ title: 'QR LIMIT', body: `Please keep QR content within ${maxBytes} bytes (~5KB).` }); return; }

    const canvas = document.getElementById('qr-canvas');
    const svgBox = document.getElementById('qr-svg');
    const offlineCap = 17;
    if (bytes.length <= offlineCap) {
        try {
            lastQRMatrix = qrEncoder.buildQRMatrix(bytes);
            if (format === 'svg') {
                const svg = matrixToSVG(lastQRMatrix, size);
                lastQRSvgMarkup = svg;
                if (svgBox) { svgBox.style.display = 'block'; if (canvas) canvas.style.display = 'none'; svgBox.innerHTML = svg; }
            } else if (canvas) {
                drawQRToCanvas(lastQRMatrix, size, canvas);
                lastQRDataUrl = canvas.toDataURL('image/png');
                canvas.style.display = 'block';
                if (svgBox) { svgBox.innerHTML = ''; svgBox.style.display = 'none'; }
            }
            return;
        } catch (e) {
            showModal({ title: 'QR ERROR', body: e && e.message ? e.message : 'Unable to build offline QR' });
        }
    }

    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(txt)}&size=${size}&format=${format === 'svg' ? 'svg' : 'png'}`;
    try {
        if (format === 'svg') {
            const res = await fetch(qrUrl);
            if (!res || !res.ok) throw new Error('QR request failed');
            const markup = await res.text();
            lastQRSvgMarkup = markup;
            if (svgBox) {
                svgBox.style.display = 'block';
                if (canvas) canvas.style.display = 'none';
                svgBox.innerHTML = markup;
            }
        } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => { img.onload = () => resolve(true); img.onerror = () => reject(new Error('QR image load failed')); img.src = qrUrl; });
            if (canvas) {
                canvas.width = size; canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                lastQRDataUrl = canvas.toDataURL('image/png');
                canvas.style.display = 'block';
                if (svgBox) { svgBox.innerHTML = ''; svgBox.style.display = 'none'; }
            }
        }
    } catch (e) {
        showModal({ title: 'QR ERROR', body: e && e.message ? e.message : 'Unable to build QR' });
    }
}

function downloadQR() {
    if (!lastQRText.trim()) { showModal({ title: 'NO QR', body: 'Generate QR first.' }); return; }
    if (lastQRFormat === 'svg') {
        let svg = lastQRSvgMarkup;
        if (!svg && lastQRMatrix) svg = matrixToSVG(lastQRMatrix, lastQRSize);
        if (!svg) { showModal({ title: 'NO QR', body: 'Generate QR first.' }); return; }
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'qr.svg'; a.click(); URL.revokeObjectURL(url);
    } else {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) { showModal({ title: 'NO QR', body: 'Generate QR first.' }); return; }
        if (lastQRMatrix) drawQRToCanvas(lastQRMatrix, lastQRSize, canvas);
        if (!lastQRDataUrl) lastQRDataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = lastQRDataUrl; a.download = 'qr.png'; a.click();
    }
}

function shiftQRPage() { return; }
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
