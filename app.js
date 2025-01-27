import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let camera, scene, renderer, labelRenderer, controls;
let map;

// Initialize Three.js scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / 2 / window.innerHeight, 1, 1000);
    camera.position.set(100, 100, 100);

    // Renderer setup
    const container = document.getElementById('building-model');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Label renderer setup
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    setupLighting();

    // Add building
    const building = createBuilding();
    scene.add(building);

    // Add ground
    createGround();

    // Add labels
    addBuildingLabels();

    // Animation loop
    animate();
}

function setupLighting() {
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Hemisphere light for sky and ground reflection
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
}

function createBuilding() {
    const building = new THREE.Group();

    // Materials
    const materials = {
        concrete: new THREE.MeshPhysicalMaterial({
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.1
        }),
        glass: new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.6,
            envMapIntensity: 1.5
        }),
        metal: new THREE.MeshPhysicalMaterial({
            color: 0x999999,
            roughness: 0.3,
            metalness: 0.8
        })
    };

    // Podium
    const podium = createPodium(materials);
    building.add(podium);

    // Towers
    const towers = createTowers(materials);
    building.add(towers);

    return building;
}

function createPodium(materials) {
    const podium = new THREE.Group();

    // Main podium structure
    const podiumGeometry = new THREE.BoxGeometry(60, 20, 40);
    const podiumMesh = new THREE.Mesh(podiumGeometry, materials.concrete);
    podiumMesh.position.y = 10;
    podiumMesh.castShadow = true;
    podiumMesh.receiveShadow = true;
    podiumMesh.name = 'podium';
    
    // Glass facade details
    const glassSegments = 8;
    const glassWidth = 7;
    for (let i = 0; i < glassSegments; i++) {
        const glassGeometry = new THREE.PlaneGeometry(glassWidth, 15);
        const glass = new THREE.Mesh(glassGeometry, materials.glass);
        glass.position.set(-25 + (i * glassWidth + 1), 10, 20.1);
        glass.castShadow = false;
        podium.add(glass);

        // Mirror on other side
        const glassBack = glass.clone();
        glassBack.position.z = -20.1;
        glassBack.rotation.y = Math.PI;
        podium.add(glassBack);
    }

    podium.add(podiumMesh);
    return podium;
}

function createTowers(materials) {
    const towers = new THREE.Group();

    // Main tower parameters
    const towerWidth = 20;
    const towerHeight = 80;
    const towerDepth = 20;

    // Create three connected towers
    for (let i = 0; i < 3; i++) {
        const tower = new THREE.Group();
        
        // Main tower structure
        const towerGeometry = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
        const towerMesh = new THREE.Mesh(towerGeometry, materials.concrete);
        towerMesh.position.set(-20 + (i * 20), towerHeight/2 + 20, 0);
        towerMesh.castShadow = true;
        towerMesh.receiveShadow = true;
        tower.add(towerMesh);

        // Add glass curtain walls
        const glassGeometry = new THREE.PlaneGeometry(towerWidth-2, towerHeight-2);
        for (let side = 0; side < 4; side++) {
            const glass = new THREE.Mesh(glassGeometry, materials.glass);
            glass.position.copy(towerMesh.position);
            glass.position.z += (side % 2 === 0 ? towerDepth/2 + 0.1 : -towerDepth/2 - 0.1);
            glass.position.x += (side < 2 ? 0.1 : -0.1);
            glass.rotation.y = (side % 2 === 0 ? 0 : Math.PI);
            tower.add(glass);
        }

        // Add balconies
        const balconyGeometry = new THREE.BoxGeometry(6, 1, 4);
        const balconyCount = 10;
        for (let j = 0; j < balconyCount; j++) {
            const balcony = new THREE.Mesh(balconyGeometry, materials.metal);
            balcony.position.set(
                towerMesh.position.x - towerWidth/2 - 2,
                30 + (j * 7),
                0
            );
            balcony.castShadow = true;
            tower.add(balcony);

            // Mirror balcony on other side
            const balconyMirror = balcony.clone();
            balconyMirror.position.x = towerMesh.position.x + towerWidth/2 + 2;
            tower.add(balconyMirror);
        }

        towers.add(tower);
    }

    return towers;
}

function createGround() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x88aa88,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some ground details (trees, paths)
    addGroundDetails();
}

function addGroundDetails() {
    // Simple tree representation
    const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x227722 });
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x554433 });

    // Add trees around the building
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 50;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 1, z);
        trunk.castShadow = true;
        scene.add(trunk);

        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        tree.position.set(x, 6, z);
        tree.castShadow = true;
        scene.add(tree);
    }
}

