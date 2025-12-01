// ============================================
// FINDZZER 3D EVENT EXPLORER
// Camera Controls Module
// ============================================
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class CameraControls {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.controls = null;
        this.isAnimating = false;
        this.animationSpeed = 1;
        this.isStreetView = false;

        this.setupControls();
    }

    // Setup OrbitControls for camera navigation
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // ============================================
        // CONTROL SETTINGS
        // ============================================

        // Damping - smooth camera movement
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Panning - allow vertical panning
        this.controls.screenSpacePanning = false;

        // Zoom limits
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;

        // Rotation limits
        this.controls.maxPolarAngle = Math.PI / 2.2;  // Prevent camera going below ground

        // Auto rotation (optional)
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;

        // Set initial target (center of scene)
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    // Update controls (call in animation loop)
    update() {
        if (this.controls) {
            this.controls.update();
        }
    }

    // Animate camera to a specific position with easing
    animateToPosition(targetPosition, duration = 2000) {
        if (this.isAnimating) return; // Prevent multiple animations

        this.isAnimating = true;
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function - ease-in-out cubic
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        animate();
    }

    // Focus camera on event marker with offset
    focusOnEvent(eventPosition) {
        const offset = 5;
        const height = 10;

        // Calculate camera position offset from event
        const offsetPosition = new THREE.Vector3(
            eventPosition.x + offset,
            eventPosition.y + height,
            eventPosition.z + offset
        );

        // Animate to the offset position
        this.animateToPosition(offsetPosition, 1500);

        // Update orbit controls target
        this.controls.target.set(eventPosition.x, eventPosition.y, eventPosition.z);
    }

    // Reset camera to initial position
    resetCamera(duration = 1500) {
        const initialPosition = new THREE.Vector3(30, 25, 30);
        this.animateToPosition(initialPosition, duration);
        this.controls.target.set(0, 0, 0);
    }

    // Get current controls instance
    getControls() {
        return this.controls;
    }

    // Enable/disable controls
    setEnabled(enabled) {
        this.controls.enabled = enabled;
    }

    // Toggle auto rotation
    toggleAutoRotate(enabled) {
        this.controls.autoRotate = enabled;
    }

    // Set zoom level
    setZoom(distance) {
        const clampedDistance = Math.max(
            this.controls.minDistance,
            Math.min(distance, this.controls.maxDistance)
        );
        this.camera.position.multiplyScalar(clampedDistance / this.camera.position.length());
    }

    // Get camera position
    getPosition() {
        return this.camera.position.clone();
    }

    // Get camera target
    getTarget() {
        return this.controls.target.clone();
    }

    // Toggle between Orbit (Bird's Eye) and Street View
    toggleViewMode() {
        this.isStreetView = !this.isStreetView;

        if (this.isStreetView) {
            // Switch to Street View
            console.log("Switching to Street View");

            // Animate camera to ground level
            const currentTarget = this.controls.target.clone();
            const streetPosition = new THREE.Vector3(
                currentTarget.x + 10,
                2, // Eye level
                currentTarget.z + 10
            );

            this.animateToPosition(streetPosition, 1500);

            // Adjust controls for street view
            this.controls.maxPolarAngle = Math.PI / 1.8; // Allow looking up slightly more
            this.controls.minDistance = 1;
            this.controls.maxDistance = 30;
            this.controls.enablePan = true;

        } else {
            // Switch to Bird's Eye View
            console.log("Switching to Bird's Eye View");

            // Animate camera back up
            const birdEyePosition = new THREE.Vector3(30, 25, 30);
            this.animateToPosition(birdEyePosition, 1500);

            // Reset controls
            this.controls.maxPolarAngle = Math.PI / 2.2;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 100;
            this.controls.enablePan = false;
            this.controls.target.set(0, 0, 0);
        }

        return this.isStreetView;
    }

    // Dispose controls
    dispose() {
        this.controls.dispose();
    }
}