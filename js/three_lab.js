/* three_lab.js */
// 3D Lab: self-contained WebGL skeletal showcase (no external deps)
(function () {
    const examples = [
        { id: 'skeletal', label: 'Skeletal Blend (offline)', type: 'skeletal' }
    ];

    // Minimal mat4 helpers
    function mat4Identity() {
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
    }
    function mat4Multiply(a, b) {
        const out = new Array(16);
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                out[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[c + 4] + a[r * 4 + 2] * b[c + 8] + a[r * 4 + 3] * b[c + 12];
            }
        }
        return out;
    }
    function mat4Translate(m, x, y, z) {
        const t = mat4Identity();
        t[12] = x; t[13] = y; t[14] = z;
        return mat4Multiply(m, t);
    }
    function mat4Scale(m, x, y, z) {
        const s = mat4Identity();
        s[0] = x; s[5] = y; s[10] = z;
        return mat4Multiply(m, s);
    }
    function mat4RotateX(m, rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        const r = [1, 0, 0, 0,
                   0, c, s, 0,
                   0, -s, c, 0,
                   0, 0, 0, 1];
        return mat4Multiply(m, r);
    }
    function mat4RotateY(m, rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        const r = [c, 0, -s, 0,
                   0, 1, 0, 0,
                   s, 0, c, 0,
                   0, 0, 0, 1];
        return mat4Multiply(m, r);
    }
    function mat4Perspective(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ];
    }
    function mat4LookAt(eye, center, up) {
        const [ex, ey, ez] = eye;
        const [cx, cy, cz] = center;
        let zx = ex - cx, zy = ey - cy, zz = ez - cz;
        let len = Math.hypot(zx, zy, zz) || 1;
        zx /= len; zy /= len; zz /= len;
        let xx = up[1] * zz - up[2] * zy;
        let xy = up[2] * zx - up[0] * zz;
        let xz = up[0] * zy - up[1] * zx;
        len = Math.hypot(xx, xy, xz) || 1;
        xx /= len; xy /= len; xz /= len;
        let yx = zy * xz - zz * xy;
        let yy = zz * xx - zx * xz;
        let yz = zx * xy - zy * xx;
        const m = [xx, yx, zx, 0,
                   xy, yy, zy, 0,
                   xz, yz, zz, 0,
                   0, 0, 0, 1];
        return mat4Multiply(m, mat4Translate(mat4Identity(), -ex, -ey, -ez));
    }

    function createGL(canvas) {
        if (!canvas) return null;
        const gl = canvas.getContext('webgl', { antialias: true });
        if (!gl) return null;
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.63, 0.63, 0.63, 1);
        return gl;
    }

    function createProgram(gl, vsSource, fsSource) {
        function compile(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.warn('Shader compile failed', gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        }
        const vs = compile(gl.VERTEX_SHADER, vsSource);
        const fs = compile(gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return null;
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn('Program link failed', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    const cubePositions = new Float32Array([
        // front
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
        // back
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5,  0.5, -0.5,
        -0.5,  0.5, -0.5,
    ]);
    const cubeIndices = new Uint16Array([
        0, 1, 2, 2, 3, 0, // front
        4, 5, 6, 6, 7, 4, // back
        4, 5, 1, 1, 0, 4, // bottom
        7, 6, 2, 2, 3, 7, // top
        5, 6, 2, 2, 1, 5, // right
        4, 7, 3, 3, 0, 4  // left
    ]);

    function buildSkeletonParts(time) {
        const wobble = Math.sin(time * 0.003) * 0.4;
        const stride = Math.sin(time * 0.006) * 0.5;
        const torso = mat4Scale(mat4Identity(), 1, 1.4, 0.6);
        const head = mat4Translate(mat4Scale(mat4Identity(), 0.6, 0.6, 0.6), 0, 1.6, 0);
        const armL = mat4Translate(mat4RotateZ(mat4Scale(mat4Identity(), 0.25, 0.9, 0.25), stride), -0.9, 0.8, 0);
        const armR = mat4Translate(mat4RotateZ(mat4Scale(mat4Identity(), 0.25, 0.9, 0.25), -stride), 0.9, 0.8, 0);
        const legL = mat4Translate(mat4RotateZ(mat4Scale(mat4Identity(), 0.3, 1.0, 0.3), -stride), -0.35, -1.0, 0);
        const legR = mat4Translate(mat4RotateZ(mat4Scale(mat4Identity(), 0.3, 1.0, 0.3), stride), 0.35, -1.0, 0);
        const tail = mat4Translate(mat4RotateX(mat4Scale(mat4Identity(), 0.2, 0.8, 0.2), wobble), 0, 0.1, -0.6);
        return [
            { color: [0.2, 0.7, 0.9], model: torso },
            { color: [0.9, 0.8, 0.4], model: head },
            { color: [0.3, 0.9, 0.6], model: armL },
            { color: [0.3, 0.9, 0.6], model: armR },
            { color: [0.9, 0.5, 0.3], model: legL },
            { color: [0.9, 0.5, 0.3], model: legR },
            { color: [0.7, 0.5, 0.9], model: tail }
        ];
    }

    function mat4RotateZ(m, rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        const r = [c, s, 0, 0,
                   -s, c, 0, 0,
                   0, 0, 1, 0,
                   0, 0, 0, 1];
        return mat4Multiply(m, r);
    }

    function buildSkeletalDemo(canvas, statusEl) {
        const gl = createGL(canvas);
        if (!gl) {
            if (statusEl) statusEl.innerText = 'WebGL unavailable';
            return Promise.resolve(null);
        }
        const vs = `
            attribute vec3 position;
            uniform mat4 u_mvp;
            void main() {
                gl_Position = u_mvp * vec4(position, 1.0);
            }
        `;
        const fs = `
            precision mediump float;
            uniform vec3 u_color;
            void main() { gl_FragColor = vec4(u_color, 1.0); }
        `;
        const program = createProgram(gl, vs, fs);
        if (!program) {
            if (statusEl) statusEl.innerText = 'Shader error';
            return Promise.resolve(null);
        }
        gl.useProgram(program);
        const posLoc = gl.getAttribLocation(program, 'position');
        const colorLoc = gl.getUniformLocation(program, 'u_color');
        const mvpLoc = gl.getUniformLocation(program, 'u_mvp');

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        const idxBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

        function resize() {
            const w = canvas.clientWidth || 640;
            const h = canvas.clientHeight || 360;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            gl.viewport(0, 0, w, h);
        }
        resize();

        let running = true;
        function stop() { running = false; }
        const render = (time) => {
            if (!running) return;
            resize();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const aspect = (canvas.clientWidth || 1) / Math.max(1, canvas.clientHeight || 1);
            const proj = mat4Perspective(Math.PI / 4, aspect, 0.1, 100);
            let view = mat4LookAt([3, 2, 6], [0, 0.4, 0], [0, 1, 0]);
            view = mat4RotateY(view, Math.sin(time * 0.0004) * 0.2);
            const parts = buildSkeletonParts(time);
            parts.forEach((part) => {
                let model = mat4Translate(mat4Identity(), 0, 0.2, 0);
                model = mat4Multiply(model, part.model);
                const mvp = mat4Multiply(proj, mat4Multiply(view, model));
                gl.uniformMatrix4fv(mvpLoc, false, new Float32Array(mvp));
                gl.uniform3fv(colorLoc, new Float32Array(part.color));
                gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
            });
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
        if (statusEl) statusEl.innerText = 'Running offline skeletal demo';
        return Promise.resolve({ stop });
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
        const status = document.createElement('div');
        status.className = 'panel-note';
        holder.appendChild(status);
        buildSkeletalDemo(canvas, status).then(function (runner) {
            foxRunner = runner;
            if (!runner) holder.innerHTML = '<div class="fox-loading">3D lab unavailable</div>';
        });
    }

    let demoRunner = null;
    function loadThreeExample(id) {
        const status = document.getElementById('pg-demo-status');
        const canvas = document.getElementById('pg-demo-canvas');
        if (demoRunner && demoRunner.stop) demoRunner.stop();
        if (!examples.find(function (e) { return e.id === id; })) {
            if (status) status.innerText = 'Demo unavailable';
            return;
        }
        if (!canvas) {
            if (status) status.innerText = 'Canvas missing';
            return;
        }
        buildSkeletalDemo(canvas, status).then(function (runner) {
            demoRunner = runner;
            if (!runner && status) status.innerText = 'Could not start demo';
        });
    }

    window.threeLab = {
        getExamples: function () { return examples.slice(); },
        setupFoxLab: setupFoxLab,
        teardownFoxLab: teardownFoxLab,
        loadExample: loadThreeExample
    };
})();
