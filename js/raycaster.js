// ============================================
// FINDZZER 3D EVENT EXPLORER
// Raycaster Manager Module
// ============================================
import * as THREE from 'three';

export class RaycasterManager {
    constructor(camera, scene, eventMarkers) {
        this.camera = camera;
        this.scene = scene;
        this.eventMarkers = eventMarkers;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.selectedObject = null;
        this.isClicking = false;

        this.setupEventListeners();
    }

    // Setup mouse event listeners
    setupEventListeners() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('click', this.onClick.bind(this), false);
        window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    }

    // Handle mouse move for hover detection
    onMouseMove(event) {
        // Calculate normalized device coordinates
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all event marker groups for intersection testing
        const markerGroups = this.eventMarkers.map(marker => marker.getGroup());
        const intersects = this.raycaster.intersectObjects(markerGroups, true);

        // Reset previous hover state
        if (this.hoveredObject && this.hoveredObject !== this.selectedObject) {
            this.hoveredObject.setHovered(false);
            document.body.style.cursor = 'default';
        }

        // Check for new hover
        if (intersects.length > 0) {
            const intersectedGroup = intersects[0].object.parent;
            
            // Traverse up the hierarchy to find the marker group
            let currentGroup = intersectedGroup;
            while (currentGroup && !currentGroup.userData.isEventMarker) {
                currentGroup = currentGroup.parent;
            }

            if (currentGroup && currentGroup.userData.isEventMarker) {
                const marker = this.eventMarkers.find(
                    m => m.getGroup().uuid === currentGroup.uuid
                );
                if (marker && marker !== this.selectedObject) {
                    marker.setHovered(true);
                    this.hoveredObject = marker;
                    document.body.style.cursor = 'pointer';
                }
            }
        } else {
            this.hoveredObject = null;
        }
    }

    // Handle mouse down
    onMouseDown(event) {
        this.isClicking = true;
    }

    // Handle mouse up
    onMouseUp(event) {
        this.isClicking = false;
    }

    // Handle click events
    onClick(event) {
        // Prevent click if dragging
        if (this.isClicking) {
            // Calculate normalized mouse position
            const rect = event.target.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Get all event marker groups
            const markerGroups = this.eventMarkers.map(marker => marker.getGroup());
            const intersects = this.raycaster.intersectObjects(markerGroups, true);

            if (intersects.length > 0) {
                const intersectedGroup = intersects[0].object.parent;
                
                // Traverse up the hierarchy to find the marker group
                let currentGroup = intersectedGroup;
                while (currentGroup && !currentGroup.userData.isEventMarker) {
                    currentGroup = currentGroup.parent;
                }

                if (currentGroup && currentGroup.userData.isEventMarker) {
                    const marker = this.eventMarkers.find(
                        m => m.getGroup().uuid === currentGroup.uuid
                    );
                    if (marker) {
                        this.onEventMarkerClick(marker);
                    }
                }
            } else {
                // Click on empty space - deselect
                this.deselectMarker();
            }
        }
    }

    // Handle event marker click
    onEventMarkerClick(marker) {
        // Deselect previous selection
        if (this.selectedObject && this.selectedObject !== marker) {
            this.selectedObject.setSelected(false);
        }

        // Select new marker
        marker.setSelected(true);
        this.selectedObject = marker;

        // Dispatch custom event
        const event = new CustomEvent('eventMarkerClicked', {
            detail: {
                eventData: marker.getEventData(),
                marker: marker
            }
        });
        window.dispatchEvent(event);
    }

    // Deselect current marker
    deselectMarker() {
        if (this.selectedObject) {
            this.selectedObject.setSelected(false);
            this.selectedObject = null;
        }

        // Dispatch deselect event
        const event = new CustomEvent('eventMarkerDeselected');
        window.dispatchEvent(event);
    }

    // Get currently selected marker
    getSelectedMarker() {
        return this.selectedObject;
    }

    // Get currently hovered marker
    getHoveredMarker() {
        return this.hoveredObject;
    }

    // Cleanup
    dispose() {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('click', this.onClick.bind(this));
        window.removeEventListener('mousedown', this.onMouseDown.bind(this));
        window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }
}