// Three.js lab helpers isolated for Playground Polygon
(function () {
    const examples = [
        { id: 'fox-local', label: 'Fox Lab (local)', url: '' },
        { id: 'transmission', label: 'Physical Transmission', url: 'https://threejs.org/examples/webgl_materials_physical_transmission_alpha.html' },
        { id: 'toon', label: 'Toon Materials', url: 'https://threejs.org/examples/webgl_materials_toon.html' },
        { id: 'pixel', label: 'Pixel Post FX', url: 'https://threejs.org/examples/webgl_postprocessing_pixel.html' },
        { id: 'md2', label: 'MD2 Loader', url: 'https://threejs.org/examples/webgl_loader_md2.html' },
        { id: 'spot', label: 'Spotlight Lab', url: 'https://threejs.org/examples/webgl_lights_spotlight.html' }
    ];

    let foxRenderer = null;
    let foxScene = null;
    let foxCamera = null;
    let foxGroup = null;
    let foxAnimHandle = null;
    let foxResizeHandler = null;
    let threeLoading = false;
    let threeQueue = [];

    function ensureThree(callback, onError) {
        const fail = typeof onError === 'function' ? onError : function () { };
        if (window.THREE) { callback(); return; }
        threeQueue.push(callback);
        if (threeLoading) return;
        threeLoading = true;
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
        s.onload = function () {
            threeLoading = false;
            const queue = threeQueue.slice();
            threeQueue = [];
            queue.forEach(fn => { if (typeof fn === 'function') fn(); });
        };
        s.onerror = function () {
            threeLoading = false; threeQueue = [];
            fail();
            if (typeof showToast === 'function') showToast('Three.js failed to load', 'error');
        };
        document.head.appendChild(s);
    }

    function teardownFoxLab() {
        if (foxResizeHandler) {
            window.removeEventListener('resize', foxResizeHandler);
            foxResizeHandler = null;
        }
        if (foxAnimHandle) {
            cancelAnimationFrame(foxAnimHandle);
            foxAnimHandle = null;
        }
        if (foxRenderer) {
            foxRenderer.dispose();
            foxRenderer = null;
        }
        foxScene = null; foxCamera = null; foxGroup = null;
    }

    function resizeFoxLab(container) {
        if (!foxRenderer || !foxCamera || !container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        foxCamera.aspect = w / h;
        foxCamera.updateProjectionMatrix();
        foxRenderer.setSize(w, h);
    }

    function setupFoxLab() {
        const holder = document.getElementById('fox-stage');
        if (!holder) return;
        holder.innerHTML = '<div class="fox-loading">Loading fox lab…</div>';
        ensureThree(() => {
            if (!holder) return;
            teardownFoxLab();
            const THREE = window.THREE;
            if (!THREE) { holder.innerHTML = '<div class="fox-loading">Three.js unavailable</div>'; return; }
            foxRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            foxRenderer.setPixelRatio(window.devicePixelRatio || 1);
            foxRenderer.setSize(holder.clientWidth, holder.clientHeight);
            holder.innerHTML = '';
            holder.appendChild(foxRenderer.domElement);

            foxScene = new THREE.Scene();
            foxCamera = new THREE.PerspectiveCamera(50, holder.clientWidth / holder.clientHeight, 0.1, 100);
            foxCamera.position.set(2, 1.4, 3);

            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            const spot = new THREE.DirectionalLight(0xffb000, 0.8);
            spot.position.set(3, 4, 2);
            foxScene.add(ambient);
            foxScene.add(spot);

            foxGroup = new THREE.Group();
            const orange = new THREE.MeshStandardMaterial({ color: 0xffa040, roughness: 0.6, metalness: 0.1 });
            const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
            const black = new THREE.MeshStandardMaterial({ color: 0x111111 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.6), orange);
            body.position.set(0, 0.3, 0);
            foxGroup.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), orange);
            head.position.set(0.9, 0.55, 0);
            foxGroup.add(head);

            const nose = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.2), black);
            nose.position.set(1.3, 0.45, 0);
            foxGroup.add(nose);

            const earL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), white);
            earL.position.set(0.75, 0.85, 0.2);
            const earR = earL.clone(); earR.position.z = -0.2;
            foxGroup.add(earL); foxGroup.add(earR);

            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.2), orange);
            tail.position.set(-1.0, 0.35, 0);
            tail.rotation.z = 0.25;
            foxGroup.add(tail);

            const legs = new THREE.BoxGeometry(0.15, 0.3, 0.15);
            const legOffsets = [ [0.4, 0, 0.2], [0.4, 0, -0.2], [-0.4, 0, 0.2], [-0.4, 0, -0.2] ];
            legOffsets.forEach((p) => {
                const leg = new THREE.Mesh(legs, black);
                leg.position.set(p[0], 0.15, p[2]);
                foxGroup.add(leg);
            });

            foxScene.add(foxGroup);
            const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 40), new THREE.MeshBasicMaterial({ color: 0x101010 }));
            ground.rotation.x = -Math.PI / 2;
            foxScene.add(ground);

            const animateFox = function () {
                if (!foxRenderer || !foxScene || !foxCamera) return;
                foxGroup.rotation.y += 0.01;
                foxGroup.position.y = 0.05 + Math.sin(Date.now() / 500) * 0.02;
                foxRenderer.render(foxScene, foxCamera);
                foxAnimHandle = requestAnimationFrame(animateFox);
            };
            animateFox();

            foxResizeHandler = function () { resizeFoxLab(holder); };
            window.addEventListener('resize', foxResizeHandler);
            resizeFoxLab(holder);
        }, () => {
            if (holder) holder.innerHTML = '<div class="fox-loading">Fox lab failed to load</div>';
        });
    }

    function loadThreeExample(id) {
        const frame = document.getElementById('pg-demo-frame');
        const status = document.getElementById('pg-demo-status');
        if (!frame || !status) return;
        const demo = examples.find(d => d.id === id);
        if (!demo) { status.innerText = 'Demo unavailable'; return; }
        if (id === 'fox-local') {
            frame.src = '';
            status.innerText = 'Fox lab runs locally above; remote iframe cleared.';
            return;
        }
        status.innerText = 'Loading ' + demo.label + '...';
        frame.src = demo.url;
        frame.onload = function () { status.innerText = 'Loaded: ' + demo.label; };
        frame.onerror = function () { status.innerText = 'Unable to load demo (offline?)'; };
    }

    window.threeLab = {
        getExamples: function () { return examples.slice(); },
        setupFoxLab: setupFoxLab,
        teardownFoxLab: teardownFoxLab,
        loadExample: loadThreeExample
    };
})();
