// ============================================
// FINDZZER 3D EVENT EXPLORER
// Lighting System Module
// ============================================
import * as THREE from 'three';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.lights = {};
        this.setupLights();
    }

    setupLights() {
        // ============================================
        // AMBIENT LIGHT
        // ============================================
        // Provides soft, overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        ambientLight.name = "ambientLight";
        this.lights.ambient = ambientLight;
        this.scene.add(ambientLight);

        // ============================================
        // DIRECTIONAL LIGHT (Main Light / Sun)
        // ============================================
        // Simulates sunlight with shadow casting
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.name = "directionalLight";
        
        // Shadow configuration for high-quality shadows
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.blurSamples = 8;
        
        this.lights.directional = directionalLight;
        this.scene.add(directionalLight);

        // ============================================
        // HEMISPHERE LIGHT
        // ============================================
        // Creates natural sky/ground coloring
        // Top color: sky blue, Bottom color: ground brown
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.5);
        hemisphereLight.name = "hemisphereLight";
        this.lights.hemisphere = hemisphereLight;
        this.scene.add(hemisphereLight);

        // ============================================
        // FILL LIGHTS (Additional Lights for Depth)
        // ============================================
        // Fill light 1 - Left side
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight1.position.set(-50, 50, -50);
        fillLight1.name = "fillLight1";
        this.lights.fill1 = fillLight1;
        this.scene.add(fillLight1);

        // Fill light 2 - Back side
        const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
        fillLight2.position.set(0, 50, -100);
        fillLight2.name = "fillLight2";
        this.lights.fill2 = fillLight2;
        this.scene.add(fillLight2);

        // ============================================
        // ACCENT LIGHTS (For Event Markers)
        // ============================================
        // These can be used to highlight specific events
        const accentLight = new THREE.DirectionalLight(0x667eea, 0.2);
        accentLight.position.set(30, 30, 30);
        accentLight.name = "accentLight";
        this.lights.accent = accentLight;
        this.scene.add(accentLight);
    }

    // Method to get a specific light
    getLight(name) {
        return this.lights[name] || null;
    }

    // Method to update directional light position (for time-of-day effects)
    updateSunPosition(angle) {
        const radius = 100;
        const sunLight = this.lights.directional;
        sunLight.position.x = Math.cos(angle) * radius;
        sunLight.position.y = Math.sin(angle) * radius + 50;
        sunLight.position.z = Math.sin(angle) * radius;
    }

    // Method to enable/disable shadows
    toggleShadows(enabled) {
        this.lights.directional.castShadow = enabled;
    }

    // Method to adjust ambient light intensity
    setAmbientIntensity(intensity) {
        this.lights.ambient.intensity = intensity;
    }

    // Method to adjust directional light intensity
    setDirectionalIntensity(intensity) {
        this.lights.directional.intensity = intensity;
    }

    // Get all lights
    getAllLights() {
        return this.lights;
    }
}