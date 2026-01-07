// #SECTION_CONTACTS - Контакти та мережевий статус
// ═══════════════════════════════════════════════════════════════════════════════

/** renderLinks - Рендерить сторінку контактів та друзів */
function renderLinks() {
    const linksHtml = systemData.contacts.map(c => `<a href="${c.url}" target="_blank" class="node-link"><span style="opacity:0.6">#</span> ${c.label}</a>`).join('');
    const friendsHtml = (systemData.friends || []).map(f => `<a href="${f.url}" target="_blank" class="node-link" style="opacity:${f.status === 'OFFLINE' ? 0.5 : 1}"><span style="opacity:0.6; color:${f.status === 'ONLINE' ? '#0f0' : 'inherit'}">●</span> ${f.label} <span style="font-size:0.7rem; margin-left:auto; opacity:0.7">[${f.status}]</span></a>`).join('');

    // HIRE BUTTON LOGIC
    let hireHtml = '';
    if (systemData.hireMe && systemData.hireMe.active) {
        hireHtml = `<div style="margin-top:30px; text-align:center; padding-top:20px; border-top:1px dashed var(--text);"><button onclick="unlockResume()" class="btn" style="border:2px solid var(--text); padding:15px 40px; font-size:1.2rem; font-weight:bold;">[ ! ] HIRE_ME_PROTOCOL [ ! ]</button></div>`;
    }

    document.getElementById('view').innerHTML = `<h2>NODE_NETWORK</h2><div class="node-grid"><div class="node-card"><div class="node-status">ONLINE</div><h3>[ ME ]</h3>${linksHtml}</div><div class="node-card"><div class="node-status">NET_SCAN</div><h3>[ FRIENDS ]</h3>${friendsHtml || '<div class="node-link" style="opacity:0.5">Scanning... No peers found.</div>'}</div></div>${hireHtml}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
