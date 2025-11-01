// ============================================
// Skopje Loader Module (3D Buildings)
// ============================================
import * as THREE from 'three';

export class SkopjeLoader {
    constructor(scene) {
        this.scene = scene;
    }

    async loadSkopjeBuildings(url) {
        try {
            const response = await fetch(url);
            const geojson = await response.json();

            // Bounds for Debar Maalo (adjust to your area)
            const bounds = {
                minLat: 41.988,
                maxLat: 42.002,
                minLon: 21.419,
                maxLon: 21.437
            };

            // Convert geo coords to XZ positions in Three.js
            const geoToXZ = (lat, lon, width = 50, height = 50) => {
                const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) - 0.5) * width;
                const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) - 0.5) * height;
                return { x, z };
            };

            // Create 3D mesh from polygon coordinates
            const createMeshFromPolygon = (coords) => {
                const shape = new THREE.Shape();
                coords.forEach((coord, i) => {
                    const { x, z } = geoToXZ(coord[1], coord[0]);
                    if (i === 0) shape.moveTo(x, z);
                    else shape.lineTo(x, z);
                });

                // Set building height (can use actual property if available)
                const buildingHeight = Math.random() * 10 + 5; // 5-15 units tall

                const extrudeSettings = {
                    depth: buildingHeight,
                    bevelEnabled: false
                };

                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                const mesh = new THREE.Mesh(geometry, material);

                // ExtrudeGeometry builds upwards along +Y
                mesh.position.y = 0;

                mesh.castShadow = true;
                mesh.receiveShadow = true;

                this.scene.add(mesh);
            };

            // Loop through GeoJSON features
            geojson.features.forEach(feature => {
                if (feature.geometry.type === 'Polygon') {
                    createMeshFromPolygon(feature.geometry.coordinates[0]);
                } else if (feature.geometry.type === 'MultiPolygon') {
                    feature.geometry.coordinates.forEach(polygon => {
                        createMeshFromPolygon(polygon[0]);
                    });
                }
            });

            console.log('Skopje 3D buildings loaded!');
        } catch (error) {
            console.error('Error loading Skopje buildings:', error);
        }
    }
}
