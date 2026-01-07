/* games.js */
// #SECTION_GAMES - Ігровий центр
// ═══════════════════════════════════════════════════════════════════════════════

function renderGameMenu() {
    const v = document.getElementById('view');
    // MERGED RENDER GAME MENU
    const gameList = Array.isArray(systemData.games) ? systemData.games : [];
    const reserved = ['snake', 'tetris', 'pico8'];
    const nameFor = (id, fallback) => {
        const found = gameList.find((g) => g && g.id === id);
        if (found && found.name) return found.name;
        return fallback;
    };
    const customGames = gameList
        .filter((g) => g && g.id && reserved.indexOf(g.id) === -1)
        .map((g) => `<div class="game-card" onclick="runGame('${g.id}')">${g.name}</div>`).join('');

    v.innerHTML = `<h2>GAME_CENTER</h2>
    <div class="game-hub">
        <div class="game-card" onclick="runGame('snake')">${nameFor('snake', 'SNAKE')}</div>
        <div class="game-card" onclick="runGame('tetris')">${nameFor('tetris', 'TETRIS')}</div>
        <div class="game-card" onclick="runGame('pico8')">PICO-8 (WEB)</div>
        ${customGames}
    </div>
    <div class="game-panels">
        <div id="game-area" class="game-area" style="display:none;">
            <div class="game-stage">
                <canvas id="game-canvas" width="640" height="480"></canvas>
                <div id="arena" class="custom-game" role="presentation"></div>
            </div>
            <div id="game-hint" class="game-hint">Arrows to move. Space/Enter to rotate. Esc to exit.</div>
        </div>
        <div id="pico-area" class="pico-panel" style="display:none;">
            <div class="game-toolbar">
                <input id="pico-url" class="todo-input" placeholder="PICO-8 widget URL" value="https://www.lexaloffle.com/bbs/widget.php?pid=celeste" aria-label="PICO-8 cart url">
                <button class="btn" onclick="loadPicoCart()">LOAD CART</button>
                <button class="btn" onclick="playPicoDemo()">PLAY CELESTE</button>
            </div>
            <div class="game-toolbar">
                <input id="pico-name" class="todo-input" placeholder="Cart name" style="max-width:220px;">
                <button class="btn btn-sm" onclick="savePicoEntry()">SAVE TO LIST</button>
            </div>
            <div id="pico-list" class="pico-list"></div>
            <iframe id="pico-frame" src="" style="width:100%; height:70vh; border:1px solid var(--text); background:#000;"></iframe>
        </div>
    </div>
    <div class="game-footer">
        <div id="game-status" aria-live="polite">Select a game to start.</div>
        <button class="btn btn-red" onclick="stopGames()">EXIT_GAME</button>
    </div>`;

    renderPicoList();
}

window.loadPicoCart = function () {
    const input = document.getElementById('pico-url');
    const url = input && input.value ? input.value.trim() : '';
    if (!url) { showModal({ title: 'No URL', body: 'Paste a PICO-8 web cart URL first.' }); return; }
    document.getElementById('pico-frame').src = url;
    const status = document.getElementById('game-status');
    if (status) status.innerText = 'Loading PICO-8 cart...';
}

window.playPicoDemo = function () {
    const demo = 'https://www.lexaloffle.com/bbs/widget.php?pid=celeste';
    const input = document.getElementById('pico-url');
    if (input) input.value = demo;
    document.getElementById('pico-frame').src = demo;
    const status = document.getElementById('game-status');
    if (status) status.innerText = 'Playing Celeste demo';
}

function renderPicoList() {
    const box = document.getElementById('pico-list');
    if (!box) return;
    if (!Array.isArray(systemData.picoCarts)) systemData.picoCarts = [];
    if (!systemData.picoCarts.length) {
        box.innerHTML = '<div class="muted">No saved carts yet.</div>';
        return;
    }
    box.innerHTML = '';
    systemData.picoCarts.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'pico-item';
        row.innerHTML = `<div class="pico-title">${c.name || 'Cart ' + (idx + 1)}</div><div class="pico-url">${c.url}</div>`;
        const actions = document.createElement('div');
        actions.className = 'pico-actions';
        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-sm';
        loadBtn.innerText = 'LOAD';
        loadBtn.onclick = () => loadSavedPico(idx);
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-red';
        delBtn.innerText = 'DEL';
        delBtn.onclick = () => removePicoEntry(idx);
        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);
        row.appendChild(actions);
        box.appendChild(row);
    });
}

