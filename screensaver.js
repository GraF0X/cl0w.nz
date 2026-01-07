/* screensaver.js loader */
(function () {
    if (window.__screensaver_loaded) return;
    var s = document.createElement('script');
    s.src = 'js/screensaver.js';
    document.head.appendChild(s);
})();
