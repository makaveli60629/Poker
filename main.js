import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { World } from './world.js';
import { Controls } from './controls.js';

const Core = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000),
    renderer: new THREE.WebGLRenderer({ antialias: true, alpha: false }),
    playerGroup: new THREE.Group(),

    init() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        
        // Force a bright background so we know it's not a black screen crash
        this.scene.background = new THREE.Color(0xffffff);

        document.body.appendChild(this.renderer.domElement);
        
        // Setup VR Button with full permissions
        const vrButton = VRButton.createButton(this.renderer, {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hand-tracking']
        });
        document.body.appendChild(vrButton);

        this.playerGroup.add(this.camera);
        this.scene.add(this.playerGroup);

        // Load Modules
        World.build(this.scene);
        Controls.init(this.renderer, this.scene, this.playerGroup);

        this.renderer.setAnimationLoop(this.render.bind(this));
    },

    render() {
        Controls.update(this.renderer, this.camera, this.playerGroup);
        this.renderer.render(this.scene, this.camera);
    }
};

// Start the core
Core.init();
