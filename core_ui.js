/* core_ui.js loader */
(function () {
    if (window.__core_ui_loaded) return;
    var s = document.createElement('script');
    s.src = 'js/core_ui.js';
    document.head.appendChild(s);
})();
