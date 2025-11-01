// ============================================
// Skopje Loader Module (3D Buildings from GeoJSON)
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

            // Bounds for your area (adjust as needed)
            const bounds = {
                minLat: 41.988,
                maxLat: 42.002,
                minLon: 21.419,
                maxLon: 21.437
            };

            // Correct mapping: longitude (X), latitude (Z)
            const geoToXZ = (lon, lat, width = 50, height = 50) => {
                const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) - 0.5) * width;
                const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) - 0.5) * height;
                return { x, z };
            };

            // 3D mesh from polygon coordinates (FIXED ORDER)
            const createMeshFromPolygon = (coords) => {
                const shape = new THREE.Shape();
                coords.forEach((coord, i) => {
                    // FIX: Pass lon, lat order!
                    const { x, z } = geoToXZ(coord[0], coord[1]);
                    if (i === 0) shape.moveTo(x, z);
                    else shape.lineTo(x, z);
                });

                // Use a random or property-driven height
                const buildingHeight = Math.random() * 10 + 5;

                const extrudeSettings = {
                    depth: buildingHeight,
                    bevelEnabled: false
                };

                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                const mesh = new THREE.Mesh(geometry, material);

                // Important: extruded shape "depth" grows in the -Y direction by default,
                // set so buildings rise upwards from ground
                mesh.rotation.x = -Math.PI / 2; // rotate geometry from Z-up to Y-up
                mesh.position.y = 0; // ground level

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

            console.log('Skopje 3D buildings loaded (horizontal orientation)!');
        } catch (error) {
            console.error('Error loading Skopje buildings:', error);
        }
    }
}
