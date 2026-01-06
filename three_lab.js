// Three.js lab helpers isolated for Playground Polygon
(function () {
    const examples = [
        { id: 'fox-local', label: 'Fox Lab (local)', type: 'fox' },
        { id: 'transmission', label: 'Physical Transmission (local)', type: 'transmission' },
        { id: 'toon', label: 'Toon Materials (local)', type: 'toon' },
        { id: 'pixel', label: 'Pixel Post FX (local)', type: 'pixel' },
        { id: 'md2', label: 'Walker Parade (local)', type: 'md2-lite' },
        { id: 'spot', label: 'Spotlight Lab (local)', type: 'spot' }
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

    let currentDemoUrl = null;

    function buildDemoHtml(type) {
        const baseStyles = `body,html{margin:0;width:100%;height:100%;background:#050505;color:#cfcfcf;font-family:monospace;}canvas{display:block;width:100%;height:100%;}`;
        const sharedSetup = `const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,0.1,100);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(window.innerWidth,window.innerHeight);document.body.appendChild(renderer.domElement);window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});`;

        const demos = {
            transmission: `${sharedSetup}camera.position.set(2,1.5,3);scene.add(new THREE.HemisphereLight(0xffffff,0x222222,1));const geo=new THREE.SphereGeometry(1,64,32);const mat=new THREE.MeshPhysicalMaterial({color:0x88c7ff,metalness:0.1,roughness:0.05,transmission:0.85,thickness:0.6,envMapIntensity:0.6,clearcoat:0.3,clearcoatRoughness:0.1});const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);const floor=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshStandardMaterial({color:0x0c0c0c,metalness:0.2,roughness:0.8}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.2;scene.add(floor);function anim(){mesh.rotation.y+=0.01;renderer.render(scene,camera);requestAnimationFrame(anim);}anim();`,
            toon: `${sharedSetup}camera.position.set(3,2,4);const light=new THREE.DirectionalLight(0xffffff,1);light.position.set(2,3,2);scene.add(light);scene.add(new THREE.AmbientLight(0x222222));const mat=new THREE.MeshToonMaterial({color:0xff8844});const geo=new THREE.TorusKnotGeometry(1,0.35,100,16);const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);function anim(){mesh.rotation.x+=0.01;mesh.rotation.y+=0.013;renderer.render(scene,camera);requestAnimationFrame(anim);}anim();`,
            pixel: `${sharedSetup}renderer.domElement.style.imageRendering='pixelated';camera.position.set(2.6,1.8,3.2);scene.add(new THREE.AmbientLight(0xffffff,0.8));const colors=[0xff5555,0x55ff99,0x66a3ff,0xffdd55];const cubes=[];for(let i=0;i<25;i++){const m=new THREE.MeshStandardMaterial({color:colors[i%colors.length]});const g=new THREE.BoxGeometry(0.5,0.5,0.5);const cube=new THREE.Mesh(g,m);cube.position.set((Math.random()-0.5)*4,(Math.random()-0.5)*3,(Math.random()-0.5)*4);scene.add(cube);cubes.push(cube);}const light=new THREE.PointLight(0xffffff,1,10);light.position.set(2,3,2);scene.add(light);function anim(){cubes.forEach((c,idx)=>{c.rotation.x+=0.01+idx*0.0005;c.rotation.y+=0.008+idx*0.0004;});renderer.setSize(window.innerWidth/2,window.innerHeight/2,false);renderer.render(scene,camera);renderer.setSize(window.innerWidth,window.innerHeight,false);}anim();`,
            'md2-lite': `${sharedSetup}camera.position.set(3,2.2,4);scene.add(new THREE.AmbientLight(0x666666));const spot=new THREE.SpotLight(0xffffff,1);spot.position.set(3,4,2);scene.add(spot);const geo=new THREE.BoxGeometry(0.4,0.8,0.4);const mats=[0xf06b6b,0x6bf0a7,0x6baaf0].map(c=>new THREE.MeshStandardMaterial({color:c}));const walkers=[];for(let i=0;i<6;i++){const mesh=new THREE.Mesh(geo,mats[i%3]);mesh.position.set(-2+i*0.8,0.4,(Math.random()-0.5)*1.5);scene.add(mesh);walkers.push(mesh);}let t=0;function anim(){t+=0.03;walkers.forEach((w,idx)=>{w.position.y=0.4+Math.sin(t+idx)*0.15;w.rotation.y=Math.sin(t*0.5+idx)*0.3;});renderer.render(scene,camera);requestAnimationFrame(anim);}anim();`,
            spot: `${sharedSetup}camera.position.set(3,2,5);scene.add(new THREE.AmbientLight(0x111111));const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshPhongMaterial({color:0x0a0a0a}));floor.rotation.x=-Math.PI/2;scene.add(floor);const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),new THREE.MeshPhongMaterial({color:0x44aaff,shininess:80}));sphere.position.y=1;scene.add(sphere);const spot=new THREE.SpotLight(0xffdd88,1.4,20,Math.PI/6,0.5,1);spot.position.set(4,6,2);spot.target=sphere;scene.add(spot);scene.add(spot.target);function anim(){sphere.rotation.y+=0.01;sphere.rotation.x+=0.005;spot.position.x=Math.sin(Date.now()/900)*4;spot.position.z=Math.cos(Date.now()/1100)*3;renderer.render(scene,camera);requestAnimationFrame(anim);}anim();`
        };

        const body = demos[type] || `${sharedSetup}camera.position.z=3;const mat=new THREE.MeshNormalMaterial();const geo=new THREE.IcosahedronGeometry(1.2,0);const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);function anim(){mesh.rotation.x+=0.01;mesh.rotation.y+=0.01;renderer.render(scene,camera);requestAnimationFrame(anim);}anim();`;

        return `<!doctype html><html><head><style>${baseStyles}</style></head><body><div id="status" style="position:absolute;left:10px;top:10px;padding:6px 10px;background:rgba(0,0,0,0.6);border:1px solid #333;border-radius:6px;">Loading…</div><script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script><script>(function(){const st=document.getElementById('status');try{${body}st.textContent='Running';}catch(e){st.textContent='Demo error: '+e.message;}})();</script></body></html>`;
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
