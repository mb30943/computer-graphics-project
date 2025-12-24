import * as THREE from 'three';

export class SkopjeLoader {
    constructor(scene) {
        this.scene = scene;
        this.buildingMeshes = [];
        this.venuePositions = []; // Track positions of cafes, bars, restaurants
        this.cityCenter = new THREE.Vector3(0, 0, 0);

        // Procedural window texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 64, 64);
        for (let y = 8; y < 64; y += 16) {
            for (let x = 8; x < 64; x += 16) {
                if (Math.random() > 0.5) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(x, y, 6, 8);
                }
            }
        }
        this.windowTexture = new THREE.CanvasTexture(canvas);
        this.windowTexture.wrapS = this.windowTexture.wrapT = THREE.RepeatWrapping;
        this.windowTexture.repeat.set(4, 2);
    }

    async loadSkopjeBuildings(url) {
        const response = await fetch(url);
        const geojson = await response.json();

        const bounds = {
            minLat: 41.988,
            maxLat: 42.002,
            minLon: 21.419,
            maxLon: 21.437
        };
        const visualWidth = 2400;
        const visualHeight = 2400;
        const scaleFootprint = 0.15;
        const heightFactor = 0.5;

        const geoToXZ = (lon, lat) => {
            const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) - 0.5) * visualWidth;
            const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) - 0.5) * visualHeight;
            return { x, z };
        };

        let sumX = 0, sumZ = 0, count = 0;
        const polygons = [];

        geojson.features.forEach(feature => {
            if (!feature.geometry) return;
            const props = feature.properties || {};
            if (feature.geometry.type === 'Polygon') {
                polygons.push({ coords: feature.geometry.coordinates[0], props });
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    polygons.push({ coords: polygon[0], props });
                });
            }
        });

        polygons.forEach(({ coords }) => {
            coords.forEach(coord => {
                const { x, z } = geoToXZ(coord[0], coord[1]);
                sumX += x;
                sumZ += z;
                count++;
            });
        });
        const centerX = sumX / count, centerZ = sumZ / count;

        for (const { coords, props } of polygons) {
            // Check if this is a highway/road instead of a building
            if (props.highway) {
                // This is a road - create it as a flat strip
                const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x424242 });

                // Create road shape from coordinates
                const roadShape = new THREE.Shape();
                coords.forEach((coord, i) => {
                    const { x, z } = geoToXZ(coord[0], coord[1]);
                    roadShape[i === 0 ? 'moveTo' : 'lineTo']((x - centerX) * scaleFootprint, (z - centerZ) * scaleFootprint);
                });

                // Extrude road slightly above ground
                const roadGeometry = new THREE.ExtrudeGeometry(roadShape, { depth: 0.05, bevelEnabled: false });
                const road = new THREE.Mesh(roadGeometry, roadMaterial);
                road.rotation.x = -Math.PI / 2;
                road.position.y = 0.05;
                road.receiveShadow = true;
                this.scene.add(road);
                continue; // Skip to next feature (don't create as building)
            }

            let height = (7 + Math.random() * 10) * heightFactor;
            if (props.height) height = parseFloat(props.height) * heightFactor || height;
            else if (props["building:levels"]) height = (3 + parseInt(props["building:levels"]) * 3.2) * heightFactor;

            let material;

            if (props.leisure === "park") {
                // Bright green for parks
                material = new THREE.MeshLambertMaterial({ color: 0x7cb342 });
                height = 0.2;
            } else if (props.amenity === "parking") {
                // Dark gray for parking
                material = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.8 });
                height = 0.1;
            } else if (props.amenity && [
                "bar", "cafe", "restaurant", "pub", "nightclub", "disco", "cinema", "theatre", "events_venue"
            ].includes(props.amenity.toLowerCase())) {
                // Vibrant flat colors for venues (red, yellow, blue)
                const vibrantColors = [0xe53935, 0xfdd835, 0x1e88e5, 0xfb8c00, 0x8e24aa];
                const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
                material = new THREE.MeshLambertMaterial({ color });
            } else if (props.building) {
                // Simple flat colors for different building types
                const colorMap = {
                    apartments: 0x90a4ae,    // Light blue-gray
                    house: 0xbcaaa4,         // Light brown
                    school: 0x64b5f6,        // Light blue
                    church: 0xa1887f,        // Brown
                    hospital: 0xef5350,      // Red
                    commercial: 0x9575cd,    // Purple
                    civic: 0xfff176          // Yellow
                };
                const color = colorMap[props.building] || 0xb0bec5; // Default gray
                material = new THREE.MeshLambertMaterial({ color });
            } else {
                // Default light gray
                material = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
            }

            const shape = new THREE.Shape();
            coords.forEach((coord, i) => {
                const { x, z } = geoToXZ(coord[0], coord[1]);
                shape[i === 0 ? 'moveTo' : 'lineTo']((x - centerX) * scaleFootprint, (z - centerZ) * scaleFootprint);
            });

            const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.buildingMeshes.push(mesh);

            // 🧭 Calculate label position
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const buildingCenter = new THREE.Vector3();
            bbox.getCenter(buildingCenter);
            mesh.localToWorld(buildingCenter);

            // Position label clearly on top of the building
            buildingCenter.y = height + 3.5; // Higher offset for clear visibility

            // Add label for cafes, bars, restaurants, etc.
            if (props.name && props.amenity && [
                "bar", "cafe", "restaurant", "pub", "nightclub", "disco", "cinema", "theatre", "events_venue"
            ].includes(props.amenity.toLowerCase())) {

                // Create and add venue label
                const sprite = this._createTextLabel(props.name, material.color);
                sprite.position.copy(buildingCenter);
                sprite.userData = { billboard: true };
                this.scene.add(sprite);

                // Store venue position for event markers
                this.venuePositions.push({
                    name: props.name,
                    amenity: props.amenity,
                    position: {
                        x: buildingCenter.x,
                        y: 0, // Ground level for event markers
                        z: buildingCenter.z
                    },
                    height: height
                });
            }
        }

        console.log('✅ City loaded! Buildings:', this.buildingMeshes.length);
    }

    _createTextLabel(text, color = new THREE.Color(0xffffff)) {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = size / 2;
        const bubbleWidth = 360;
        const bubbleHeight = 110;
        const cornerRadius = 55;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Outer glow effect for visibility
        ctx.shadowColor = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.6)`;
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Vibrant gradient background
        const gradient = ctx.createLinearGradient(
            centerX - bubbleWidth / 2,
            centerY - bubbleHeight / 2,
            centerX + bubbleWidth / 2,
            centerY + bubbleHeight / 2
        );

        // Create vibrant gradient
        const r = Math.min(255, color.r * 255 + 60);
        const g = Math.min(255, color.g * 255 + 60);
        const b = Math.min(255, color.b * 255 + 60);

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.98)`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.95)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.98)`);

        // Draw floating badge (no pin)
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX - bubbleWidth / 2 + cornerRadius, centerY - bubbleHeight / 2);
        ctx.lineTo(centerX + bubbleWidth / 2 - cornerRadius, centerY - bubbleHeight / 2);
        ctx.quadraticCurveTo(centerX + bubbleWidth / 2, centerY - bubbleHeight / 2, centerX + bubbleWidth / 2, centerY - bubbleHeight / 2 + cornerRadius);
        ctx.lineTo(centerX + bubbleWidth / 2, centerY + bubbleHeight / 2 - cornerRadius);
        ctx.quadraticCurveTo(centerX + bubbleWidth / 2, centerY + bubbleHeight / 2, centerX + bubbleWidth / 2 - cornerRadius, centerY + bubbleHeight / 2);
        ctx.lineTo(centerX - bubbleWidth / 2 + cornerRadius, centerY + bubbleHeight / 2);
        ctx.quadraticCurveTo(centerX - bubbleWidth / 2, centerY + bubbleHeight / 2, centerX - bubbleWidth / 2, centerY + bubbleHeight / 2 - cornerRadius);
        ctx.lineTo(centerX - bubbleWidth / 2, centerY - bubbleHeight / 2 + cornerRadius);
        ctx.quadraticCurveTo(centerX - bubbleWidth / 2, centerY - bubbleHeight / 2, centerX - bubbleWidth / 2 + cornerRadius, centerY - bubbleHeight / 2);
        ctx.closePath();
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Premium border
        const borderGradient = ctx.createLinearGradient(
            centerX - bubbleWidth / 2,
            centerY - bubbleHeight / 2,
            centerX + bubbleWidth / 2,
            centerY + bubbleHeight / 2
        );
        borderGradient.addColorStop(0, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`);
        borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        borderGradient.addColorStop(1, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`);

        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - bubbleWidth / 2 + cornerRadius + 8, centerY - bubbleHeight / 2 + 5);
        ctx.lineTo(centerX + bubbleWidth / 2 - cornerRadius - 8, centerY - bubbleHeight / 2 + 5);
        ctx.stroke();

        // Modern text
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Strong text shadow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.fillText(text, centerX, centerY);

        // Shine effect
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        const shineGradient = ctx.createLinearGradient(
            centerX, centerY - bubbleHeight / 2,
            centerX, centerY - bubbleHeight / 2 + 35
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = shineGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - bubbleWidth / 2 + cornerRadius, centerY - bubbleHeight / 2);
        ctx.lineTo(centerX + bubbleWidth / 2 - cornerRadius, centerY - bubbleHeight / 2);
        ctx.quadraticCurveTo(centerX + bubbleWidth / 2, centerY - bubbleHeight / 2, centerX + bubbleWidth / 2, centerY - bubbleHeight / 2 + cornerRadius);
        ctx.lineTo(centerX + bubbleWidth / 2, centerY - bubbleHeight / 2 + 35);
        ctx.lineTo(centerX - bubbleWidth / 2, centerY - bubbleHeight / 2 + 35);
        ctx.lineTo(centerX - bubbleWidth / 2, centerY - bubbleHeight / 2 + cornerRadius);
        ctx.quadraticCurveTo(centerX - bubbleWidth / 2, centerY - bubbleHeight / 2, centerX - bubbleWidth / 2 + cornerRadius, centerY - bubbleHeight / 2);
        ctx.closePath();
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            opacity: 1.0
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(10, 10, 1); // Larger for better visibility

        return sprite;
    }

    updateLabels(camera) {
        this.scene.children.forEach(obj => {
            if (obj.userData.billboard) obj.lookAt(camera.position);
        });
    }

    // Get all venue positions for event marker placement
    getVenuePositions() {
        return this.venuePositions;
    }

    // Get building meshes for collision detection
    getBuildingMeshes() {
        return this.buildingMeshes;
    }
}
