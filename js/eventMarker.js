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
        this.originalScale = 1;
        this.pulseAmplitude = 0.2;
        
        this.createMarker();
        this.addToScene();
    }

    createMarker() {
        // Base platform - cylindrical foundation
        const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.2, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            metalness: 0.7,
            roughness: 0.3,
            emissive: this.data.color,
            emissiveIntensity: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        base.name = "base";
        this.group.add(base);

        // Glowing sphere marker - main visual element
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.5,
            metalness: 0.5,
            roughness: 0.2,
            wireframe: false
        });
        this.marker = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.marker.position.y = 1.5;
        this.marker.castShadow = true;
        this.marker.receiveShadow = true;
        this.marker.name = "sphere";
        this.group.add(this.marker);

        // Point light for glow effect - attached to sphere
        this.light = new THREE.PointLight(this.data.color, 2, 10);
        this.light.position.y = 1.5;
        this.light.intensity = 2;
        this.group.add(this.light);

        // Outer glow ring - animated torus
        const ringGeometry = new THREE.TorusGeometry(0.7, 0.05, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.data.color,
            transparent: true,
            opacity: 0.6,
            fog: true
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.rotation.x = Math.PI / 2;
        this.ring.position.y = 0.2;
        this.ring.name = "ring";
        this.group.add(this.ring);

        // Secondary ring for extra visual effect
        const ringGeometry2 = new THREE.TorusGeometry(0.55, 0.04, 16, 100);
        const ringMaterial2 = new THREE.MeshBasicMaterial({
            color: this.data.color,
            transparent: true,
            opacity: 0.4
        });
        this.ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
        this.ring2.rotation.x = Math.PI / 2;
        this.ring2.rotation.z = Math.PI / 4;
        this.ring2.position.y = 0.2;
        this.ring2.name = "ring2";
        this.group.add(this.ring2);

        // Cone indicator - points upward from base
        const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.3,
            metalness: 0.6,
            roughness: 0.4
        });
        this.cone = new THREE.Mesh(coneGeometry, coneMaterial);
        this.cone.position.y = 0.6;
        this.cone.castShadow = true;
        this.cone.receiveShadow = true;
        this.cone.name = "cone";
        this.group.add(this.cone);

        // Set group position in world space
        this.group.position.set(
            this.data.position.x,
            this.data.position.y,
            this.data.position.z
        );

        // Store event data reference for raycasting
        this.group.userData = {
            eventData: this.data,
            isEventMarker: true,
            markerInstance: this
        };
    }

    addToScene() {
        this.scene.add(this.group);
    }

    // Animation method - call in render loop for frame-based animations
    animate(time) {
        // Floating animation - vertical oscillation
        const floatHeight = Math.sin(time * 2 + this.data.id) * this.pulseAmplitude;
        this.marker.position.y = 1.5 + floatHeight;
        this.cone.position.y = 0.6 + floatHeight * 0.5;

        // Rotation animation - sphere rotates continuously
        this.marker.rotation.y += 0.01;
        this.marker.rotation.x += 0.005;

        // Pulsating light effect
        const lightIntensity = 2 + Math.sin(time * 3 + this.data.id) * 0.5;
        this.light.intensity = lightIntensity;

        // Ring rotation animations
        this.ring.rotation.z += 0.005;
        this.ring2.rotation.z -= 0.008;

        // Cone rotation
        this.cone.rotation.z += 0.003;

        // Hover effect with smooth scale interpolation
        if (this.isHovered) {
            const targetScale = 1.3;
            this.marker.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            this.light.intensity = Math.min(lightIntensity * 1.5, 4);
            this.cone.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
        } else {
            this.marker.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            this.cone.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
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