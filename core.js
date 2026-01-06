
let audioCtx = null; let soundOn = true;
function playSfx(f, t = 'sine', d = 0.1, v = 0.05) {
    if (!soundOn) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
        g.gain.setValueAtTime(v, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + d);
    } catch (e) { }
}
/** toggleSound - Перемикає звук увімкнено/вимкнено */
function toggleSound() { soundOn = !soundOn; document.getElementById('sound-toggle').innerText = soundOn ? '🕪' : '🕩'; }

function openIRC() {
    if (document.getElementById('irc-window')) return; // Already open

    const w = document.createElement('div');
    w.id = 'irc-window';
    w.style.cssText = `position:fixed; bottom:50px; right:50px; width:350px; height:400px; 
        background:var(--bg); border:2px solid var(--text); z-index:9000; 
        display:flex; flex-direction:column; box-shadow:5px 5px 0 var(--dim);`;

    w.innerHTML = `
        <div id="irc-header" style="background:var(--text); color:var(--bg); padding:5px; font-weight:bold; cursor:grab; display:flex; justify-content:space-between; align-items:center;">
            <span>[ #general ]</span>
            <div style="display:flex; gap:5px;">
                <input id="irc-nick-set" placeholder="Nick" value="${systemData.resume.name || ''}"
                       style="background:var(--bg); color:var(--text); border:1px solid var(--bg); width:80px; padding:2px; font-size:0.8rem;"
                       onchange="systemData.resume.name=this.value; saveData(); addIRCMessage('System', 'Nick changed to '+this.value, 'yellow');">
                <button onclick="closeIRC()" class="btn btn-sm btn-ghost">X</button>
            </div>
        </div>
        <div id="irc-log" style="flex-grow:1; overflow-y:auto; padding:5px; font-size:0.85rem; font-family:monospace;">
            <div style="opacity:0.6;">* Connecting to 127.0.0.1...</div>
            <div style="opacity:0.6;">* Connected.</div>
            <div style="opacity:0.6;">* Joining #general...</div>
            <div style="color:yellow;">* Topic: Welcome to new CyberSpace. Be nice.</div>
        </div>
        <div style="display:flex; border-top:1px solid var(--text);">
            <input type="text" id="irc-input" style="flex-grow:1; background:rgba(0,0,0,0.1); border:none; color:var(--text); padding:5px; font-family:inherit; outline:none;" placeholder="Type /help..." onkeypress="if(event.key==='Enter') sendIRC()">
            <button onclick="sendIRC()" class="btn btn-sm">SEND</button>
        </div>
    `;

    document.body.appendChild(w);
    dragElement(w);

    // Auto-bot messages
    setTimeout(() => addIRCMessage("System", "Welcome, " + (systemData.resume.name || "Guest") + "!", "magenta"), 1000);
}

window.closeIRC = function () {
    const w = document.getElementById('irc-window');
    if (w) document.body.removeChild(w);
}

window.sendIRC = function () {
    const inp = document.getElementById('irc-input');
    const txt = inp.value.trim();
    if (!txt) return;

    addIRCMessage("Me", txt);
    inp.value = '';

    // Bot logic
    if (txt.startsWith('/')) {
        const cmd = txt.split(' ')[0];
        const arg = txt.split(' ').slice(1).join(' ');

        if (cmd === '/help') addIRCMessage("System", "Commands: /nick [name], /whois, /slap [user], /clear", "gray");
        else if (cmd === '/clear') document.getElementById('irc-log').innerHTML = '';
        else if (cmd === '/nick') {
            if (arg) {
                const old = systemData.resume.name || "Guest";
                systemData.resume.name = arg;
                saveData();
                addIRCMessage("System", `Nickname changed to ${arg}`, "yellow");
            }
        }
        else if (cmd === '/slap') {
            const target = arg || "someone";
            addIRCMessage("*", "slaps " + target + " around a bit with a large trout", "cyan");
        }
    } else {
        // Random replies
        if (Math.random() > 0.7) {
            setTimeout(() => {
                const replies = ["Interesting...", "LOL", "AFK", "brb", ":)", "Does it run Doom?", "pwned"];
                const users = ["Neo", "Morpheus", "Trinity", "Cypher", "Guest84"];
                const u = users[Math.floor(Math.random() * users.length)];
                const r = replies[Math.floor(Math.random() * replies.length)];
                addIRCMessage(u, r, "lime");
            }, 1000 + Math.random() * 2000);
        }
    }
}

function addIRCMessage(user, msg, color) {
    const log = document.getElementById('irc-log');
    if (!log) return;
    const now = new Date().toTimeString().substr(0, 5);
    const div = document.createElement('div');
    const uColor = color || (user === "Me" ? "inherit" : "lime");
    const nameDisplay = user === "Me" && systemData.resume.name ? systemData.resume.name : user;
    div.innerHTML = `<span style="opacity:0.5;">[${now}]</span> <span style="font-weight:bold; color:${uColor}">&lt;${nameDisplay}&gt;</span> ${msg}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    playSfx(1200, 'square', 0.05, 0.05);
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "-header")) {
        document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
