// ============================================
// FINDZZER 3D EVENT EXPLORER
// Scene Manager Module
// ============================================

import * as THREE from 'three';
import { CityLoader } from './cityLoader.js';
import { LightingSystem } from './lighting.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.container = null;
        this.lightingSystem = null;
        this.cityLoader = null;

        this.init();
    }

    // Initialize core scene elements
    init() {
        // Container div to hold WebGL output
        this.container = document.getElementById('canvas-container');
        if (!this.container) {
            console.error('Canvas container not found!');
            return;
        }

        // Create three.js scene with background and fog
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 150);

        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(30, 25, 30);
        this.camera.lookAt(0, 0, 0);

        // Create WebGL renderer with anti-aliasing
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        // Append renderer canvas to container
        this.container.appendChild(this.renderer.domElement);

        // Setup lighting system
        this.lightingSystem = new LightingSystem(this.scene);

        // Setup city loader to load buildings and environment
        this.cityLoader = new CityLoader(this.scene);

        // Window resize listener
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    // Load city assets (buildings, ground, skybox)
    loadCity(callback) {
        this.cityLoader.loadCity(callback);
    }

    // Window resize handler adjusts camera and renderer
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Getter for scene
    getScene() {
        return this.scene;
    }
    getCamera() {
        return this.camera;
    }
    getRenderer() {
        return this.renderer;
    }
    getLightingSystem() {
        return this.lightingSystem;
    }
    getCityLoader() {
        return this.cityLoader;
    }

    // Render current frame
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // Dispose resources and event listeners
    dispose() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
        if (this.cityLoader) this.cityLoader.dispose();
    }
}