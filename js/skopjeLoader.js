import * as THREE from 'three';

export class SkopjeLoader {
    constructor(scene) {
        this.scene = scene;
        this.buildingMeshes = [];
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
            let height = (7 + Math.random() * 10) * heightFactor;
            if (props.height) height = parseFloat(props.height) * heightFactor || height;
            else if (props["building:levels"]) height = (3 + parseInt(props["building:levels"]) * 3.2) * heightFactor;

            let material;

            if (props.leisure === "park") {
                material = new THREE.MeshLambertMaterial({ color: 0x6ab04c });
                height = 0.2;
            } else if (props.amenity === "parking") {
                material = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
                height = 0.1;
            } else if (props.amenity && [
                "bar", "cafe", "restaurant", "pub", "nightclub", "disco", "cinema", "theatre", "events_venue"
            ].includes(props.amenity.toLowerCase())) {
                const vibrantColors = [0xff4f81, 0xffd700, 0x66ccff, 0xff9933, 0xcc66ff];
                const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
                material = new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: 0.3,
                    roughness: 0.4,
                    metalness: 0.6
                });
            } else if (props.building) {
                const colorMap = {
                    apartments: 0xd1e8e4,
                    house: 0xf6e2b3,
                    school: 0x60a8e9,
                    church: 0xc0a16b,
                    hospital: 0xf18f8f,
                    commercial: 0xc2b2e5,
                    civic: 0xe0d4a8
                };
                const color = colorMap[props.building] || 0xb0b0b0;
                material = new THREE.MeshStandardMaterial({
                    color,
                    roughness: 0.4,
                    metalness: 0.3,
                    map: this.windowTexture
                });
            } else {
                material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
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

            // 🧭 Compute center of building from bounding box
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const buildingCenter = new THREE.Vector3();
            bbox.getCenter(buildingCenter);
            mesh.localToWorld(buildingCenter);
            buildingCenter.y = bbox.max.y -5; // slightly above the top

            // 🎈 Add label (above correct spot)
            if (props.name && props.amenity && [
                "bar", "cafe", "restaurant", "pub", "nightclub", "disco", "cinema", "theatre", "events_venue"
            ].includes(props.amenity.toLowerCase())) {
                const sprite = this._createTextLabel(props.name, material.color);
                sprite.position.copy(buildingCenter);
                sprite.userData = { billboard: true };
                this.scene.add(sprite);
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
        const bubbleWidth = 300;
        const bubbleHeight = 120;
        const cornerRadius = 40;

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeStyle = `#${color.getHexString()}`;
        ctx.lineWidth = 6;

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
        ctx.stroke();

        // Pin
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + bubbleHeight / 2);
        ctx.lineTo(centerX - 15, centerY + bubbleHeight / 2 + 30);
        ctx.lineTo(centerX + 15, centerY + bubbleHeight / 2 + 30);
        ctx.closePath();
        ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.8)`;
        ctx.fill();

        // Text
        ctx.font = 'Bold 48px Arial';
        ctx.fillStyle = `#${color.getHexString()}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, centerX, centerY);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(18, 13, 1);

        return sprite;
    }

    updateLabels(camera) {
        this.scene.children.forEach(obj => {
            if (obj.userData.billboard) obj.lookAt(camera.position);
        });
    }
}
