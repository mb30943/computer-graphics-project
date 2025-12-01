// ============================================
// FINDZZER 3D EVENT EXPLORER
// Main Application
// ============================================
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SceneManager } from './scene.js';
import { CameraControls } from './controls.js';
import { EventMarker } from './eventMarker.js';
import { RaycasterManager } from './raycaster.js';
import { eventData } from './eventData.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class FindzzerApp {
    constructor() {
        this.sceneManager = null;
        this.cameraControls = null;
        this.eventMarkers = [];
        this.raycasterManager = null;
        this.clock = new THREE.Clock();
        this.isLoading = true;
        this.stats = {
            frameCount: 0,
            lastTime: Date.now(),
            fps: 0
        };

        console.log('Initializing Findzzer 3D Event Explorer...');
        this.init();
    }

    // Initialize application
    async init() {
        try {
            // Initialize scene
            this.sceneManager = new SceneManager();

            // Load city
            this.sceneManager.loadCity(() => {
                this.onCityLoaded();
            });
        } catch (error) {
            console.error('Error initializing application:', error);
            this.hideLoadingScreen();
        }
    }

    // Called when city is loaded
    onCityLoaded() {
        console.log('City loaded. Initializing markers and controls...');

        // Setup camera controls
        this.cameraControls = new CameraControls(
            this.sceneManager.getCamera(),
            this.sceneManager.getRenderer()
        );

        // Create event markers
        this.createEventMarkers();
        console.log(`Created ${this.eventMarkers.length} event markers`);

        // Setup raycaster for interaction
        this.raycasterManager = new RaycasterManager(
            this.sceneManager.getCamera(),
            this.sceneManager.getScene(),
            this.eventMarkers
        );

        // Setup UI interactions
        this.setupUIInteractions();

        // Add keyboard controls
        this.setupKeyboardControls();

        // Hide loading screen
        this.hideLoadingScreen();

        // Start animation loop
        this.animate();

        console.log('Application ready!');
    }

    // Create event markers from event data
    createEventMarkers() {
        eventData.forEach((event) => {
            const marker = new EventMarker(event, this.sceneManager.getScene());
            this.eventMarkers.push(marker);
        });
    }

    // Setup UI interactions
    setupUIInteractions() {
        // ============================================
        // EVENT MARKER CLICK HANDLER
        // ============================================
        window.addEventListener('eventMarkerClicked', (e) => {
            this.showEventPopup(e.detail.eventData);
            this.cameraControls.focusOnEvent(
                new THREE.Vector3(
                    e.detail.eventData.position.x,
                    e.detail.eventData.position.y,
                    e.detail.eventData.position.z
                )
            );
        });

        // ============================================
        // CLOSE POPUP BUTTON
        // ============================================
        const closeBtn = document.getElementById('close-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideEventPopup();
            });
        }

        // ============================================
        // POPUP BACKGROUND CLICK
        // ============================================
        const popup = document.getElementById('event-popup');
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    this.hideEventPopup();
                }
            });
        }

        // ============================================
        // EVENT ACTION BUTTON
        // ============================================
        const actionBtn = document.getElementById('event-action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                const selectedMarker = this.raycasterManager.getSelectedMarker();
                if (selectedMarker) {
                    const eventData = selectedMarker.getEventData();
                    console.log('Opening event:', eventData.name);
                    alert(`Opening details for: ${eventData.name}\\n\\nIn a real app, this would open the full event details.`);
                }
            });
        }

        // ============================================
        // ESCAPE KEY TO CLOSE POPUP
        // ============================================
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEventPopup();
            }
        });

        // ============================================
        // TOGGLE VIEW BUTTON
        // ============================================
        const toggleViewBtn = document.getElementById('toggle-view-btn');
        const viewModeHint = document.getElementById('view-mode-hint');
        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', () => {
                const isStreetView = this.cameraControls.toggleViewMode();
                toggleViewBtn.textContent = isStreetView ? 'Toggle Bird\'s Eye View' : 'Toggle Street View';

                // Show/hide WASD hint
                if (viewModeHint) {
                    viewModeHint.style.display = isStreetView ? 'block' : 'none';
                }
            });
        }
    }

    // Setup keyboard controls
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'r':
                    // Reset camera
                    this.cameraControls.resetCamera();
                    break;
                case 'v':
                    // Toggle view mode with V key
                    const toggleViewBtn = document.getElementById('toggle-view-btn');
                    if (toggleViewBtn) {
                        toggleViewBtn.click();
                    }
                    break;
                case 'h':
                    // Show help
                    console.log('Findzzer 3D Event Explorer Controls:');
                    console.log('- Mouse drag: Rotate view');
                    console.log('- Mouse scroll: Zoom in/out');
                    console.log('- Click: Select event marker');
                    console.log('- R key: Reset camera');
                    console.log('- V key: Toggle Street View');
                    console.log('- WASD keys: Move in Street View');
                    console.log('- Escape: Close popup');
                    break;
            }
        });
    }

    // Show event popup
    showEventPopup(eventData) {
        const popup = document.getElementById('event-popup');
        const name = document.getElementById('event-name');
        const date = document.getElementById('event-date');
        const category = document.getElementById('event-category');
        const description = document.getElementById('event-description');

        if (popup && name && date && category && description) {
            name.textContent = eventData.name;
            date.textContent = `📅 ${eventData.date}`;
            category.textContent = `🏷️ Category: ${eventData.category}`;
            description.textContent = eventData.description;

            popup.classList.remove('hidden');
            // Trigger animation
            setTimeout(() => {
                popup.classList.add('show');
            }, 10);
        }
    }

    // Hide event popup
    hideEventPopup() {
        const popup = document.getElementById('event-popup');
        if (popup) {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.classList.add('hidden');
            }, 300);
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    // Update FPS counter (optional)
    updateFPS() {
        this.stats.frameCount++;
        const currentTime = Date.now();
        const elapsed = currentTime - this.stats.lastTime;

        if (elapsed >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastTime = currentTime;
            // Uncomment to see FPS in console
            // console.log('FPS:', this.stats.fps);
        }
    }

    // Main animation loop
    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = this.clock.getElapsedTime();

        // Update camera controls
        this.cameraControls.update();

        // Animate event markers
        this.eventMarkers.forEach((marker) => {
            marker.animate(time);
        });

        // Update FPS
        this.updateFPS();

        // Render scene
        this.sceneManager.render();
    }

    // Dispose of resources
    dispose() {
        this.sceneManager.dispose();
        this.cameraControls.dispose();
        this.raycasterManager.dispose();
        this.eventMarkers.forEach(marker => marker.dispose());
    }
}

// ============================================
// APPLICATION ENTRY POINT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting Application');
    window.findezzerApp = new FindzzerApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.findezzerApp) {
        window.findezzerApp.dispose();
    }
});