window.savePicoEntry = function () {
    const nameInput = document.getElementById('pico-name');
    const urlInput = document.getElementById('pico-url');
    const url = urlInput && urlInput.value ? urlInput.value.trim() : '';
    const name = nameInput && nameInput.value ? nameInput.value.trim() : 'Cart';
    if (!url) { showModal({ title: 'No URL', body: 'Paste a PICO-8 cart URL first.' }); return; }
    if (!Array.isArray(systemData.picoCarts)) systemData.picoCarts = [];
    systemData.picoCarts.push({ name, url });
    saveData();
    renderPicoList();
    showToast('PICO-8 cart saved', 'success');
};

window.loadSavedPico = function (idx) {
    if (!Array.isArray(systemData.picoCarts)) return;
    const cart = systemData.picoCarts[idx];
    if (!cart) return;
    const input = document.getElementById('pico-url');
    if (input) input.value = cart.url;
    loadPicoCart();
    const status = document.getElementById('game-status');
    if (status) status.innerText = `Loaded ${cart.name || 'cart'}`;
};

window.removePicoEntry = function (idx) {
    if (!Array.isArray(systemData.picoCarts)) return;
    systemData.picoCarts.splice(idx, 1);
    saveData();
    renderPicoList();
};

/** gameInterval - Інтервал активної гри для коректної зупинки */
var gameInterval = null; // Renamed from gameInt to match new code
var gameCleanup = null;
function setGameTimer(handle) {
    gameInterval = handle;
    window.gameInt = handle;
    return handle;
}
function stopGames() {
    if (gameInterval) clearInterval(gameInterval);
    if (window.gameInt) {
        try { clearInterval(window.gameInt); } catch (e) { }
    }
    if (typeof gameCleanup === 'function') {
        try { gameCleanup(); } catch (e) { }
    }
    gameInterval = null;
    window.gameInt = null;
    gameCleanup = null;
    const gameArea = document.getElementById('game-area');
    if (gameArea) gameArea.style.display = 'none';
    const customHost = document.getElementById('arena');
    if (customHost) { customHost.innerHTML = ''; customHost.style.display = 'none'; }
    const canvas = document.getElementById('game-canvas');
    if (canvas) { canvas.style.display = 'block'; }
    const hint = document.getElementById('game-hint');
    if (hint) { hint.innerText = 'Arrows to move. Space/Enter to rotate. Esc to exit.'; }
    const picoArea = document.getElementById('pico-area');
    if (picoArea) picoArea.style.display = 'none';
    const status = document.getElementById('game-status');
    if (status) status.innerText = 'Game stopped';
    // stopScreensaver(); // Just in case - assuming this function exists elsewhere or is a placeholder
}

function sizeGameCanvas() {
    const area = document.getElementById('game-area');
    const canvas = document.getElementById('game-canvas');
    if (!area || !canvas) return;
    const baseW = parseInt(canvas.dataset.baseW || '640', 10);
    const baseH = parseInt(canvas.dataset.baseH || '480', 10);
    const maxW = area.parentElement ? area.parentElement.clientWidth - 20 : baseW;
    const rect = area.getBoundingClientRect();
    const maxH = window.innerHeight - rect.top - 40;
    const scale = Math.min(1, maxW / baseW, maxH / baseH);
    canvas.style.width = Math.floor(baseW * scale) + 'px';
    canvas.style.height = Math.floor(baseH * scale) + 'px';
}

function setGameBaseSize(width, height) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const baseW = width || 640;
    const baseH = height || 480;
    canvas.dataset.baseW = baseW;
    canvas.dataset.baseH = baseH;
    canvas.width = baseW;
    canvas.height = baseH;
}

window.addEventListener('resize', sizeGameCanvas);

// --- BUILT-IN MINI GAMES (SAFE DEFAULTS) ---

