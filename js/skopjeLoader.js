import * as THREE from 'three';

export class SkopjeLoader {
    constructor(scene) {
        this.scene = scene;
        this.buildingMeshes = [];
        this.cityCenter = new THREE.Vector3(0, 0, 0);
    }

    async loadSkopjeBuildings(url) {
        const response = await fetch(url);
        const geojson = await response.json();

        // Extreme visual scaling for wider roads
        const bounds = {
            minLat: 41.988,
            maxLat: 42.002,
            minLon: 21.419,
            maxLon: 21.437
        };
        const visualWidth = 2400;    // Very wide X dimension for spacing
        const visualHeight = 2400;   // Very wide Z dimension for spacing
        const scaleFootprint = 0.15; // Shrink all building footprints (15% original)
        const heightFactor = 0.5;    // Lower building heights

        const geoToXZ = (lon, lat) => {
            const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) - 0.5) * visualWidth;
            const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) - 0.5) * visualHeight;
            return { x, z };
        };

        // Calculate center for offset
        let sumX = 0, sumZ = 0, count = 0;
        const polygons = [];
        geojson.features.forEach(feature => {
            if (!feature.geometry) return;
            const props = feature.properties || {};
            if (feature.geometry.type === 'Polygon') {
                polygons.push({coords: feature.geometry.coordinates[0], props});
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    polygons.push({coords: polygon[0], props});
                });
            }
        });
        polygons.forEach(({coords}) => {
            coords.forEach(coord => {
                const {x, z} = geoToXZ(coord[0], coord[1]);
                sumX += x;
                sumZ += z;
                count++;
            });
        });
        const centerX = sumX / count, centerZ = sumZ / count;

        polygons.forEach(({coords, props}) => {
            // Height adjustments
            let height = (7 + Math.random() * 10) * heightFactor;
            if (props.height) height = parseFloat(props.height) * heightFactor || height;
            else if (props["building:levels"]) height = (3 + parseInt(props["building:levels"]) * 3.2) * heightFactor;

            // Color map by building type
            const colorMap = {
                apartments: 0xd1e8e4,
                house: 0xf6e2b3,
                school: 0x60a8e9,
                church: 0xc0a16b,
                hospital: 0xf18f8f,
                commercial: 0xc2b2e5
            };
            const color = colorMap[props.building] || 0xaaaaaa;

            const shape = new THREE.Shape();
            coords.forEach((coord, i) => {
                const {x, z} = geoToXZ(coord[0], coord[1]);
                shape[i === 0 ? 'moveTo' : 'lineTo']((x - centerX) * scaleFootprint, (z - centerZ) * scaleFootprint);
            });

            // Build geometry & mesh
            const geometry = new THREE.ExtrudeGeometry(shape, {depth: height, bevelEnabled: false, steps: 1});
            const material = new THREE.MeshStandardMaterial({color, roughness: 0.55});
            const mesh = new THREE.Mesh(geometry, material);

            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.scene.add(mesh);

            // Store info for marker placements
            const centroid = coords.reduce((acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]], [0,0])
                .map(x => x / coords.length);
            const {x, z} = geoToXZ(centroid[0], centroid[1]);
            mesh.userData = {
                centroid: new THREE.Vector3((x - centerX) * scaleFootprint, height, (z - centerZ) * scaleFootprint),
                height,
                color,
                buildingType: props.building,
            };
            this.buildingMeshes.push(mesh);
        });

        this.cityCenter = new THREE.Vector3(0, 0, 0);
        console.log('City is centered! Building count:', this.buildingMeshes.length);
    }

    getRandomBuildings(n = 5) {
        const list = [...this.buildingMeshes].sort(() => Math.random() - 0.5);
        return list.slice(0, n);
    }
}
