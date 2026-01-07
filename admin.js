/* admin.js loader */
(function () {
    if (window.__admin_loaded) return;
    var s = document.createElement('script');
    s.src = 'js/admin.js';
    document.head.appendChild(s);
})();
