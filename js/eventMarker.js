// ============================================
// FINDZZER 3D EVENT EXPLORER
// Event Marker Class
// ============================================

// Event Marker Class - Creates hierarchical 3D event markers
import * as THREE from 'three';

export class EventMarker {
    constructor(eventData, scene) {
        this.data = eventData;
        this.scene = scene;
        this.group = new THREE.Group();
        this.marker = null;
        this.light = null;
        this.isHovered = false;
        this.isSelected = false;
        this.originalScale = 3; // Increased from 1 for better visibility
        this.pulseAmplitude = 0.3; // Increased animation amplitude

        this.createMarker();
        this.addToScene();
    }

    createMarker() {
        // TALL VERTICAL PIN DESIGN for visibility from all angles

        // Base platform - larger and more visible
        const baseGeometry = new THREE.CylinderGeometry(1.5, 2, 0.4, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            metalness: 0.7,
            roughness: 0.3,
            emissive: this.data.color,
            emissiveIntensity: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        base.name = "base";
        this.group.add(base);

        // Tall pin shaft - makes it visible from bird's eye view
        const pinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
        const pinMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            metalness: 0.6,
            roughness: 0.4,
            emissive: this.data.color,
            emissiveIntensity: 0.2
        });
        this.pinShaft = new THREE.Mesh(pinGeometry, pinMaterial);
        this.pinShaft.position.y = 4.5; // Tall vertical position
        this.pinShaft.castShadow = true;
        this.pinShaft.name = "pinShaft";
        this.group.add(this.pinShaft);

        // Large glowing sphere at top - main visual element
        const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.6,
            metalness: 0.5,
            roughness: 0.2
        });
        this.marker = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.marker.position.y = 9; // Top of the pin
        this.marker.castShadow = true;
        this.marker.receiveShadow = true;
        this.marker.name = "sphere";
        this.group.add(this.marker);

        // Bright point light for glow effect
        this.light = new THREE.PointLight(this.data.color, 3, 20);
        this.light.position.y = 9;
        this.light.intensity = 3;
        this.group.add(this.light);

        // Large outer glow ring at base - visible from above
        const ringGeometry = new THREE.TorusGeometry(2, 0.15, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.data.color,
            transparent: true,
            opacity: 0.7
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.rotation.x = Math.PI / 2;
        this.ring.position.y = 0.3;
        this.ring.name = "ring";
        this.group.add(this.ring);

        // Secondary ring for extra visual effect
        const ringGeometry2 = new THREE.TorusGeometry(1.5, 0.12, 16, 100);
        const ringMaterial2 = new THREE.MeshBasicMaterial({
            color: this.data.color,
            transparent: true,
            opacity: 0.5
        });
        this.ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
        this.ring2.rotation.x = Math.PI / 2;
        this.ring2.rotation.z = Math.PI / 4;
        this.ring2.position.y = 0.3;
        this.ring2.name = "ring2";
        this.group.add(this.ring2);

        // Cone at base pointing upward
        const coneGeometry = new THREE.ConeGeometry(0.8, 2, 32);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.3,
            metalness: 0.6,
            roughness: 0.4
        });
        this.cone = new THREE.Mesh(coneGeometry, coneMaterial);
        this.cone.position.y = 1.5;
        this.cone.castShadow = true;
        this.cone.receiveShadow = true;
        this.cone.name = "cone";
        this.group.add(this.cone);

        // Text Label (Sprite) - larger and more visible
        this.label = this.createTextLabel(this.data.name);
        this.label.position.y = 11; // Above the sphere
        this.label.scale.set(0, 0, 0); // Initially hidden
        this.label.name = "label";
        this.group.add(this.label);

        // Set group position in world space
        this.group.position.set(
            this.data.position.x,
            this.data.position.y + 2, // Slight elevation
            this.data.position.z
        );

        // Store event data reference for raycasting
        this.group.userData = {
            eventData: this.data,
            isEventMarker: true,
            markerInstance: this
        };
    }

    createTextLabel(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 48;
        const fontFace = 'Arial';

        // Measure text width
        context.font = `Bold ${fontSize}px ${fontFace}`;
        const textWidth = context.measureText(text).width;

        // Resize canvas to fit text
        canvas.width = textWidth + 40;
        canvas.height = fontSize + 40;

        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.strokeStyle = `#${new THREE.Color(this.data.color).getHexString()}`;
        context.lineWidth = 4;

        // Rounded rectangle
        const x = 2, y = 2, w = canvas.width - 4, h = canvas.height - 4, r = 10;
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
        context.fill();
        context.stroke();

        // Draw text
        context.font = `Bold ${fontSize}px ${fontFace}`;
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(material);
        // Larger scale for better visibility
        const scale = 5;
        sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);

        return sprite;
    }

    addToScene() {
        this.scene.add(this.group);
    }

    // Animation method - call in render loop for frame-based animations
    animate(time) {
        // Floating animation - vertical oscillation
        const floatHeight = Math.sin(time * 2 + this.data.id) * this.pulseAmplitude;
        this.marker.position.y = 9 + floatHeight;
        this.pinShaft.position.y = 4.5 + floatHeight * 0.3;
        this.cone.position.y = 1.5 + floatHeight * 0.2;

        // Rotation animation - sphere rotates continuously
        this.marker.rotation.y += 0.01;
        this.marker.rotation.x += 0.005;

        // Pulsating light effect - brighter
        const lightIntensity = 3 + Math.sin(time * 3 + this.data.id) * 1;
        this.light.intensity = lightIntensity;
        this.light.position.y = 9 + floatHeight;

        // Ring rotation animations
        this.ring.rotation.z += 0.005;
        this.ring2.rotation.z -= 0.008;

        // Pin shaft subtle rotation
        this.pinShaft.rotation.y += 0.002;

        // Hover effect with smooth scale interpolation
        if (this.isHovered) {
            const targetScale = 1.4;
            this.marker.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            this.light.intensity = Math.min(lightIntensity * 1.5, 6);
            this.cone.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);

            // Show label
            const labelTargetScale = 5;
            const aspectRatio = this.label.material.map.image.width / this.label.material.map.image.height;
            this.label.scale.lerp(new THREE.Vector3(labelTargetScale * aspectRatio, labelTargetScale, 1), 0.15);
            this.label.position.y = 11 + floatHeight;
        } else {
            this.marker.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            this.cone.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

            // Hide label
            this.label.scale.lerp(new THREE.Vector3(0, 0, 0), 0.2);
        }
    }

    // Set hover state
    setHovered(hovered) {
        this.isHovered = hovered;
    }

    // Set selection state
    setSelected(selected) {
        this.isSelected = selected;
        if (selected) {
            this.marker.material.emissiveIntensity = 1;
        } else {
            this.marker.material.emissiveIntensity = 0.5;
        }
    }

    // Get the group for raycasting
    getGroup() {
        return this.group;
    }

    // Get event data
    getEventData() {
        return this.data;
    }

    // Dispose of resources
    dispose() {
        this.marker.geometry.dispose();
        this.marker.material.dispose();
        this.ring.geometry.dispose();
        this.ring.material.dispose();
        this.ring2.geometry.dispose();
        this.ring2.material.dispose();
        this.base.geometry.dispose();
        this.base.material.dispose();
        this.cone.geometry.dispose();
        this.cone.material.dispose();
        this.scene.remove(this.group);
    }
}