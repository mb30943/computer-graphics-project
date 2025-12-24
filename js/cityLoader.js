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
        // Roads are now loaded from GeoJSON data in skopjeLoader
        this.addTrees();
        this.addSkybox();
        if (onLoadComplete) onLoadComplete();
    }

    addGroundPlane() {
        const groundGeometry = new THREE.PlaneGeometry(250, 250);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x8bc34a, // Bright green like in the image
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    addTrees() {
        // Add simple low-poly trees around the scene
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 }); // Brown
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x2e7d32 }); // Dark green

        // Place trees randomly but not on roads
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;

            // Skip if too close to center (where buildings are)
            if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;

            // Trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, 1, z);
            trunk.castShadow = true;
            this.scene.add(trunk);

            // Leaves (cone shape)
            const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 6);
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(x, 3.5, z);
            leaves.castShadow = true;
            this.scene.add(leaves);
        }
    }


    addStreetLamps() {
        // Add street lamps around the perimeter for urban atmosphere
        const lampPositions = [
            // Around the square perimeter
            [-80, 0, -80], [80, 0, -80], [-80, 0, 80], [80, 0, 80],
            [-40, 0, -80], [0, 0, -80], [40, 0, -80],
            [-40, 0, 80], [0, 0, 80], [40, 0, 80],
            [-80, 0, -40], [-80, 0, 0], [-80, 0, 40],
            [80, 0, -40], [80, 0, 0], [80, 0, 40]
        ];

        lampPositions.forEach(pos => {
            this.createStreetLamp(pos[0], pos[1], pos[2]);
        });
    }

    createStreetLamp(x, y, z) {
        const lampGroup = new THREE.Group();

        // Lamp post (tall pole)
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.25, 8, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,
            roughness: 0.7,
            metalness: 0.5
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 4;
        pole.castShadow = true;
        lampGroup.add(pole);

        // Lamp head (light housing)
        const headGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 8.5;
        head.castShadow = true;
        lampGroup.add(head);

        // Glowing light bulb
        const bulbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const bulbMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff4e0,
            emissive: 0xfff4e0,
            emissiveIntensity: 0.8
        });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.y = 8;
        lampGroup.add(bulb);

        // Point light from lamp
        const light = new THREE.PointLight(0xfff4e0, 1.5, 25);
        light.position.y = 8;
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        lampGroup.add(light);

        lampGroup.position.set(x, y, z);
        this.scene.add(lampGroup);
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

    // Get building meshes for collision detection
    getBuildingMeshes() {
        return this.skopjeLoader.buildingMeshes;
    }

    // Get venue positions for event marker placement
    getVenuePositions() {
        return this.skopjeLoader.getVenuePositions();
    }

    dispose() { }
}
