/* todo.js */
// #SECTION_TODO - Список справ
// ═══════════════════════════════════════════════════════════════════════════════

function computeTodoStats(list) {
    const todos = Array.isArray(list) ? list : [];
    const total = todos.length;
    const done = todos.filter(t => t.d).length;
    const scheduled = todos.filter(t => t.due).length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, scheduled, progress };
}

/** renderTodo - Рендерить контейнер списку справ */
function renderTodo() {
    const v = document.getElementById('view');
    const editable = systemData.todoEditable;
    const stats = computeTodoStats(systemData.todos);

    let html = `<h2>TODO_MANAGER ${editable ? '[EDIT_MODE]' : '[READ_ONLY]'}</h2>`;
    html += `<div class="todo-stats">
        <div><strong>${stats.done}/${stats.total}</strong> completed</div>
        <div class="progress"><span style="width:${stats.progress}%;"></span></div>
        <div>${stats.scheduled} scheduled</div>
    </div>`;

    if (editable) {
        html += `<div class="todo-input-group" style="margin-bottom:15px; flex-wrap:wrap;">
            <input type="text" id="new-todo-input" class="todo-input" placeholder="New task..." onkeypress="if(event.key==='Enter') addTodoItem()">
            <input type="date" id="new-todo-date" class="todo-input" style="max-width:180px;" aria-label="Due date">
            <input type="time" id="new-todo-time" class="todo-input" style="max-width:140px;" aria-label="Due time">
            <button class="btn" onclick="addTodoItem()">ADD_TASK</button>
            <button class="btn" onclick="renderCalendar()" style="margin-left:auto;">[ CALENDAR_VIEW ]</button>
            <button class="btn" onclick="renderTodoList()" id="list-view-btn" style="display:none;">[ LIST_VIEW ]</button>
        </div>
        <div style="margin-bottom:15px; display:flex; gap:10px;">
             <button class="btn" onclick="exportTodoData()">EXPORT (JSON)</button>
             <button class="btn" onclick="exportTodoICS()">EXPORT (ICS)</button>
             <label class="btn" style="cursor:pointer;">
                IMPORT (JSON) <input type="file" id="todo-imp" style="display:none" onchange="importTodoData(this)">
             </label>
        </div>`;
    } else {
        html += `<div style="margin-bottom:15px; display:flex; gap:10px;">
            <button class="btn" onclick="renderCalendar()">[ CALENDAR_VIEW ]</button>
            <button class="btn" onclick="exportTodoICS()">EXPORT (ICS)</button>
        </div>`;
    }
    html += `<div class="todo-container" id="todo-main-box"><div class="todo-list" id="todo-list"></div></div>`;
    v.innerHTML = html;
    renderTodoList();
}

/** renderTodoList - Відображає елементи списку справ */
function renderTodoList() {
    const box = document.getElementById('todo-main-box');
    const listBtn = document.getElementById('list-view-btn');
    if (listBtn) listBtn.style.display = 'none';

    box.innerHTML = `<div class="todo-list" id="todo-list"></div>`;
    const l = document.getElementById('todo-list');

    const editable = systemData.todoEditable;
    systemData.todos.forEach((t, i) => {
        const el = document.createElement('div');
        el.className = `todo-item ${t.d ? 'todo-done' : ''}`;
        const dueInfo = t.due ? `<span class="todo-due">${t.due}${t.time ? ' ' + t.time : ''}</span>` : '<span class="todo-due muted">No date</span>';
        if (editable) {
            el.innerHTML = `<span class="todo-check" onclick="toggleTodoDone(${i})" style="cursor:pointer">[${t.d ? 'x' : ' '}]</span>
                           <div class="todo-meta" onclick="openTodoDetail(${i})">
                                <div class="todo-text">${t.t}</div>
                                <div class="todo-meta-line">${dueInfo} <span class="todo-status">${t.d ? 'DONE' : 'ACTIVE'}</span></div>
                           </div>
                           <div class="todo-actions">
                                <button class="btn btn-sm" onclick="openTodoDetail(${i})">DETAILS</button>
                                <button class="btn btn-red btn-sm todo-del" onclick="removeTodoItem(${i})">X</button>
                           </div>`;
        } else {
            el.innerHTML = `<span class="todo-check">[${t.d ? 'x' : ' '}]</span> <div class="todo-meta"><div class="todo-text">${t.t}</div><div class="todo-meta-line">${dueInfo}</div></div>`;
        }
        l.appendChild(el);
    });
}

