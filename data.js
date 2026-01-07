/* data.js loader */
(function () {
    if (window.__data_loaded) return;
    var s = document.createElement('script');
    s.src = 'js/data.js';
    document.head.appendChild(s);
})();