// Predeclare handlers to avoid ReferenceErrors during resolution
function startSnake(canvas, ctx) {
    const gridSize = 20;
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    let snake = [{ x: 5, y: 5 }];
    let dir = { x: 1, y: 0 };
    let food = { x: 10, y: 10 };
    let alive = true;

    const keyHandler = (e) => {
        if (e.key === 'ArrowUp' && dir.y === 0) dir = { x: 0, y: -1 };
        if (e.key === 'ArrowDown' && dir.y === 0) dir = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft' && dir.x === 0) dir = { x: -1, y: 0 };
        if (e.key === 'ArrowRight' && dir.x === 0) dir = { x: 1, y: 0 };
    };
    document.addEventListener('keydown', keyHandler);

    const spawnFood = () => {
        food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    };

    const loop = () => {
        if (!alive) return;
        const head = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };
        // Collision with self
        if (snake.some((s) => s.x === head.x && s.y === head.y)) {
            alive = false;
            ctx.fillStyle = '#f55';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
            return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            playSfx(900, 'square', 0.05);
            spawnFood();
        } else {
            snake.pop();
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text') || '#0f0';
        snake.forEach((s) => ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2));
        ctx.fillStyle = '#f50';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    };

    setGameTimer(setInterval(loop, 120));
    gameCleanup = () => document.removeEventListener('keydown', keyHandler);
}

function startTetris(canvas, ctx) {
      const cols = 10, rows = 20, size = 24;
      canvas.width = cols * size;
      canvas.height = rows * size;
    const shapes = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [1, 1, 1]],
    ];
    const board = Array.from({ length: rows }, () => Array(cols).fill(0));
    let current = { shape: shapes[Math.floor(Math.random() * shapes.length)], x: 3, y: 0 };

    const canMove = (dx, dy, shape = current.shape) => {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {
                if (!shape[y][x]) continue;
                const nx = current.x + dx + x;
                const ny = current.y + dy + y;
                if (nx < 0 || nx >= cols || ny >= rows) return false;
                if (ny >= 0 && board[ny][nx]) return false;
            }
        }
        return true;
    };

    const mergePiece = () => {
        current.shape.forEach((row, y) => row.forEach((val, x) => {
            if (val) board[current.y + y][current.x + x] = 1;
        }));
        clearLines();
        current = { shape: shapes[Math.floor(Math.random() * shapes.length)], x: 3, y: 0 };
    };

    const clearLines = () => {
        for (let y = rows - 1; y >= 0; y--) {
            if (board[y].every((v) => v)) {
                board.splice(y, 1);
                board.unshift(Array(cols).fill(0));
                playSfx(800, 'sine', 0.05);
            }
        }
    };

    const rotate = () => {
        const rotated = current.shape[0].map((_, idx) => current.shape.map((row) => row[idx]).reverse());
        if (canMove(0, 0, rotated)) current.shape = rotated;
    };

    const keyHandler = (e) => {
        if (e.key === 'ArrowLeft' && canMove(-1, 0)) current.x -= 1;
        if (e.key === 'ArrowRight' && canMove(1, 0)) current.x += 1;
        if (e.key === 'ArrowDown' && canMove(0, 1)) current.y += 1;
        if (e.key === 'ArrowUp') rotate();
        if (e.key === ' ') {
            while (canMove(0, 1)) current.y += 1;
            mergePiece();
        }
    };
    document.addEventListener('keydown', keyHandler);

    const draw = () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text') || '#0f0';
        board.forEach((row, y) => row.forEach((val, x) => {
            if (val) ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        }));
        current.shape.forEach((row, y) => row.forEach((val, x) => {
            if (val) ctx.fillRect((current.x + x) * size + 1, (current.y + y) * size + 1, size - 2, size - 2);
        }));
    };

    const tick = () => {
        if (canMove(0, 1)) {
            current.y += 1;
        } else {
            mergePiece();
        }
        draw();
    };

    draw();
    setGameTimer(setInterval(tick, 450));
    gameCleanup = () => document.removeEventListener('keydown', keyHandler);
}

  /** runGame - Запускає обрану гру */
  function runGame(id) {
      const area = document.getElementById('game-area');
      const pico = document.getElementById('pico-area');
      const canvas = document.getElementById('game-canvas');
      const customHost = document.getElementById('arena');
      const hint = document.getElementById('game-hint');
      if (!area || !pico || !canvas) return; // Error safety
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      stopGames(); // Clear previous

      if (id === 'pico8') {
          pico.style.display = 'flex';
            const input = document.getElementById('pico-url');
            const url = input && input.value ? input.value : 'https://www.lexaloffle.com/bbs/widget.php?pid=celeste';
          document.getElementById('pico-frame').src = url;
          if (customHost) { customHost.innerHTML = ''; customHost.style.display = 'none'; }
          const status = document.getElementById('game-status');
          if (status) status.innerText = 'PICO-8 web player ready';
          return;
      }

      area.style.display = 'block';
      if (id === 'snake' || id === 'tetris') {
          setGameBaseSize(480, 360);
      } else {
          setGameBaseSize(640, 480);
      }
      sizeGameCanvas();
      if (customHost) { customHost.innerHTML = ''; customHost.style.display = 'none'; }
      canvas.style.display = 'block';
      if (hint) { hint.style.display = 'block'; hint.innerText = 'Arrows to move. Space/Enter to rotate. Esc to exit.'; }
      const status = document.getElementById('game-status');
      if (status) status.innerText = `Running ${id.toUpperCase()}`;

      const customGame = (Array.isArray(systemData.games) ? systemData.games : []).find(g => g.id === id);
      const customCode = customGame && customGame.code ? customGame.code.trim() : '';
      if (customCode && customHost) {
          customHost.style.display = 'block';
          canvas.style.display = 'none';
          if (hint) hint.innerText = 'Custom game active — code comes from admin.';
          try {
              new Function('gameCanvas', 'gameCtx', 'host', 'systemData', 'helpers', customCode)(
                  canvas,
                  ctx,
                  customHost,
                  systemData,
                  {
                      stopGames: stopGames,
                      playSfx: playSfx,
                      saveData: saveData,
                      setInterval: function (fn, t) { return setGameTimer(setInterval(fn, t)); },
                      setTimeout: setTimeout,
                      requestAnimationFrame: requestAnimationFrame
                  }
              );
              return;
          } catch (err) {
              customHost.innerHTML = '<div class="game-error">Custom game failed to run.</div>';
              showModal({ title: 'Game Error', body: 'Failed to run custom game: ' + err.message });
              if (status) status.innerText = 'Custom game error';
              return;
          }
      }

      const handlers = {
          snake: typeof window.startSnake === 'function' ? window.startSnake : startSnake,
          tetris: typeof window.startTetris === 'function' ? window.startTetris : startTetris,
      };

      if (typeof handlers[id] === 'function') {
          handlers[id](canvas, ctx);
          return;
      }

      // Graceful fallback for unknown/missing games
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text') || '#fff';
      ctx.textAlign = 'center';
      ctx.font = '16px monospace';
      ctx.fillText('Game not available', canvas.width / 2, canvas.height / 2);
  }

  window.startSnake = typeof window.startSnake === 'function' ? window.startSnake : startSnake;
  window.startTetris = typeof window.startTetris === 'function' ? window.startTetris : startTetris;