// CALENDAR LOGIC
function renderCalendar() {
    const box = document.getElementById('todo-main-box');
    const listBtn = document.getElementById('list-view-btn');
    if (listBtn) listBtn.style.display = 'inline-block';

    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay(); // 0=Sun
    const editable = !!systemData.todoEditable;

    const events = (systemData.todos || []).filter(t => t.due).map((t, idx) => ({ date: t.due, title: t.t, time: t.time || 'All Day', idx }));

    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="font-weight:bold;">${y}-${String(m + 1).padStart(2, '0')}</div>
        <button class="btn btn-sm" onclick="renderTodoList()">BACK TO LIST</button>
    </div>`;
    html += `<div class="calendar-grid">`;
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => html += `<div style="text-align:center; font-weight:bold; border-bottom:1px solid var(--text); padding:5px 0;">${d}</div>`);
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const hasEv = dayEvents.length > 0;
        html += `<div class="cal-day" onclick="openCalDate('${dateStr}')" style="border:1px solid var(--dim); min-height:80px; padding:5px; cursor:pointer; position:relative;">
            <div style="font-weight:bold; opacity:${hasEv ? 1 : 0.5}; margin-bottom:5px;">${i}</div>
            <div style="font-size:0.65rem; line-height:1.2;">
                ${dayEvents.map(e => `<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; background:var(--dim); margin-bottom:2px; padding:1px;">• ${e.title}</div>`).join('')}
            </div>
            ${i === now.getDate() ? '<div style="position:absolute; top:5px; right:5px; width:8px; height:8px; background:var(--text); border-radius:50%;"></div>' : ''}
        </div>`;
    }

    html += `</div>`;
    box.innerHTML = html;
}

window.openCalDate = function (date) {
    if (!systemData.todos) systemData.todos = [];
    const editable = !!systemData.todoEditable;
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '10px';

    const listBox = document.createElement('div');
    listBox.className = 'cal-event-list';

    const renderList = () => {
        const events = systemData.todos.filter(e => e.due === date);
        if (!events.length) {
            listBox.innerHTML = '<div style="opacity:0.6;">No events for this date</div>';
            return;
        }
        listBox.innerHTML = '';
        events.forEach((e, idx) => {
            const row = document.createElement('div');
            row.className = 'cal-event-row';
            row.innerHTML = `<span class="badge">${e.time || 'All Day'}</span><span class="cal-event-title">${e.title}</span>`;
            if (editable) {
                const delBtn = document.createElement('button');
                delBtn.className = 'btn btn-sm btn-red';
                delBtn.innerText = 'Delete';
                delBtn.onclick = () => {
                    showConfirm('Delete this event?').then((ok) => {
                        if (!ok) return;
                        const target = systemData.todos.filter(t => t.due === date)[idx];
                        if (!target) return;
                        const realIdx = systemData.todos.indexOf(target);
                        if (realIdx > -1) systemData.todos.splice(realIdx, 1);
                        saveData();
                        renderList();
                        renderTodoList();
                    });
                };
                row.appendChild(delBtn);
            }
            listBox.appendChild(row);
        });
    };

    const form = document.createElement('div');
    form.style.display = 'flex';
    form.style.gap = '10px';
    form.style.flexWrap = 'wrap';
    form.innerHTML = editable ? `
        <label class="opt-check">Time <input type="time" id="cal-time" class="todo-input" style="max-width:140px;"></label>
        <input type="text" id="cal-title" class="todo-input" placeholder="Title..." style="flex:1; min-width:180px;">
        <button class="btn btn-green" id="cal-add-btn">Add</button>
    ` : `<div style="opacity:0.7;">Calendar is read-only</div>`;

    wrapper.appendChild(listBox);
    wrapper.appendChild(form);

    const overlay = showModal({ title: `Events for ${date}`, body: wrapper, actions: [{ label: 'Close' }] });
    const addBtn = form.querySelector('#cal-add-btn');
    if (addBtn) {
        addBtn.onclick = () => {
            if (!editable) return;
            const time = form.querySelector('#cal-time').value || 'All Day';
            const title = form.querySelector('#cal-title').value.trim() || 'Event';
            systemData.todos.push({ t: title, due: date, time, d: false });
            saveData();
            form.querySelector('#cal-title').value = '';
            renderList();
            renderTodoList();
        };
    }

    renderList();
    setTimeout(() => {
        const firstInput = overlay ? overlay.querySelector('input') : null;
        if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
    }, 30);
};

// IMPORT / EXPORT
window.exportTodoData = function () {
    const data = {
        todos: systemData.todos,
        calendar: []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vvs_tasks.json';
    link.click();
}

window.exportTodoICS = function () {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//cl0w.nz//tasks//EN'];
    const pushEvent = (title, date, time) => {
        if (!date) return;
        const uid = `${title}-${date}-${time || 'allday'}@cl0w.nz`;
        const dt = date.replace(/-/g, '') + (time ? 'T' + time.replace(/:/g, '') + '00' : '');
        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + uid);
        lines.push('DTSTAMP:' + stamp);
        lines.push('DTSTART:' + dt);
        lines.push('SUMMARY:' + title);
        lines.push('END:VEVENT');
    };
    (systemData.todos || []).forEach((t) => pushEvent(t.t, t.due, t.time));
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tasks.ics'; a.click(); URL.revokeObjectURL(url);
};

window.importTodoData = function (acc) {
    const file = acc.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = function (e) {
        try {
            const d = JSON.parse(e.target.result);
            if (d.todos) systemData.todos = d.todos;
            if (Array.isArray(d.calendar)) {
                d.calendar.forEach(ev => {
                    if (ev && ev.date && ev.title) {
                        systemData.todos.push({ t: ev.title, due: ev.date, time: ev.time || 'All Day', d: false });
                    }
                });
            }
            saveData();
            showToast('Tasks Imported!', 'success');
            renderTodo();
        } catch (err) {
            showModal({ title: 'Import Error', body: 'Error parsing JSON' });
        }
    };
    r.readAsText(file);
}

/** addTodoItem - Додає новий елемент до списку справ */
function addTodoItem() {
    const inp = document.getElementById('new-todo-input');
    if (!inp || !inp.value.trim()) return;
    const dueInput = document.getElementById('new-todo-date');
    const timeInput = document.getElementById('new-todo-time');
    const dueDate = dueInput && dueInput.value ? dueInput.value : '';
    const dueTime = timeInput && timeInput.value ? timeInput.value : '';
    const item = { t: inp.value.trim(), d: false };
    if (dueDate) item.due = dueDate;
    if (dueTime) item.time = dueTime;
    systemData.todos.push(item);
    saveData();
    renderTodoList();
    inp.value = '';
    const dIn = document.getElementById('new-todo-date'); if (dIn) dIn.value = '';
    const tIn = document.getElementById('new-todo-time'); if (tIn) tIn.value = '';
    playSfx(800);
}
/** toggleTodoDone - Змінює статус виконання завдання */
function toggleTodoDone(i) {
    systemData.todos[i].d = !systemData.todos[i].d;
    saveData();
    renderTodoList();
    playSfx(systemData.todos[i].d ? 900 : 700);
}
/** removeTodoItem - Видаляє елемент зі списку справ */
function removeTodoItem(i) {
    showConfirm('Delete this task?').then((ok) => {
        if (!ok) return;
        systemData.todos.splice(i, 1);
        saveData();
        renderTodoList();
        playSfx(400);
    });
}

function openTodoDetail(i) {
    const item = systemData.todos[i];
    if (!item) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="form-group"><label>Title</label><input type="text" id="todo-edit-title" class="form-control" value="${item.t}"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <label class="opt-check">Due <input type="date" id="todo-edit-date" value="${item.due || ''}" class="todo-input" style="max-width:180px;"></label>
            <label class="opt-check">Time <input type="time" id="todo-edit-time" value="${item.time || ''}" class="todo-input" style="max-width:140px;"></label>
            <label class="opt-check"><input type="checkbox" id="todo-edit-done" ${item.d ? 'checked' : ''}> Done</label>
        </div>
    `;

    showModal({
        title: 'Task Details',
        body: wrapper,
        actions: [
            { label: 'Delete', variant: 'danger', onClick: () => removeTodoItem(i) },
            {
                label: 'Save', variant: 'success', onClick: () => {
                    const title = wrapper.querySelector('#todo-edit-title').value.trim() || 'Task';
                    const due = wrapper.querySelector('#todo-edit-date').value;
                    const time = wrapper.querySelector('#todo-edit-time').value;
                    const done = wrapper.querySelector('#todo-edit-done').checked;

                    const prevDue = item.due;
                    const prevTitle = item.t;
                    item.t = title;
                    item.due = due || undefined;
                    item.time = time || undefined;
                    item.d = done;

                    saveData();
                    renderTodoList();
                }
            }
        ]
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
