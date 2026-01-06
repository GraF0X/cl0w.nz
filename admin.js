
const HELP_CONTENT = {
    templates: {
        ua: "<h3>Змінні Шаблонів</h3><ul><li>{{name}} - Ім'я</li><li>{{birth}} - Дата народження</li><li>{{email}} - Email</li><li>{{phone}} - Телефон</li><li>{{summary}} - Текст Про Мене</li><li>{{title_summary/skills/langs/jobs/edu/rnd}} - Заголовки секцій</li><li>{{skills_list}} - Список навичок</li><li>{{langs_list}} - Список мов</li><li>{{jobs_list}} - Досвід роботи (HTML/MD)</li><li>{{edu_list}} - Освіта (HTML/MD)</li><li>{{rnd_list}} - Список R&D</li></ul>",
        en: "<h3>Template Variables</h3><ul><li>{{name}} - Name</li><li>{{birth}} - DOB</li><li>{{email}} - Email</li><li>{{phone}} - Phone</li><li>{{summary}} - Summary Text</li><li>{{title_summary/skills/langs/jobs/edu/rnd}} - Section Titles</li><li>{{skills_list}} - Skills List</li><li>{{langs_list}} - Languages List</li><li>{{jobs_list}} - Experience (HTML/MD)</li><li>{{edu_list}} - Education (HTML/MD)</li><li>{{rnd_list}} - R&D List</li></ul>"
    },
    global: {
        ua: "<h3>Інструкція Адміністратора</h3><p><b>HOME:</b> Налаштування головної, заголовку, лого, та мов розділу 'About'.<br><b>HOME LINKS:</b> Редактор плиток (профілів) та зовнішніх посилань.<br><b>RESUME:</b> Налаштування резюме, переклад заголовків, та редагування шаблонів генерації файлів.<br><b>GALLERY:</b> Керування фото (upload/delete).<br><b>BLOG/NOTES:</b> Текстовий контент.<br><b>THEMES:</b> Налаштування кольорів.</p>",
        en: "<h3>Admin Instructions</h3><p><b>HOME:</b> Main settings, header, logo, and 'About' languages.<br><b>HOME LINKS:</b> Edit tiles (profiles) and external links.<br><b>RESUME:</b> Resume config, translate titles, and file generation templates.<br><b>GALLERY:</b> Manage photos (upload/delete).<br><b>BLOG/NOTES:</b> Text content.<br><b>THEMES:</b> Color settings.</p>"
    }
};

const ADM_SAVER_TYPES = [
    { id: 'matrix', name: 'Matrix Rain' },
    { id: 'fire', name: 'Pixel Fire' },
    { id: 'pipes', name: 'Pipes' },
    { id: 'dvd', name: 'DVD' },
    { id: 'trees', name: 'Fractal Trees' }
];

window.currentHelpContext = null;  // Поточний контекст довідки
window.currentHelpLang = 'ua';      // Поточна мова довідки

/**
 * showHelp - Відображає модальне вікно довідки
 * @param {string} context - Контекст довідки ('templates' або 'global')
 */