/**
 * renderGallery - Рендерить сітку галереї
 * Відображає фото або ASCII-арт залежно від обраної категорії
 */
function renderGallery() {
    const v = document.getElementById('view');
    v.innerHTML = `<h2>Gallery.Manager</h2><div class="obs-tabs" id="g-t"></div><div class="gallery-grid" id="g-g"></div>`;
    systemData.gallery.cats.forEach(c => {
        const b = document.createElement('button');
        b.className = `obs-tab-btn ${c === currentGalCat ? 'active' : ''}`;
        b.innerText = c;
        b.onclick = () => { currentGalCat = c; renderGallery(); };
        document.getElementById('g-t').appendChild(b);
    });
    systemData.gallery[currentGalCat].forEach((i, idx) => {
        document.getElementById('g-g').innerHTML += `
                <div class="gallery-item">
                    <div class="gallery-thumb" onclick="expandGallery('${currentGalCat}', ${idx})" style="cursor:pointer" title="Click to Expand">
                        ${currentGalCat === 'ASCII_ART' ? '<pre style="font-size:0.6rem">' + i.a + '</pre>' : '<img src="' + i.a + '" onerror="this.parentElement.innerHTML=\'[IMAGE_NOT_FOUND]\'"/>'}
                    </div>
                    <div style="margin-top:10px; font-size:0.7rem; opacity:0.7;">NAME: ${i.n}<br>DATE: ${i.d}</div>
                </div>`;
    });
}

