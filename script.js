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
function toggleSound() { soundOn = !soundOn; document.getElementById('sound-toggle').innerText = soundOn ? '🕪' : '🕩'; }

let systemData = {};
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
            if (!systemData.resume.languages) systemData.resume.languages = defaultData.resume.languages;
            if (!systemData.resume.rnd) systemData.resume.rnd = defaultData.resume.rnd;
            if (typeof systemData.resume.rnd === 'string') systemData.resume.rnd = [systemData.resume.rnd];

            if (!systemData.about) systemData.about = JSON.parse(JSON.stringify(defaultData.about));
            // Migrate About to new structure
            if (!systemData.about.languages || !Array.isArray(systemData.about.languages)) {
                systemData.about.languages = JSON.parse(JSON.stringify(defaultData.about.languages));
                // Try to migrate existing UK/EN text if they differ from default
                if (systemData.about.uk && systemData.about.uk !== defaultData.about.languages.find(l => l.code === 'uk').text) {
                    const uk = systemData.about.languages.find(l => l.code === 'uk'); if (uk) uk.text = systemData.about.uk;
                }
                if (systemData.about.en && systemData.about.en !== defaultData.about.languages.find(l => l.code === 'en').text) {
                    const en = systemData.about.languages.find(l => l.code === 'en'); if (en) en.text = systemData.about.en;
                }
            }
            if (!systemData.about.activeLang) systemData.about.activeLang = 'uk'; // Default

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

            if (!systemData.home.logoText) systemData.home.logoText = defaultData.home.logoText;
            if (!systemData.home.browserTitle) systemData.home.browserTitle = defaultData.home.browserTitle || systemData.home.logoText.replace(':~$', '');

            if (!systemData.themes) systemData.themes = JSON.parse(JSON.stringify(defaultData.themes));
            // New theme trigger migration
            if (!systemData.themes.adminTriggerTheme) systemData.themes.adminTriggerTheme = 'mix-eva';

            updateCustomThemeCSS();

            const savedTheme = localStorage.getItem('vvs_theme_v13');
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                setTheme(systemData.themes.defaultId);
            }

        } catch (e) { systemData = JSON.parse(JSON.stringify(defaultData)); }
    } else {
        systemData = JSON.parse(JSON.stringify(defaultData));
        setTheme(systemData.themes.defaultId);
    }
    applyMenuVisibility(); // Apply on init
    renderDynamicLogo(); // Ensure logo is updated
}
function saveData() { localStorage.setItem('vvs_system_data_v15', JSON.stringify(systemData)); }

// --- MENU VISIBILITY LOGIC ---
function applyMenuVisibility() {
    const mv = systemData.menuVisibility;
    // Helper to safe toggle
    const toggle = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'block' : 'none';
    };

    toggle('nav-work', mv.work);
    toggle('nav-obsidian', mv.notes);
    toggle('nav-blog', mv.blog);
    toggle('nav-todo', mv.todo);
    toggle('nav-gallery', mv.gallery);
    toggle('nav-game', mv.game);
}

// --- THEMES ---
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

// --- CORE ---
let isTyping = false; let currentObsCat = 'SECURITY'; let currentObsFile = '';
let currentGalCat = 'ASCII_ART'; let logoClicks = 0; let clownClicks = 0;
let currentLang = 'uk'; let adminAuth = false;
let admNoteCat = ''; let admNoteFile = '';
let glitchTriggered = false; let mintEvaClicks = 0; let evaCount = 0;

function nav(id) {
    if (isTyping) return;

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
    else if (id === 'blog') { activeBlogTag = null; renderBlog(); } // Reset filter on nav
    else if (id === 'todo') renderTodo();
    else if (id === 'gallery') renderGallery();
    else if (id === 'game') renderGameMenu();
    else if (id === 'contact') renderLinks();
    else if (id === 'admin') renderAdmin();
}

// Helper to update tree visuals
function updateTreeVisuals() {
    const contactBtn = document.getElementById('nav-contact');
    if (adminAuth) {
        contactBtn.innerHTML = '/link';
        document.getElementById('nav-admin').style.display = 'block';
    } else {
        contactBtn.innerHTML = '/link';
        document.getElementById('nav-admin').style.display = 'none';
    }
}

