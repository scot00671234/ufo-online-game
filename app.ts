import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';

const SpaceShooter = () => {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let ship, bullets = [], asteroids = [], stars = [];
    
    // Procedural texture generation
    function createNoiseTexture(size = 256) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(size, size);
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = Math.random() * 255;
        imageData.data[i] = noise;
        imageData.data[i + 1] = noise;
        imageData.data[i + 2] = noise;
        imageData.data[i + 3] = 255;
      }
      
      ctx.putImageData(imageData, 0, 0);
      return new THREE.CanvasTexture(canvas);
    }
    
    // Create planet surface texture
    function createPlanetTexture(baseColor, noiseScale = 0.5) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Convert hex color to RGB
      const r = (baseColor >> 16) & 255;
      const g = (baseColor >> 8) & 255;
      const b = baseColor & 255;
      
      const imageData = ctx.createImageData(512, 256);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = (Math.random() * noiseScale + (1 - noiseScale));
        imageData.data[i] = r * noise;
        imageData.data[i + 1] = g * noise;
        imageData.data[i + 2] = b * noise;
        imageData.data[i + 3] = 255;
      }
      
      ctx.putImageData(imageData, 0, 0);
      return new THREE.CanvasTexture(canvas);
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // UFO
    const ufoGroup = new THREE.Group();
    
    // Main body (saucer shape)
    const bodyGeometry = new THREE.CylinderGeometry(1, 1.2, 0.3, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x808080,
      shininess: 100,
      specular: 0x111111
    });
    const ufoBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Top dome
    const domeGeometry = new THREE.SphereGeometry(0.7, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.7,
      shininess: 100,
      specular: 0xffffff
    });
    const ufoDome = new THREE.Mesh(domeGeometry, domeMaterial);
    ufoDome.position.y = 0.15;
    
    // Bottom lights
    const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    for (let i = 0; i < 8; i++) {
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      const angle = (i / 8) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 0.9, -0.2, Math.sin(angle) * 0.9);
      ufoGroup.add(light);
    }
    
    // Add all parts to UFO group
    ufoGroup.add(ufoBody);
    ufoGroup.add(ufoDome);
    
    ship = ufoGroup;
    ship.position.z = -5;
    ship.rotation.x = Math.PI / 2; // Adjust rotation to face forward
    scene.add(ship);

    // Camera position
    camera.position.z = 5;

    // Create a skybox for deep space effect
    const skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
    const skyboxMaterial = new THREE.MeshBasicMaterial({
      color: 0x000011, // Slight blue tint for space
      side: THREE.BackSide
    });
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    scene.add(skybox);
    // Create nebula effect
    function createNebula(color, position, scale) {
      const nebulaGroup = new THREE.Group();
      
      // Create multiple layers for more complex appearance
      for (let i = 0; i < 3; i++) {
        const nebulaGeometry = new THREE.IcosahedronGeometry(scale * (1 - i * 0.1), 4);
        const nebulaMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.15,
          wireframe: true,
          blending: THREE.AdditiveBlending
        });
        const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        nebulaMesh.rotation.x = Math.random() * Math.PI;
        nebulaMesh.rotation.y = Math.random() * Math.PI;
        nebulaGroup.add(nebulaMesh);
      }
      
      // Add particle system for star-like points
      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = 1000;
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const radius = scale * Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: color,
        size: 2,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      nebulaGroup.add(particleSystem);
      
      nebulaGroup.position.copy(position);
      scene.add(nebulaGroup);
      return nebulaGroup;
      const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebula.position.copy(position);
      scene.add(nebula);
      return nebula;
    }
    // Stars background with different sizes
    function createStar() {
      const size = Math.random() * 0.2;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(
          0.8 + Math.random() * 0.2,
          0.8 + Math.random() * 0.2,
          0.8 + Math.random() * 0.2
        )
      });
      const star = new THREE.Mesh(geometry, material);
      star.position.set(
        Math.random() * 1000 - 500,
        Math.random() * 1000 - 500,
        Math.random() * 1000 - 500
      );
      stars.push(star);
      scene.add(star);
    }
    // Enhanced planet creation with textures and features
    function createPlanet(radius, color, distance, hasRings = false, hasClouds = false) {
      const planetGeometry = new THREE.SphereGeometry(radius, 64, 64);
      const planetTexture = createPlanetTexture(color, 0.3);
      const bumpTexture = createNoiseTexture();
      const planetMaterial = new THREE.MeshPhongMaterial({ 
        map: planetTexture,
        bumpMap: bumpTexture,
        bumpScale: radius * 0.05,
        shininess: 25,
        specularMap: bumpTexture
      });
      const planet = new THREE.Group();
      const planetCore = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.add(planetCore);
      
      // Add rings if specified
      if (hasRings) {
        const ringGeometry = new THREE.RingGeometry(radius * 1.5, radius * 2.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        planet.add(rings);
      }
      
      // Add cloud layer if specified
      if (hasClouds) {
        const cloudGeometry = new THREE.SphereGeometry(radius * 1.02, 32, 32);
        const cloudMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        planet.add(clouds);
      }
      
      // Random position on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      planet.position.x = distance * Math.sin(theta) * Math.cos(phi);
      planet.position.y = distance * Math.sin(theta) * Math.sin(phi);
      planet.position.z = distance * Math.cos(theta);
      
      scene.add(planet);
      return planet;
    }

    // Create initial stars and planets
    for(let i = 0; i < 5000; i++) {
      createStar();
    }
    
    // Create a larger variety of planets at different distances
    // Create various space objects
    const planets = [
      createPlanet(15, 0xff4444, 100, false, true),    // Red planet with clouds
      createPlanet(20, 0x44ff44, 200, true, false),    // Green planet with rings
      createPlanet(25, 0x4444ff, 300, false, true),    // Blue planet with clouds
      createPlanet(30, 0xffff44, 400, true, true),     // Yellow planet with rings and clouds
      createPlanet(40, 0xff00ff, 600, false, true),    // Purple planet with clouds
      createPlanet(35, 0x00ffff, 800, true, false),    // Cyan planet with rings
      createPlanet(45, 0xff8800, 1000, true, true),    // Orange planet with rings and clouds
      createPlanet(50, 0x8800ff, 1200, false, true),   // Violet planet with clouds
      createPlanet(60, 0x884400, 1500, true, false),   // Brown planet with rings
      createPlanet(55, 0x008844, 1800, false, true),   // Turquoise planet with clouds
      createPlanet(70, 0x880088, 2000, true, true),    // Magenta planet with rings and clouds
      createPlanet(65, 0x888800, 2500, false, true)    // Gold planet with clouds
    ];
    // Create nebulae
    const nebulae = [
      createNebula(0xff0044, new THREE.Vector3(500, 200, -1000), 200),  // Red nebula
      createNebula(0x00ff44, new THREE.Vector3(-700, -300, -1500), 300),// Green nebula
      createNebula(0x4400ff, new THREE.Vector3(-300, 500, -2000), 250), // Blue nebula
      createNebula(0xff8800, new THREE.Vector3(800, -400, -2500), 350)  // Orange nebula
    ];
    // Create AI spaceships
    const aiShips = [];
    function createAISpaceship(position) {
      const aiShip = new THREE.Group();
      
      // Main body
      const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: Math.random() * 0xffffff,
        shininess: 100,
        emissive: 0x222222
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      aiShip.add(body);
      
      // Engine glow
      const engineGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const engineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
      });
      const engine = new THREE.Mesh(engineGeometry, engineMaterial);
      engine.position.y = -1;
      aiShip.add(engine);
      
      // Wing details
      const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.5);
      const wingMaterial = new THREE.MeshPhongMaterial({
        color: bodyMaterial.color,
        shininess: 100
      });
      const wings = new THREE.Mesh(wingGeometry, wingMaterial);
      wings.position.y = -0.3;
      aiShip.add(wings);
      aiShip.position.copy(position);
      aiShip.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      scene.add(aiShip);
      aiShips.push(aiShip);
    }
    // Create initial AI ships
    for(let i = 0; i < 20; i++) {
      createAISpaceship(new THREE.Vector3(
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000
      ));
    }

    // Bullet creation function
    function createBullet() {
      // Calculate speed multiplier based on score
      const speedMultiplier = 1 + Math.floor(score / 1000) * 0.2;
      
      // Create bullet geometry with trail effect
      const bulletGroup = new THREE.Group();
      
      // Main bullet
      const bulletGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
      
      // Bullet trail
      const trailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.z = 0.2;
      trail.rotation.x = Math.PI / 2;
      
      bulletGroup.add(bullet);
      bulletGroup.add(trail);
      bulletGroup.position.copy(ship.position);
      bulletGroup.velocity = new THREE.Vector3(0, 0, -2 * speedMultiplier);
      bullets.push(bulletGroup);
      scene.add(bulletGroup);
    }

    // Asteroid creation function
    function createAsteroid() {
      const radius = Math.random() * 1 + 0.5; // Random size between 0.5 and 1.5
      const geometry = new THREE.IcosahedronGeometry(radius, 0); // Rough asteroid shape
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x808080,
        wireframe: true // Gives a cool space rock effect
      });
      const asteroid = new THREE.Mesh(geometry, material);
      
      // Random position at top of screen
      asteroid.position.set(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        -30
      );
      
      // Random rotation and movement
      asteroid.rotationSpeed = {
        x: Math.random() * 0.02 - 0.01,
        y: Math.random() * 0.02 - 0.01,
        z: Math.random() * 0.02 - 0.01
      };
      
      asteroid.velocity = {
        x: Math.random() * 0.04 - 0.02,
        y: Math.random() * 0.04 - 0.02,
        z: Math.random() * 0.04 + 0.05 // Mainly moving towards player
      };
      
      asteroid.radius = radius; // Store for collision detection
      asteroids.push(asteroid);
      scene.add(asteroid);
    }

    // Controls
    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);
    document.addEventListener('keypress', (e) => {
      if(e.key === ' ') createBullet();
    });

    // Game loop
    let lastAsteroidSpawn = 0;
    function animate(time) {
      requestAnimationFrame(animate);

      const baseSpeed = 2;
      const rotationSpeed = 0.03;
      
      // Ship rotation controls
      if(keys['ArrowLeft']) ship.rotation.y += rotationSpeed;
      if(keys['ArrowRight']) ship.rotation.y -= rotationSpeed;
      if(keys['ArrowUp']) ship.rotation.x += rotationSpeed;
      if(keys['ArrowDown']) ship.rotation.x -= rotationSpeed;
      if(keys['q'] || keys['Q']) ship.rotation.z += rotationSpeed;
      if(keys['e'] || keys['E']) ship.rotation.z -= rotationSpeed;
      
      // Movement in all directions
      if(keys['w'] || keys['W']) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(ship.quaternion);
        ship.position.add(forward.multiplyScalar(baseSpeed));
      }
      if(keys['s'] || keys['S']) {
        const backward = new THREE.Vector3(0, 0, 1);
        backward.applyQuaternion(ship.quaternion);
        ship.position.add(backward.multiplyScalar(baseSpeed));
      }
      if(keys['a'] || keys['A']) {
        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(ship.quaternion);
        ship.position.add(left.multiplyScalar(baseSpeed));
      }
      if(keys['d'] || keys['D']) {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(ship.quaternion);
        ship.position.add(right.multiplyScalar(baseSpeed));
      }
      if(keys['r'] || keys['R']) {
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(ship.quaternion);
        ship.position.add(up.multiplyScalar(baseSpeed));
      }
      if(keys['f'] || keys['F']) {
        const down = new THREE.Vector3(0, -1, 0);
        down.applyQuaternion(ship.quaternion);
        ship.position.add(down.multiplyScalar(baseSpeed));
      }
      
      // Update camera to follow ship with smooth interpolation
      const cameraOffset = new THREE.Vector3(0, 2, 8);
      cameraOffset.applyQuaternion(ship.quaternion);
      camera.position.copy(ship.position).add(cameraOffset);
      camera.lookAt(ship.position);

      // Move bullets
      bullets.forEach((bullet, bulletIndex) => {
        bullet.position.add(bullet.velocity);
        if(bullet.position.z < -50) {
          scene.remove(bullet);
          bullets.splice(bulletIndex, 1);
        }
      });

      if (!gameOver) {
        // Spawn asteroids with increasing frequency based on score
        const spawnInterval = Math.max(1000 - Math.floor(score / 500) * 50, 400);
        if(time - lastAsteroidSpawn > spawnInterval) {
          createAsteroid();
          lastAsteroidSpawn = time;
        }
        // Move and rotate asteroids
        asteroids.forEach((asteroid, asteroidIndex) => {
          asteroid.position.x += asteroid.velocity.x;
          asteroid.position.y += asteroid.velocity.y;
          asteroid.position.z += asteroid.velocity.z;
          
          asteroid.rotation.x += asteroid.rotationSpeed.x;
          asteroid.rotation.y += asteroid.rotationSpeed.y;
          asteroid.rotation.z += asteroid.rotationSpeed.z;
          // Check collision with bullets
          bullets.forEach((bullet, bulletIndex) => {
            if(asteroid.position.distanceTo(bullet.position) < asteroid.radius) {
              scene.remove(asteroid);
              scene.remove(bullet);
              asteroids.splice(asteroidIndex, 1);
              bullets.splice(bulletIndex, 1);
              setScore(prev => prev + 100);
            }
          });
          // Check collision with ship
          // Use a larger collision radius for the UFO
          const ufoCollisionRadius = 1.2; // Adjust this value as needed
          if(asteroid.position.distanceTo(ship.position) < asteroid.radius + ufoCollisionRadius) {
            setGameOver(true);
          }
          // Remove asteroids that pass the ship
          if(asteroid.position.z > 5) {
            scene.remove(asteroid);
            asteroids.splice(asteroidIndex, 1);
          }
        });
      }

      // Update planets rotation
      // Update planets
      planets.forEach((planet, index) => {
        planet.rotation.y += 0.001 * (index + 1);
        if (planet.children.length > 1) { // If planet has clouds
          planet.children[1].rotation.y += 0.002 * (index + 1);
        }
      });
      
      // Update nebulae
      nebulae.forEach((nebula, index) => {
        nebula.rotation.x += 0.0001;
        nebula.rotation.y += 0.0002;
        nebula.rotation.z += 0.0001;
      });
      
      // Update AI ships
      aiShips.forEach((aiShip, index) => {
        // Update position
        aiShip.position.add(aiShip.velocity);
        
        // Random direction changes
        if(Math.random() < 0.01) {
          aiShip.velocity.x += (Math.random() - 0.5) * 0.1;
          aiShip.velocity.y += (Math.random() - 0.5) * 0.1;
          aiShip.velocity.z += (Math.random() - 0.5) * 0.1;
          
          // Limit velocity
          aiShip.velocity.clampLength(0, 0.5);
        }
        
        // Point in direction of movement
        aiShip.lookAt(aiShip.position.clone().add(aiShip.velocity));
        
        // Wrap around if too far from origin
        if(aiShip.position.length() > 3000) {
          aiShip.position.multiplyScalar(0.1);
        }
      });
      
      // Check if ship is far from origin and create new stars
      const distanceFromOrigin = ship.position.length();
      if(distanceFromOrigin > 400) {
        // Remove distant stars and create new ones near the ship
        stars.forEach((star, index) => {
          if(star.position.distanceTo(ship.position) > 600) {
            scene.remove(star);
            stars.splice(index, 1);
            
            // Create new star near the ship
            const newStar = new THREE.Mesh(
              new THREE.SphereGeometry(Math.random() * 0.2, 8, 8),
              new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(
                  0.8 + Math.random() * 0.2,
                  0.8 + Math.random() * 0.2,
                  0.8 + Math.random() * 0.2
                )
              })
            );
            
            // Position new star relative to ship
            newStar.position.set(
              ship.position.x + (Math.random() * 400 - 200),
              ship.position.y + (Math.random() * 400 - 200),
              ship.position.z + (Math.random() * 400 - 200)
            );
            
            stars.push(newStar);
            scene.add(newStar);
          }
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mountRef} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '24px'
      }}>
        SCORE: {score}
      </div>
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff0000',
          fontFamily: 'monospace',
          fontSize: '48px',
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          GAME OVER<br/>
          Final Score: {score}<br/>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '24px',
              backgroundColor: '#00ff00',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Play Again
          </button>
        </div>
      )}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '16px'
      }}>
        Controls:<br/>
        W/S: Move Forward/Backward<br/>
        A/D: Strafe Left/Right<br/>
        R/F: Move Up/Down<br/>
        Q/E: Roll Left/Right<br/>
        Arrow Keys: Rotate Ship<br/>
        Space: Shoot<br/>
        Explore the infinite space!
      </div>
    </div>
  );
};

const App = () => {
  return <SpaceShooter />;
};

const container = document.getElementById('renderDiv');
const root = ReactDOM.createRoot(container);
root.render(<App />);