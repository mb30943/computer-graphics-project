// ============================================
// FINDZZER 3D EVENT EXPLORER
// City Loader Module
// ============================================
import * as THREE from 'three'
import { SkopjeLoader } from './skopjeLoader.js';

export class CityLoader {
    constructor(scene) {
        this.scene = scene;
        this.skopjeLoader = new SkopjeLoader(scene);
    }

    async loadCity(onLoadComplete) {
        // Try to load Skopje buildings from your GeoJSON file
        await this.skopjeLoader.loadSkopjeBuildings('assets/data/skopje-buildings.geojson');

        // Optionally, you can add generic elements (ground, skybox, etc.)
        this.addGroundPlane();
        this.addSkybox();

        // Callback for when loading is complete
        if (onLoadComplete) onLoadComplete();
    }

    addGroundPlane() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = "ground";
        this.scene.add(ground);
    }

    addSkybox() {
        const skyGeometry = new THREE.SphereGeometry(300, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb, // light blue
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        skybox.name = "skybox";
        this.scene.add(skybox);
    }

    // Use this for any additional disposal/cleanup
    dispose() {
        // Optionally remove children or dispose resources
    }
}