// --- RESUME UNLOCK ---
function unlockResume() {
    document.getElementById('nav-resume').style.display = 'block';
    playSfx(600, 'square', 0.2); // Sound effect for unlocking
    nav('resume');
}

// --- HOME RENDERER ---
let activeHomeProfile = null;
let activeHomeTag = null;

function renderHome() {
    const v = document.getElementById('view');
    // Basic Home Content
    let html = `<div style="text-align:center; margin-top:40px;"><pre style="font-size:1rem; line-height:1; display:inline-block; text-align:left; font-family:monospace; opacity:0.9;">${systemData.home.ascii}</pre><h1 style="font-size:2.2rem; margin-top:10px;">${systemData.home.title}</h1><p>${systemData.home.text}</p></div>`;

    // Profiles Section
    html += `<h3 class="underline" style="margin-top:30px">PROFILES</h3><div class="home-profile-grid">`;
    systemData.homeLinks.profiles.forEach(p => {
        const isActive = activeHomeProfile === p.id ? 'active' : '';
        const isLocked = p.password && p.password.length > 0;
        const lockIcon = isLocked ? '🔒 ' : '';
        html += `<button class="home-profile-btn ${isActive}" onclick="selectHomeProfile('${p.id}')">[ ${lockIcon}${p.name} ]</button>`;
    });
    html += `</div>`;

    // Tags Section (if profile selected)
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

    // Links Section (if tag selected)
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
            const att = prompt("ENTER PASSWORD:");
            const hash = await hashPass(att);
            if (hash !== profile.password) {
                playSfx(100, 'sawtooth', 0.5);
                alert("ACCESS DENIED");
                return;
            }
        } else {
            // Admin Bypass Feedback
            playSfx(800, 'sine', 0.1);
            alert("ADMIN: PASSWORD BYPASSED");
        }
    }

    activeHomeProfile = id;
    activeHomeTag = null; // Reset tag when profile changes
    playSfx(600, 'sine');
    renderHome();
}

function selectHomeTag(tag) {
    if (activeHomeTag === tag) {
        activeHomeTag = null;
    } else {
        activeHomeTag = tag;
        playSfx(800, 'square', 0.05);
    }
    renderHome();
}

