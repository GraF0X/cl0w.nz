/* final_three.js */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CCDIKSolver, CCDIKHelper } from 'three/addons/animation/CCDIKSolver.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';
import { BleachBypassShader } from 'three/addons/shaders/BleachBypassShader.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { ColorifyShader } from 'three/addons/shaders/ColorifyShader.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { SepiaShader } from 'three/addons/shaders/SepiaShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

const container = document.getElementById('finals-container');
if (!container || container.dataset.ready === 'true') {
    container && (container.dataset.ready = 'true');
} else {
    container.dataset.ready = 'true';

    let camera, scene, renderer, composer, clock, stats, controls;
    let gui = null;
    let renderPass, renderPixelatedPass;
    let bloomPass, bokehPass, bleachPass, colorCorrectionPass;
    let colorifyPass, hBlurPass, vBlurPass, sepiaPass, vignettePass;
    let filmPass, dotScreenPass, simpleBloomPass;
    let fxaaPass, gammaPass, outputPass;
    let asciiEffect;
    let isAsciiActive = false;

    let ikSolver, ikHelper;
    let transformControls = [];
    const ikConfig = {
        enabled: false,
        showHelpers: false
    };

    const postProcessingParams = {
        pixelation: true,
        bloom: false,
        simpleBloom: false,
        bokeh: false,
        bleach: false,
        colorCorrection: true,
        colorify: false,
        sepia: false,
        blur: false,
        vignette: false,
        film: false,
        dotScreen: false,
        fxaa: true,
        gamma: false,
        bloomStrength: 1.5,
        bloomRadius: 0.4,
        bloomThreshold: 0.85,
        simpleBloomStrength: 1.25,
        bokehFocus: 1.0,
        bokehAperture: 0.025,
        bokehMaxBlur: 0.01,
        bleachOpacity: 0.95,
        colorifyColor: 0xffffff,
        blurSize: 1.0,
        vignetteOffset: 1.0,
        vignetteDarkness: 1.0,
        filmNoise: 0.35,
        filmScanlines: 0.5,
        filmGrayscale: false,
        dotScale: 1.0,
        autoRotate: false
    };

    let spotLight, lightHelper;
    const lightConfig = {
        animate: true,
        manualX: 5,
        manualY: 8,
        manualZ: 5
    };

    let model, skeleton, mixer;
    let skinnedMesh;

    const crossFadeControls = [];
    let currentBaseAction = 'idle';
    const allActions = [];

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
    let panelSettings;

    init();

    function getSize() {
        const width = container.clientWidth || window.innerWidth;
        const height = Math.max(320, container.clientHeight || 480);
        return { width, height };
    }

    function init() {
        const { width, height } = getSize();

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        camera.position.set(-1, 2, 4);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        new RGBELoader()
            .setPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/equirectangular/')
            .load('royal_esplanade_1k.hdr', function (texture) {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture;
            });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        scene.add(ambientLight);

        spotLight = new THREE.SpotLight(0xffffff, 100);
        spotLight.position.set(5, 8, 5);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 1;
        spotLight.decay = 2;
        spotLight.distance = 200;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.camera.near = 1;
        spotLight.shadow.camera.far = 20;
        spotLight.shadow.focus = 1;
        spotLight.shadow.bias = -0.0001;
        scene.add(spotLight);

        lightHelper = new THREE.SpotLightHelper(spotLight);
        lightHelper.visible = false;
        scene.add(lightHelper);

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: 0x333333, depthWrite: false }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add(mesh);

        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);

        composer = new EffectComposer(renderer);

        renderPass = new RenderPass(scene, camera);
        renderPixelatedPass = new RenderPixelatedPass(6, scene, camera);
        renderPixelatedPass.enabled = false;

        bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        bloomPass.threshold = postProcessingParams.bloomThreshold;
        bloomPass.strength = postProcessingParams.bloomStrength;
        bloomPass.radius = postProcessingParams.bloomRadius;

        simpleBloomPass = new BloomPass(postProcessingParams.simpleBloomStrength);

        bokehPass = new BokehPass(scene, camera, {
            focus: 1.0,
            aperture: 0.025,
            maxblur: 0.01,
            width: width,
            height: height
        });

        bleachPass = new ShaderPass(BleachBypassShader);
        bleachPass.uniforms["opacity"].value = 0.95;

        colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
        colorCorrectionPass.uniforms['powRGB'].value.set(2, 2, 2);
        colorCorrectionPass.uniforms['mulRGB'].value.set(1.1, 1.1, 1.1);

        colorifyPass = new ShaderPass(ColorifyShader);
        colorifyPass.uniforms["color"].value = new THREE.Color(postProcessingParams.colorifyColor);

        hBlurPass = new ShaderPass(HorizontalBlurShader);
        vBlurPass = new ShaderPass(VerticalBlurShader);
        const pixelRatio = renderer.getPixelRatio();
        hBlurPass.uniforms['h'].value = postProcessingParams.blurSize / (width * pixelRatio);
        vBlurPass.uniforms['v'].value = postProcessingParams.blurSize / (height * pixelRatio);

        sepiaPass = new ShaderPass(SepiaShader);

        vignettePass = new ShaderPass(VignetteShader);
        vignettePass.uniforms["offset"].value = postProcessingParams.vignetteOffset;
        vignettePass.uniforms["darkness"].value = postProcessingParams.vignetteDarkness;

        filmPass = new FilmPass(
            postProcessingParams.filmNoise,
            postProcessingParams.filmScanlines,
            648,
            postProcessingParams.filmGrayscale
        );

        dotScreenPass = new DotScreenPass(new THREE.Vector2(0, 0), 0.5, 0.8);
        dotScreenPass.uniforms['scale'].value = postProcessingParams.dotScale;

        fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);

        gammaPass = new ShaderPass(GammaCorrectionShader);
        outputPass = new OutputPass();

        postProcessingParams.pixelation = false;
        updateComposer();

        asciiEffect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: true });
        asciiEffect.setSize(width, height);
        asciiEffect.domElement.style.color = 'white';
        asciiEffect.domElement.style.backgroundColor = 'black';
        asciiEffect.domElement.style.display = 'none';
        container.appendChild(asciiEffect.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.target.set(0, 1, 0);
        controls.autoRotate = false;
        controls.update();

        stats = new Stats();
        stats.dom.style.position = 'absolute';
        stats.dom.style.top = '8px';
        stats.dom.style.left = '8px';
        stats.dom.style.zIndex = '5';
        container.appendChild(stats.dom);

        clock = new THREE.Clock();
        const loader = new GLTFLoader();
        const modelUrl = 'https://dl.dropboxusercontent.com/scl/fi/zui9932abn9tvcbawunvl/Xbot.glb?rlkey=m1lqparwj8fl9uu4ab6agr5ef&st=ds3i3i43';

        loader.load(modelUrl, function (gltf) {
            model = gltf.scene;
            scene.add(model);

            model.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    if (!skinnedMesh && object.isSkinnedMesh) skinnedMesh = object;
                }
            });

            skeleton = new THREE.SkeletonHelper(model);
            skeleton.visible = false;
            scene.add(skeleton);

            spotLight.target = model;

            const animations = gltf.animations;
            mixer = new THREE.AnimationMixer(model);

            const numAnimations = animations.length;

            for (let i = 0; i !== numAnimations; ++i) {
                let clip = animations[i];
                const name = clip.name;

                if (baseActions[name]) {
                    const action = mixer.clipAction(clip);
                    activateAction(action);
                    baseActions[name].action = action;
                    allActions.push(action);
                } else if (additiveActions[name]) {
                    THREE.AnimationUtils.makeClipAdditive(clip);
                    if (clip.name.endsWith('_pose')) {
                        clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30);
                    }
                    const action = mixer.clipAction(clip);
                    activateAction(action);
                    additiveActions[name].action = action;
                    allActions.push(action);
                }
            }

            if (skinnedMesh) initIK(skinnedMesh);
            createMergedGUI();
            renderer.setAnimationLoop(animate);
        }, undefined, function (error) {
            console.error('Помилка завантаження моделі:', error);
            loader.load('https://threejs.org/examples/models/gltf/Xbot.glb', function (gltf) {
                model = gltf.scene;
                scene.add(model);
                spotLight.target = model;
                mixer = new THREE.AnimationMixer(model);
                model.traverse(o => { if (o.isSkinnedMesh) skinnedMesh = o; });
                if (skinnedMesh) initIK(skinnedMesh);
                renderer.setAnimationLoop(animate);
            });
        });

        window.addEventListener('resize', onWindowResize);
        window.finalThreeTeardown = teardown;
    }

    function initIK(mesh) {
        if (!mesh || !mesh.skeleton || !mesh.skeleton.bones || mesh.skeleton.bones.length === 0) return;
        if (ikSolver) return;

        const bones = mesh.skeleton.bones;
        const boneMap = {};
        bones.forEach((b, i) => boneMap[b.name] = i);

        const getIndex = (names) => {
            for (let name of names) {
                if (boneMap[name] !== undefined) return boneMap[name];
            }
            for (let name of names) {
                const cleanName = name.replace('mixamorig', '');
                if (!cleanName) continue;
                for (let i = 0; i < bones.length; i++) {
                    if (bones[i].name.endsWith(cleanName)) return i;
                }
            }
            return null;
        };

        const chainConfigs = [
            {
                name: "LeftHand",
                effectorNames: ['mixamorigLeftHand', 'LeftHand'],
                linkNames: [['mixamorigLeftForeArm', 'LeftForeArm'], ['mixamorigLeftArm', 'LeftArm']]
            },
            {
                name: "RightHand",
                effectorNames: ['mixamorigRightHand', 'RightHand'],
                linkNames: [['mixamorigRightForeArm', 'RightForeArm'], ['mixamorigRightArm', 'RightArm']]
            },
            {
                name: "LeftFoot",
                effectorNames: ['mixamorigLeftFoot', 'LeftFoot'],
                linkNames: [['mixamorigLeftLeg', 'LeftLeg'], ['mixamorigLeftUpLeg', 'LeftUpLeg']]
            },
            {
                name: "RightFoot",
                effectorNames: ['mixamorigRightFoot', 'RightFoot'],
                linkNames: [['mixamorigRightLeg', 'RightLeg'], ['mixamorigRightUpLeg', 'RightUpLeg']]
            }
        ];

        const iks = [];

        chainConfigs.forEach(config => {
            const effector = getIndex(config.effectorNames);
            if (effector === null || !bones[effector]) return;

            const links = [];
            let complete = true;
            for (let linkNameCandidates of config.linkNames) {
                const idx = getIndex(linkNameCandidates);
                if (idx === null || !bones[idx]) {
                    complete = false;
                    break;
                }
                links.push({ index: idx });
            }

            if (complete) {
                const targetMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0 })
                );

                const effectorBone = bones[effector];
                effectorBone.getWorldPosition(targetMesh.position);
                scene.add(targetMesh);

                bones.push(targetMesh);
                if (mesh.skeleton && mesh.skeleton.boneInverses) {
                    mesh.skeleton.boneInverses.push(new THREE.Matrix4());
                }
                const targetIndex = bones.length - 1;

                iks.push({
                    target: targetIndex,
                    effector: effector,
                    links: links
                });

                const control = new TransformControls(camera, renderer.domElement);
                control.attach(targetMesh);
                control.visible = false;
                control.enabled = false;
                control.addEventListener('dragging-changed', function (event) {
                    controls.enabled = !event.value;
                });
                scene.add(control);
                transformControls.push(control);
            }
        });

        if (iks.length > 0) {
            ikSolver = new CCDIKSolver(mesh, iks);
            ikHelper = new CCDIKHelper(mesh, iks);
            ikHelper.visible = false;
            scene.add(ikHelper);
        }
    }

    function updateComposer() {
        composer.passes = [];

        if (postProcessingParams.pixelation) {
            renderPixelatedPass.enabled = true;
            composer.addPass(renderPixelatedPass);
        } else {
            renderPass.enabled = true;
            composer.addPass(renderPass);
        }

        if (postProcessingParams.simpleBloom) { simpleBloomPass.enabled = true; composer.addPass(simpleBloomPass); }
        if (postProcessingParams.bloom) { bloomPass.enabled = true; composer.addPass(bloomPass); }
        if (postProcessingParams.bokeh) { bokehPass.enabled = true; composer.addPass(bokehPass); }

        if (postProcessingParams.dotScreen) { dotScreenPass.enabled = true; composer.addPass(dotScreenPass); }
        if (postProcessingParams.film) { filmPass.enabled = true; composer.addPass(filmPass); }

        if (postProcessingParams.bleach) { bleachPass.enabled = true; composer.addPass(bleachPass); }
        if (postProcessingParams.colorCorrection) { colorCorrectionPass.enabled = true; composer.addPass(colorCorrectionPass); }
        if (postProcessingParams.colorify) { colorifyPass.enabled = true; composer.addPass(colorifyPass); }
        if (postProcessingParams.sepia) { sepiaPass.enabled = true; composer.addPass(sepiaPass); }

        if (postProcessingParams.blur) {
            hBlurPass.enabled = true;
            vBlurPass.enabled = true;
            composer.addPass(hBlurPass);
            composer.addPass(vBlurPass);
        }

        if (postProcessingParams.vignette) { vignettePass.enabled = true; composer.addPass(vignettePass); }

        if (postProcessingParams.gamma) { gammaPass.enabled = true; composer.addPass(gammaPass); }
        if (postProcessingParams.fxaa) { fxaaPass.enabled = true; composer.addPass(fxaaPass); }

        composer.addPass(outputPass);
    }

    function createMergedGUI() {
        gui = new GUI({ width: 310 });

        const visualFolder = gui.addFolder('Visual Settings');
        const pixelParams = {
            pixelSize: 6,
            normalEdgeStrength: 0.3,
            depthEdgeStrength: 0.4,
            pixelAlignedPanning: true
        };

        const pixelToggle = visualFolder.add(postProcessingParams, 'pixelation').name('Pixelation').onChange(() => {
            if (postProcessingParams.pixelation) {
                postProcessingParams.pixelation = false;
            }
            updateComposer();
        });
        pixelToggle.domElement.classList.add('control-inactive');

        const pixelSub = visualFolder.addFolder('Pixel Details');
        pixelSub.add(pixelParams, 'pixelSize').min(1).max(16).step(1).onChange(() => { renderPixelatedPass.setPixelSize(pixelParams.pixelSize); });
        pixelSub.add(renderPixelatedPass, 'normalEdgeStrength').min(0).max(2).step(0.05);
        pixelSub.add(renderPixelatedPass, 'depthEdgeStrength').min(0).max(1).step(0.05);
        if (renderPixelatedPass.pixelAlignedPanning !== undefined) {
            renderPixelatedPass.pixelAlignedPanning = pixelParams.pixelAlignedPanning;
            pixelSub.add(pixelParams, 'pixelAlignedPanning').onChange(val => renderPixelatedPass.pixelAlignedPanning = val);
        }

        visualFolder.add(postProcessingParams, 'bloom').name('Unreal Bloom').onChange(updateComposer);
        const bloomSub = visualFolder.addFolder('Bloom Details');
        bloomSub.add(postProcessingParams, 'bloomThreshold', 0.0, 1.0).onChange(function (value) { bloomPass.threshold = Number(value); });
        bloomSub.add(postProcessingParams, 'bloomStrength', 0.0, 3.0).onChange(function (value) { bloomPass.strength = Number(value); });
        bloomSub.add(postProcessingParams, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(function (value) { bloomPass.radius = Number(value); });

        visualFolder.add(postProcessingParams, 'bokeh').name('Bokeh (DoF)').onChange(updateComposer);
        const bokehSub = visualFolder.addFolder('Bokeh Details');
        bokehSub.add(postProcessingParams, 'bokehFocus', 10.0, 3000.0, 10).onChange(function (value) { bokehPass.uniforms["focus"].value = value; });
        bokehSub.add(postProcessingParams, 'bokehAperture', 0, 0.0001, 0.00001).onChange(function (value) { bokehPass.uniforms["aperture"].value = value; });
        bokehSub.add(postProcessingParams, 'bokehMaxBlur', 0.0, 0.01, 0.001).onChange(function (value) { bokehPass.uniforms["maxblur"].value = value; });

        visualFolder.add(postProcessingParams, 'bleach').name('Bleach Bypass').onChange(updateComposer);
        visualFolder.add(postProcessingParams, 'bleachOpacity', 0, 1).name('Bleach Opacity').onChange(function (value) { bleachPass.uniforms["opacity"].value = value; });

        visualFolder.add(postProcessingParams, 'colorCorrection').name('Color Correction').onChange(updateComposer);
        const colorSub = visualFolder.addFolder('Color Correction');
        const colorParams = {
            pow: 2,
            mul: 1.1
        };
        colorSub.add(colorParams, 'pow', 0, 4).name('Power (Contrast)').onChange(function (val) {
            colorCorrectionPass.uniforms['powRGB'].value.set(val, val, val);
        });
        colorSub.add(colorParams, 'mul', 0, 4).name('Multiply (Brightness)').onChange(function (val) {
            colorCorrectionPass.uniforms['mulRGB'].value.set(val, val, val);
        });

        const artFolder = visualFolder.addFolder('Artistic Filters');

        artFolder.add(postProcessingParams, 'sepia').name('Sepia').onChange(updateComposer);
        artFolder.add(postProcessingParams, 'vignette').name('Vignette').onChange(updateComposer);
        artFolder.add(postProcessingParams, 'vignetteOffset', 0, 2).name('Vignette Offset').onChange(val => vignettePass.uniforms['offset'].value = val);
        artFolder.add(postProcessingParams, 'vignetteDarkness', 0, 2).name('Vignette Darkness').onChange(val => vignettePass.uniforms['darkness'].value = val);

        artFolder.add(postProcessingParams, 'colorify').name('Colorify').onChange(updateComposer);
        artFolder.addColor(postProcessingParams, 'colorifyColor').name('Colorify Hex').onChange(val => colorifyPass.uniforms['color'].value.setHex(val));

        artFolder.add(postProcessingParams, 'blur').name('Blur (H+V)').onChange(updateComposer);
        artFolder.add(postProcessingParams, 'blurSize', 0, 2).name('Blur Size').onChange(val => {
            const pixelRatio = renderer.getPixelRatio();
            const width = container.clientWidth || window.innerWidth;
            const height = container.clientHeight || window.innerHeight;
            hBlurPass.uniforms['h'].value = val / (width * pixelRatio);
            vBlurPass.uniforms['v'].value = val / (height * pixelRatio);
        });

        const retroFolder = visualFolder.addFolder('Retro / Screen Effects');
        retroFolder.add(postProcessingParams, 'simpleBloom').name('Simple Bloom').onChange(updateComposer);
        retroFolder.add(postProcessingParams, 'simpleBloomStrength', 0, 10).name('Simple Bloom Strength').onChange(val => {
            if (simpleBloomPass && simpleBloomPass.copyUniforms) {
                simpleBloomPass.copyUniforms["opacity"].value = val;
            }
        });

        retroFolder.add(postProcessingParams, 'film').name('Film Pass').onChange(updateComposer);
        retroFolder.add(postProcessingParams, 'filmNoise', 0, 1).name('Noise').onChange(val => {
            if (filmPass && filmPass.uniforms && filmPass.uniforms['nIntensity']) filmPass.uniforms['nIntensity'].value = val;
        });
        retroFolder.add(postProcessingParams, 'filmScanlines', 0, 1).name('Scanlines').onChange(val => {
            if (filmPass && filmPass.uniforms && filmPass.uniforms['sIntensity']) filmPass.uniforms['sIntensity'].value = val;
        });
        retroFolder.add(postProcessingParams, 'filmGrayscale').name('Grayscale').onChange(val => {
            if (filmPass && filmPass.uniforms && filmPass.uniforms['grayscale']) filmPass.uniforms['grayscale'].value = val;
        });

        retroFolder.add(postProcessingParams, 'dotScreen').name('Dot Screen').onChange(updateComposer);
        retroFolder.add(postProcessingParams, 'dotScale', 0.1, 5).name('Dot Scale').onChange(val => {
            if (dotScreenPass && dotScreenPass.uniforms && dotScreenPass.uniforms['scale']) dotScreenPass.uniforms['scale'].value = val;
        });

        visualFolder.add(postProcessingParams, 'fxaa').name('FXAA (Antialias)').onChange(updateComposer);
        visualFolder.add(postProcessingParams, 'gamma').name('Gamma Correction').onChange(updateComposer);

        const asciiParams = { enableAscii: false };
        visualFolder.add(asciiParams, 'enableAscii').name('ASCII Mode').onChange((val) => {
            isAsciiActive = val;
            if (val) {
                asciiEffect.domElement.style.display = 'block';
                renderer.domElement.style.display = 'none';
            } else {
                asciiEffect.domElement.style.display = 'none';
                renderer.domElement.style.display = 'block';
            }
        });

        const toneFolder = gui.addFolder('Tone Mapping');
        const toneMappingOptions = {
            'None': THREE.NoToneMapping,
            'Linear': THREE.LinearToneMapping,
            'Reinhard': THREE.ReinhardToneMapping,
            'Cineon': THREE.CineonToneMapping,
            'ACESFilmic': THREE.ACESFilmicToneMapping
        };
        const toneParams = {
            exposure: 1.0,
            toneMapping: 'ACESFilmic'
        };

        toneFolder.add(toneParams, 'toneMapping', Object.keys(toneMappingOptions)).name('Algorithm').onChange(function (value) {
            renderer.toneMapping = toneMappingOptions[value];
        });
        toneFolder.add(toneParams, 'exposure', 0, 2).name('Exposure').onChange(function (value) {
            renderer.toneMappingExposure = value;
        });

        const lightFolder = gui.addFolder('Spotlight Settings');
        const lightParams = {
            color: spotLight.color.getHex(),
            intensity: spotLight.intensity,
            distance: spotLight.distance,
            angle: spotLight.angle,
            penumbra: spotLight.penumbra,
            decay: spotLight.decay,
            focus: spotLight.shadow.focus,
            helper: false
        };

        lightFolder.add(lightConfig, 'animate').name('Animate Light');
        const manualX = lightFolder.add(lightConfig, 'manualX', -20, 20).name('Light X');
        const manualY = lightFolder.add(lightConfig, 'manualY', 0, 20).name('Light Y');
        const manualZ = lightFolder.add(lightConfig, 'manualZ', -20, 20).name('Light Z');

        function updateManualControls() {
            if (!lightConfig.animate) {
                spotLight.position.set(lightConfig.manualX, lightConfig.manualY, lightConfig.manualZ);
            }
        }
        manualX.onChange(updateManualControls);
        manualY.onChange(updateManualControls);
        manualZ.onChange(updateManualControls);

        lightFolder.addColor(lightParams, 'color').onChange(val => spotLight.color.setHex(val));
        lightFolder.add(lightParams, 'intensity', 0, 200).onChange(val => spotLight.intensity = val);
        lightFolder.add(lightParams, 'distance', 50, 400).onChange(val => spotLight.distance = val);
        lightFolder.add(lightParams, 'angle', 0, Math.PI / 3).onChange(val => spotLight.angle = val);
        lightFolder.add(lightParams, 'penumbra', 0, 1).onChange(val => spotLight.penumbra = val);
        lightFolder.add(lightParams, 'decay', 1, 2).onChange(val => spotLight.decay = val);
        lightFolder.add(lightParams, 'focus', 0, 1).onChange(val => spotLight.shadow.focus = val);
        lightFolder.add(lightParams, 'helper').name('Show Helper').onChange(val => lightHelper.visible = val);

        const folder1 = gui.addFolder('Animation Control');
        const folder2 = gui.addFolder('Animation Weights');

        folder1.add(postProcessingParams, 'autoRotate').name('Auto Rotate Camera').onChange(val => {
            controls.autoRotate = val;
        });

        const ikFolder = gui.addFolder('IK & Interaction');
        ikFolder.add(ikConfig, 'enabled').name('Enable IK').onChange(val => {
            transformControls.forEach(tc => {
                tc.enabled = val;
                tc.visible = val;
            });
            if (ikHelper) ikHelper.visible = val && ikConfig.showHelpers;
        });
        ikFolder.add(ikConfig, 'showHelpers').name('Show Skeleton').onChange(val => {
            if (ikHelper && ikConfig.enabled) ikHelper.visible = val;
        });

        panelSettings = {
            'modify time scale': 1.0
        };

        const baseNames = ['None', ...Object.keys(baseActions)];

        for (let i = 0, l = baseNames.length; i !== l; ++i) {
            const name = baseNames[i];
            const settings = baseActions[name];
            panelSettings[name] = function () {
                const currentSettings = baseActions[currentBaseAction];
                const currentAction = currentSettings ? currentSettings.action : null;
                const action = settings ? settings.action : null;

                if (currentAction !== action) {
                    prepareCrossFade(currentAction, action, 0.35);
                }
            };
            crossFadeControls.push(folder1.add(panelSettings, name));
        }

        for (const name of Object.keys(additiveActions)) {
            const settings = additiveActions[name];
            panelSettings[name] = settings.weight;
            folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange(function (weight) {
                if (settings.action) {
                    setWeight(settings.action, weight);
                    settings.weight = weight;
                }
            });
        }

        folder1.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);

        ikFolder.open();
        visualFolder.close();
        lightFolder.close();
        folder1.open();

        crossFadeControls.forEach(function (control) {
            control.setInactive = function () {
                control.domElement.classList.add('control-inactive');
            };
            control.setActive = function () {
                control.domElement.classList.remove('control-inactive');
            };
            const settings = baseActions[control.property];
            if (!settings || !settings.weight) {
                control.setInactive();
            }
        });
    }

    function activateAction(action) {
        const clip = action.getClip();
        const settings = baseActions[clip.name] || additiveActions[clip.name];
        setWeight(action, settings.weight);
        action.play();
    }

    function modifyTimeScale(speed) {
        mixer.timeScale = speed;
    }

    function prepareCrossFade(startAction, endAction, duration) {
        if (currentBaseAction === 'idle' || !startAction || !endAction) {
            executeCrossFade(startAction, endAction, duration);
        } else {
            synchronizeCrossFade(startAction, endAction, duration);
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
                control.setActive();
            } else {
                control.setInactive();
            }
        });
    }

    function synchronizeCrossFade(startAction, endAction, duration) {
        mixer.addEventListener('loop', onLoopFinished);
        function onLoopFinished(event) {
            if (event.action === startAction) {
                mixer.removeEventListener('loop', onLoopFinished);
                executeCrossFade(startAction, endAction, duration);
            }
        }
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
        } else {
            if (startAction) startAction.fadeOut(duration);
        }
    }

    function setWeight(action, weight) {
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
    }

    function onWindowResize() {
        const { width, height } = getSize();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        composer.setSize(width, height);
        const pixelRatio = renderer.getPixelRatio();
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
        asciiEffect.setSize(width, height);
    }

    function animate() {
        if (!container.isConnected) {
            teardown();
            return;
        }
        const delta = clock.getDelta();
        const time = clock.elapsedTime;

        if (spotLight) {
            if (lightConfig.animate) {
                spotLight.position.x = Math.cos(time * 0.5) * 2.5 + 5;
                spotLight.position.z = Math.sin(time * 0.5) * 2.5 + 5;
                lightConfig.manualX = spotLight.position.x;
                lightConfig.manualZ = spotLight.position.z;
            }
            if (lightHelper) lightHelper.update();
        }

        if (filmPass && filmPass.uniforms && filmPass.uniforms.time) {
            filmPass.uniforms.time.value += delta;
        }

        if (!scene || !camera || !renderer) return;
        if (controls) controls.update();
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        if (camera) {
            camera.updateMatrixWorld();
        }
        if (mixer) mixer.update(delta);
        if (ikSolver && ikConfig.enabled) {
            ikSolver.update();
        }

        if (isAsciiActive) {
            asciiEffect.render(scene, camera);
        } else {
            composer.render();
        }

        stats.update();
    }

    function teardown() {
        window.removeEventListener('resize', onWindowResize);
        if (renderer) renderer.setAnimationLoop(null);
        if (controls) controls.dispose();
        if (gui) gui.destroy();
        if (stats && stats.dom && stats.dom.parentNode) stats.dom.parentNode.removeChild(stats.dom);
        if (renderer && renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        if (asciiEffect && asciiEffect.domElement && asciiEffect.domElement.parentNode) asciiEffect.domElement.parentNode.removeChild(asciiEffect.domElement);
        if (container) container.dataset.ready = 'false';
    }
}
