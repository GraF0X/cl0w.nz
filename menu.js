// #SECTION_MENU - Видимість меню
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * applyMenuVisibility - Застосовує налаштування видимості пунктів меню
 * Керує відображенням секцій: work, notes, blog, todo, gallery, game
 */

// --- MENU VISIBILITY LOGIC ---
function applyMenuVisibility() {
    const mv = systemData.menuVisibility;
    const toggle = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'block' : 'none';

        // Also toggle SVG icons if they exist in buttons
        // Note: New request asked for toggling icons GLOBALLY via Themes, not Admin per Item.
        // Admin controls ITEM visibility. Themes control ICON visibility. Valid.
    };

    toggle('nav-work', mv.work);
    toggle('nav-obsidian', mv.notes);
    toggle('nav-blog', mv.blog);
    toggle('nav-todo', mv.todo);
    toggle('nav-gallery', mv.gallery);
    toggle('nav-game', mv.game);
    // New ones:
    toggle('nav-draw', mv.draw !== false); // default true
    toggle('nav-pc', mv.pc !== false);
    toggle('nav-saver', mv.saver !== false);
}

/**
 * hexToRgba - Конвертує HEX колір у RGBA формат
 * @param {string} hex - HEX колір (#RRGGBB)
 * @param {number} alpha - Прозорість (0.0 - 1.0)
 * @returns {string} RGBA рядок
 */
// ═══════════════════════════════════════════════════════════════════════════════