// --- WORKTHING ---
function renderWork() {
    const v = document.getElementById('view');
    v.innerHTML = `<h2>WORK_TOOLS</h2><div class="work-grid"><div class="work-card"><h3>SECURE_PASS_GEN</h3><div id="pass-out" class="pass-result">...</div><div class="opts-grid"><label class="opt-check"><input type="checkbox" id="p-upper" checked> A-Z</label><label class="opt-check"><input type="checkbox" id="p-nums" checked> 0-9</label><label class="opt-check"><input type="checkbox" id="p-syms"> !@#</label><label class="opt-check"><input type="checkbox" id="p-phrase"> PHRASE</label></div><div class="form-group" style="margin-bottom:10px;"><label style="font-size:0.8rem">Length: <span id="p-len-val">16</span></label><input type="range" id="p-len" min="8" max="64" value="16" style="width:100%" oninput="document.getElementById('p-len-val').innerText=this.value"></div><button class="btn btn-green" onclick="generatePass()">GENERATE</button><button class="btn" onclick="copyPass()">COPY</button></div><div class="work-card"><h3>TRANSLITERATION (KMU 55)</h3><div style="margin-bottom:5px; font-size:0.8rem">Ukrainian (Cyrillic):</div><textarea id="tr-ua" class="translit-area" placeholder="Введіть текст..." oninput="doTranslit('ua')"></textarea><div style="margin-bottom:5px; font-size:0.8rem">English (Latin):</div><textarea id="tr-en" class="translit-area" placeholder="Output..." oninput="doTranslit('en')"></textarea><div style="font-size:0.7rem; opacity:0.6; margin-top:5px;">*Reverse translit is best-effort estimate.</div></div></div>`;
    generatePass();
}
const words = ["cyber", "secure", "hack", "node", "core", "linux", "root", "admin", "flux", "neon", "grid", "data", "byte", "bit", "net", "web", "cloud", "void", "null", "zero"];
function generatePass() { const isPhrase = document.getElementById('p-phrase').checked; const len = parseInt(document.getElementById('p-len').value); const useUp = document.getElementById('p-upper').checked; const useNum = document.getElementById('p-nums').checked; const useSym = document.getElementById('p-syms').checked; let res = ""; if (isPhrase) { let wCount = Math.floor(len / 4); if (wCount < 3) wCount = 3; let arr = []; for (let i = 0; i < wCount; i++) { let w = words[Math.floor(Math.random() * words.length)]; if (useUp) w = w.charAt(0).toUpperCase() + w.slice(1); arr.push(w); } res = arr.join(useSym ? "-" : ""); if (useNum) res += Math.floor(Math.random() * 100); } else { let chars = "abcdefghijklmnopqrstuvwxyz"; if (useUp) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; if (useNum) chars += "0123456789"; if (useSym) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"; for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length)); } document.getElementById('pass-out').innerText = res; }
function copyPass() { const txt = document.getElementById('pass-out').innerText; if (txt !== "...") { navigator.clipboard.writeText(txt); alert("Copied!"); } }
const mapUA = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', '\'': '', '’': '', 'ю': 'iu', 'я': 'ia', 'є': 'ie', 'ї': 'i', 'й': 'i' };
const mapUA_Start = { 'є': 'ye', 'ї': 'yi', 'й': 'y', 'ю': 'yu', 'я': 'ya' };
function doTranslit(dir) { if (dir === 'ua') { let src = document.getElementById('tr-ua').value; let out = ""; let temp = src.replace(/зг/g, "zgh").replace(/Зг/g, "Zgh").replace(/ЗГ/g, "ZGH"); for (let i = 0; i < temp.length; i++) { const c = temp[i]; const low = c.toLowerCase(); const isUp = c !== low; const isStart = (i === 0 || /[\s\n\t\.,!?]/.test(temp[i - 1])); let tr = ""; if (isStart && mapUA_Start[low]) tr = mapUA_Start[low]; else if (mapUA[low] !== undefined) tr = mapUA[low]; else tr = c; if (tr.length > 0) { if (isUp) { if (tr.length > 1 && temp[i + 1] && temp[i + 1] === temp[i + 1].toUpperCase()) tr = tr.toUpperCase(); else tr = tr.charAt(0).toUpperCase() + tr.slice(1); } } out += tr; } document.getElementById('tr-en').value = out; } else { let src = document.getElementById('tr-en').value; src = src.replace(/zgh/gi, "зг"); const revMapMulti = [{ k: 'shch', v: 'щ' }, { k: 'zh', v: 'ж' }, { k: 'kh', v: 'х' }, { k: 'ts', v: 'ц' }, { k: 'ch', v: 'ч' }, { k: 'sh', v: 'ш' }, { k: 'ye', v: 'є' }, { k: 'yi', v: 'ї' }, { k: 'yu', v: 'ю' }, { k: 'ya', v: 'я' }, { k: 'ia', v: 'я' }, { k: 'ie', v: 'є' }, { k: 'iu', v: 'ю' }]; for (let pair of revMapMulti) { const reg = new RegExp(pair.k, "gi"); src = src.replace(reg, (match) => { const isUp = match[0] === match[0].toUpperCase(); return isUp ? pair.v.toUpperCase() : pair.v; }); } const revMapSingle = { 'a': 'а', 'b': 'б', 'v': 'в', 'h': 'г', 'g': 'ґ', 'd': 'д', 'e': 'е', 'z': 'з', 'y': 'и', 'i': 'і', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф' }; let out = ""; for (let i = 0; i < src.length; i++) { const c = src[i]; const low = c.toLowerCase(); const isUp = c !== low; if (revMapSingle[low]) out += isUp ? revMapSingle[low].toUpperCase() : revMapSingle[low]; else out += c; } document.getElementById('tr-ua').value = out; } }

// --- CRYPTO HELPER ---
async function hashPass(str) {
    if (!str) return '';
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


// --- GENERATE DOC (WORD) ---
// --- GENERATE DOC (WORD) ---
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

// --- UI RENDERING ---
// --- UI RENDERING ---
function renderAbout() {
    const v = document.getElementById('view');
    // Dynamic Language Buttons
    let btns = systemData.about.languages.map(l =>
        `<button class="btn ${systemData.about.activeLang === l.code ? 'active' : ''}" onclick="switchLang('${l.code}')">${l.label}</button>`
    ).join('');

    let html = `<div style="display:flex; justify-content:flex-end; gap:10px; margin-bottom:15px;">${btns}</div>`;

    // Float structure for about photo
    html += `<div style="overflow:hidden;">`; // Container to manage floats if needed

    if (systemData.about.showPhoto) {
        // Determine photo source: use specific about photo if available, fallback to resume photo
        const photoSrc = systemData.about.photo || systemData.resume.photo;
        html += `<img src="${photoSrc}" style="float:right; margin-left:20px; margin-bottom:10px; width:150px; border: 2px solid var(--text); object-fit:cover;" alt="Me">`;
    }

    html += `<div id="about-txt"></div>`;
    html += `</div>`;

    v.innerHTML = html;

    const activeData = (systemData.about.languages || []).find(l => l.code === systemData.about.activeLang) || (systemData.about.languages ? systemData.about.languages[0] : null);
    if (activeData) typeEffect(activeData.text, 'about-txt');
}

window.switchLang = function (langCode) {
    if (systemData.about.languages.find(l => l.code === langCode)) {
        systemData.about.activeLang = langCode;
        renderAbout();
    }
}
function switchLang(l) { if (currentLang === l || isTyping) return; currentLang = l; renderAbout(); }
function typeEffect(html, targetId) { const v = document.getElementById(targetId); v.innerHTML = '<div id="type-box" class="typing"></div>'; const b = document.getElementById('type-box'); isTyping = true; const startTime = Date.now(); const duration = 1000; const timer = setInterval(() => { const elapsed = Date.now() - startTime; let progress = elapsed / duration; if (progress > 1) progress = 1; let i = Math.floor(html.length * progress); const sub = html.substring(0, i); const lastOpen = sub.lastIndexOf('<'); const lastClose = sub.lastIndexOf('>'); if (lastOpen > lastClose) { const closing = html.indexOf('>', lastOpen); if (closing !== -1) i = closing + 1; } if (Math.random() > 0.8) playSfx(200 + Math.random() * 100, 'sine', 0.02, 0.02); b.innerHTML = html.substring(0, i); if (progress === 1) { clearInterval(timer); b.innerHTML = html; b.classList.remove('typing'); isTyping = false; } }, 16); }

function renderResume() {
    const v = document.getElementById('view');
    const r = systemData.resume;
    const t = r.titles || defaultData.resume.titles; // Fallback
    const skills = r.skills.map(s => `<div>${s.n}: [${"█".repeat(Math.round(s.p / 10))}${"░".repeat(10 - Math.round(s.p / 10))}] ${s.p}%</div>`).join("");
    const langs = (r.languages || []).map(l => `<div>• ${l}</div>`).join("");
    const rnds = (r.rnd || []).map(r => `<div>● ${r}</div>`).join("");
    const birthDate = r.birth.split('-').reverse().join('.');
    let eduHTML = ''; if (r.education && r.education.length > 0) { eduHTML = `<h3 class="underline" style="margin-top:15px">${t.edu}</h3><div class="scroll-area">${r.education.map(e => `<div class="exp-item" style="margin-bottom:10px;"><h4>${e.inst}</h4><div>${e.year} | ${e.deg}</div></div>`).join("")}</div>`; }
    v.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--text); padding-bottom:10px; margin-bottom:20px;"><h1>РЕЗЮМЕ</h1><div style="display:flex; gap:10px;"><button class="btn" onclick="genMD()">[ MD ]</button><button class="btn" onclick="generateDOC()">[ DOC ]</button></div></div><div style="display:flex; gap:20px; flex-wrap:wrap"><div class="photo"><img class="photo" src="${r.photo}" alt="VVS Photo"></div><div><h2>${r.name}</h2><p>DOB: ${birthDate}</p><p>Email: ${r.email}</p><p>Phone: ${r.phone || 'N/A'}</p><div style="font-size:0.8rem; margin-top:10px;">${skills}</div><h3 style="margin-top:10px; font-size:1rem; border-bottom:1px solid var(--dim); display:inline-block;">${t.langs}</h3><div style="font-size:0.8rem; margin-top:5px;">${langs}</div></div></div><h3 class="underline" style="margin-top:25px">${t.summary}</h3><p style="margin-bottom:20px; line-height:1.5;">${r.summary || ''}</p><h3 class="underline">${t.jobs}</h3><div class="scroll-area">${r.jobs.map(j => `<div class="exp-item"><h4>${j.co}</h4><div class="meta">${j.per} | ${j.pos}</div><ul>${j.tasks.map(t => `<li>${t}</li>`).join("")}</ul></div>`).join("")}</div>${eduHTML}<h3 class="underline" style="margin-top:15px">${t.rnd}</h3><div style="font-size:0.9rem">${rnds}</div>`;
}
// --- GENERATE MD (MARKDOWN) ---
window.genMD = function () {
    const r = systemData.resume;
    const t = r.titles;
    let content = r.templates.md;

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
    content = content.replace('{{skills_list}}', r.skills.map(s => `- ${s.n} (${s.p}%)`).join('\n'));
    content = content.replace('{{langs_list}}', (r.languages || []).map(l => `- ${l}`).join('\n'));
    content = content.replace('{{rnd_list}}', (r.rnd || []).map(p => `- ${p}`).join('\n'));
    content = content.replace('{{jobs_list}}', r.jobs.map(j => `### ${j.co}\n*${j.pos} | ${j.per}*\n${j.tasks.map(t => `- ${t}`).join('\n')}`).join('\n\n'));
    content = content.replace('{{edu_list}}', (r.education || []).map(e => `### ${e.inst}\n${e.deg} (${e.year})`).join('\n\n'));

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resume_${r.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderObsidian() {
    const v = document.getElementById('view'); const content = currentObsFile ? systemData.obsidian[currentObsCat][currentObsFile].replace(/\\\\/g, '\\') : "Оберіть нотатку для зчитування..."; v.innerHTML = `<h2>Obsidian.Vault</h2><div class="obs-container"><div class="obs-tabs" id="o-t"></div><div class="obs-main"><div class="obs-files" id="o-f"></div><div class="obs-viewer" id="o-v"><pre>${content}</pre></div></div></div>`; const tabBox = document.getElementById('o-t');
    systemData.obsidian.cats.forEach(c => {
        const b = document.createElement('button');
        b.className = `obs-tab-btn ${c === currentObsCat ? 'active' : ''}`;
        // Lock icon in tab
        const isLocked = systemData.obsidian.catAuth && systemData.obsidian.catAuth[c];
        b.innerText = (isLocked ? '🔒 ' : '') + c;

        b.onclick = () => {
            if (isLocked) { // Check lock existence first
                if (!adminAuth) {
                    const p = prompt("ENTER PASSWORD for " + c + ":");
                    if (p !== systemData.obsidian.catAuth[c]) {
                        playSfx(100, 'sawtooth', 0.5); alert("ACCESS DENIED"); return;
                    }
                } else {
                    // Admin feedback
                    playSfx(800, 'sine', 0.1);
                    alert("ADMIN: PASSWORD BYPASSED");
                }
            }
            currentObsCat = c; currentObsFile = ''; renderObsidian();
        };
        tabBox.appendChild(b);
    });

    const fileBox = document.getElementById('o-f'); Object.keys(systemData.obsidian[currentObsCat]).forEach(f => { const b = document.createElement('button'); b.className = `obs-file-item ${f === currentObsFile ? 'active' : ''}`; b.innerText = '> ' + f; b.onclick = () => { currentObsFile = f; playSfx(600); renderObsidian(); }; fileBox.appendChild(b); });
}

let activeBlogTag = null;

function renderBlog() {
    const v = document.getElementById('view');
    // Collect all unique tags
    const allTags = new Set();
    systemData.blog.forEach(p => p.tags.forEach(t => allTags.add(t)));

    let tagsHtml = `<button class="home-tag-btn ${activeBlogTag === null ? 'active' : ''}" onclick="filterBlog(null)">[ ALL ]</button>`;
    allTags.forEach(t => {
        tagsHtml += `<button class="home-tag-btn ${activeBlogTag === t ? 'active' : ''}" onclick="filterBlog('${t}')">#${t}</button>`;
    });

    v.innerHTML = `<h2>/var/log/blog</h2>
            <div style="margin-bottom:15px; display:flex; flex-wrap:wrap; gap:5px; border-bottom:1px dashed var(--dim); padding-bottom:10px;">${tagsHtml}</div>
            <div class="blog-list" id="blog-list"></div>`;

    const list = document.getElementById('blog-list');

    const filteredPosts = activeBlogTag
        ? systemData.blog.filter(p => p.tags.includes(activeBlogTag))
        : systemData.blog;

    if (filteredPosts.length === 0) {
        list.innerHTML = `<div style="opacity:0.5; padding:10px;">No posts found for tag: ${activeBlogTag}</div>`;
    } else {
        filteredPosts.forEach(p => {
            const d = document.createElement('div');
            d.className = 'blog-entry';
            d.innerHTML = `<div class="blog-header"><span class="blog-title">>> ${p.title}</span><span class="blog-date">${p.date}</span></div><div style="margin-bottom:5px;">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div><div class="blog-snippet">${p.snippet}</div>`;
            d.onclick = () => renderBlogPost(p.id);
            list.appendChild(d);
        });
    }
}

function filterBlog(tag) {
    activeBlogTag = tag;
    renderBlog();
    playSfx(600, 'sine', 0.05);
}

function renderBlogPost(id) { const p = systemData.blog.find(x => x.id === id); const v = document.getElementById('view'); playSfx(500); v.innerHTML = `<button class="btn" onclick="nav('blog')" style="margin-bottom:15px;">< BACK</button><h2 style="border-bottom:2px solid var(--text); padding-bottom:5px; margin-bottom:10px;">${p.title}</h2><div style="font-size:0.8rem; margin-bottom:20px; opacity:0.7;">DATE: ${p.date} | TAGS: ${p.tags.join(', ')}</div><div class="blog-read-view blog-full">${p.content}</div>`; }
function renderTodo() { const v = document.getElementById('view'); v.innerHTML = `<h2>TODO_LIST [READ_ONLY]</h2><div class="todo-container"><div class="todo-list" id="todo-list"></div></div>`; renderTodoList(); }
function renderTodoList() { const l = document.getElementById('todo-list'); l.innerHTML = ''; systemData.todos.forEach((t) => { const el = document.createElement('div'); el.className = `todo-item ${t.d ? 'todo-done' : ''}`; el.innerHTML = `<span class="todo-check">[${t.d ? 'x' : ' '}]</span> <span class="todo-text">${t.t}</span>`; l.appendChild(el); }); }

function renderGallery() {
    const v = document.getElementById('view');
    v.innerHTML = `<h2>Gallery.Manager</h2><div class="obs-tabs" id="g-t"></div><div class="gallery-grid" id="g-g"></div>`;
    systemData.gallery.cats.forEach(c => {
        const b = document.createElement('button');
        b.className = `obs-tab-btn ${c === currentGalCat ? 'active' : ''}`;
        b.innerText = c;
        b.onclick = () => { currentGalCat = c; renderGallery(); };
        document.getElementById('g-t').appendChild(b);
    });
    systemData.gallery[currentGalCat].forEach((i, idx) => {
        document.getElementById('g-g').innerHTML += `
                <div class="gallery-item">
                    <div class="gallery-thumb" onclick="expandGallery('${currentGalCat}', ${idx})" style="cursor:pointer" title="Click to Expand">
                        ${currentGalCat === 'ASCII_ART' ? '<pre style="font-size:0.6rem">' + i.a + '</pre>' : '<img src="' + i.a + '" onerror="this.parentElement.innerHTML=\'[IMAGE_NOT_FOUND]\'"/>'}
                    </div>
                    <div style="margin-top:10px; font-size:0.7rem; opacity:0.7;">NAME: ${i.n}<br>DATE: ${i.d}</div>
                </div>`;
    });
}

// EXPAND GALLERY (FIXED: Fullscreen + No Scroll)
window.expandGallery = function (c, i) {
    const item = systemData.gallery[c][i];
    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column; cursor:pointer;";

    // Disable Page Scroll
    document.body.style.overflow = 'hidden';

    overlay.onclick = function () {
        document.body.removeChild(overlay);
        document.body.style.overflow = ''; // Restore Scroll
    };

    let content = '';
    if (c === 'ASCII_ART') {
        content = `<pre style="color:var(--text); font-size:0.8rem; overflow:auto; max-width:90vw; max-height:90vh;">${item.a}</pre>`;
    } else {
        content = `<img src="${item.a}" style="max-width:90vw; max-height:90vh; object-fit:contain; border:2px solid var(--text);">`;
    }

    overlay.innerHTML = `${content}<div style="margin-top:20px; color:var(--text); font-family:monospace;">${item.n} [CLICK TO CLOSE]</div>`;
    document.body.appendChild(overlay);
    playSfx(600, 'square', 0.1);
}
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

let gameInt = null; function stopGames() { if (gameInt) clearInterval(gameInt); window.onkeydown = null; }

function renderGameMenu() {
    const gamesHtml = systemData.games.map((g, index) => `<div class="game-card" onclick="runGame('${g.id}')">${g.name}</div>`).join('');
    document.getElementById('view').innerHTML = `<h2>Game Hub</h2><div class="game-hub">${gamesHtml}</div><div id="arena" style="margin-top:20px; display:flex; justify-content:center"></div>`;
}

function runGame(id) {
    stopGames();
    const g = systemData.games.find(x => x.id === id);
    if (g && g.code) {
        try {
            // Safe evaluation in local context
            const f = new Function(g.code);
            f();
        } catch (e) {
            document.getElementById('arena').innerHTML = `<div style="color:red">RUNTIME ERROR: ${e.message}</div>`;
        }
    }
}

function toggleThemeMenu() { const popup = document.getElementById('theme-popup'); popup.innerHTML = ''; themesList.forEach(t => { const el = document.createElement('div'); el.className = 'theme-item'; el.innerHTML = `<div class="color-preview" style="background:${t.c}"></div> ${t.name}`; el.onclick = () => setTheme(t.id); popup.appendChild(el); }); popup.classList.toggle('show'); playSfx(400); }
function setTheme(t) {
    document.body.className = `theme-${t}`;
    playSfx(1000, 'sine', 0.05);
    localStorage.setItem('vvs_theme_v12', t);

    // USE CUSTOM ADMIN TRIGGER THEME
    if (t === systemData.themes.adminTriggerTheme) {
        mintEvaClicks++; checkAdminUnlock();
    }
    if (t === 'eva') { evaCount++; if (evaCount >= 5) { const sound = new Audio('xero.wav'); sound.play().catch(e => console.log(e)); evaCount = 0; } }
    document.getElementById('theme-popup').classList.remove('show');
}
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
function checkAdminUnlock() {
    if (glitchTriggered && mintEvaClicks >= 10) {
        const btn = document.getElementById('nav-admin');
        if (btn.style.display !== 'block') { btn.style.display = 'block'; playSfx(800, 'square', 0.5); alert("SYSTEM OVERRIDE: ADMIN ACCESS UNLOCKED"); }
    }
}
function easterEggClown() { clownClicks++; if (clownClicks >= 5) { playSfx(400); setTimeout(() => playSfx(300), 100); const o = document.getElementById('clown-overlay'); o.style.display = 'flex'; setTimeout(() => { o.style.display = 'none'; clownClicks = 0; }, 1000); } }
function easterEggClock() { const m = document.getElementById('matrix-bg'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; if (m.style.display === 'block') startMatrix(); }
function startMatrix() { const c = document.getElementById('matrix-bg'), x = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight; const col = Array(Math.floor(c.width / 16)).fill(1); setInterval(() => { x.fillStyle = "rgba(0,0,0,0.05)"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = getComputedStyle(document.body).getPropertyValue('--text'); col.forEach((y, i) => { x.fillText(String.fromCharCode(33 + Math.random() * 90), i * 16, y * 16); if (y * 16 > c.height && Math.random() > 0.975) col[i] = 0; col[i]++; }); }, 50); }

function renderDynamicLogo() {
    if (document.getElementById('matrix-bg')) startMatrix();
    // Dynamic Title & Logo
    if (systemData.home && systemData.home.logoText) {
        document.title = systemData.home.logoText;
        const logoEl = document.getElementById('logo-text');
        if (logoEl) logoEl.innerText = systemData.home.logoText;
    }
}

window.onload = () => {
    initData();
    const savedTheme = localStorage.getItem('vvs_theme_v12'); if (savedTheme) document.body.className = `theme-${savedTheme}`;
    renderDynamicLogo();

    // Boot Logic
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

