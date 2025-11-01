// ============================================
// FINDZZER 3D EVENT EXPLORER
// Scene Manager Module
// ============================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { LightingSystem } from './lighting.js';
import { CityLoader } from './cityLoader.js';

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

    // Initialize scene, camera, and renderer
    init() {
        // ============================================
        // GET CONTAINER
        // ============================================
        this.container = document.getElementById('canvas-container');
        if (!this.container) {
            console.error('Canvas container not found!');
            return;
        }

        // ============================================
        // CREATE SCENE
        // ============================================
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 150);
        this.scene.name = "mainScene";

        // ============================================
        // CREATE CAMERA
        // ============================================
        this.camera = new THREE.PerspectiveCamera(
            60,                                    // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1,                                   // Near clipping plane
            1000                                   // Far clipping plane
        );
        this.camera.position.set(30, 25, 30);
        this.camera.lookAt(0, 0, 0);

        // ============================================
        // CREATE RENDERER
        // ============================================
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
        
        // Add renderer to container
        this.container.appendChild(this.renderer.domElement);

        // ============================================
        // SETUP LIGHTING
        // ============================================
        this.lightingSystem = new LightingSystem(this.scene);

        // ============================================
        // SETUP CITY
        // ============================================
        this.cityLoader = new CityLoader(this.scene);

        // ============================================
        // EVENT LISTENERS
        // ============================================
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    // Load city environment
    loadCity(callback) {
        this.cityLoader.loadCity(callback);
    }

    // Handle window resize events
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(width, height);
    }

    // Get scene
    getScene() {
        return this.scene;
    }

    // Get camera
    getCamera() {
        return this.camera;
    }

    // Get renderer
    getRenderer() {
        return this.renderer;
    }

    // Get lighting system
    getLightingSystem() {
        return this.lightingSystem;
    }

    // Get city loader
    getCityLoader() {
        return this.cityLoader;
    }

    // Render the scene
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // Dispose resources
    dispose() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
        this.cityLoader.dispose();
    }
}