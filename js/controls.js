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

        // Keyboard movement state
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        this.moveSpeed = 0.3;

        this.setupControls();
        this.setupKeyboardControls();
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

    // Setup keyboard controls for WASD movement
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.isStreetView) return; // Only allow movement in street view

            switch (e.key.toLowerCase()) {
                case 'w':
                    this.moveState.forward = true;
                    break;
                case 's':
                    this.moveState.backward = true;
                    break;
                case 'a':
                    this.moveState.left = true;
                    break;
                case 'd':
                    this.moveState.right = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.moveState.forward = false;
                    break;
                case 's':
                    this.moveState.backward = false;
                    break;
                case 'a':
                    this.moveState.left = false;
                    break;
                case 'd':
                    this.moveState.right = false;
                    break;
            }
        });
    }

    // Update controls (call in animation loop)
    update() {
        if (this.controls) {
            // Handle keyboard movement in street view
            if (this.isStreetView) {
                const direction = new THREE.Vector3();
                const right = new THREE.Vector3();

                // Get camera direction (forward/backward)
                this.camera.getWorldDirection(direction);
                direction.y = 0; // Keep movement horizontal
                direction.normalize();

                // Get right vector (left/right strafe)
                right.crossVectors(this.camera.up, direction).normalize();

                // Apply movement based on key states
                if (this.moveState.forward) {
                    this.camera.position.addScaledVector(direction, this.moveSpeed);
                }
                if (this.moveState.backward) {
                    this.camera.position.addScaledVector(direction, -this.moveSpeed);
                }
                if (this.moveState.left) {
                    this.camera.position.addScaledVector(right, this.moveSpeed);
                }
                if (this.moveState.right) {
                    this.camera.position.addScaledVector(right, -this.moveSpeed);
                }

                // Update orbit controls target to follow camera
                if (this.moveState.forward || this.moveState.backward ||
                    this.moveState.left || this.moveState.right) {
                    this.controls.target.copy(this.camera.position).add(direction);
                }
            }

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
            console.log("Switching to Street View - Use WASD to move and mouse to look around!");

            // Animate camera to ground level
            const currentTarget = this.controls.target.clone();
            const streetPosition = new THREE.Vector3(
                currentTarget.x + 10,
                2, // Eye level
                currentTarget.z + 10
            );

            this.animateToPosition(streetPosition, 1500);

            // Adjust controls for first-person street view
            this.controls.maxPolarAngle = Math.PI / 1.5; // Allow looking up more
            this.controls.minPolarAngle = Math.PI / 3; // Prevent looking too far down
            this.controls.minDistance = 0.1; // Very close for first-person feel
            this.controls.maxDistance = 5; // Limited zoom in street view
            this.controls.enablePan = false; // Disable panning for cleaner FPS feel
            this.controls.rotateSpeed = 0.5; // Faster rotation for responsive mouse look
            this.controls.dampingFactor = 0.1; // Less damping for snappier response

        } else {
            // Switch to Bird's Eye View
            console.log("Switching to Bird's Eye View");

            // Animate camera back up
            const birdEyePosition = new THREE.Vector3(30, 25, 30);
            this.animateToPosition(birdEyePosition, 1500);

            // Reset controls to orbital view
            this.controls.maxPolarAngle = Math.PI / 2.2;
            this.controls.minPolarAngle = 0;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 100;
            this.controls.enablePan = false;
            this.controls.rotateSpeed = 1.0; // Default rotation speed
            this.controls.dampingFactor = 0.05; // Default damping
            this.controls.target.set(0, 0, 0);
        }

        return this.isStreetView;
    }

    // Dispose controls
    dispose() {
        this.controls.dispose();
    }
}