/**
 * Subtle Three.js Background Effect for FoodFlow
 * A minimal particle field that gently responds to cursor movement.
 */

// Use an IIFE to avoid polluting the global scope
(function () {
    let scene, camera, renderer, particles, material;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function init() {
        // Create container
        const canvas = document.createElement('canvas');
        canvas.id = 'three-bg-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '1'; // Above body background, below content
        canvas.style.pointerEvents = 'none'; // Don't block interactions
        document.body.appendChild(canvas);

        console.log('FoodFlow Background: Three.js Initialized');

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;

        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        // Create a cloud of particles
        for (let i = 0; i < 1500; i++) {
            vertices.push(
                Math.random() * 4000 - 2000,
                Math.random() * 4000 - 2000,
                Math.random() * 4000 - 2000
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        material = new THREE.PointsMaterial({
            size: 4,
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Theme management
        updateTheme();
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    updateTheme();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        document.addEventListener('mousemove', onDocumentMouseMove);
        window.addEventListener('resize', onWindowResize);

        animate();
    }

    function updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            material.color.setHex(0x3b82f6);
            material.blending = THREE.AdditiveBlending;
            material.opacity = 0.5;
        } else {
            // Light mode uses normal blending and slightly more subtle blue
            material.color.setHex(0x2563eb);
            material.blending = THREE.NormalBlending;
            material.opacity = 0.25;
        }
        material.needsUpdate = true;
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        // Parallax effect based on mouse position
        camera.position.x += (mouseX - camera.position.x) * 0.02;
        camera.position.y += (-mouseY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Subtle rotation
        particles.rotation.y += 0.001;

        renderer.render(scene, camera);
    }

    init();
})();
