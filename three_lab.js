// 3D Lab: single skeletal animation demo using Three.js (remote libs)
(function () {
    const examples = [
        { id: 'skeletal', label: 'Skeletal Blend (Xbot)', type: 'skeletal' }
    ];

    let libsPromise = null;
    function loadThreeLibs() {
        if (libsPromise) return libsPromise;
        libsPromise = (async function () {
            const [THREE, StatsMod, GUIMod, OrbitMod, GLTFMod] = await Promise.all([
                import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'),
                import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/stats.module.js'),
                import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/lil-gui.module.min.js'),
                import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js'),
                import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js')
            ]);
            return {
                THREE: THREE,
                Stats: StatsMod.default || StatsMod,
                GUI: GUIMod.GUI || GUIMod.default || GUIMod,
                OrbitControls: OrbitMod.OrbitControls || OrbitMod.default,
                GLTFLoader: GLTFMod.GLTFLoader || GLTFMod.default || GLTFMod
            };
        })().catch(function (err) {
            console.error('Failed to load Three.js libs', err);
            throw err;
        });
        return libsPromise;
    }

    function sizeRenderer(renderer, canvas) {
        if (!renderer || !canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const w = (canvas.clientWidth || 640) * dpr;
        const h = (canvas.clientHeight || 360) * dpr;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        renderer.setSize(canvas.clientWidth || 640, canvas.clientHeight || 360, false);
    }

    function buildSkeletalDemo(canvas, statusEl, guiHost) {
        let stopLoop = null;
        let gui = null;
        let stats = null;
        let resizeHandler = null;
        let renderer, scene, camera, mixer, controls, clock;
        let currentBaseAction = 'idle';
        const crossFadeControls = [];
        const baseActions = {
            idle: { weight: 1 },
            walk: { weight: 0 },
            run: { weight: 0 }
        };
        const additiveActions = {
            sneak_pose: { weight: 0 },
            sad_pose: { weight: 0 },
            agree: { weight: 0 },
            headShake: { weight: 0 }
        };
        const allActions = [];
        const panelSettings = { 'modify time scale': 1.0 };
        let libs = null;

        function setStatus(msg) {
            if (statusEl) statusEl.innerText = msg;
        }

        function teardown() {
            if (stopLoop) stopLoop();
            stopLoop = null;
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            resizeHandler = null;
            if (controls && controls.dispose) controls.dispose();
            controls = null;
            if (gui && gui.destroy) gui.destroy();
            gui = null;
            if (stats && stats.dom && stats.dom.parentNode) stats.dom.parentNode.removeChild(stats.dom);
            stats = null;
            if (renderer && renderer.dispose) renderer.dispose();
            renderer = null;
            scene = null;
            camera = null;
            mixer = null;
        }

        function activateAction(action, weight) {
            if (!action) return;
            action.enabled = true;
            action.setEffectiveTimeScale(1);
            action.setEffectiveWeight(weight);
            action.play();
        }

        function setWeight(action, weight) {
            if (!action) return;
            action.enabled = true;
            action.setEffectiveTimeScale(1);
            action.setEffectiveWeight(weight);
        }

        function executeCrossFade(startAction, endAction, duration) {
            if (endAction) {
                setWeight(endAction, 1);
                endAction.time = 0;
                if (startAction) {
                    startAction.crossFadeTo(endAction, duration, true);
                } else {
                    endAction.fadeIn(duration);
                }
            } else if (startAction) {
                startAction.fadeOut(duration);
            }
        }

        function prepareCrossFade(startAction, endAction, duration) {
            if (!mixer) return;
            if (currentBaseAction === 'idle' || !startAction || !endAction) {
                executeCrossFade(startAction, endAction, duration);
            } else {
                const onLoopFinished = function (event) {
                    if (event.action === startAction) {
                        mixer.removeEventListener('loop', onLoopFinished);
                        executeCrossFade(startAction, endAction, duration);
                    }
                };
                mixer.addEventListener('loop', onLoopFinished);
            }

            if (endAction) {
                const clip = endAction.getClip();
                currentBaseAction = clip.name;
            } else {
                currentBaseAction = 'None';
            }

            crossFadeControls.forEach(function (control) {
                const name = control.property;
                if (name === currentBaseAction) {
                    if (control.setActive) control.setActive();
                } else {
                    if (control.setInactive) control.setInactive();
                }
            });
        }

        function createPanel() {
            if (!libs || !libs.GUI) return;
            gui = new libs.GUI({ width: 260 });
            if (guiHost) {
                guiHost.appendChild(gui.domElement);
            }

            const folder1 = gui.addFolder('Base Actions');
            const folder2 = gui.addFolder('Additive Action Weights');
            const folder3 = gui.addFolder('General Speed');

            const baseNames = ['None'].concat(Object.keys(baseActions));
            baseNames.forEach(function (name) {
                const settings = baseActions[name];
                panelSettings[name] = function () {
                    const currentSettings = baseActions[currentBaseAction];
                    const currentAction = currentSettings ? currentSettings.action : null;
                    const action = settings ? settings.action : null;
                    if (currentAction !== action) {
                        prepareCrossFade(currentAction, action, 0.35);
                    }
                };
                const control = folder1.add(panelSettings, name);
                control.setInactive = function () {
                    control.domElement.classList.add('control-inactive');
                };
                control.setActive = function () {
                    control.domElement.classList.remove('control-inactive');
                };
                const s = baseActions[name];
                if (!s || !s.weight) control.setInactive();
                crossFadeControls.push(control);
            });

            Object.keys(additiveActions).forEach(function (name) {
                const settings = additiveActions[name];
                panelSettings[name] = settings.weight;
                folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange(function (weight) {
                    if (settings.action) {
                        setWeight(settings.action, weight);
                        settings.weight = weight;
                    }
                });
            });

            folder3.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(function (speed) {
                if (mixer) mixer.timeScale = speed;
            });

            folder1.open();
            folder2.open();
            folder3.open();
        }

        function onWindowResize() {
            if (!renderer || !camera || !canvas) return;
            const aspect = (canvas.clientWidth || 1) / Math.max(1, canvas.clientHeight || 1);
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth || 640, canvas.clientHeight || 360, false);
        }

        function initScene() {
            scene = new libs.THREE.Scene();
            scene.background = new libs.THREE.Color(0xa0a0a0);
            scene.fog = new libs.THREE.Fog(0xa0a0a0, 10, 50);

            const hemiLight = new libs.THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
            hemiLight.position.set(0, 20, 0);
            scene.add(hemiLight);

            const dirLight = new libs.THREE.DirectionalLight(0xffffff, 3);
            dirLight.position.set(3, 10, 10);
            dirLight.castShadow = true;
            dirLight.shadow.camera.top = 2;
            dirLight.shadow.camera.bottom = -2;
            dirLight.shadow.camera.left = -2;
            dirLight.shadow.camera.right = 2;
            dirLight.shadow.camera.near = 0.1;
            dirLight.shadow.camera.far = 40;
            scene.add(dirLight);

            const mesh = new libs.THREE.Mesh(new libs.THREE.PlaneGeometry(100, 100), new libs.THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }));
            mesh.rotation.x = -Math.PI / 2;
            mesh.receiveShadow = true;
            scene.add(mesh);

            renderer = new libs.THREE.WebGLRenderer({ antialias: true, canvas: canvas });
            renderer.setPixelRatio(window.devicePixelRatio || 1);
            renderer.shadowMap.enabled = true;
            sizeRenderer(renderer, canvas);

            camera = new libs.THREE.PerspectiveCamera(45, (canvas.clientWidth || 1) / Math.max(1, canvas.clientHeight || 1), 1, 100);
            camera.position.set(-1, 2, 3);

            controls = new libs.OrbitControls(camera, renderer.domElement);
            controls.enablePan = false;
            controls.enableZoom = true;
            controls.target.set(0, 1, 0);
            controls.update();

            clock = new libs.THREE.Clock();

            if (libs.Stats) {
                stats = new libs.Stats();
                stats.showPanel(0);
                if (guiHost) guiHost.appendChild(stats.dom); else document.body.appendChild(stats.dom);
            }

            resizeHandler = onWindowResize;
            window.addEventListener('resize', resizeHandler);
        }

        function loadModel() {
            const loader = new libs.GLTFLoader();
            loader.load('https://threejs.org/examples/models/gltf/Xbot.glb', function (gltf) {
                const model = gltf.scene;
                scene.add(model);
                model.traverse(function (object) {
                    if (object.isMesh) object.castShadow = true;
                });

                const skeleton = new libs.THREE.SkeletonHelper(model);
                skeleton.visible = false;
                scene.add(skeleton);

                const animations = gltf.animations || [];
                mixer = new libs.THREE.AnimationMixer(model);

                animations.forEach(function (clip) {
                    const name = clip.name;
                    if (baseActions[name]) {
                        const action = mixer.clipAction(clip);
                        activateAction(action, baseActions[name].weight);
                        baseActions[name].action = action;
                        allActions.push(action);
                    } else if (additiveActions[name]) {
                        libs.THREE.AnimationUtils.makeClipAdditive(clip);
                        if (clip.name.indexOf('_pose') > -1) {
                            clip = libs.THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30);
                        }
                        const action = mixer.clipAction(clip);
                        activateAction(action, additiveActions[name].weight);
                        additiveActions[name].action = action;
                        allActions.push(action);
                    }
                });

                createPanel();
                setStatus('Loaded skeletal rig: ' + animations.length + ' clips');

                const animate = function () {
                    const delta = clock.getDelta();
                    if (mixer) mixer.update(delta);
                    renderer.render(scene, camera);
                    if (stats) stats.update();
                };
                renderer.setAnimationLoop(animate);
                stopLoop = function () {
                    renderer.setAnimationLoop(null);
                };
            }, function () {
                setStatus('Loading model...');
            }, function (err) {
                console.warn('GLTF load failed', err);
                setStatus('Failed to load model');
            });
        }

        return loadThreeLibs().then(function (loaded) {
            libs = loaded;
            if (!canvas) {
                setStatus('Canvas missing');
                return null;
            }
            initScene();
            loadModel();
            setStatus('Initializing skeletal demo...');
            return {
                stop: teardown
            };
        }).catch(function (err) {
            console.error('Skeletal demo error', err);
            setStatus('3D libs unavailable');
            return null;
        });
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
        buildSkeletalDemo(canvas, status, holder).then(function (runner) {
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
        const guiHost = document.getElementById('pg-demo-frame') || canvas.parentNode;
        buildSkeletalDemo(canvas, status, guiHost).then(function (runner) {
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
