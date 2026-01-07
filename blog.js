/* blog.js loader */
(function () {
    if (window.__blog_loaded) return;
    var s = document.createElement('script');
    s.src = 'js/blog.js';
    document.head.appendChild(s);
})();
