import * as THREE from 'three';

export const World = {
    build(scene) {
        // FULL BRIGHT LIGHTS
        scene.add(new THREE.AmbientLight(0xffffff, 1.8));
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(0, 10, 0);
        scene.add(sun);

        // 4 ROOMS: Lobby, Poker, Store, Vault
        this.createArea(scene, 0, 0, 20, 0x222222);   // Lobby
        this.createArea(scene, 20, 0, 15, 0x076324);  // Poker
        this.createArea(scene, -20, 0, 15, 0x111111); // Store
        this.createArea(scene, 0, 20, 15, 0x444444);  // Vault

        // THE GOLD SAFE
        const safe = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2, 1.2),
            new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        safe.position.set(0, 1, 25);
        scene.add(safe);
    },

    createArea(scene, x, z, size, color) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: color }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x, 0, z);
        scene.add(floor);
        // Bright Ceiling
        const ceil = floor.clone();
        ceil.position.y = 5;
        ceil.rotation.x = Math.PI / 2;
        scene.add(ceil);
    }
};
