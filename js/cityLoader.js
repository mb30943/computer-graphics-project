// ============================================
// FINDZZER 3D EVENT EXPLORER
// City Loader Module
// ============================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CityLoader {
    constructor(scene) {
        this.scene = scene;
        this.cityModel = null;
        this.buildings = [];
    }

    // Load 3D city model from external source
    loadCity(onLoadComplete) {
        const loader = new THREE.GLTFLoader();
        
        // Option 1: Load from external GLTF model (uncomment if you have a city model)
        /*
        loader.load(
            'assets/models/city.glb',
            (gltf) => {
                this.cityModel = gltf.scene;
                this.cityModel.scale.set(1, 1, 1);
                this.cityModel.position.set(0, 0, 0);
                
                // Enable shadows on all meshes
                this.cityModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.side = THREE.DoubleSide;
                    }
                });
                
                this.scene.add(this.cityModel);
                if (onLoadComplete) onLoadComplete();
            },
            (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log('Loading: ' + percent + '%');
            },
            (error) => {
                console.error('Error loading city model:', error);
                this.createPlaceholderCity();
                if (onLoadComplete) onLoadComplete();
            }
        );
        */

        // Option 2: Create placeholder city (procedural generation)
        this.createPlaceholderCity();
        if (onLoadComplete) onLoadComplete();
    }

    // Create a simple procedural city environment
    createPlaceholderCity() {
        // ============================================
        // GROUND PLANE
        // ============================================
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d2d2d,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = "ground";
        this.scene.add(ground);

        // ============================================
        // CREATE BUILDINGS
        // ============================================
        this.createBuildings();

        // ============================================
        // GRID HELPER (Visual Reference)
        // ============================================
        const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x333333);
        gridHelper.name = "gridHelper";
        this.scene.add(gridHelper);

        // ============================================
        // SKYBOX (Simple Blue Sky)
        // ============================================
        this.createSkybox();
    }

    // Create multiple buildings with varied heights and positions
    createBuildings() {
        const buildingPositions = [
            { x: -20, z: -20, width: 8, height: 15, depth: 8, color: 0x606060 },
            { x: 20, z: -20, width: 6, height: 20, depth: 6, color: 0x707070 },
            { x: -25, z: 20, width: 7, height: 18, depth: 7, color: 0x686868 },
            { x: 25, z: 20, width: 9, height: 12, depth: 9, color: 0x787878 },
            { x: 0, z: -30, width: 10, height: 25, depth: 10, color: 0x666666 },
            { x: -15, z: 0, width: 5, height: 10, depth: 5, color: 0x595959 },
            { x: 15, z: 5, width: 6, height: 14, depth: 6, color: 0x6b6b6b },
            { x: -30, z: 10, width: 7, height: 16, depth: 7, color: 0x626262 },
            { x: 30, z: -10, width: 8, height: 18, depth: 8, color: 0x747474 },
            { x: 5, z: 25, width: 6, height: 12, depth: 6, color: 0x6d6d6d },
            { x: -10, z: -35, width: 5, height: 14, depth: 5, color: 0x5f5f5f },
            { x: 10, z: -35, width: 5, height: 14, depth: 5, color: 0x5f5f5f }
        ];

        buildingPositions.forEach((pos) => {
            this.createBuilding(
                pos.x,
                pos.z,
                pos.width,
                pos.height,
                pos.depth,
                pos.color
            );
        });
    }

    // Create individual building with specified dimensions
    createBuilding(x, z, width, height, depth, baseColor) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create varied material
        const randomColorVariation = baseColor + Math.random() * 0x222222;
        const material = new THREE.MeshStandardMaterial({
            color: randomColorVariation,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        building.name = `building_${this.buildings.length}`;
        
        // Add windows to the building
        this.addWindows(building, width, height, depth);
        
        // Add rooftop details
        this.addRooftop(building, width, height, depth);
        
        this.scene.add(building);
        this.buildings.push(building);
    }

    // Add window meshes to buildings
    addWindows(building, width, height, depth) {
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff99,
            emissive: 0xffff99,
            emissiveIntensity: 0.5
        });

        const windowSize = 0.3;
        const windowSpacing = 1.5;

        // Front windows
        for (let y = 2; y < height - 1; y += windowSpacing) {
            for (let x = -width / 2 + 1; x < width / 2; x += windowSpacing) {
                const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(x, y - height / 2, depth / 2 + 0.05);
                building.add(windowMesh);

                // Back windows
                const windowMesh2 = windowMesh.clone();
                windowMesh2.position.set(x, y - height / 2, -depth / 2 - 0.05);
                building.add(windowMesh2);
            }
        }

        // Side windows
        for (let y = 2; y < height - 1; y += windowSpacing) {
            for (let z = -depth / 2 + 1; z < depth / 2; z += windowSpacing) {
                const windowGeometry = new THREE.BoxGeometry(0.1, windowSize, windowSize);
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(width / 2 + 0.05, y - height / 2, z);
                building.add(windowMesh);

                const windowMesh2 = windowMesh.clone();
                windowMesh2.position.set(-width / 2 - 0.05, y - height / 2, z);
                building.add(windowMesh2);
            }
        }
    }

    // Add rooftop details
    addRooftop(building, width, height, depth) {
        // Rooftop edge light
        const roofGeometry = new THREE.BoxGeometry(width + 0.2, 0.3, depth + 0.2);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            emissive: 0x222222,
            emissiveIntensity: 0.2,
            roughness: 0.8,
            metalness: 0.1
        });
        const rooftop = new THREE.Mesh(roofGeometry, roofMaterial);
        rooftop.position.y = height / 2 + 0.15;
        rooftop.castShadow = true;
        rooftop.receiveShadow = true;
        building.add(rooftop);
    }

    // Create a simple skybox
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        skybox.name = "skybox";
        this.scene.add(skybox);
    }

    // Get all buildings
    getBuildings() {
        return this.buildings;
    }

    // Get building count
    getBuildingCount() {
        return this.buildings.length;
    }

    // Dispose of resources
    dispose() {
        this.buildings.forEach(building => {
            building.geometry.dispose();
            building.material.dispose();
        });
        this.buildings = [];
    }
}