function addBuildingLabels() {
    // Create and add labels for different building sections
    const labels = [
        { text: "Residential Towers\n20-25 floors", position: new THREE.Vector3(0, 90, 0) },
        { text: "Commercial Podium\n4-5 floors", position: new THREE.Vector3(0, 25, 25) },
        { text: "Green Space", position: new THREE.Vector3(30, 5, 30) }
    ];

    labels.forEach(labelInfo => {
        const div = document.createElement('div');
        div.className = 'building-label';
        div.textContent = labelInfo.text;
        const label = new CSS2DObject(div);
        label.position.copy(labelInfo.position);
        scene.add(label);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('building-model');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);

// Initialize the 3D scene
init();

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWVtb3J0YWw4OCIsImEiOiJjbGN6MTd6eWcwdTR6M3Btc2xzdmp5bnB2In0.q4Z1mQ_uEtz_oPVoJDE5qw';
map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [34.4450, 31.5016],
    zoom: 15
});

// Add map markers and interaction
map.on('load', () => {
    const marker = new mapboxgl.Marker()
        .setLngLat([34.4450, 31.5016])
        .addTo(map);
});

// Tab functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and content
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Initialize charts and interactive elements
function initializeCharts() {
    // Unit Distribution Chart with enhanced details
    const unitCtx = document.getElementById('unitDistributionChart').getContext('2d');
    new Chart(unitCtx, {
        type: 'doughnut',
        data: {
            labels: ['1-Bedroom', '2-Bedroom', '3-Bedroom', 'Studio'],
            datasets: [{
                data: [150, 200, 100, 50],
                backgroundColor: ['#1976D2', '#2196F3', '#64B5F6', '#90CAF9'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Unit Distribution'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} units (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Enhanced Energy Usage Chart
    const energyCtx = document.getElementById('energyUsageChart').getContext('2d');
    new Chart(energyCtx, {
        type: 'bar',
        data: {
            labels: ['Solar', 'Grid', 'Backup', 'Wind'],
            datasets: [{
                label: 'Energy Sources (MWh/year)',
                data: [400, 600, 150, 250],
                backgroundColor: ['#4CAF50', '#FFC107', '#FF5722', '#2196F3'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Annual Energy Usage Distribution'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value} MWh/year (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Energy Usage (MWh/year)'
                    }
                }
            }
        }
    });

    // Construction Timeline Chart
    const timelineCtx = document.getElementById('constructionTimelineChart').getContext('2d');
    new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Planned Progress',
                data: [10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 95, 100],
                borderColor: '#2196F3',
                borderWidth: 2,
                fill: false
            },
            {
                label: 'Actual Progress',
                data: [12, 22, 31, 42, 51, 62, 71, 79, null, null, null, null],
                borderColor: '#4CAF50',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Construction Progress Timeline'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Completion (%)'
                    }
                }
            }
        }
    });
}

// Initialize facility map with enhanced interactivity
function initializeFacilityMap() {
    const canvas = document.getElementById('facilityLayoutCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const facilities = [
        { x: 100, y: 100, width: 150, height: 100, label: 'Community Center', color: '#2196F3', details: 'Multi-purpose community space' },
        { x: 300, y: 100, width: 120, height: 80, label: 'Wellness Center', color: '#4CAF50', details: 'Fitness and health facilities' },
        { x: 100, y: 250, width: 100, height: 100, label: 'Children\'s Play Area', color: '#FFC107', details: 'Safe outdoor playground' },
        { x: 250, y: 250, width: 140, height: 90, label: 'Green Space', color: '#66BB6A', details: 'Landscaped recreation area' }
    ];

    let hoveredFacility = null;

    function drawFacilities() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw building outline
        ctx.fillStyle = '#e3f2fd';
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        facilities.forEach(facility => {
            ctx.fillStyle = facility === hoveredFacility ? lightenColor(facility.color, 20) : facility.color;
            ctx.fillRect(facility.x, facility.y, facility.width, facility.height);
            
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.fillText(facility.label, facility.x + 5, facility.y + 20);
        });

        if (hoveredFacility) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(10, canvas.height - 40, 300, 30);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(hoveredFacility.details, 20, canvas.height - 20);
        }
    }

    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 + (G < 255 ? G : 255) * 0x100 + (B < 255 ? B : 255)).toString(16).slice(1);
    }

    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        hoveredFacility = facilities.find(facility => 
            x >= facility.x && x <= facility.x + facility.width &&
            y >= facility.y && y <= facility.y + facility.height
        );

        drawFacilities();
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredFacility = null;
        drawFacilities();
    });

    drawFacilities();
}

// Initialize progress bars
function initializeProgress() {
    // Set progress bar widths
    document.querySelectorAll('.progress-bar').forEach(bar => {
        const progress = bar.dataset.progress;
        bar.querySelector('.progress').style.setProperty('--progress', `${progress}%`);
    });

    // Initialize circular progress indicators
    document.querySelectorAll('.metric-progress').forEach(progress => {
        const value = progress.dataset.progress;
        progress.style.background = `conic-gradient(#1976D2 ${value}%, #f0f0f0 ${value}%)`;
    });
}

// Facility item click handler
document.querySelectorAll('.facility-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.facility-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

// Initialize all interactive elements
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    initializeFacilityMap();
    initializeProgress();
});