// EXPAND GALLERY (FIXED: Fullscreen + No Scroll + Filters)
/**
 * expandGallery - Відкриває зображення або ASCII-арт на весь екран
 * Supports MONO and PIXEL filters
 */
window.expandGallery = function (c, i) {
    const item = systemData.gallery[c][i];
    const overlay = document.createElement('div');
    overlay.id = 'gallery-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column; cursor:pointer;";

    // Disable Page Scroll
    document.body.style.overflow = 'hidden';

    // CLOSE FUNCTION
    const closeGal = function (e) {
        if (e) e.stopPropagation();
        const el = document.getElementById('gallery-overlay');
        if (el) document.body.removeChild(el);
        document.body.style.overflow = ''; // Restore Scroll
    };

    let content = '';
    let isImg = c !== 'ASCII_ART';

    if (!isImg) {
        content = `<pre style="color:var(--text); font-size:0.8rem; overflow:auto; max-width:90vw; max-height:90vh;">${item.a}</pre>`;
    } else {
        // IMAGE CONTAINER FOR FILTERS
        // We use a container to apply tint (Mono) via mix-blend-mode or absolute overlay
        content = `<div id="img-container" style="position:relative; max-width:90vw; max-height:70vh;">
            <img id="gal-img" src="${item.a}" style="max-width:100%; max-height:70vh; object-fit:contain; border:2px solid var(--text); transition:0.2s;">
            <div id="tint-layer" style="position:absolute; inset:0; background:var(--text); mix-blend-mode:color; pointer-events:none; display:none;"></div>
        </div>`;
    }

    let controls = '';
    if (isImg) {
        controls = `<div style="display:flex; gap:10px; margin-top:15px; z-index:10001;" onclick="event.stopPropagation()">
            <button class="btn" onclick="toggleGalFilter('mono')">[ MONO ]</button>
            <button class="btn" onclick="toggleGalFilter('pixel')">[ PIXEL ]</button>
            <button class="btn btn-red" onclick="closeGal()">[ CLOSE ]</button>
        </div>`;
    } else {
        controls = `<div style="margin-top:20px;" onclick="closeGal()"><button class="btn btn-red">[ CLOSE ]</button></div>`;
    }

    overlay.onclick = function (e) { if (e.target === overlay) closeGal(); };

    overlay.innerHTML = `${content}
        <div style="margin-top:10px; color:var(--text); font-family:monospace; cursor:default;" onclick="event.stopPropagation()">${item.n}</div>
        ${controls}`;

    // Expose close globally for the button
    window.closeGal = closeGal;

    document.body.appendChild(overlay);
    playSfx(600, 'square', 0.1);
}


window.toggleGalFilter = function (type) {
    const img = document.getElementById('gal-img');
    const tint = document.getElementById('tint-layer');
    if (!img) return;

    if (type === 'pixel') {
        // Toggle Pixelation
        if (img.dataset.pixelated === 'true') {
            // Restore
            if (img.dataset.origSrc) img.src = img.dataset.origSrc;
            img.style.imageRendering = 'auto';
            img.style.transform = 'scale(1)';
            img.dataset.pixelated = 'false';
        } else {
            // Apply Strong Pixelation via Canvas
            if (!img.dataset.origSrc) img.dataset.origSrc = img.src;

            const scale = 0.05; // Stronger pixelation (5%)
            const canvas = document.createElement('canvas');
            const cw = Math.floor(img.naturalWidth * scale);
            const ch = Math.floor(img.naturalHeight * scale);

            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');

            // Draw small
            ctx.drawImage(img, 0, 0, cw, ch);

            // Get data
            const pixelData = canvas.toDataURL();

            img.src = pixelData;
            img.style.imageRendering = 'pixelated';
            img.style.transform = 'scale(1)'; // Browser upscales it automatically because img tag has specific size or max-width
            img.dataset.pixelated = 'true';
        }
    } else if (type === 'mono') {
        if (tint.style.display === 'block') {
            tint.style.display = 'none';
            img.style.filter = 'none';
        } else {
            // Apply Mono
            tint.style.display = 'block';
            img.style.filter = 'grayscale(100%) contrast(1.2) brightness(0.9)';
        }
    }
    playSfx(800);
}
// ═══════════════════════════════════════════════════════════════════════════════
