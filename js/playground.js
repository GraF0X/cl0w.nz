/* playground.js */
// #SECTION_ABOUT - Про мене
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderAbout - Рендерить секцію "Про мене".
 * Відображає текст обраною мовою з ефектом друку та опційним фото.
 */
function renderAbout() {
    const view = document.getElementById('view');
    if (!view) return;

    const languages = Array.isArray(systemData.about.languages)
        ? systemData.about.languages
        : [];
    const activeLang = languages.find((lang) => lang.code === systemData.about.activeLang)
        ? systemData.about.activeLang
        : (languages[0] ? languages[0].code : '');

    systemData.about.activeLang = activeLang;

    const buttons = languages
        .map((lang) => {
            const activeClass = activeLang === lang.code ? 'active' : '';
            return `<button class="btn ${activeClass}" onclick="switchLang('${lang.code}')">${lang.label}</button>`;
        })
        .join('');

    const photoSrc = systemData.about.photo || systemData.resume.photo;
    const photoMarkup = systemData.about.showPhoto
        ? `<img src="${photoSrc}" class="about-photo" alt="Me">`
        : '';

    view.innerHTML = `
        <div class="about-lang-switch">${buttons}</div>
        <div class="about-shell">
            ${photoMarkup}
            <div id="about-txt" class="about-text"></div>
        </div>
    `;

    const activeData = languages.find((lang) => lang.code === activeLang);
    if (activeData) typeEffect(activeData.text, 'about-txt');
}

/**
 * switchLang - Перемикає мову секції "Про мене".
 * @param {string} langCode - Код мови.
 */
function switchLang(langCode) {
    if (isTyping || !langCode) return;
    const languages = Array.isArray(systemData.about.languages)
        ? systemData.about.languages
        : [];
    const exists = languages.find((lang) => lang.code === langCode);
    if (!exists) return;
    systemData.about.activeLang = langCode;
    renderAbout();
}

window.switchLang = switchLang;

/**
 * typeEffect - Поступово друкує HTML-текст, щоб імітувати термінальний ввод.
 * @param {string} html - Текст, який потрібно надрукувати.
 * @param {string} targetId - ID контейнера для виводу.
 */
function typeEffect(html, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = '<div id="type-box" class="typing"></div>';
    const typeBox = document.getElementById('type-box');
    if (!typeBox) return;

    isTyping = true;
    const startTime = Date.now();
    const durationMs = 1000;

    const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        let sliceIndex = Math.floor(html.length * progress);

        // Не обриваємо HTML-теги посередині.
        const substring = html.substring(0, sliceIndex);
        const lastOpen = substring.lastIndexOf('<');
        const lastClose = substring.lastIndexOf('>');
        if (lastOpen > lastClose) {
            const closing = html.indexOf('>', lastOpen);
            if (closing !== -1) sliceIndex = closing + 1;
        }

        if (Math.random() > 0.8) {
            playSfx(200 + Math.random() * 100, 'sine', 0.02, 0.02);
        }

        typeBox.innerHTML = html.substring(0, sliceIndex);

        if (progress === 1) {
            clearInterval(timer);
            typeBox.innerHTML = html;
            typeBox.classList.remove('typing');
            isTyping = false;
        }
    }, 16);
}

// ═══════════════════════════════════════════════════════════════════════════════
