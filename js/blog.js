/* blog.js */
window.__blog_loaded = true;
// #SECTION_BLOG - Керування блогом
// ═══════════════════════════════════════════════════════════════════════════════

/** activeBlogTag - Поточний тег для фільтрації блогу */
let activeBlogTag = null;

/**
 * renderBlog - Рендерить список постів блогу
 * Підтримує фільтрацію за тегами
 */
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

/** filterBlog - Встановлює тег для фільтрації блогу */
function filterBlog(tag) {
    activeBlogTag = tag;
    renderBlog();
    playSfx(600, 'sine', 0.05);
}

/** renderBlogPost - Рендерить повний текст одного поста блогу */
function renderBlogPost(id) {
    const p = systemData.blog.find(x => x.id === id);
    const v = document.getElementById('view');
    playSfx(500);

    // COMMENTS LOGIC
    if (!systemData.blogComments) systemData.blogComments = {};
    const comments = systemData.blogComments[id] || [];

    let commentsHtml = `
    <div style="margin-top:40px; border-top:1px dashed var(--dim); padding-top:20px;">
        <h3>COMMENTS (${comments.length})</h3>
        <div id="blog-comments-list" style="margin-bottom:20px; max-height:300px; overflow-y:auto; padding-right:10px;">
            ${comments.length === 0 ? '<div style="opacity:0.5; font-style:italic;">No comments yet.</div>' : comments.map(c =>
        `<div style="background:rgba(0,0,0,0.1); padding:10px; margin-bottom:10px; border-left:2px solid var(--text);">
                    <div style="font-size:0.75rem; opacity:0.7; margin-bottom:5px;"><strong>${c.user}</strong> @ ${c.date}</div>
                    <div style="white-space:pre-wrap;">${c.text}</div>
                 </div>`
    ).join('')}
        </div>
        
        <div style="background:var(--dim); padding:15px; border:1px solid var(--text);">
            <div style="margin-bottom:10px;">
                <input type="text" id="com-name" placeholder="Name/Handle (Optional)" style="width:100%; border:none; background:rgba(0,0,0,0.2); color:var(--text); padding:5px; font-family:inherit;">
            </div>
            <div style="margin-bottom:10px;">
                <textarea id="com-text" placeholder="Write a comment..." style="width:100%; height:60px; border:none; background:rgba(0,0,0,0.2); color:var(--text); padding:5px; font-family:inherit; resize:vertical;"></textarea>
            </div>
            <button class="btn" onclick="addBlogComment(${id})">POST COMMENT</button>
        </div>
    </div>`;

    v.innerHTML = `<button class="btn" onclick="nav('blog')" style="margin-bottom:15px;">< BACK</button><h2 style="border-bottom:2px solid var(--text); padding-bottom:5px; margin-bottom:10px;">${p.title}</h2><div style="font-size:0.8rem; margin-bottom:20px; opacity:0.7;">DATE: ${p.date} | TAGS: ${p.tags.join(', ')}</div><div class="blog-read-view blog-full">${p.content}</div>${commentsHtml}`;
}

/** addBlogComment - Додає коментар */
window.addBlogComment = function (postId) {
    const txt = document.getElementById('com-text').value.trim();
    let name = document.getElementById('com-name').value.trim();
    if (!name) name = 'Anonymous';

    if (!txt) return; // Empty

    if (!systemData.blogComments) systemData.blogComments = {};
    if (!systemData.blogComments[postId]) systemData.blogComments[postId] = [];

    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    systemData.blogComments[postId].push({
        user: name,
        text: txt.replace(/</g, "&lt;").replace(/>/g, "&gt;"), // Basic sanitize
        date: dateStr
    });

    saveData();
    renderBlogPost(postId); // Rerender
    playSfx(800, 'square', 0.1);
}

// ═══════════════════════════════════════════════════════════════════════════════
