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

        // Create a more detailed window texture
        const windowCanvas = document.createElement('canvas');
        windowCanvas.width = 128;
        windowCanvas.height = 128;
        const wCtx = windowCanvas.getContext('2d');

        // Building facade background
        wCtx.fillStyle = '#d4d4d4';
        wCtx.fillRect(0, 0, 128, 128);

        // Draw windows in a grid pattern
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = col * 32 + 8;
                const y = row * 32 + 8;

                // Window frame
                wCtx.fillStyle = '#1a1a1a';
                wCtx.fillRect(x, y, 16, 20);

                // Glass (with random lights on/off)
                if (Math.random() > 0.3) {
                    wCtx.fillStyle = '#ffe680'; // Light on
                } else {
                    wCtx.fillStyle = '#2a4a5a'; // Light off
                }
                wCtx.fillRect(x + 2, y + 2, 12, 16);

                // Window divider
                wCtx.strokeStyle = '#1a1a1a';
                wCtx.lineWidth = 1;
                wCtx.beginPath();
                wCtx.moveTo(x + 8, y + 2);
                wCtx.lineTo(x + 8, y + 18);
                wCtx.stroke();
            }
        }

        this.detailedWindowTexture = new THREE.CanvasTexture(windowCanvas);
        this.detailedWindowTexture.wrapS = this.detailedWindowTexture.wrapT = THREE.RepeatWrapping;
    }

    async loadSkopjeBuildings(url) {
        const response = await fetch(url);
        const geojson = await response.json();

        const bounds = {
            minLat: 41.995,
            maxLat: 42.000,
            minLon: 21.425,
            maxLon: 21.432
        };
        const visualWidth = 1200;
        const visualHeight = 1200;
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

        // Filter buildings to only show those near the center - SMALLER AREA
        const maxDistanceFromCenter = 60; // Reduced from 80 to make city more compact
        const filteredPolygons = polygons.filter(({ coords }) => {
            // Calculate center of this building
            let bldgX = 0, bldgZ = 0;
            coords.forEach(coord => {
                const { x, z } = geoToXZ(coord[0], coord[1]);
                bldgX += (x - centerX) * scaleFootprint;
                bldgZ += (z - centerZ) * scaleFootprint;
            });
            bldgX /= coords.length;
            bldgZ /= coords.length;

            const distanceFromCenter = Math.sqrt(bldgX * bldgX + bldgZ * bldgZ);
            return distanceFromCenter < maxDistanceFromCenter;
        });

        console.log(`Filtered to ${filteredPolygons.length} buildings near center (from ${polygons.length} total)`);

        for (const { coords, props } of filteredPolygons) {
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
                // Vibrant materials for venues with windows
                const vibrantColors = [0xe53935, 0xfdd835, 0x1e88e5, 0xfb8c00, 0x8e24aa];
                const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
                material = new THREE.MeshStandardMaterial({
                    color,
                    map: this.detailedWindowTexture,
                    roughness: 0.6,
                    metalness: 0.1
                });
            } else if (props.building) {
                // Realistic materials for different building types with windows
                const buildingMaterials = {
                    apartments: new THREE.MeshStandardMaterial({
                        color: 0xc8c8c8,
                        map: this.detailedWindowTexture,
                        roughness: 0.7,
                        metalness: 0.2
                    }),
                    house: new THREE.MeshLambertMaterial({
                        color: 0xd4a574,
                        roughness: 0.8
                    }),
                    school: new THREE.MeshStandardMaterial({
                        color: 0xe8e8e8,
                        map: this.detailedWindowTexture,
                        roughness: 0.6,
                        metalness: 0.1
                    }),
                    church: new THREE.MeshLambertMaterial({
                        color: 0xb8a090,
                        roughness: 0.9
                    }),
                    hospital: new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        map: this.detailedWindowTexture,
                        roughness: 0.5,
                        metalness: 0.2
                    }),
                    commercial: new THREE.MeshStandardMaterial({
                        color: 0xb0b0b0,
                        map: this.detailedWindowTexture,
                        roughness: 0.4,
                        metalness: 0.3
                    }),
                    civic: new THREE.MeshStandardMaterial({
                        color: 0xf5f5dc,
                        map: this.detailedWindowTexture,
                        roughness: 0.6,
                        metalness: 0.1
                    })
                };
                material = buildingMaterials[props.building] || new THREE.MeshStandardMaterial({
                    color: 0xd0d0d0,
                    map: this.detailedWindowTexture,
                    roughness: 0.7,
                    metalness: 0.2
                });
            } else {
                // Default realistic material with windows
                material = new THREE.MeshStandardMaterial({
                    color: 0xd0d0d0,
                    map: this.detailedWindowTexture,
                    roughness: 0.7,
                    metalness: 0.2
                });
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

        // Collect building positions for street generation
        const buildingPositions = [];
        this.buildingMeshes.forEach(mesh => {
            buildingPositions.push({
                x: mesh.position.x,
                z: mesh.position.z
            });
        });

        // Generate streets based on building positions
        this.generateStreets(buildingPositions, visualWidth, visualHeight, scaleFootprint);

        // Add environmental elements
        this.addTrees(buildingPositions, visualWidth, visualHeight, scaleFootprint);
        this.addPeople(buildingPositions, visualWidth, visualHeight, scaleFootprint);

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

    // Generate streets based on building positions - SQUARE GRID around perimeter
    generateStreets(buildingPositions, visualWidth, visualHeight, scaleFootprint) {
        const streetWidth = 12;
        const buildingZoneRadius = 60; // Smaller building zone

        // Street material
        const streetMaterial = new THREE.MeshLambertMaterial({
            color: 0x2a2a2a,
            side: THREE.DoubleSide
        });
        const markingMaterial = new THREE.MeshLambertMaterial({
            color: 0xffdd00,
            side: THREE.DoubleSide
        });

        // Create SQUARE grid around buildings
        const innerSize = buildingZoneRadius + 10; // Inner square edge
        const outerSize = buildingZoneRadius + 50; // Outer square edge
        const gridSpacing = 40; // Distance between parallel streets

        // Create perimeter square roads (outer boundary)
        this.createStreetMesh(-outerSize, -outerSize, outerSize, -outerSize, streetWidth, streetMaterial, markingMaterial); // Bottom
        this.createStreetMesh(-outerSize, outerSize, outerSize, outerSize, streetWidth, streetMaterial, markingMaterial); // Top
        this.createStreetMesh(-outerSize, -outerSize, -outerSize, outerSize, streetWidth, streetMaterial, markingMaterial); // Left
        this.createStreetMesh(outerSize, -outerSize, outerSize, outerSize, streetWidth, streetMaterial, markingMaterial); // Right

        // Create inner square roads (around building zone)
        this.createStreetMesh(-innerSize, -innerSize, innerSize, -innerSize, streetWidth, streetMaterial, markingMaterial); // Bottom
        this.createStreetMesh(-innerSize, innerSize, innerSize, innerSize, streetWidth, streetMaterial, markingMaterial); // Top
        this.createStreetMesh(-innerSize, -innerSize, -innerSize, innerSize, streetWidth, streetMaterial, markingMaterial); // Left
        this.createStreetMesh(innerSize, -innerSize, innerSize, innerSize, streetWidth, streetMaterial, markingMaterial); // Right

        // Create connecting streets (horizontal)
        for (let z = -outerSize + gridSpacing; z < outerSize; z += gridSpacing) {
            this.createStreetMesh(-outerSize, z, -innerSize, z, streetWidth, streetMaterial, markingMaterial); // Left side
            this.createStreetMesh(innerSize, z, outerSize, z, streetWidth, streetMaterial, markingMaterial); // Right side
        }

        // Create connecting streets (vertical)
        for (let x = -outerSize + gridSpacing; x < outerSize; x += gridSpacing) {
            this.createStreetMesh(x, -outerSize, x, -innerSize, streetWidth, streetMaterial, markingMaterial); // Bottom side
            this.createStreetMesh(x, innerSize, x, outerSize, streetWidth, streetMaterial, markingMaterial); // Top side
        }

        console.log('✅ Square street grid generated!');
    }

    // Add trees AROUND the perimeter in square pattern
    addTrees(buildingPositions, visualWidth, visualHeight, scaleFootprint) {
        const treeCount = 80;
        const buildingZoneRadius = 60;
        const innerBoundary = buildingZoneRadius + 15;
        const outerBoundary = buildingZoneRadius + 55;

        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const foliageGeometry = new THREE.ConeGeometry(2, 4, 8);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });

        for (let i = 0; i < treeCount; i++) {
            // Random position in square perimeter zone
            const x = (Math.random() - 0.5) * 2 * outerBoundary;
            const z = (Math.random() - 0.5) * 2 * outerBoundary;

            // Only place if in perimeter zone (outside inner boundary)
            const distFromCenter = Math.sqrt(x * x + z * z);
            if (distFromCenter > innerBoundary && distFromCenter < outerBoundary) {
                // Create trunk
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.set(x, 1.5, z);
                trunk.castShadow = true;
                this.scene.add(trunk);

                // Create foliage
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.set(x, 4.5, z);
                foliage.castShadow = true;
                this.scene.add(foliage);
            }
        }

        console.log('✅ Trees added around perimeter!');
    }

    // Add people walking on the square grid streets
    addPeople(buildingPositions, visualWidth, visualHeight, scaleFootprint) {
        const peopleCount = 60;
        const buildingZoneRadius = 60;
        const streetZone = buildingZoneRadius + 15;

        // Different clothing colors for variety
        const clothingColors = [
            0x1a5490, // Blue
            0x8b4513, // Brown
            0x2d5016, // Green
            0x8b0000, // Dark red
            0x4a4a4a, // Dark gray
            0x6b4423, // Tan
            0x000080, // Navy
            0x800080  // Purple
        ];

        for (let i = 0; i < peopleCount; i++) {
            // Random position in perimeter zone
            const x = (Math.random() - 0.5) * 2 * (streetZone + 30);
            const z = (Math.random() - 0.5) * 2 * (streetZone + 30);

            // Only place if outside building zone
            const distFromCenter = Math.sqrt(x * x + z * z);
            if (distFromCenter > streetZone) {
                const personGroup = new THREE.Group();

                // Body (cylinder)
                const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.5, 8);
                const clothingColor = clothingColors[Math.floor(Math.random() * clothingColors.length)];
                const bodyMaterial = new THREE.MeshLambertMaterial({ color: clothingColor });
                const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                body.position.y = 0.75;
                body.castShadow = true;
                personGroup.add(body);

                // Head (sphere)
                const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
                const skinColor = 0xffdbac; // Skin tone
                const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
                const head = new THREE.Mesh(headGeometry, headMaterial);
                head.position.y = 1.75;
                head.castShadow = true;
                personGroup.add(head);

                // Legs (two small cylinders)
                const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
                const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c }); // Dark pants

                const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
                leftLeg.position.set(-0.15, 0.4, 0);
                leftLeg.castShadow = true;
                personGroup.add(leftLeg);

                const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
                rightLeg.position.set(0.15, 0.4, 0);
                rightLeg.castShadow = true;
                personGroup.add(rightLeg);

                // Random rotation
                personGroup.rotation.y = Math.random() * Math.PI * 2;
                personGroup.position.set(x, 0, z);

                this.scene.add(personGroup);
            }
        }

        console.log('✅ People added on streets!');
    }

    // Create a single street segment
    createStreetMesh(startX, startZ, endX, endZ, width, streetMaterial, markingMaterial) {
        // Determine if this is a horizontal or vertical street
        const isHorizontal = Math.abs(endX - startX) > Math.abs(endZ - startZ);

        let length, centerX, centerZ, rotation;

        if (isHorizontal) {
            length = Math.abs(endX - startX);
            centerX = (startX + endX) / 2;
            centerZ = startZ;
            rotation = 0;
        } else {
            length = Math.abs(endZ - startZ);
            centerX = startX;
            centerZ = (startZ + endZ) / 2;
            rotation = Math.PI / 2;
        }

        // Create main street surface
        const streetGeometry = new THREE.PlaneGeometry(length, width);
        const street = new THREE.Mesh(streetGeometry, streetMaterial);
        street.rotation.x = -Math.PI / 2;
        street.rotation.z = rotation;
        street.position.set(centerX, 0.1, centerZ);
        street.receiveShadow = true;
        this.scene.add(street);

        // Create center lane marking
        const markingWidth = 0.3;
        const markingLength = length * 0.9; // Slightly shorter than street
        const markingGeometry = new THREE.PlaneGeometry(markingLength, markingWidth);
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.rotation.z = rotation;
        marking.position.set(centerX, 0.11, centerZ); // Slightly above street
        this.scene.add(marking);
    }
}
