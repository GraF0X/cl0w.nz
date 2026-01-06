// Local demo lab helpers for Playground Polygon (no external deps)
(function () {
    const examples = [
        { id: 'fox-local', label: 'Fox Lab (local)', type: 'fox' },
        { id: 'transmission', label: 'Physical Transmission (local)', type: 'transmission' },
        { id: 'toon', label: 'Toon Materials (local)', type: 'toon' },
        { id: 'pixel', label: 'Pixel Post FX (local)', type: 'pixel' },
        { id: 'md2', label: 'Walker Parade (local)', type: 'md2-lite' },
        { id: 'spot', label: 'Spotlight Lab (local)', type: 'spot' }
    ];

    // Fox lab (canvas-based)
    let foxCanvas = null;
    let foxCtx = null;
    let foxAnimHandle = null;
    let foxResizeHandler = null;

    function teardownFoxLab() {
        if (foxResizeHandler) {
            window.removeEventListener('resize', foxResizeHandler);
            foxResizeHandler = null;
        }
        if (foxAnimHandle) {
            cancelAnimationFrame(foxAnimHandle);
            foxAnimHandle = null;
        }
        foxCanvas = null;
        foxCtx = null;
    }

    function resizeFoxLab(holder) {
        if (!foxCanvas || !holder) return;
        foxCanvas.width = holder.clientWidth || 640;
        foxCanvas.height = holder.clientHeight || 360;
    }

    function drawFoxScene(time, holder) {
        if (!foxCtx || !foxCanvas) return;
        const w = foxCanvas.width;
        const h = foxCanvas.height;
        foxCtx.clearRect(0, 0, w, h);
        foxCtx.save();
        foxCtx.translate(w / 2, h / 2 + 30);
        const t = time * 0.001;
        const wobble = Math.sin(t) * 0.1;
        foxCtx.scale(1 + wobble * 0.2, 1 + wobble * 0.2);
        foxCtx.rotate(Math.sin(t * 0.7) * 0.15);

        const drawBox = (x, y, wBox, hBox, color) => {
            foxCtx.fillStyle = color;
            foxCtx.fillRect(x, y, wBox, hBox);
        };

        drawBox(-90, -40, 160, 70, '#f58a2c'); // body
        drawBox(60, -30, 70, 55, '#f58a2c'); // head
        drawBox(120, -15, 35, 30, '#111'); // nose
        drawBox(-150, -10, 90, 25, '#f58a2c'); // tail base
        drawBox(-65, -40, 20, 90, '#1a1a1a'); // leg 1
        drawBox(-20, -40, 20, 90, '#1a1a1a'); // leg 2
        drawBox(25, -40, 20, 90, '#1a1a1a'); // leg 3
        drawBox(70, -40, 20, 90, '#1a1a1a'); // leg 4
        drawBox(70, -65, 25, 25, '#fff'); // ear
        drawBox(85, -65, 25, 25, '#fff'); // ear
        drawBox(-170, -20, 45, 20, '#fff'); // tail tip

        foxCtx.fillStyle = '#f0f0f0';
        foxCtx.fillRect(52, -8, 14, 14);
        foxCtx.fillRect(86, -8, 14, 14);
        foxCtx.fillStyle = '#111';
        foxCtx.fillRect(56, -4, 6, 6);
        foxCtx.fillRect(90, -4, 6, 6);

        foxCtx.restore();

        foxCtx.save();
        foxCtx.fillStyle = 'rgba(255,255,255,0.05)';
        foxCtx.translate(w / 2, h / 2 + 80);
        foxCtx.scale(1.4 + Math.sin(time / 400) * 0.05, 0.4);
        foxCtx.beginPath();
        foxCtx.arc(0, 0, 150, 0, Math.PI * 2);
        foxCtx.fill();
        foxCtx.restore();

        foxAnimHandle = requestAnimationFrame((ts) => drawFoxScene(ts, holder));
    }

    function setupFoxLab() {
        const holder = document.getElementById('fox-stage');
        if (!holder) return;
        teardownFoxLab();
        foxCanvas = document.createElement('canvas');
        foxCanvas.className = 'fox-canvas';
        holder.innerHTML = '';
        holder.appendChild(foxCanvas);
        foxCtx = foxCanvas.getContext('2d');
        resizeFoxLab(holder);
        foxResizeHandler = function () { resizeFoxLab(holder); };
        window.addEventListener('resize', foxResizeHandler);
        foxAnimHandle = requestAnimationFrame((ts) => drawFoxScene(ts, holder));
    }

    // Demo builder (local canvas-based)
    let currentDemoUrl = null;

    function buildDemoHtml(type) {
        const baseStyles = `body,html{margin:0;width:100%;height:100%;background:#050505;color:#cfcfcf;font-family:monospace;overflow:hidden;}canvas{display:block;width:100%;height:100%;background:#040404;}`;
        const script = `(() => {\n  const canvas=document.querySelector('canvas');\n  const ctx=canvas.getContext('2d');\n  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}\n  window.addEventListener('resize',resize);\n  resize();\n  let t=0;\n  function loop(ts){t=ts*0.001;ctx.clearRect(0,0,canvas.width,canvas.height);${demoBody(type)}requestAnimationFrame(loop);}\n  requestAnimationFrame(loop);\n})();`;
        return `<!doctype html><html><head><style>${baseStyles}</style></head><body><canvas></canvas><script>${script}<\/script></body></html>`;
    }

    function demoBody(type) {
        const common = `ctx.save();ctx.translate(canvas.width/2,canvas.height/2);`;
        const end = `ctx.restore();`;
        const bodies = {
            transmission: `${common}const r=140+Math.sin(t*2)*20;const g=ctx.createRadialGradient(0,0,10,0,0,r);g.addColorStop(0,'rgba(136,199,255,0.7)');g.addColorStop(1,'rgba(15,15,25,0.1)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='rgba(180,220,255,0.6)';ctx.stroke();${end}`,
            toon: `${common}for(let i=0;i<14;i++){ctx.save();ctx.rotate(t*0.8+i*0.45);ctx.fillStyle=i%2?'#ff8844':'#2c1a0f';ctx.fillRect(60, -14, 140, 28);ctx.restore();}${end}`,
            pixel: `${common}const size=18;for(let x=-8;x<=8;x++){for(let y=-8;y<=8;y++){const fx=Math.sin(t+x*0.3+y*0.2);const fy=Math.cos(t*1.3+x*0.25);const c=Math.floor((fx+fy+2)/4*255);ctx.fillStyle='rgb('+c+','+(120+c/2)+','+(80+c/3)+')';ctx.fillRect(x*size+Math.sin(t+x*0.2)*6,y*size+Math.cos(t+y*0.25)*6,size,size);}}${end}`,
            'md2-lite': `${common}for(let i=0;i<6;i++){ctx.save();ctx.translate(-160+i*60,Math.sin(t+i)*12);ctx.fillStyle=i%2?'#6bf0a7':'#f06b6b';ctx.fillRect(-10,-40,20,40);ctx.fillRect(-18,-60,36,18);ctx.fillRect(-6,0,12,34);ctx.fillRect(-12,28,24,14);ctx.restore();}${end}`,
            spot: `${common}ctx.fillStyle='#0a0a0a';ctx.fillRect(-260,-160,520,320);const bx=Math.sin(t)*80;const by=Math.cos(t*0.6)*40;const grd=ctx.createRadialGradient(bx,by,10,bx,by,200);grd.addColorStop(0,'rgba(255,221,136,0.8)');grd.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grd;ctx.fillRect(-260,-160,520,320);ctx.fillStyle='#44aaff';ctx.beginPath();ctx.arc(bx*0.3,by*0.4,50,0,Math.PI*2);ctx.fill();${end}`
        };
        return bodies[type] || `${common}ctx.fillStyle='#66ccff';ctx.beginPath();ctx.arc(0,0,120,0,Math.PI*2);ctx.fill();${end}`;
    }

    function loadThreeExample(id) {
        const frame = document.getElementById('pg-demo-frame');
        const status = document.getElementById('pg-demo-status');
        if (!frame || !status) return;
        const demo = examples.find(d => d.id === id);
        if (!demo) { status.innerText = 'Demo unavailable'; return; }
        if (id === 'fox-local') {
            if (currentDemoUrl) { URL.revokeObjectURL(currentDemoUrl); currentDemoUrl = null; }
            frame.src = '';
            status.innerText = 'Fox lab runs locally above; inline demo cleared.';
            return;
        }
        status.innerText = 'Loading ' + demo.label + '...';
        const html = buildDemoHtml(demo.type);
        const blob = new Blob([html], { type: 'text/html' });
        if (currentDemoUrl) URL.revokeObjectURL(currentDemoUrl);
        currentDemoUrl = URL.createObjectURL(blob);
        frame.src = currentDemoUrl;
        frame.onload = function () { status.innerText = 'Loaded: ' + demo.label; };
        frame.onerror = function () { status.innerText = 'Unable to load local demo'; };
    }

    window.threeLab = {
        getExamples: function () { return examples.slice(); },
        setupFoxLab: setupFoxLab,
        teardownFoxLab: teardownFoxLab,
        loadExample: loadThreeExample
    };
})();
