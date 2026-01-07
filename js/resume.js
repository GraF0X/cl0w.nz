/* resume.js */
// #SECTION_RESUME - Резюме (CV)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderResume - Рендерить секцію резюме
 * Використовує дані з systemData.resume та titles
 */
function renderResume() {
    const v = document.getElementById('view');
    const r = systemData.resume;
    const t = r.titles || defaultData.resume.titles; // Fallback
    const skills = r.skills.map(s => `<div>${s.n}: [${"█".repeat(Math.round(s.p / 10))}${"░".repeat(10 - Math.round(s.p / 10))}] ${s.p}%</div>`).join("");
    const langs = (r.languages || []).map(l => `<div>• ${l}</div>`).join("");
    const rnds = (r.rnd || []).map(r => `<div>● ${r}</div>`).join("");
    const birthDate = r.birth.split('-').reverse().join('.');
    let eduHTML = ''; if (r.education && r.education.length > 0) { eduHTML = `<h3 class="underline" style="margin-top:15px">${t.edu}</h3><div class="scroll-area">${r.education.map(e => `<div class="exp-item" style="margin-bottom:10px;"><h4>${e.inst}</h4><div>${e.year} | ${e.deg}</div></div>`).join("")}</div>`; }
    const photoHtml = r.photo ? `<div class="photo"><img class="photo" src="${r.photo}" alt="VVS Photo"></div>` : '';
    v.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--text); padding-bottom:10px; margin-bottom:20px;"><h1>РЕЗЮМЕ</h1><div style="display:flex; gap:10px;"><button class="btn" onclick="genMD()">[ MD ]</button><button class="btn" onclick="generateDOC()">[ DOC ]</button></div></div><div style="display:flex; gap:20px; flex-wrap:wrap">${photoHtml}<div><h2>${r.name}</h2><p>DOB: ${birthDate}</p><p>Email: ${r.email}</p><p>Phone: ${r.phone || 'N/A'}</p><div style="font-size:0.8rem; margin-top:10px;">${skills}</div><h3 style="margin-top:10px; font-size:1rem; border-bottom:1px solid var(--dim); display:inline-block;">${t.langs}</h3><div style="font-size:0.8rem; margin-top:5px;">${langs}</div></div></div><h3 class="underline" style="margin-top:25px">${t.summary}</h3><p style="margin-bottom:20px; line-height:1.5;">${r.summary || ''}</p><h3 class="underline">${t.jobs}</h3><div class="scroll-area">${r.jobs.map(j => `<div class="exp-item"><h4>${j.co}</h4><div class="meta">${j.per} | ${j.pos}</div><ul>${j.tasks.map(t => `<li>${t}</li>`).join("")}</ul></div>`).join("")}</div>${eduHTML}<h3 class="underline" style="margin-top:15px">${t.rnd}</h3><div style="font-size:0.9rem">${rnds}</div>`;
}
// --- GENERATE MD (MARKDOWN) ---
/** genMD - Генерує та завантажує резюме у форматі Markdown */
window.genMD = function () {
    const r = systemData.resume;
    const t = r.titles;
    let content = r.templates.md;

    content = content.replace(/{{name}}/g, r.name)
        .replace(/{{birth}}/g, r.birth)
        .replace(/{{email}}/g, r.email)
        .replace(/{{phone}}/g, r.phone || '')
        .replace(/{{summary}}/g, r.summary || '')
        .replace(/{{title_summary}}/g, t.summary)
        .replace(/{{title_skills}}/g, t.skills)
        .replace(/{{title_langs}}/g, t.langs)
        .replace(/{{title_jobs}}/g, t.jobs)
        .replace(/{{title_edu}}/g, t.edu)
        .replace(/{{title_rnd}}/g, t.rnd);

    // Lists
    content = content.replace('{{skills_list}}', r.skills.map(s => `- ${s.n} (${s.p}%)`).join('\n'));
    content = content.replace('{{langs_list}}', (r.languages || []).map(l => `- ${l}`).join('\n'));
    content = content.replace('{{rnd_list}}', (r.rnd || []).map(p => `- ${p}`).join('\n'));
    content = content.replace('{{jobs_list}}', r.jobs.map(j => `### ${j.co}\n*${j.pos} | ${j.per}*\n${j.tasks.map(t => `- ${t}`).join('\n')}`).join('\n\n'));
    content = content.replace('{{edu_list}}', (r.education || []).map(e => `### ${e.inst}\n${e.deg} (${e.year})`).join('\n\n'));

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resume_${r.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ═══════════════════════════════════════════════════════════════════════════════
