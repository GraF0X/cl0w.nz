// Local WebGL demo lab for Playground Polygon (fully local scenes)
(function () {
    const examples = [
        { id: 'fox-local', label: 'Fox Lab', type: 'fox' },
        { id: 'transmission', label: 'Physical Transmission', type: 'transmission' },
        { id: 'toon', label: 'Toon Materials', type: 'toon' },
        { id: 'pixel', label: 'Pixel Post FX', type: 'pixel' },
        { id: 'md2', label: 'Walker Parade', type: 'md2-lite' },
        { id: 'spot', label: 'Spotlight Lab', type: 'spot' }
    ];

    // Minimal matrix helpers
    function mat4Identity() {
        return new Float32Array([1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1]);
    }
    function mat4Multiply(a, b) {
        const out = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                out[i * 4 + j] =
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        return out;
    }
    function mat4Perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        const out = new Float32Array(16);
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = (2 * far * near) * nf; out[15] = 0;
        return out;
    }
    function mat4LookAt(eye, center, up) {
        const [ex, ey, ez] = eye, [cx, cy, cz] = center, [ux, uy, uz] = up;
        let zx = ex - cx, zy = ey - cy, zz = ez - cz;
        const zlen = Math.hypot(zx, zy, zz) || 1;
        zx /= zlen; zy /= zlen; zz /= zlen;
        let xx = uy * zz - uz * zy;
        let xy = uz * zx - ux * zz;
        let xz = ux * zy - uy * zx;
        const xlen = Math.hypot(xx, xy, xz) || 1;
        xx /= xlen; xy /= xlen; xz /= xlen;
        const yx = zy * xz - zz * xy;
        const yy = zz * xx - zx * xz;
        const yz = zx * xy - zy * xx;
        const out = new Float32Array(16);
        out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
        out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
        out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
        out[12] = -(xx * ex + xy * ey + xz * ez);
        out[13] = -(yx * ex + yy * ey + yz * ez);
        out[14] = -(zx * ex + zy * ey + zz * ez);
        out[15] = 1;
        return out;
    }
    function mat4RotateY(mat, rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        const r = mat4Identity();
        r[0] = c; r[2] = s; r[8] = -s; r[10] = c;
        return mat4Multiply(mat, r);
    }
    function mat4RotateX(mat, rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        const r = mat4Identity();
        r[5] = c; r[6] = -s; r[9] = s; r[10] = c;
        return mat4Multiply(mat, r);
    }

    function createGl(canvas) {
        if (!canvas) return null;
        return canvas.getContext('webgl', { antialias: true }) || canvas.getContext('experimental-webgl');
    }
    function resizeGl(gl, canvas) {
        if (!gl || !canvas) return { w: 0, h: 0 };
        const dpr = window.devicePixelRatio || 1;
        const w = (canvas.clientWidth || 640) * dpr;
        const h = (canvas.clientHeight || 360) * dpr;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        return { w: canvas.width, h: canvas.height };
    }
    function compile(gl, type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.warn('Shader error', gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    }
    function program(gl, fragSrc) {
        const vsSrc = `attribute vec3 position;attribute vec3 normal;uniform mat4 proj;uniform mat4 view;uniform mat4 model;varying vec3 vNormal;varying vec3 vPos;void main(){vNormal=mat3(model)*normal;vec4 wp=model*vec4(position,1.0);vPos=wp.xyz;gl_Position=proj*view*wp;}`;
        const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.warn('Link error', gl.getProgramInfoLog(p));
            return null;
        }
        return p;
    }

    function cubeGeometry(gl) {
        const positions = new Float32Array([
            // front
            -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
            // back
            -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
            // left
            -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
            // right
            1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
            // top
            -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
            // bottom
            -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1
        ]);
        const normals = new Float32Array([
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
        ]);
        const indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ]);
        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const normBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        const idxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return { posBuf, normBuf, idxBuf, count: indices.length };
    }

    function fragmentFor(type) {
        const base = `precision mediump float;varying vec3 vNormal;varying vec3 vPos;uniform float uTime;uniform vec3 uColor;vec3 lightDir=normalize(vec3(0.5,0.8,0.6));float l(){return max(dot(normalize(vNormal),lightDir),0.0);}float fres(){return pow(1.0-max(dot(normalize(-vPos),normalize(vNormal)),0.0),3.0);}void main(){`;
        const end = `}`;
        const bodies = {
            fox: `float li=l();vec3 col=mix(vec3(0.08,0.04,0.02),uColor,li+0.2);gl_FragColor=vec4(col,1.0);`,
            transmission: `float li=l();float fr=fres();vec3 col=mix(vec3(0.08,0.14,0.18),vec3(0.7,0.95,1.0),fr+li*0.4);gl_FragColor=vec4(col,0.85);`,
            toon: `float li=l();float stepv=floor(li*4.0)/4.0;vec3 col=mix(vec3(0.05,0.05,0.08),uColor,stepv+0.2);gl_FragColor=vec4(col,1.0);`,
            pixel: `float li=l();vec2 grid=floor(gl_FragCoord.xy/8.0);float flick=sin(uTime*1.5+grid.x*0.12+grid.y*0.08);vec3 col=uColor*(0.35+0.65*li)+vec3(0.05*flick);gl_FragColor=vec4(col,1.0);`,
            'md2-lite': `float li=l();float wave=sin(uTime*2.0+vPos.x*0.5+vPos.y*0.3);vec3 col=mix(vec3(0.1,0.18,0.22),uColor,li*0.7+0.2);col+=vec3(0.1*wave);gl_FragColor=vec4(col,1.0);`,
            spot: `float li=l();vec2 p=vPos.xz*0.6;float dist=length(p);float cone=smoothstep(0.6,0.0,dist);vec3 col=mix(vec3(0.02,0.02,0.02),uColor,cone*li+0.2);gl_FragColor=vec4(col,1.0);`
        };
        return base + (bodies[type] || bodies.fox) + end;
    }

    function colorFor(type) {
        switch (type) {
            case 'transmission': return [0.6, 0.9, 1.0];
            case 'toon': return [0.95, 0.55, 0.3];
            case 'pixel': return [0.35, 0.85, 0.95];
            case 'md2-lite': return [0.5, 0.9, 0.65];
            case 'spot': return [1.0, 0.9, 0.6];
            default: return [0.95, 0.55, 0.25];
        }
    }

    function startScene(canvas, type, statusEl) {
        if (!canvas) return null;
        const gl = createGl(canvas);
        if (!gl) {
            if (statusEl) statusEl.innerText = 'WebGL unavailable';
            return null;
        }
        const frag = fragmentFor(type);
        const prog = program(gl, frag);
        if (!prog) {
            if (statusEl) statusEl.innerText = 'Shader error';
            return null;
        }
        const geo = cubeGeometry(gl);
        const posLoc = gl.getAttribLocation(prog, 'position');
        const normLoc = gl.getAttribLocation(prog, 'normal');
        const projLoc = gl.getUniformLocation(prog, 'proj');
        const viewLoc = gl.getUniformLocation(prog, 'view');
        const modelLoc = gl.getUniformLocation(prog, 'model');
        const timeLoc = gl.getUniformLocation(prog, 'uTime');
        const colorLoc = gl.getUniformLocation(prog, 'uColor');
        const color = colorFor(type);

        gl.enable(gl.DEPTH_TEST);
        let frame = null;
        const render = function (ts) {
            const size = resizeGl(gl, canvas);
            gl.clearColor(0.02, 0.02, 0.04, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(prog);

            gl.bindBuffer(gl.ARRAY_BUFFER, geo.posBuf);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posLoc);
            gl.bindBuffer(gl.ARRAY_BUFFER, geo.normBuf);
            gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normLoc);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.idxBuf);

            const proj = mat4Perspective(Math.PI / 4, size.w / Math.max(1, size.h), 0.1, 50);
            const view = mat4LookAt([3.2, 2.4, 4.2], [0, 0, 0], [0, 1, 0]);
            let model = mat4Identity();
            model = mat4RotateY(model, ts * 0.0012 + (type === 'pixel' ? 0.7 : 0));
            model = mat4RotateX(model, 0.6 + Math.sin(ts * 0.0015) * 0.2);

            gl.uniformMatrix4fv(projLoc, false, proj);
            gl.uniformMatrix4fv(viewLoc, false, view);
            gl.uniformMatrix4fv(modelLoc, false, model);
            gl.uniform1f(timeLoc, ts * 0.001);
            gl.uniform3fv(colorLoc, color);

            gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
            frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);
        if (statusEl) statusEl.innerText = 'Rendering: ' + (type === 'fox' ? 'Fox Lab' : type);
        return {
            stop: function () { if (frame) cancelAnimationFrame(frame); },
            gl: gl
        };
    }

    let foxRunner = null;
    function teardownFoxLab() {
        if (foxRunner && foxRunner.stop) foxRunner.stop();
        foxRunner = null;
    }
    function setupFoxLab() {
        const holder = document.getElementById('fox-stage');
        if (!holder) return;
        teardownFoxLab();
        const canvas = document.createElement('canvas');
        canvas.className = 'fox-canvas';
        holder.innerHTML = '';
        holder.appendChild(canvas);
        foxRunner = startScene(canvas, 'fox');
        if (!foxRunner) holder.innerHTML = '<div class="fox-loading">WebGL unavailable</div>';
    }

    let demoRunner = null;
    function loadThreeExample(id) {
        const status = document.getElementById('pg-demo-status');
        if (!examples.find(e => e.id === id)) {
            if (status) status.innerText = 'Demo unavailable';
            return;
        }
        const canvas = document.getElementById('pg-demo-canvas');
        if (!canvas) return;
        if (demoRunner && demoRunner.stop) demoRunner.stop();
        if (id === 'fox-local') {
            if (status) status.innerText = 'Fox lab runs in the left stage';
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
            demoRunner = null;
            return;
        }
        const demo = examples.find(e => e.id === id);
        demoRunner = startScene(canvas, demo.type, status);
    }

    window.threeLab = {
        getExamples: function () { return examples.slice(); },
        setupFoxLab: setupFoxLab,
        teardownFoxLab: teardownFoxLab,
        loadExample: loadThreeExample
    };
})();
