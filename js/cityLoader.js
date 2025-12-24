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

    // addCars() {
    //     // Add simple low-poly cars on the roads
    //     const carColors = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xfb8c00, 0x8e24aa];

    //     // Place cars along roads
    //     for (let i = 0; i < 15; i++) {
    //         const color = carColors[Math.floor(Math.random() * carColors.length)];
    //         const carMaterial = new THREE.MeshLambertMaterial({ color });

    //         // Random position on a road
    //         const onHorizontalRoad = Math.random() > 0.5;
    //         let x, z;

    //         if (onHorizontalRoad) {
    //             x = (Math.random() - 0.5) * 80;
    //             z = Math.floor((Math.random() - 0.5) * 6) * 20; // Snap to road
    //         } else {
    //             x = Math.floor((Math.random() - 0.5) * 6) * 20; // Snap to road
    //             z = (Math.random() - 0.5) * 80;
    //         }

    //         // Car body
    //         const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    //         const body = new THREE.Mesh(bodyGeometry, carMaterial);
    //         body.position.set(x, 0.5, z);
    //         body.castShadow = true;

    //         // Rotate if on vertical road
    //         if (!onHorizontalRoad) {
    //             body.rotation.y = Math.PI / 2;
    //         }

    //         this.scene.add(body);

    //         // Car roof (smaller box on top)
    //         const roofGeometry = new THREE.BoxGeometry(1.5, 0.8, 2.5);
    //         const roof = new THREE.Mesh(roofGeometry, carMaterial);
    //         roof.position.set(x, 1.4, z);
    //         roof.castShadow = true;

    //         if (!onHorizontalRoad) {
    //             roof.rotation.y = Math.PI / 2;
    //         }

    //         this.scene.add(roof);
    //     }
    // }

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
