/* work.js loader */
(function () {
    if (window.__work_loaded) return;
    var s = document.createElement('script');
    s.src = 'js/work.js';
    document.head.appendChild(s);
})();
