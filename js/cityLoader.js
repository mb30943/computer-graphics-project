import * as THREE from 'three';
import { SkopjeLoader } from './skopjeLoader.js';

export class CityLoader {
    constructor(scene) {
        this.scene = scene;
        this.skopjeLoader = new SkopjeLoader(scene);
    }

    async loadCity(onLoadComplete) {
        await this.skopjeLoader.loadSkopjeBuildings('assets/data/skopje-buildings.geojson');
        this.addGroundPlane();
        this.addSkybox();
        if (onLoadComplete) onLoadComplete();
    }

    addGroundPlane() {
        const groundGeometry = new THREE.PlaneGeometry(250, 250);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    addSkybox() {
        const skyGeometry = new THREE.SphereGeometry(350, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skybox);
    }

    dispose() {}
}