window.showHelp = function (context) {
    window.currentHelpContext = context;
    const overlay = document.createElement('div');
    overlay.id = 'help-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center;";
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div style="background:var(--bg); padding:20px; border:1px solid var(--text); max-width:600px; width:90%; border-radius:5px; position:relative;">
            <button onclick="document.getElementById('help-overlay').remove()" style="position:absolute; top:10px; right:10px; background:transparent; border:none; color:var(--text); cursor:pointer;">X</button>
            <div style="margin-bottom:15px; border-bottom:1px solid var(--dim); padding-bottom:10px;">
                <button class="btn btn-sm" onclick="switchHelp('ua')">UA</button>
                <button class="btn btn-sm" onclick="switchHelp('en')">EN</button>
            </div>
            <div id="help-content">${HELP_CONTENT[context][window.currentHelpLang]}</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * switchHelp - Перемикає мову довідки (UA/EN)
 * @param {string} lang - Код мови ('ua' або 'en')
 */
window.switchHelp = function (lang) {
    window.currentHelpLang = lang;
    const c = document.getElementById('help-content');
    if (c) c.innerHTML = HELP_CONTENT[window.currentHelpContext][lang];
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_AUTH - Авторизація адміністратора
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderAdmin - Рендерить форму входу або панель адміністратора
 * Перевіряє adminAuth та відображає відповідний інтерфейс
 */
function renderAdmin() {
    const v = document.getElementById('view');
    if (!adminAuth) {
        v.innerHTML = `<div class="admin-login"><h2 style="color:red; margin-bottom:20px;">SECURE ACCESS REQUIRED</h2><input type="password" id="admin-pass" class="admin-input" placeholder="Enter Password..." onkeypress="if(event.key==='Enter') checkAdmin()"><button class="btn" onclick="checkAdmin()">LOGIN</button></div>`;
    } else { renderAdminDash('home'); }
}
/**
 * checkAdmin - Перевіряє введений пароль адміністратора
 * Порівнює хеш введеного пароля з збереженим у systemData
 */
async function checkAdmin() {
    const p = document.getElementById('admin-pass').value;
    // Check against stored password
    const hash = await hashPass(p);
    if (hash === systemData.password) {
        playSfx(800, 'square'); adminAuth = true;
        updateTreeVisuals(); // Update tree structure
        renderAdminDash('home');
    } else {
        playSfx(100, 'sawtooth', 0.5); document.getElementById('admin-pass').value = ''; alert("ACCESS DENIED");
    }
}

/**
 * logoutAdmin - Вихід з адмін-панелі
 * Скидає авторизацію та повертає на головну сторінку
 */
function logoutAdmin() {
    adminAuth = false;
    updateTreeVisuals();
    nav('home');
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_DASHBOARD - Головна панель адміністратора
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderAdminDash - Рендерить головну панель адміністратора
 * @param {string} section - Активна секція (home, resume, gallery тощо)
 * Створює бокове меню та контейнер для редактора
 */
function renderAdminDash(section) {
    const v = document.getElementById('view');
    v.innerHTML = `<h2>ADMIN_PANEL</h2>
                <div style="background:rgba(255,0,0,0.2); border:1px solid red; padding:10px; margin-bottom:15px; color:#ff5555; font-size:0.9rem;">⚠ <strong>УВАГА:</strong> Всі зміни відбуваються локально, для примінення змін потрібно Завантажити data.js та замінити файл зі змінами на сервері</div>
                <div class="admin-dash">
                    <div class="admin-sidebar">
                        <div style="border-bottom:1px solid var(--dim);padding-bottom:10px;margin-bottom:10px;">
                            <button class="btn ${section === 'home' ? 'active' : ''}" onclick="renderAdminDash('home')">HOME</button>
                            <button class="btn ${section === 'home-links' ? 'active' : ''}" onclick="renderAdminDash('home-links')">HOME-LINKS</button>
                            <button class="btn ${section === 'resume' ? 'active' : ''}" onclick="renderAdminDash('resume')">RESUME</button>
                        </div>
                        <div style="border-bottom:1px solid var(--dim);padding-bottom:10px;margin-bottom:10px;">
                            <button class="btn ${section === 'notes' ? 'active' : ''}" onclick="renderAdminDash('notes')">NOTES</button>
                            <button class="btn ${section === 'blog' ? 'active' : ''}" onclick="renderAdminDash('blog')">BLOG</button>
                            <button class="btn ${section === 'todo' ? 'active' : ''}" onclick="renderAdminDash('todo')">TODO</button>
                        </div>
                        <div style="border-bottom:1px solid var(--dim);padding-bottom:10px;margin-bottom:10px;">
                            <button class="btn ${section === 'gallery' ? 'active' : ''}" onclick="renderAdminDash('gallery')">GALLERY</button>
                            <button class="btn ${section === 'games' ? 'active' : ''}" onclick="renderAdminDash('games')">GAMES</button>
                            <button class="btn ${section === 'saver' ? 'active' : ''}" onclick="renderAdminDash('saver')">SAVER</button>
                        </div>
                        <div style="border-bottom:1px solid var(--dim);padding-bottom:10px;margin-bottom:10px;">
                            <button class="btn ${section === 'links' ? 'active' : ''}" onclick="renderAdminDash('links')">CONTACTS</button>
                            <button class="btn ${section === 'themes' ? 'active' : ''}" onclick="renderAdminDash('themes')">THEMES</button>
                            <button class="btn ${section === 'sys' ? 'active' : ''}" onclick="renderAdminDash('sys')">SYSTEM</button>
                        </div>
                        <div style="margin-top:auto;display:flex;flex-direction:column;gap:5px;">
                            <button class="btn btn-green" onclick="downloadSource()">DOWNLOAD DATA.JS</button>
                            <button class="btn" onclick="showHelp('global')">[?] HELP</button>
                            <button class="btn btn-red" onclick="logoutAdmin()">LOGOUT</button>
                        </div>
                    </div>
                    <div class="admin-content" id="admin-editor"></div>
                </div>`;
    if (section) loadAdminEditor(section);
}

/**
 * loadAdminEditor - Завантажує редактор для обраної секції
 * @param {string} sec - Назва секції для редагування
 * Генерує HTML форми залежно від типу контенту
 */
function loadAdminEditor(sec) {
    const el = document.getElementById('admin-editor');
    if (sec === 'resume') {
        el.innerHTML = `<h3>Edit Basics</h3>
                    <div class="form-group"><label class="form-label">ПІБ:</label><input class="form-control" id="adm-res-name" value="${systemData.resume.name}"></div>
                    <div class="form-group"><label class="form-label">Birth Date:</label><input type="date" class="form-control" id="adm-res-birth" value="${systemData.resume.birth}"></div>
                    <div class="form-group"><label class="form-label">Email:</label><input class="form-control" id="adm-res-email" value="${systemData.resume.email}"></div>
                    <div class="form-group"><label class="form-label">Phone (Digits & + only):</label><input class="form-control" id="adm-res-phone" value="${systemData.resume.phone || ''}" oninput="this.value = this.value.replace(/[^0-9+]/g, '')"></div>
                    <div class="form-group"><label class="form-label">Summary (Опис):</label><textarea class="form-control" id="adm-res-summary" style="height:100px">${systemData.resume.summary || ''}</textarea></div>
                    <div class="form-group"><label class="form-label">Update Photo:</label><input type="file" id="adm-res-photo-up" class="form-control"></div>
                    <button class="btn" onclick="uploadResumePhoto()">UPLOAD PHOTO</button>
                    <button class="btn btn-green" onclick="saveResumeBasics()">SAVE BASICS</button>
                    <hr style="border-color:var(--dim); margin:15px 0;">
                    <h3>Edit Skills</h3><div class="item-list" id="adm-skill-list"></div><button class="btn" onclick="addSkill()">+ ADD SKILL</button>
                    <hr style="border-color:var(--dim); margin:15px 0;">
                    <h3>Edit Languages</h3><div class="item-list" id="adm-lang-list"></div><button class="btn" onclick="addLang()">+ ADD LANG</button>
                    <hr style="border-color:var(--dim); margin:15px 0;">
                    <h3>Edit Experience</h3><div class="item-list" id="adm-job-list"></div><button class="btn" onclick="addJob()">+ NEW JOB</button><div id="job-editor-area" style="margin-top:15px; border:1px solid var(--text); padding:10px; display:none;"></div>
                    <hr style="border-color:var(--dim); margin:15px 0;">
                    <h3>Edit Education</h3><div class="item-list" id="adm-edu-list"></div><button class="btn" onclick="addEdu()">+ ADD EDU</button><div id="edu-editor-area" style="margin-top:15px; border:1px solid var(--text); padding:10px; display:none;"></div>
                    <hr style="border-color:var(--dim); margin:15px 0;">
                    <h3>Edit R&D Projects</h3><div class="item-list" id="adm-rnd-list"></div><button class="btn" onclick="addRnd()">+ ADD R&D</button>
                    <hr style="border-color:var(--dim); margin:20px 0;">
                    <h3>Resume Configuration</h3>
                    <h5>Section Titles</h5>
                    <div class="form-group"><label>Summary:</label><input class="form-control" id="rt-sum" value="${systemData.resume.titles.summary}"></div>
                    <div class="form-group"><label>Skills:</label><input class="form-control" id="rt-ski" value="${systemData.resume.titles.skills}"></div>
                    <div class="form-group"><label>Languages:</label><input class="form-control" id="rt-lan" value="${systemData.resume.titles.langs}"></div>
                    <div class="form-group"><label>Jobs:</label><input class="form-control" id="rt-job" value="${systemData.resume.titles.jobs}"></div>
                    <div class="form-group"><label>Education:</label><input class="form-control" id="rt-edu" value="${systemData.resume.titles.edu}"></div>
                    <div class="form-group"><label>R&D:</label><input class="form-control" id="rt-rnd" value="${systemData.resume.titles.rnd}"></div>
                    <button class="btn btn-green" onclick="saveResumeTitles()">SAVE TITLES</button>
                    
                    <h5>Generation Templates (Use {{placeholders}}) <button class="btn btn-sm" onclick="showHelp('templates')">[?]</button></h5>
                    <div class="form-group"><label>DOC Template (HTML):</label><textarea class="form-control code-block" id="tpl-doc">${systemData.resume.templates.doc}</textarea></div>
                    <div class="form-group"><label>MD Template (Markdown):</label><textarea class="form-control code-block" id="tpl-md">${systemData.resume.templates.md}</textarea></div>
                    <button class="btn btn-green" onclick="saveResumeTemplates()">SAVE TEMPLATES</button>`;
        renderAdminSkills(); renderAdminLangs(); renderAdminJobs(); renderAdminEdu(); renderAdminRnd();
    } else if (sec === 'notes') {
        el.innerHTML = `<h3>Obsidian Manager</h3><div class="notes-manager"><div class="notes-cats"><div style="border-bottom:1px solid var(--text); padding-bottom:5px; margin-bottom:5px; font-weight:bold;">CATEGORIES</div><div id="adm-note-cat-list"></div><button class="btn btn-sm" style="margin-top:5px;" onclick="addNoteCat()">+ CAT</button></div><div class="notes-files-area"><div class="notes-files-list" id="adm-note-file-list">Select a category...</div><div class="notes-editor"><textarea id="adm-note-content" class="form-control" style="flex-grow:1; display:none;" placeholder="Content markdown..."></textarea><div style="margin-top:5px; display:none;" id="adm-note-controls"><button class="btn btn-green" onclick="saveNoteContent()">SAVE CONTENT</button></div></div></div></div>`;
        renderNoteCats();
    } else if (sec === 'blog') {
        el.innerHTML = `<h3>Manage Blog Posts</h3><div class="item-list" id="adm-blog-list"></div><button class="btn" onclick="addBlogPost()">+ NEW POST</button>`;
        renderAdminBlogList();
    } else if (sec === 'todo') {
        el.innerHTML = `<h3>Todo List Manager</h3>
                <div style="margin-bottom:20px; border:1px solid var(--dim); padding:10px;">
                    <label class="opt-check" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                        <input type="checkbox" id="adm-todo-editable" ${systemData.todoEditable ? 'checked' : ''} onchange="saveTodoSettings()">
                        <span><b>Allow User edit ToDo (Дозволити користувачам редагувати список)</b></span>
                    </label>
                </div>
                <div class="todo-input-group" style="flex-wrap:wrap; gap:8px; align-items:flex-end;">
                    <input type="text" id="adm-new-todo" class="todo-input" placeholder="Admin task..." onkeypress="if(event.key==='Enter') addAdminTodo()" style="flex:1; min-width:200px;">
                    <label style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem;">
                        <span>Due Date</span>
                        <input type="date" id="adm-new-todo-date" class="todo-input" style="max-width:180px;">
                    </label>
                    <label style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem;">
                        <span>Time</span>
                        <input type="time" id="adm-new-todo-time" class="todo-input" style="max-width:140px;">
                    </label>
                    <button class="btn" onclick="addAdminTodo()">ADD</button>
                </div>
                <div class="item-list" id="adm-todo-list"></div>`;
        renderAdminTodo();
    } else if (sec === 'saver') {
        ensureSaverData();
        const timeout = systemData.screensaver.timeout || 60;
        el.innerHTML = `<h3>Screensaver Manager</h3>
            <div class="form-group" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:10px; align-items:center;">
                <label class="opt-check"><input type="checkbox" id="adm-saver-enabled" ${systemData.screensaver.enabled !== false ? 'checked' : ''}> Enable idle trigger</label>
                <label style="display:flex; flex-direction:column; gap:4px; font-size:0.9rem;">Timeout (seconds)
                    <input type="number" id="adm-saver-timeout" class="form-control" min="10" max="600" value="${timeout}">
                </label>
            </div>
            <div class="item-list" id="adm-saver-list"></div>
            <div id="saver-editor-area" style="display:none; border:1px solid var(--dim); padding:10px; margin:12px 0;">
                <h4 id="saver-editor-heading">Edit saver</h4>
                <div class="form-group" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:8px;">
                    <input class="form-control" id="adm-saver-edit-name" placeholder="Name">
                    <input class="form-control" id="adm-saver-edit-desc" placeholder="Description">
                    <select class="form-control" id="adm-saver-edit-id">${ADM_SAVER_TYPES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Canvas script (function(canvas, ctx, requestFrame, isActive, isPreview)):</label>
                    <textarea class="form-control code-block" id="adm-saver-code" style="height:180px; font-family:monospace;"></textarea>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn btn-green" onclick="saveSaverEdit()">SAVE</button>
                    <button class="btn" onclick="closeSaverEditor()">CLOSE</button>
                </div>
            </div>
            <div class="form-group" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap:8px;">
                <input class="form-control" id="adm-saver-name" placeholder="Name e.g. Matrix">
                <input class="form-control" id="adm-saver-desc" placeholder="Description">
                <select class="form-control" id="adm-saver-id">${ADM_SAVER_TYPES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
                <button class="btn" onclick="addSaverEntry()">+ ADD</button>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-green" onclick="saveSaverSettings()">APPLY</button>
                <button class="btn" onclick="renderAdminDash('saver')">RESET</button>
            </div>`;
        renderAdminSaverList();
    } else if (sec === 'gallery') {
        el.innerHTML = `<h3>Manage Gallery (Images)</h3><div class="form-group"><label class="form-label">Upload Image:</label><input type="file" id="adm-img-upload" accept="image/*" class="form-control"></div><div class="form-group"><label class="form-label">Name:</label><input class="form-control" id="adm-img-name" placeholder="IMG_NAME"></div><button class="btn btn-green" onclick="uploadImage()">UPLOAD</button><hr><div class="item-list" id="adm-gal-list"></div>
                 <hr><h3>Manage ASCII Art</h3><div class="form-group"><label class="form-label">New ASCII Name:</label><input class="form-control" id="adm-asc-name" placeholder="ASCII_NAME"></div><div class="form-group"><label class="form-label">ASCII Content:</label><textarea class="form-control" id="adm-asc-content" style="font-family:monospace; height:100px;"></textarea></div><button class="btn btn-green" onclick="addAscii()">ADD ASCII</button><div class="item-list" id="adm-asc-list" style="margin-top:10px;"></div>`;
        renderAdminGalleryList(); renderAdminAsciiList();
    } else if (sec === 'games') {
        el.innerHTML = `<h3>Game Source Code Manager</h3>
                <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:10px; font-size:0.8rem; border:1px dashed var(--dim);">
                    <strong>DEV DOCUMENTATION:</strong><br>
                    1. Use <code>document.getElementById('arena')</code> as your game container.<br>
                    2. Use <code>setInterval</code> for game loops and assign it to global <code>gameInt</code> variable so the system can stop it when navigating away.<br>
                    3. Call <code>stopGames()</code> to clear interval and listeners manually if needed.<br>
                    4. Use <code>playSfx(freq, type)</code> for sound effects.<br>
                    5. Example: <code>arena.innerHTML='...'; gameInt=setInterval(()=>{...}, 100);</code>
                </div>
                <div class="item-list" id="adm-game-list" style="height:150px"></div>
                <button class="btn" onclick="createNewGame()">+ NEW GAME</button>
                <div id="game-editor-area" style="display:none; margin-top:15px; border-top:1px solid var(--text); padding-top:10px;">
                    <h4 id="ge-heading">Editing: ...</h4>
                    <div class="form-group"><label class="form-label">Game Name:</label><input class="form-control" id="ge-name"></div>
                    <div class="form-group">
                        <label class="form-label">Javascript Source Code:</label>
                        <textarea class="form-control code-block" id="ge-code" spellcheck="false"></textarea>
                    </div>
                    <button class="btn btn-green" onclick="saveGameCode()">SAVE CODE</button>
                    <button class="btn btn-red" onclick="closeGameEditor()">CLOSE</button>
                </div>`;
        renderAdminGameList();
    } else if (sec === 'home') {
        el.innerHTML = `<h3>Site Header & Branding</h3>
                <div class="form-group"><label class="form-label">Logo/Header Text (shown in header):</label><input class="form-control" id="adm-home-logotxt" value="${systemData.home.logoText || ''}"></div>
                <div class="form-group"><label class="form-label">Browser Tab Title (base name):</label><input class="form-control" id="adm-home-btitle" value="${systemData.home.browserTitle || ''}"></div>
                <h5 style="margin-top:15px;">Glitch Logo Steps</h5>
                <div class="item-list" id="adm-glitch-list" style="max-height:100px;"></div>
                <button class="btn btn-sm" onclick="addGlitch()">+ ADD STEP</button>
                <hr>
                <h3>Home Screen Content</h3>
                <div class="form-group"><label class="form-label">ASCII Logo:</label><textarea class="form-control" id="adm-home-ascii" style="height:150px; font-family:monospace;">${systemData.home.ascii}</textarea></div>
                <div class="form-group"><label class="form-label">Title (Main H1):</label><input class="form-control" id="adm-home-title" value="${systemData.home.title}"></div>
                <div class="form-group"><label class="form-label">Subtitle Text:</label><input class="form-control" id="adm-home-text" value="${systemData.home.text}"></div>
                <hr>
                <h3>About Section Settings</h3>
                <label class="opt-check" style="margin-bottom:10px;"><input type="checkbox" id="adm-about-photo" ${systemData.about.showPhoto ? 'checked' : ''}> Show Photo in About</label>
                <div class="form-group"><label class="form-label">Upload Custom About Photo:</label><input type="file" id="adm-about-photo-up" class="form-control"></div>
                <button class="btn" onclick="uploadAboutPhoto()">UPLOAD ABOUT PHOTO</button>
                <hr>
                <h4>About Languages Manager</h4>
                <div class="item-list" id="adm-al-list"></div>
                <button class="btn" onclick="addAboutLang()">+ ADD LANGUAGE</button>
                <div id="al-editor-area" style="display:none; margin-top:15px; border-top:1px solid var(--text); padding-top:10px;">
                    <input type="hidden" id="eal-code-orig">
                    <div class="form-group"><label>Code (e.g. en, uk, de):</label><input class="form-control" id="eal-code"></div>
                    <div class="form-group"><label>Label (e.g. EN, UA):</label><input class="form-control" id="eal-label"></div>
                    <div class="form-group"><label>Content (HTML):</label><textarea class="form-control" id="eal-text" style="height:150px"></textarea></div>
                    <button class="btn btn-green" onclick="saveAboutLang()">SAVE LANG</button>
                    <button class="btn" onclick="document.getElementById('al-editor-area').style.display='none'">CANCEL</button>
                </div>
                <hr>
                <button class="btn btn-green" onclick="saveHome()" style="width:100%;">SAVE HOME & ABOUT</button>`;
        renderAboutLangList();
        renderAdminGlitchList();
    } else if (sec === 'home-links') {
        // NEW ADMIN SECTION FOR PROFILES AND LINKS
        el.innerHTML = `<h3>Manage Home Profiles & Links</h3>
                <div style="border:1px solid var(--dim); padding:10px; margin-bottom:20px;">
                    <h4 style="border-bottom:1px solid var(--text); margin-bottom:10px;">Profiles (Tag Groups)</h4>
                    <div class="item-list" id="adm-hp-list" style="max-height:150px;"></div>
                    <div style="display:flex; gap:5px; margin-top:5px; flex-direction: column;">
                        <input class="form-control" id="adm-hp-name" placeholder="Profile Name">
                        <input class="form-control" id="adm-hp-tags" placeholder="Tags (comma sep)">
                        <input class="form-control" id="adm-hp-pass" placeholder="Password (Optional)" type="password">
                        <button class="btn btn-green" onclick="addHomeProfile()">ADD</button>
                    </div>
                </div>
                <!-- Profile Editor Area -->
                <div id="hp-editor-area" style="display:none; border:1px solid var(--text); padding:10px; margin-bottom:20px;">
                    <h4>Edit Profile</h4>
                    <input type="hidden" id="ehp-id">
                    <div class="form-group"><label>Name:</label><input class="form-control" id="ehp-name"></div>
                    <div class="form-group"><label>Tags (comma sep):</label><input class="form-control" id="ehp-tags"></div>
                    <div class="form-group"><label>New Password (Optional, leave blank to keep):</label><input class="form-control" id="ehp-pass" type="password"></div>
                    <button class="btn btn-green" onclick="saveHomeProfile()">SAVE PROFILE</button>
                    <button class="btn" onclick="document.getElementById('hp-editor-area').style.display='none'">CANCEL</button>
                </div>
                <div style="border:1px solid var(--dim); padding:10px;">
                    <h4 style="border-bottom:1px solid var(--text); margin-bottom:10px;">Web Links</h4>
                    <div class="item-list" id="adm-hl-list" style="max-height:250px;"></div>
                    <div style="display:flex; gap:5px; margin-top:5px; flex-direction:column;">
                        <div style="display:flex; gap:5px;">
                            <input class="form-control" id="adm-hl-title" placeholder="Link Title">
                            <input class="form-control" id="adm-hl-url" placeholder="URL (https://...)">
                        </div>
                        <div style="display:flex; gap:5px;">
                            <input class="form-control" id="adm-hl-tags" placeholder="Tags (comma sep)">
                            <button class="btn btn-green" onclick="addHomeLink()">ADD LINK</button>
                        </div>
                    </div>
                </div>`;
        renderAdminHomeProfiles();
        renderAdminHomeLinks();
    } else if (sec === 'links') {
        el.innerHTML = `<h3>Edit Contact Links (Tree)</h3><div class="item-list" id="adm-link-list"></div><button class="btn" onclick="addLinkItem()">+ ADD LINK</button>
                <hr style="border-color:var(--dim); margin:20px 0;">
                <h3>Edit Friends</h3><div class="item-list" id="adm-friend-list"></div><button class="btn" onclick="addFriendItem()">+ ADD FRIEND</button>
                <hr style="border-color:var(--dim); margin:20px 0;">
                <label class="opt-check"><input type="checkbox" id="adm-hire-toggle" ${systemData.hireMe.active ? 'checked' : ''} onchange="toggleHireMe()"> <b>HIRE ME BUTTON STATUS</b></label>
                `;
        renderAdminLinks();
    } else if (sec === 'themes') {
        el.innerHTML = `<h3>Theme Manager</h3>
                <div class="form-group" style="border:1px solid var(--text); padding:10px; margin-bottom:15px;">
                    <label class="form-label">Admin Trigger Theme:</label>
                    <select id="adm-trigger-theme" class="form-control" onchange="setAdminTriggerTheme(this.value)">
                        ${[...themesList, ...systemData.themes.custom].map(t => `<option value="${t.id}" ${systemData.themes.adminTriggerTheme === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="border:1px solid var(--text); padding:10px; margin-bottom:15px;">
                    <h4>Effects, Icons & Fonts</h4>
                    <div class="theme-toggle-row" style="flex-wrap:wrap; gap:10px;">
                        <label class="opt-check"><input type="checkbox" id="adm-fx-glow" ${systemData.effects.glow ? 'checked' : ''}> Glow</label>
                        <label class="opt-check"><input type="checkbox" id="adm-fx-flicker" ${systemData.effects.flicker ? 'checked' : ''}> Flicker</label>
                        <label class="opt-check"><input type="checkbox" id="adm-fx-scan" ${systemData.effects.scanline ? 'checked' : ''}> Scanlines</label>
                        <label class="opt-check"><input type="checkbox" id="adm-fx-svg" ${systemData.effects.svgGlow !== false ? 'checked' : ''}> SVG Icons</label>
                        <label class="opt-check"><input type="checkbox" id="adm-fx-pulse" ${systemData.effects.screenPulse ? 'checked' : ''}> Screen Pulse</label>
                        <label class="opt-check"><input type="checkbox" id="adm-home-icons" ${systemData.home.showIcons !== false ? 'checked' : ''}> Show Menu Icons</label>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px;">
                        <label class="form-label" for="adm-font-choice" style="margin:0;">Font:</label>
                        <select id="adm-font-choice" class="form-control" style="max-width:220px;">
                            <option value="modern" ${systemData.themes.font === 'modern' ? 'selected' : ''}>Mono (JetBrains/Fira)</option>
                            <option value="pixel" ${systemData.themes.font === 'pixel' ? 'selected' : ''}>Pixel</option>
                        </select>
                        <button class="btn btn-green" onclick="saveThemeExtras()">APPLY</button>
                    </div>
                </div>
                <div style="border:1px solid var(--text); padding:10px; margin-bottom:15px">
                    <h4>Create Custom Theme</h4>
                    <div class="form-group"><label>Theme Name:</label><input class="form-control" id="adm-theme-name" placeholder="My Cool Theme"></div>
                    <div class="form-group"><label>Background Color (Hex):</label><input type="color" class="form-control" id="adm-theme-bg" value="#000000"></div>
                    <div class="form-group"><label>Text Color (Hex):</label><input type="color" class="form-control" id="adm-theme-text" value="#ffffff"></div>
                    <button class="btn btn-green" onclick="createCustomTheme()">CREATE THEME</button>
                </div>
                <h4>All Themes (Set Default)</h4>
                <div class="item-list" id="adm-theme-list"></div>`;
        renderAdminThemeList();
    } else if (sec === 'sys') {
        el.innerHTML = `<h3>System Settings</h3>
                <div class="form-group"><label class="form-label">Change Admin Password:</label><input class="form-control" id="adm-sys-pass" value="${systemData.password}"></div>
                <button class="btn btn-green" onclick="saveSysPass()">SAVE PASSWORD</button>
                
                <hr style="border-color:var(--dim); margin:20px 0;">
                <h4>Menu Visibility Configuration</h4>
                <div class="opts-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                    <label class="opt-check"><input type="checkbox" id="mv-work" ${systemData.menuVisibility.work ? 'checked' : ''}> Work</label>
                    <label class="opt-check"><input type="checkbox" id="mv-notes" ${systemData.menuVisibility.notes ? 'checked' : ''}> Notes</label>
                    <label class="opt-check"><input type="checkbox" id="mv-blog" ${systemData.menuVisibility.blog ? 'checked' : ''}> Blog</label>
                    <label class="opt-check"><input type="checkbox" id="mv-todo" ${systemData.menuVisibility.todo ? 'checked' : ''}> Todo</label>
                    <label class="opt-check"><input type="checkbox" id="mv-gallery" ${systemData.menuVisibility.gallery ? 'checked' : ''}> Gallery</label>
                    <label class="opt-check"><input type="checkbox" id="mv-game" ${systemData.menuVisibility.game ? 'checked' : ''}> Game</label>
                    <label class="opt-check"><input type="checkbox" id="mv-draw" ${systemData.menuVisibility.draw ? 'checked' : ''}> Draw</label>
                    <label class="opt-check"><input type="checkbox" id="mv-pc" ${systemData.menuVisibility.pc ? 'checked' : ''}> About PC</label>
                    <label class="opt-check"><input type="checkbox" id="mv-saver" ${systemData.menuVisibility.saver ? 'checked' : ''}> Saver</label>
                </div>
                <button class="btn btn-green" style="margin-top:10px" onclick="saveMenuVis()">SAVE MENU CONFIG</button>

                <hr style="border-color:var(--dim); margin:20px 0;">
                <h4>Footer Phrases</h4>
                <div class="item-list" id="adm-phrase-list"></div>
                <button class="btn" onclick="addPhrase()">+ ADD PHRASE</button>`;
        renderSysLists();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_MENU_CONFIG - Конфігурація меню
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * saveMenuVis - Зберігає налаштування видимості пунктів меню
 * Керує відображенням секцій: work, notes, blog, todo, gallery, game
 */
// --- MENU CONFIG SAVE ---
window.saveMenuVis = function () {
    systemData.menuVisibility.work = document.getElementById('mv-work').checked;
    systemData.menuVisibility.notes = document.getElementById('mv-notes').checked;
    systemData.menuVisibility.blog = document.getElementById('mv-blog').checked;
    systemData.menuVisibility.todo = document.getElementById('mv-todo').checked;
    systemData.menuVisibility.gallery = document.getElementById('mv-gallery').checked;
    systemData.menuVisibility.game = document.getElementById('mv-game').checked;
    systemData.menuVisibility.draw = document.getElementById('mv-draw').checked;
    systemData.menuVisibility.pc = document.getElementById('mv-pc').checked;
    systemData.menuVisibility.saver = document.getElementById('mv-saver').checked;

    saveData();
    if (typeof applyMenuVisibility === 'function') applyMenuVisibility();
    alert("Menu Configuration Saved!");
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_RESUME - Функції редагування резюме
// ═══════════════════════════════════════════════════════════════════════════════

// --- GLOBAL ADMIN FUNCTIONS ---

// --- RESUME BASICS ---
/** saveResumeBasics - Зберігає базові дані резюме (ім'я, email, телефон, опис) */
// RESUME
window.saveResumeBasics = function () {
    systemData.resume.name = document.getElementById('adm-res-name').value;
    systemData.resume.email = document.getElementById('adm-res-email').value;
    systemData.resume.birth = document.getElementById('adm-res-birth').value;
    systemData.resume.phone = document.getElementById('adm-res-phone').value;
    systemData.resume.summary = document.getElementById('adm-res-summary').value;
    saveData(); alert("Saved!");
}
/** uploadResumePhoto - Завантажує фото для резюме як base64 */
window.uploadResumePhoto = function () {
    const file = document.getElementById('adm-res-photo-up').files[0];
    if (!file) return alert("Select file!");
    const reader = new FileReader();
    reader.onload = function (e) { systemData.resume.photo = e.target.result; saveData(); alert("Photo Updated!"); };
    reader.readAsDataURL(file);
}
// --- SKILLS ---
/** renderAdminSkills - Рендерить список навичок з полями редагування */
window.renderAdminSkills = function () { const l = document.getElementById('adm-skill-list'); l.innerHTML = systemData.resume.skills.map((s, i) => `<div class="item-row"><input class="form-control" style="width:50%" value="${s.n}" onchange="updateSkill(${i}, 'n', this.value)"><input type="number" class="form-control" style="width:20%" value="${s.p}" onchange="updateSkill(${i}, 'p', this.value)">%<button class="btn btn-red btn-sm" onclick="delSkill(${i})">X</button></div>`).join(''); }
/** updateSkill - Оновлює навичку за індексом */
window.updateSkill = function (i, f, v) { systemData.resume.skills[i][f] = v; saveData(); }
/** addSkill - Додає нову навичку */
window.addSkill = function () { systemData.resume.skills.push({ n: "New Skill", p: 50 }); saveData(); renderAdminSkills(); }
/** delSkill - Видаляє навичку за індексом */
window.delSkill = function (i) { if (confirm("Del?")) { systemData.resume.skills.splice(i, 1); saveData(); renderAdminSkills(); } }

// --- LANGUAGES ---
/** renderAdminLangs - Рендерить список мов */
window.renderAdminLangs = function () { const l = document.getElementById('adm-lang-list'); l.innerHTML = systemData.resume.languages.map((lang, i) => `<div class="item-row"><input class="form-control" value="${lang}" onchange="updateLang(${i}, this.value)"><button class="btn btn-red btn-sm" onclick="delLang(${i})">X</button></div>`).join(''); }
/** updateLang - Оновлює мову за індексом */
window.updateLang = function (i, v) { systemData.resume.languages[i] = v; saveData(); }
/** addLang - Додає нову мову */
window.addLang = function () { systemData.resume.languages.push("New Language"); saveData(); renderAdminLangs(); }
/** delLang - Видаляє мову за індексом */
window.delLang = function (i) { if (confirm("Del?")) { systemData.resume.languages.splice(i, 1); saveData(); renderAdminLangs(); } }

// --- JOBS (Experience) ---
/** renderAdminJobs - Рендерить список досвіду роботи */
window.delLang = function (i) { if (confirm("Del?")) { systemData.resume.languages.splice(i, 1); saveData(); renderAdminLangs(); } }
window.renderAdminJobs = function () { const l = document.getElementById('adm-job-list'); l.innerHTML = systemData.resume.jobs.map((j, i) => `<div class="item-row"><span>${j.co}</span> <div><button class="btn btn-sm" onclick="editJob(${i})">EDIT</button> <button class="btn btn-red btn-sm" onclick="delJob(${i})">DEL</button></div></div>`).join(''); }
/** addJob - Додає новий запис про роботу */
window.addJob = function () { systemData.resume.jobs.unshift({ co: "New Corp", pos: "Position", per: "2024-2025", tasks: ["Task 1"] }); saveData(); renderAdminJobs(); editJob(0); }
/** delJob - Видаляє запис про роботу */
window.delJob = function (i) { if (confirm("Delete job?")) { systemData.resume.jobs.splice(i, 1); saveData(); renderAdminJobs(); document.getElementById('job-editor-area').style.display = 'none'; } }
/** editJob - Відкриває редактор для запису про роботу */
window.editJob = function (i) { const j = systemData.resume.jobs[i]; const area = document.getElementById('job-editor-area'); area.style.display = 'block'; area.innerHTML = `<h4>Editing: ${j.co}</h4><div class="form-group"><label>Company:</label><input class="form-control" id="ej-co" value="${j.co}"></div><div class="form-group"><label>Position:</label><input class="form-control" id="ej-pos" value="${j.pos}"></div><div class="form-group"><label>Period:</label><input class="form-control" id="ej-per" value="${j.per}"></div><div class="form-group"><label>Tasks (one per line):</label><textarea class="form-control" id="ej-tasks" style="height:100px">${j.tasks.join('\n')}</textarea></div><button class="btn btn-green" onclick="saveJob(${i})">SAVE JOB</button> <button class="btn" onclick="document.getElementById('job-editor-area').style.display='none'">CLOSE</button>`; }
/** saveJob - Зберігає зміни до запису про роботу */
window.saveJob = function (i) { const j = systemData.resume.jobs[i]; j.co = document.getElementById('ej-co').value; j.pos = document.getElementById('ej-pos').value; j.per = document.getElementById('ej-per').value; j.tasks = document.getElementById('ej-tasks').value.split('\n').filter(t => t.trim() !== ''); saveData(); renderAdminJobs(); alert("Job Updated!"); }

// --- EDUCATION ---
/** renderAdminEdu - Рендерить список освіти */
window.renderAdminEdu = function () {
    const l = document.getElementById('adm-edu-list');
    if (!l) return;

    const education = (systemData.resume && Array.isArray(systemData.resume.education)) ? systemData.resume.education : [];
    if (!education.length) {
        l.innerHTML = '<div class="item-row" style="opacity:0.6;">No education records</div>';
        return;
    }

    l.innerHTML = education.map((e, i) =>
        `<div class="item-row"><span>${e.inst || 'Institution'}</span> <div><button class="btn btn-sm" onclick="editEdu(${i})">EDIT</button> <button class="btn btn-red btn-sm" onclick="delEdu(${i})">DEL</button></div></div>`
    ).join('');
};
window.addEdu = function () { systemData.resume.education.unshift({ inst: "University", year: "2020-2024", deg: "Degree" }); saveData(); renderAdminEdu(); editEdu(0); }
window.delEdu = function (i) { if (confirm("Delete?")) { systemData.resume.education.splice(i, 1); saveData(); renderAdminEdu(); document.getElementById('edu-editor-area').style.display = 'none'; } }
window.editEdu = function (i) { const e = systemData.resume.education[i]; const area = document.getElementById('edu-editor-area'); area.style.display = 'block'; area.innerHTML = `<h4>Editing: ${e.inst}</h4><div class="form-group"><label>Institution:</label><input class="form-control" id="ee-inst" value="${e.inst}"></div><div class="form-group"><label>Year:</label><input class="form-control" id="ee-year" value="${e.year}"></div><div class="form-group"><label>Degree:</label><input class="form-control" id="ee-deg" value="${e.deg}"></div><button class="btn btn-green" onclick="saveEdu(${i})">SAVE EDU</button> <button class="btn" onclick="document.getElementById('edu-editor-area').style.display='none'">CLOSE</button>`; }
window.saveEdu = function (i) { const e = systemData.resume.education[i]; e.inst = document.getElementById('ee-inst').value; e.year = document.getElementById('ee-year').value; e.deg = document.getElementById('ee-deg').value; saveData(); renderAdminEdu(); alert("Edu Updated!"); }
window.renderAdminRnd = function () { const l = document.getElementById('adm-rnd-list'); l.innerHTML = systemData.resume.rnd.map((r, i) => `<div class="item-row"><input class="form-control" value="${r}" onchange="updateRnd(${i}, this.value)"><button class="btn btn-red btn-sm" onclick="delRnd(${i})">X</button></div>`).join(''); }
window.updateRnd = function (i, v) { systemData.resume.rnd[i] = v; saveData(); }
window.addRnd = function () { systemData.resume.rnd.push("New Project"); saveData(); renderAdminRnd(); }
window.delRnd = function (i) { if (confirm("Del?")) { systemData.resume.rnd.splice(i, 1); saveData(); renderAdminRnd(); } }

// --- RESUME TITLES & TEMPLATES ---
/** saveResumeTitles - Зберігає заголовки секцій резюме */
// RESUME CONFIG
window.saveResumeTitles = function () {
    if (!systemData.resume.titles) systemData.resume.titles = {};
    const t = systemData.resume.titles;
    t.summary = document.getElementById('rt-sum').value;
    t.skills = document.getElementById('rt-ski').value;
    t.langs = document.getElementById('rt-lan').value;
    t.jobs = document.getElementById('rt-job').value;
    t.edu = document.getElementById('rt-edu').value;
    t.rnd = document.getElementById('rt-rnd').value;
    saveData(); alert("Titles Saved!");
}
/** saveResumeTemplates - Зберігає шаблони генерації DOC/MD */
window.saveResumeTemplates = function () {
    systemData.resume.templates.doc = document.getElementById('tpl-doc').value;
    systemData.resume.templates.md = document.getElementById('tpl-md').value;
    saveData(); alert("Templates Saved!");
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_NOTES - Менеджер нотаток Obsidian
// ═══════════════════════════════════════════════════════════════════════════════

/** renderNoteCats - Рендерить список категорій нотаток */
// NOTES
window.renderNoteCats = function () {
    const l = document.getElementById('adm-note-cat-list'); l.innerHTML = systemData.obsidian.cats.map(c => {
        const hasPass = systemData.obsidian.catAuth && systemData.obsidian.catAuth[c];
        const lockBtn = `<button class="btn btn-sm" onclick="toggleNoteCatLock('${c}', event)">${hasPass ? 'UNLOCK' : 'LOCK'}</button>`;
        return `<div class="item-row" style="cursor:pointer; ${c === admNoteCat ? 'background:var(--dim)' : ''}" onclick="selectNoteCat('${c}')"><span>${hasPass ? '🔒 ' : ''}${c}</span> <div>${lockBtn} <button class="btn btn-red btn-sm" onclick="delNoteCat('${c}', event)">X</button></div></div>`
    }).join('');
}

window.toggleNoteCatLock = async function (c, e) {
    e.stopPropagation();
    if (!systemData.obsidian.catAuth) systemData.obsidian.catAuth = {};
    if (systemData.obsidian.catAuth[c]) {
        if (confirm("Remove password for " + c + "?")) {
            delete systemData.obsidian.catAuth[c];
            saveData(); renderNoteCats();
        }
    } else {
        const pass = prompt("Set password for " + c + ":");
        if (pass) {
            systemData.obsidian.catAuth[c] = await hashPass(pass);
            saveData(); renderNoteCats();
        }
    }
}

window.selectNoteCat = function (c) { admNoteCat = c; admNoteFile = ''; renderNoteCats(); renderNoteFiles(); document.getElementById('adm-note-content').style.display = 'none'; document.getElementById('adm-note-controls').style.display = 'none'; }
window.addNoteCat = function () { const n = prompt("Category Name:"); if (n) { if (!systemData.obsidian.cats.includes(n)) { systemData.obsidian.cats.push(n); systemData.obsidian[n] = {}; saveData(); renderNoteCats(); } } }
window.delNoteCat = function (c, e) { e.stopPropagation(); if (confirm("Del Category " + c + "?")) { systemData.obsidian.cats = systemData.obsidian.cats.filter(x => x !== c); delete systemData.obsidian[c]; if (systemData.obsidian.catAuth) delete systemData.obsidian.catAuth[c]; if (admNoteCat === c) admNoteCat = ''; saveData(); renderNoteCats(); document.getElementById('adm-note-file-list').innerHTML = ''; } }
window.renderNoteFiles = function () { const l = document.getElementById('adm-note-file-list'); if (!admNoteCat) { l.innerHTML = 'Select category...'; return; } l.innerHTML = `<button class="btn btn-sm" style="margin-bottom:5px; width:100%" onclick="addNoteFile()">+ NEW FILE</button>` + (systemData.obsidian[admNoteCat] ? Object.keys(systemData.obsidian[admNoteCat]).map(f => `<div class="item-row" style="cursor:pointer; ${f === admNoteFile ? 'background:var(--text); color:var(--bg)' : ''}" onclick="selectNoteFile('${f}')"><span>${f}</span> <button class="btn btn-red btn-sm" onclick="delNoteFile('${f}', event)">X</button></div>`).join('') : ''); }
window.selectNoteFile = function (f) { admNoteFile = f; renderNoteFiles(); const ta = document.getElementById('adm-note-content'); ta.style.display = 'block'; ta.value = systemData.obsidian[admNoteCat][f]; document.getElementById('adm-note-controls').style.display = 'block'; }
window.addNoteFile = function () { const n = prompt("File Name (e.g. note.md):"); if (n && admNoteCat) { if (!systemData.obsidian[admNoteCat]) systemData.obsidian[admNoteCat] = {}; systemData.obsidian[admNoteCat][n] = "# New Note"; saveData(); renderNoteFiles(); selectNoteFile(n); } }
window.delNoteFile = function (f, e) { e.stopPropagation(); if (confirm("Del File?")) { delete systemData.obsidian[admNoteCat][f]; if (admNoteFile === f) { admNoteFile = ''; document.getElementById('adm-note-content').style.display = 'none'; } saveData(); renderNoteFiles(); } }
window.saveNoteContent = function () { if (admNoteCat && admNoteFile) { systemData.obsidian[admNoteCat][admNoteFile] = document.getElementById('adm-note-content').value; saveData(); alert("Note Saved!"); } }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_BLOG - Керування блогом
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAdminBlogList - Рендерить список постів блогу */
// BLOG
window.renderAdminBlogList = function () { const l = document.getElementById('adm-blog-list'); l.innerHTML = systemData.blog.map((p, i) => `<div class="item-row"><span>${p.title}</span><div><button class="btn btn-sm" onclick="editBlog(${i})">EDIT</button><button class="btn btn-red btn-sm" onclick="delBlog(${i})">DEL</button></div></div>`).join(''); }
window.addBlogPost = function () { systemData.blog.unshift({ id: Date.now(), title: "New Blog Post", date: new Date().toISOString().split('T')[0], tags: ["NEW"], snippet: "Description...", content: "Content..." }); saveData(); renderAdminBlogList(); editBlog(0); }
window.editBlog = function (i) {
    const p = systemData.blog[i]; const el = document.getElementById('admin-editor'); el.innerHTML = `<h3>Edit Post</h3><div class="form-group"><label>Title:</label><input class="form-control" id="eb-title" value="${p.title}"></div><div class="form-group"><label>Date:</label><input class="form-control" id="eb-date" value="${p.date}"></div>
        <div class="form-group"><label>Tags (comma separated):</label><input class="form-control" id="eb-tags" value="${p.tags.join(', ')}"></div>
        <div class="form-group"><label>Snippet:</label><input class="form-control" id="eb-snip" value="${p.snippet}"></div><div class="form-group"><label>Content:</label><textarea class="form-control" id="eb-cont">${p.content}</textarea></div><button class="btn btn-green" onclick="saveBlogEdit(${i})">SAVE</button> <button class="btn" onclick="renderAdminDash('blog')">CANCEL</button>`;
}
window.saveBlogEdit = function (i) {
    const p = systemData.blog[i]; p.title = document.getElementById('eb-title').value; p.date = document.getElementById('eb-date').value; p.snippet = document.getElementById('eb-snip').value; p.content = document.getElementById('eb-cont').value;
    const tagStr = document.getElementById('eb-tags').value;
    p.tags = tagStr.split(',').map(t => t.trim()).filter(t => t);
    saveData(); renderAdminDash('blog');
}
window.delBlog = function (i) { if (confirm("Delete?")) { systemData.blog.splice(i, 1); saveData(); renderAdminBlogList(); } }
// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_TODO - Список справ (Todo)
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAdminTodo - Рендерить список завдань */
// TODO
window.renderAdminTodo = function () {
    const l = document.getElementById('adm-todo-list');
    const rows = systemData.todos.map((t, i) => {
        const dueVal = t.due ? t.due : '';
        const timeVal = t.time ? t.time : '';
        return `<div class="item-row" style="gap:10px; align-items:center; ${t.d ? 'opacity:0.6' : ''}">
            <input type="checkbox" ${t.d ? 'checked' : ''} onchange="toggleTodo(${i})" aria-label="Mark done">
            <input type="text" class="form-control" style="flex:1;" value="${t.t}" onchange="editAdminTodo(${i}, 't', this.value)">
            <input type="date" class="form-control" style="max-width:170px;" value="${dueVal}" onchange="editAdminTodo(${i}, 'due', this.value)">
            <input type="time" class="form-control" style="max-width:130px;" value="${timeVal}" onchange="editAdminTodo(${i}, 'time', this.value)">
            <button class="btn btn-red btn-sm" onclick="delTodo(${i})">DEL</button>
        </div>`;
    });
    l.innerHTML = rows.join('');
};
window.addAdminTodo = function () {
    const inp = document.getElementById('adm-new-todo');
    const date = document.getElementById('adm-new-todo-date');
    const time = document.getElementById('adm-new-todo-time');
    const title = inp && inp.value ? inp.value.trim() : '';
    if (!title) return;
    const item = { t: title, d: false };
    if (date && date.value) item.due = date.value;
    if (time && time.value) item.time = time.value;
    systemData.todos.push(item);
    saveData();
    renderAdminTodo();
    if (inp) inp.value = '';
    if (date) date.value = '';
    if (time) time.value = '';
};
window.editAdminTodo = function (i, key, value) {
    if (!systemData.todos[i]) return;
    if (key === 't') systemData.todos[i].t = value.trim();
    if (key === 'due') systemData.todos[i].due = value ? value : undefined;
    if (key === 'time') systemData.todos[i].time = value ? value : undefined;
    saveData();
};
window.toggleTodo = function (i) { systemData.todos[i].d = !systemData.todos[i].d; saveData(); renderAdminTodo(); }
window.delTodo = function (i) { systemData.todos.splice(i, 1); saveData(); renderAdminTodo(); }
window.saveTodoSettings = function () { systemData.todoEditable = document.getElementById('adm-todo-editable').checked; saveData(); }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_SAVER - Screensaver config
// ═══════════════════════════════════════════════════════════════════════════════

function ensureSaverData() {
    if (!systemData.screensaver) systemData.screensaver = JSON.parse(JSON.stringify(defaultData.screensaver));
    if (!Array.isArray(systemData.screensaver.catalog)) systemData.screensaver.catalog = JSON.parse(JSON.stringify(defaultData.screensaver.catalog || ADM_SAVER_TYPES));
    if (systemData.screensaver.catalog.length === 0) systemData.screensaver.catalog = JSON.parse(JSON.stringify(defaultData.screensaver.catalog || ADM_SAVER_TYPES));
    systemData.screensaver.catalog = systemData.screensaver.catalog.map((s) => ({ code: '', desc: '', name: '', ...s }));
    if (!systemData.screensaver.type) systemData.screensaver.type = systemData.screensaver.catalog[0] ? systemData.screensaver.catalog[0].id : 'matrix';
    if (typeof systemData.screensaver.enabled === 'undefined') systemData.screensaver.enabled = true;
    if (!systemData.screensaver.timeout) systemData.screensaver.timeout = 60;
}

window.renderAdminSaverList = function () {
    ensureSaverData();
    const l = document.getElementById('adm-saver-list');
    const rows = systemData.screensaver.catalog.map((s, i) => {
        return `<div class="item-row" style="gap:8px; align-items:center;">
            <label class="opt-check"><input type="radio" name="adm-saver-default" value="${s.id}" ${systemData.screensaver.type === s.id ? 'checked' : ''}> Default</label>
            <input class="form-control" style="flex:1;" value="${s.name || ''}" onchange="updateSaverField(${i}, 'name', this.value)">
            <input class="form-control" style="flex:1;" value="${s.desc || ''}" onchange="updateSaverField(${i}, 'desc', this.value)">
            <select class="form-control" onchange="updateSaverField(${i}, 'id', this.value)">${ADM_SAVER_TYPES.map(t => `<option value="${t.id}" ${t.id === s.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
            <div style="display:flex; gap:6px;">
                <button class="btn btn-sm" onclick="openSaverEditor(${i})">EDIT</button>
                <button class="btn btn-red btn-sm" onclick="delSaver(${i})">DEL</button>
            </div>
        </div>`;
    });
    l.innerHTML = rows.join('');
};

let currentSaverEdit = -1;

window.openSaverEditor = function (i) {
    ensureSaverData();
    const target = systemData.screensaver.catalog[i];
    if (!target) return;
    currentSaverEdit = i;
    document.getElementById('saver-editor-heading').innerText = `Editing: ${target.name || target.id}`;
    document.getElementById('adm-saver-edit-name').value = target.name || '';
    document.getElementById('adm-saver-edit-desc').value = target.desc || '';
    const idSel = document.getElementById('adm-saver-edit-id');
    if (idSel) idSel.value = target.id;
    document.getElementById('adm-saver-code').value = target.code || '';
    const area = document.getElementById('saver-editor-area');
    if (area) area.style.display = 'block';
    const nameEl = document.getElementById('adm-saver-edit-name');
    if (nameEl) nameEl.focus();
};

window.closeSaverEditor = function () {
    const area = document.getElementById('saver-editor-area');
    if (area) area.style.display = 'none';
    currentSaverEdit = -1;
};

window.saveSaverEdit = function () {
    ensureSaverData();
    if (currentSaverEdit < 0 || !systemData.screensaver.catalog[currentSaverEdit]) return;
    const name = document.getElementById('adm-saver-edit-name').value || '';
    const desc = document.getElementById('adm-saver-edit-desc').value || '';
    const idSel = document.getElementById('adm-saver-edit-id');
    const idVal = idSel && idSel.value ? idSel.value : systemData.screensaver.catalog[currentSaverEdit].id;
    const code = document.getElementById('adm-saver-code').value || '';
    if (systemData.screensaver.catalog.some((s, idx) => idx !== currentSaverEdit && s.id === idVal)) {
        showToast('Saver ID already exists', 'error');
        return;
    }
    const target = systemData.screensaver.catalog[currentSaverEdit];
    target.name = name;
    target.desc = desc;
    target.id = idVal;
    target.code = code;
    saveData();
    renderAdminSaverList();
    closeSaverEditor();
    showToast('Saver updated', 'success');
};

window.updateSaverField = function (i, key, value) {
    ensureSaverData();
    if (!systemData.screensaver.catalog[i]) return;
    if (key === 'id' && systemData.screensaver.catalog.some((s, idx) => s.id === value && idx !== i)) {
        showToast('ID already exists', 'error');
        return;
    }
    systemData.screensaver.catalog[i][key] = value;
    saveData();
};

window.addSaverEntry = function () {
    ensureSaverData();
    const name = document.getElementById('adm-saver-name').value || 'New Saver';
    const desc = document.getElementById('adm-saver-desc').value || '';
    const idSel = document.getElementById('adm-saver-id');
    const idVal = idSel && idSel.value ? idSel.value : 'matrix';
    if (systemData.screensaver.catalog.find(s => s.id === idVal)) {
        showToast('Saver with this ID already exists', 'error');
        return;
    }
    systemData.screensaver.catalog.push({ id: idVal, name, desc, code: '' });
    saveData();
    renderAdminSaverList();
    document.getElementById('adm-saver-name').value = '';
    document.getElementById('adm-saver-desc').value = '';
};

window.delSaver = function (i) {
    ensureSaverData();
    const target = systemData.screensaver.catalog[i];
    systemData.screensaver.catalog.splice(i, 1);
    if (target && systemData.screensaver.type === target.id) {
        systemData.screensaver.type = systemData.screensaver.catalog[0] ? systemData.screensaver.catalog[0].id : 'matrix';
    }
    saveData();
    renderAdminSaverList();
};

window.saveSaverSettings = function () {
    ensureSaverData();
    const timeout = document.getElementById('adm-saver-timeout');
    const enabled = document.getElementById('adm-saver-enabled');
    const defaultSel = document.querySelector('input[name="adm-saver-default"]:checked');
    const tVal = timeout && timeout.value ? parseInt(timeout.value, 10) : 60;
    systemData.screensaver.timeout = isNaN(tVal) ? 60 : Math.max(10, Math.min(600, tVal));
    systemData.screensaver.enabled = enabled ? enabled.checked !== false : true;
    if (defaultSel && systemData.screensaver.catalog.find(s => s.id === defaultSel.value)) {
        systemData.screensaver.type = defaultSel.value;
    }
    saveData();
    resetIdleTimer();
    showToast('Screensaver settings saved', 'success');
};
// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_GALLERY - Галерея (фото + ASCII арт)
// ═══════════════════════════════════════════════════════════════════════════════

/** uploadImage - Завантажує зображення з автоматичним resize до 1280x720 */
// GALLERY
window.uploadImage = function () {
    const file = document.getElementById('adm-img-upload').files[0];
    const name = document.getElementById('adm-img-name').value || "IMG_" + Date.now();
    if (!file) return alert("Select file!");

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 720;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                if (width / MAX_WIDTH > height / MAX_HEIGHT) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL(file.type || 'image/jpeg'); // Default to jpeg if type missing

            systemData.gallery.PHOTO_DATA.unshift({ n: name, d: new Date().toISOString().split('T')[0], a: dataUrl });
            saveData();
            renderAdminGalleryList();
            alert("Uploaded & Resized!");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.delImg = function (i) { if (confirm("Delete?")) { systemData.gallery.PHOTO_DATA.splice(i, 1); saveData(); renderAdminGalleryList(); } }
window.renderAdminGalleryList = function () { const l = document.getElementById('adm-gal-list'); l.innerHTML = systemData.gallery.PHOTO_DATA.map((p, i) => `<div class="item-row"><span>${p.n}</span><button class="btn btn-red btn-sm" onclick="delImg(${i})">DEL</button></div>`).join(''); }
window.renderAdminAsciiList = function () { const l = document.getElementById('adm-asc-list'); l.innerHTML = systemData.gallery.ASCII_ART.map((a, i) => `<div class="item-row"><span>${a.n}</span><button class="btn btn-red btn-sm" onclick="delAscii(${i})">DEL</button></div>`).join(''); }
window.addAscii = function () { const name = document.getElementById('adm-asc-name').value; const content = document.getElementById('adm-asc-content').value; if (!name || !content) return alert("Fill all fields!"); systemData.gallery.ASCII_ART.unshift({ n: name, d: new Date().toISOString().split('T')[0], a: content }); saveData(); renderAdminAsciiList(); document.getElementById('adm-asc-name').value = ''; document.getElementById('adm-asc-content').value = ''; }
window.delAscii = function (i) { if (confirm("Delete?")) { systemData.gallery.ASCII_ART.splice(i, 1); saveData(); renderAdminAsciiList(); } }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_GAMES - Редактор ігор
// ═══════════════════════════════════════════════════════════════════════════════

let editingGameId = null;  // ID гри що редагується
/** renderAdminGameList - Рендерить список ігор */
window.renderAdminGameList = function () { const l = document.getElementById('adm-game-list'); l.innerHTML = systemData.games.map((g) => `<div class="item-row"><span>${g.name}</span><div><button class="btn btn-sm" onclick="editGame('${g.id}')">EDIT CODE</button> <button class="btn btn-red btn-sm" onclick="delGame('${g.id}')">DEL</button></div></div>`).join(''); }
/** createNewGame - Створює нову гру з шаблоном коду */
window.createNewGame = function () { editingGameId = 'game_' + Date.now(); document.getElementById('game-editor-area').style.display = 'block'; document.getElementById('ge-heading').innerText = 'Creating New Game'; document.getElementById('ge-name').value = 'My New Game'; document.getElementById('ge-code').value = `// Game Code Here. \n// Container: document.getElementById('arena')\n\nconst arena = document.getElementById('arena');\narena.innerHTML = '<div style="padding:20px">Hello World</div>';`; }
/** editGame - Відкриває редактор коду гри */
window.editGame = function (id) { const g = systemData.games.find(x => x.id === id); if (!g) return; editingGameId = id; document.getElementById('game-editor-area').style.display = 'block'; document.getElementById('ge-heading').innerText = 'Editing: ' + g.name; document.getElementById('ge-name').value = g.name; document.getElementById('ge-code').value = g.code || ''; document.getElementById('ge-name').focus(); }
/** saveGameCode - Зберігає код гри */
window.saveGameCode = function () {
    if (!editingGameId) return;
    const name = document.getElementById('ge-name').value;
    const code = document.getElementById('ge-code').value;
    const existingIndex = systemData.games.findIndex(x => x.id === editingGameId);
    if (existingIndex >= 0) {
        systemData.games[existingIndex].name = name;
        systemData.games[existingIndex].code = code;
    } else {
        systemData.games.push({ id: editingGameId, name: name, code: code });
    }
    saveData();
    renderAdminGameList();
    showToast('Game saved', 'success');
};
/** delGame - Видаляє гру */
window.delGame = function (id) {
    showConfirm('Delete this game?').then((ok) => {
        if (!ok) return;
        systemData.games = systemData.games.filter(x => x.id !== id);
        saveData();
        renderAdminGameList();
        closeGameEditor();
        showToast('Game removed', 'info');
    });
};
/** closeGameEditor - Закриває редактор гри */
window.closeGameEditor = function () { document.getElementById('game-editor-area').style.display = 'none'; editingGameId = null; }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_HOME_PROF - Профілі головної сторінки
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAdminHomeProfiles - Рендерить список профілів (тегових груп) */
// HOME PROFILES ADMIN FUNCTIONS
window.renderAdminHomeProfiles = function () {
    const l = document.getElementById('adm-hp-list');
    l.innerHTML = systemData.homeLinks.profiles.map((p, i) => `
                <div class="item-row">
                    <span><b>${p.password ? '🔒 ' : ''}${p.name}</b> [${p.tags.join(', ')}]</span>
                    <div>
                        <button class="btn btn-sm" onclick="editHomeProfile(${i})">EDIT</button> 
                        <button class="btn btn-red btn-sm" onclick="delHomeProfile(${i})">X</button>
                    </div>
                </div>
            `).join('');
}
window.addHomeProfile = async function () {
    const name = document.getElementById('adm-hp-name').value.trim();
    const tagsVal = document.getElementById('adm-hp-tags').value.trim();
    const passVal = document.getElementById('adm-hp-pass').value.trim();
    if (!name || !tagsVal) return alert("Fill Name and Tags!");
    const tags = tagsVal.split(',').map(t => t.trim()).filter(t => t);

    let finalPass = "";
    if (passVal) finalPass = await hashPass(passVal);

    systemData.homeLinks.profiles.push({ id: 'hp_' + Date.now(), name: name, tags: tags, password: finalPass });
    saveData();
    renderAdminHomeProfiles();
    document.getElementById('adm-hp-name').value = '';
    document.getElementById('adm-hp-tags').value = '';
    document.getElementById('adm-hp-pass').value = '';
}
window.delHomeProfile = function (i) {
    if (confirm("Delete profile?")) {
        systemData.homeLinks.profiles.splice(i, 1);
        saveData();
        renderAdminHomeProfiles();
    }
}
window.editHomeProfile = function (i) {
    const p = systemData.homeLinks.profiles[i];
    const area = document.getElementById('hp-editor-area');
    area.style.display = 'block';
    document.getElementById('ehp-id').value = i;
    document.getElementById('ehp-name').value = p.name;
    document.getElementById('ehp-tags').value = p.tags.join(', ');
    document.getElementById('ehp-pass').value = '';
}
window.saveHomeProfile = async function () {
    const i = document.getElementById('ehp-id').value;
    const name = document.getElementById('ehp-name').value;
    const tagsVal = document.getElementById('ehp-tags').value;
    const passVal = document.getElementById('ehp-pass').value;

    if (!name || !tagsVal) return alert("Fill Name and Tags!");

    const p = systemData.homeLinks.profiles[i];
    p.name = name;
    p.tags = tagsVal.split(',').map(t => t.trim()).filter(t => t);

    // Only update password if user typed something
    if (passVal) {
        p.password = await hashPass(passVal);
    }

    saveData();
    renderAdminHomeProfiles();
    document.getElementById('hp-editor-area').style.display = 'none';
    alert("Profile Updated!");
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_HOME_LINKS - Посилання головної сторінки
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAdminHomeLinks - Рендерить список веб-посилань */
// HOME LINKS ADMIN FUNCTIONS
window.renderAdminHomeLinks = function () {
    const l = document.getElementById('adm-hl-list');
    l.innerHTML = systemData.homeLinks.links.map((link, i) => `
                <div class="item-row" style="flex-direction:column; align-items:flex-start; gap:5px;">
                    <div style="display:flex; justify-content:space-between; width:100%">
                        <span style="font-weight:bold">${link.t}</span>
                        <button class="btn btn-red btn-sm" onclick="delHomeLink(${i})">DEL</button>
                    </div>
                    <div style="font-size:0.8rem; opacity:0.7">${link.u}</div>
                    <div style="font-size:0.7rem; opacity:0.5">TAGS: ${link.tags.join(', ')}</div>
                </div>
            `).join('');
}
window.addHomeLink = function () {
    const t = document.getElementById('adm-hl-title').value.trim();
    const u = document.getElementById('adm-hl-url').value.trim();
    const tagsVal = document.getElementById('adm-hl-tags').value.trim();
    if (!t || !u || !tagsVal) return alert("Fill all fields!");
    const tags = tagsVal.split(',').map(tag => tag.trim()).filter(tag => tag);
    systemData.homeLinks.links.unshift({ t, u, tags });
    saveData();
    renderAdminHomeLinks();
    document.getElementById('adm-hl-title').value = '';
    document.getElementById('adm-hl-url').value = '';
    document.getElementById('adm-hl-tags').value = '';
}
window.delHomeLink = function (i) {
    if (confirm("Delete link?")) {
        systemData.homeLinks.links.splice(i, 1);
        saveData();
        renderAdminHomeLinks();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_HOME_SAVE - Збереження налаштувань Home
// ═══════════════════════════════════════════════════════════════════════════════

/** saveHome - Зберігає налаштування Header, Home Screen, About */
// HOME & SYS (UPDATED)
window.saveHome = function () {
    systemData.home.logoText = document.getElementById('adm-home-logotxt').value;
    systemData.home.browserTitle = document.getElementById('adm-home-btitle').value;

    systemData.home.ascii = document.getElementById('adm-home-ascii').value;
    systemData.home.title = document.getElementById('adm-home-title').value;
    systemData.home.text = document.getElementById('adm-home-text').value;

    systemData.about.showPhoto = document.getElementById('adm-about-photo').checked;

    saveData();
    renderDynamicLogo();
    alert("Home/About Updated!");
}

window.uploadAboutPhoto = function () {
    const file = document.getElementById('adm-about-photo-up').files[0];
    if (!file) return alert("Select file!");
    const reader = new FileReader();
    reader.onload = function (e) {
        systemData.about.photo = e.target.result;
        saveData();
        alert("About Photo Updated!");
    };
    reader.readAsDataURL(file);
}

window.setAdminTriggerTheme = function (id) {
    systemData.themes.adminTriggerTheme = id;
    saveData();
    showToast("Admin trigger theme updated to: " + id, 'success');
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_ABOUT_LANG - Мови розділу About
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAboutLangList - Рендерить список мов для About */
// ABOUT LANGUAGES
window.renderAboutLangList = function () {
    const l = document.getElementById('adm-al-list');
    if (!l) return;
    l.innerHTML = systemData.about.languages.map(lang => `
        <div class="item-row">
            <span><b>${lang.code.toUpperCase()}</b> (${lang.label})</span>
            <div>
                <button class="btn btn-sm" onclick="editAboutLang('${lang.code}')">EDIT</button>
                <button class="btn btn-red btn-sm" onclick="delAboutLang('${lang.code}')">DEL</button>
            </div>
        </div>
    `).join('');
}
window.addAboutLang = function () {
    document.getElementById('al-editor-area').style.display = 'block';
    document.getElementById('eal-code-orig').value = '';
    document.getElementById('eal-code').value = '';
    document.getElementById('eal-label').value = '';
    document.getElementById('eal-text').value = '';
}
window.editAboutLang = function (code) {
    const l = systemData.about.languages.find(x => x.code === code);
    if (!l) return;
    document.getElementById('al-editor-area').style.display = 'block';
    document.getElementById('eal-code-orig').value = l.code;
    document.getElementById('eal-code').value = l.code;
    document.getElementById('eal-label').value = l.label;
    document.getElementById('eal-text').value = l.text;
}
window.saveAboutLang = function () {
    const origCode = document.getElementById('eal-code-orig').value;
    const code = document.getElementById('eal-code').value.trim().toLowerCase();
    const label = document.getElementById('eal-label').value.trim();
    const text = document.getElementById('eal-text').value;

    if (!code || !label) return alert("Code and Label required!");

    if (origCode && origCode !== code) {
        const idx = systemData.about.languages.findIndex(x => x.code === origCode);
        if (idx !== -1) systemData.about.languages.splice(idx, 1);
    }

    if (!origCode && systemData.about.languages.find(x => x.code === code)) return alert("Code exists!");

    const idx = systemData.about.languages.findIndex(x => x.code === origCode || x.code === code);
    if (idx !== -1) {
        systemData.about.languages[idx] = { code, label, text };
    } else {
        systemData.about.languages.push({ code, label, text });
    }

    saveData();
    renderAboutLangList();
    document.getElementById('al-editor-area').style.display = 'none';
    alert("Language Saved!");
}
window.delAboutLang = function (code) {
    if (confirm("Delete " + code + "? (Cannot delete active)")) {
        if (systemData.about.activeLang === code) return alert("Change active language first!");
        systemData.about.languages = systemData.about.languages.filter(x => x.code !== code);
        saveData();
        renderAboutLangList();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_SYSTEM - Системні налаштування (пароль, glitch, phrases)
// ═══════════════════════════════════════════════════════════════════════════════

/** saveSysPass - Зберігає новий пароль адміністратора */
window.saveSysPass = async function () {
    const p = document.getElementById('adm-sys-pass').value;
    if (!p) return alert("Cannot be empty");
    systemData.password = await hashPass(p);
    saveData(); alert("Password Updated!");
}
window.renderSysLists = function () {
    renderAdminGlitchList();
    const pl = document.getElementById('adm-phrase-list'); if (pl) pl.innerHTML = systemData.glitch.footerPhrases.map((p, i) => `<div class="item-row"><input class="form-control" value="${p}" onchange="updPhrase(${i},this.value)"><button class="btn btn-red btn-sm" onclick="delPhrase(${i})">X</button></div>`).join('');
}
window.renderAdminGlitchList = function () {
    const gl = document.getElementById('adm-glitch-list'); if (gl) gl.innerHTML = systemData.glitch.logoSteps.map((s, i) => `<div class="item-row"><input class="form-control" value="${s}" onchange="updGlitch(${i},this.value)"><button class="btn btn-red btn-sm" onclick="delGlitch(${i})">X</button></div>`).join('');
}
window.updGlitch = function (i, v) { systemData.glitch.logoSteps[i] = v; saveData(); }
window.delGlitch = function (i) { if (confirm("Del?")) { systemData.glitch.logoSteps.splice(i, 1); saveData(); renderAdminGlitchList(); } }
window.addGlitch = function () { systemData.glitch.logoSteps.push("New Step"); saveData(); renderAdminGlitchList(); }
window.updPhrase = function (i, v) { systemData.glitch.footerPhrases[i] = v; saveData(); }
window.delPhrase = function (i) { if (confirm("Del?")) { systemData.glitch.footerPhrases.splice(i, 1); saveData(); renderSysLists(); } }
window.addPhrase = function () { systemData.glitch.footerPhrases.push("New Phrase"); saveData(); renderSysLists(); }

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_CONTACTS - Контакти та друзі
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAdminLinks - Рендерить список контактів та друзів */
// LINKS (FRIENDS + CONTACTS)
window.renderAdminLinks = function () {
    const l = document.getElementById('adm-link-list'); l.innerHTML = systemData.contacts.map((c, i) => `<div class="item-row"><div><input class="form-control" style="margin-bottom:2px" value="${c.label}" onchange="updLink(${i},'label',this.value)"><input class="form-control" style="font-size:0.8rem" value="${c.url}" onchange="updLink(${i},'url',this.value)"></div><button class="btn btn-red btn-sm" onclick="delLink(${i})">X</button></div>`).join('');

    const f = document.getElementById('adm-friend-list'); f.innerHTML = (systemData.friends || []).map((c, i) => `<div class="item-row"><div><input class="form-control" style="margin-bottom:2px" value="${c.label}" onchange="updFriend(${i},'label',this.value)"><input class="form-control" style="font-size:0.8rem; margin-bottom:2px" value="${c.url}" onchange="updFriend(${i},'url',this.value)"><select class="form-control" onchange="updFriend(${i},'status',this.value)" style="font-size:0.8rem"><option value="ONLINE" ${c.status === 'ONLINE' ? 'selected' : ''}>ONLINE</option><option value="OFFLINE" ${c.status === 'OFFLINE' ? 'selected' : ''}>OFFLINE</option></select></div><button class="btn btn-red btn-sm" onclick="delFriend(${i})">X</button></div>`).join('');
}
window.updLink = function (i, f, v) { systemData.contacts[i][f] = v; saveData(); }
window.addLinkItem = function () { systemData.contacts.push({ label: "NEW LINK", url: "#" }); saveData(); renderAdminLinks(); }
window.delLink = function (i) { if (confirm("Del?")) { systemData.contacts.splice(i, 1); saveData(); renderAdminLinks(); } }

window.updFriend = function (i, f, v) { systemData.friends[i][f] = v; saveData(); }
window.addFriendItem = function () { systemData.friends.push({ label: "NEW FRIEND", url: "#", status: "ONLINE" }); saveData(); renderAdminLinks(); }
window.delFriend = function (i) { if (confirm("Del?")) { systemData.friends.splice(i, 1); saveData(); renderAdminLinks(); } }

// HIRE ME TOGGLE
window.toggleHireMe = function () {
    const cb = document.getElementById('adm-hire-toggle');
    systemData.hireMe.active = cb.checked;
    saveData();
    alert("Button Status: " + (cb.checked ? "ACTIVE" : "HIDDEN"));
}

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_THEMES - Керування темами
// ═══════════════════════════════════════════════════════════════════════════════

/** renderAdminThemeList - Рендерить список всіх тем (стандартні + кастомні) */
// THEMES ADMIN
window.renderAdminThemeList = function () {
    const combined = [...themesList, ...systemData.themes.custom];
    const l = document.getElementById('adm-theme-list');
    l.innerHTML = combined.map(t => {
        const isCustom = systemData.themes.custom.find(ct => ct.id === t.id);
        const isDefault = systemData.themes.defaultId === t.id;

        let btns = `<button class="btn btn-sm" onclick="setDefaultTheme('${t.id}')" ${isDefault ? 'disabled style="opacity:0.5"' : ''}>${isDefault ? 'DEFAULT' : 'SET DEFAULT'}</button>`;

        if (isCustom) {
            btns += ` <button class="btn btn-red btn-sm" onclick="delCustomTheme('${t.id}')">DEL</button>`;
        }

        return `<div class="item-row" style="border-left: 5px solid ${t.c || t.bg}">
                    <span>${t.name}</span>
                    <div>${btns}</div>
                </div>`;
    }).join('');
}

window.createCustomTheme = function () {
    const name = document.getElementById('adm-theme-name').value;
    const bg = document.getElementById('adm-theme-bg').value;
    const text = document.getElementById('adm-theme-text').value;

    if (!name) return showToast("Enter theme name!", 'error');

    const id = 'custom-' + Date.now();
    const newTheme = { id, name, bg, text };

    systemData.themes.custom.push(newTheme);
    saveData();
    updateCustomThemeCSS();
    renderAdminThemeList();
    setTheme(id);

    showToast("Theme Created!", 'success');
    document.getElementById('adm-theme-name').value = '';
}

window.delCustomTheme = function (id) {
    if (confirm("Delete this theme?")) {
        systemData.themes.custom = systemData.themes.custom.filter(t => t.id !== id);

        if (systemData.themes.defaultId === id) systemData.themes.defaultId = 'amber';
        if (document.body.classList.contains(`theme-${id}`)) setTheme('amber');

        saveData();
        updateCustomThemeCSS();
        renderAdminThemeList();
    }
}

window.setDefaultTheme = function (id) {
    systemData.themes.defaultId = id;
    saveData();
    renderAdminThemeList();
    showToast("Default Theme Updated!", 'success');
}

window.saveThemeExtras = function () {
    if (!systemData.effects) systemData.effects = JSON.parse(JSON.stringify(defaultData.effects));
    if (!systemData.home) systemData.home = {};
    if (!systemData.themes) systemData.themes = JSON.parse(JSON.stringify(defaultData.themes));

    systemData.effects.glow = document.getElementById('adm-fx-glow').checked;
    systemData.effects.flicker = document.getElementById('adm-fx-flicker').checked;
    systemData.effects.scanline = document.getElementById('adm-fx-scan').checked;
    systemData.effects.svgGlow = document.getElementById('adm-fx-svg').checked;
    systemData.effects.screenPulse = document.getElementById('adm-fx-pulse').checked;
    systemData.home.showIcons = document.getElementById('adm-home-icons').checked;
    const fontSelect = document.getElementById('adm-font-choice');
    systemData.themes.font = fontSelect ? fontSelect.value : 'modern';

    saveData();
    if (typeof applyEffects === 'function') applyEffects();
    if (typeof applyFontChoice === 'function') applyFontChoice(systemData.themes.font);
    if (typeof toggleIcons === 'function') toggleIcons(systemData.home.showIcons);
    showToast('Theme extras applied', 'success');
};

// ═══════════════════════════════════════════════════════════════════════════════
// #SECTION_DOWNLOAD - Завантаження data.js
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * downloadSource - Генерує та завантажує data.js
 * Створює файл з усіма налаштуваннями для заміни на сервері
 */
// --- DOWNLOAD DATA ---
function downloadSource() {
    const dataStr = JSON.stringify(systemData, null, 4);
    const content = '/* --- DATA START --- */\nconst defaultData = ' + dataStr + ';\n/* --- DATA END --- */';

    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert("data.js downloaded! Please replace the file in your site folder.");
}
