/* =========================================================
   Cosmic Explorer – 3D Interactive Solar System
   Uses Three.js (r128) loaded via CDN in index.html
   ========================================================= */

(function () {
  'use strict';

  // ── Globals ──────────────────────────────────────────────
  var scene, camera, renderer, controls, raycaster, mouse;
  var clock = new THREE.Clock();
  var speedMultiplier = 1;
  var celestialBodies = [];   // { mesh, data, orbitGroup?, orbitAngle? }
  var orbitLines = [];
  var ORBIT_LINE_HALF_WIDTH = 0.04;
  var ORBIT_SEGMENTS = 128;
  var shootingStars = [];
  var nebulaParticles;
  var sunGlowLayers = [];
  var cameraIntroComplete = false;

  // ── Data ─────────────────────────────────────────────────
  var SUN_DATA = {
    name: 'Sun',
    type: 'Star',
    desc: 'The Sun is the star at the center of our Solar System. It is a nearly perfect ball of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating energy as visible light and infrared radiation.',
    stats: { 'Diameter': '1,391,000 km', 'Surface Temp': '5,500 °C', 'Age': '4.6 billion yrs', 'Type': 'G2V Yellow Dwarf' }
  };

  var PLANETS = [
    { name: 'Mercury', color: 0xaaaaaa, radius: 0.38, distance: 8,  speed: 4.15, rotationSpeed: 0.005,
      type: 'Rocky Planet', desc: 'Mercury is the smallest planet and closest to the Sun. Its surface is covered in craters and has virtually no atmosphere. Temperatures swing from −180 °C at night to 430 °C during the day.',
      stats: { 'Diameter': '4,879 km', 'Day Length': '59 Earth days', 'Year Length': '88 Earth days', 'Moons': '0' } },
    { name: 'Venus', color: 0xe8cda0, radius: 0.95, distance: 11,  speed: 1.62, rotationSpeed: 0.003,
      type: 'Rocky Planet', desc: 'Venus is the second planet from the Sun and the hottest in our solar system. Its thick atmosphere of carbon dioxide traps heat in a runaway greenhouse effect.',
      stats: { 'Diameter': '12,104 km', 'Day Length': '243 Earth days', 'Year Length': '225 Earth days', 'Moons': '0' } },
    { name: 'Earth', color: 0x4488ff, radius: 1.0, distance: 15,  speed: 1.0, rotationSpeed: 0.01,
      type: 'Rocky Planet', desc: 'Earth is the third planet from the Sun and the only known planet to harbor life. Its surface is 71% water and it is protected by a magnetic field and ozone layer.',
      stats: { 'Diameter': '12,742 km', 'Day Length': '24 hours', 'Year Length': '365.25 days', 'Moons': '1' },
      satellites: [
        { name: 'Moon', color: 0xcccccc, radius: 0.27, distance: 2.2, speed: 5.0,
          type: 'Natural Satellite', desc: 'The Moon is Earth\'s only natural satellite. It stabilises Earth\'s axial tilt and causes ocean tides. Humans first set foot on the Moon in 1969 during Apollo 11.',
          stats: { 'Diameter': '3,474 km', 'Orbital Period': '27.3 days', 'Distance': '384,400 km', 'Gravity': '1.62 m/s²' } },
        { name: 'ISS', color: 0xffee88, radius: 0.1, distance: 1.5, speed: 20.0,
          type: 'Artificial Satellite', desc: 'The International Space Station is the largest modular space station in low Earth orbit. It serves as a microgravity and space environment research laboratory.',
          stats: { 'Altitude': '~408 km', 'Speed': '27,600 km/h', 'Crew': '6–7', 'Since': '1998' } }
      ] },
    { name: 'Mars', color: 0xcc5533, radius: 0.53, distance: 20,  speed: 0.53, rotationSpeed: 0.009,
      type: 'Rocky Planet', desc: 'Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. It hosts the tallest volcano (Olympus Mons) and the deepest canyon (Valles Marineris) in the solar system.',
      stats: { 'Diameter': '6,779 km', 'Day Length': '24.6 hours', 'Year Length': '687 Earth days', 'Moons': '2' },
      satellites: [
        { name: 'Phobos', color: 0x998877, radius: 0.12, distance: 1.6, speed: 8.0,
          type: 'Natural Satellite', desc: 'Phobos is the larger and closer of Mars\' two moons. It orbits so close to Mars that it completes an orbit faster than Mars rotates.',
          stats: { 'Diameter': '22.4 km', 'Orbital Period': '7.66 hours', 'Distance': '9,376 km', 'Shape': 'Irregular' } }
      ] },
    { name: 'Jupiter', color: 0xddaa77, radius: 2.5, distance: 30,  speed: 0.084, rotationSpeed: 0.02,
      type: 'Gas Giant', desc: 'Jupiter is the largest planet in the solar system, a gas giant with a mass more than twice that of all other planets combined. Its Great Red Spot is a storm that has raged for centuries.',
      stats: { 'Diameter': '139,820 km', 'Day Length': '9.9 hours', 'Year Length': '11.86 years', 'Moons': '95' },
      satellites: [
        { name: 'Europa', color: 0xeeddcc, radius: 0.25, distance: 3.8, speed: 3.0,
          type: 'Natural Satellite', desc: 'Europa is one of Jupiter\'s Galilean moons. Beneath its icy surface lies a global ocean that may harbor conditions suitable for life.',
          stats: { 'Diameter': '3,122 km', 'Orbital Period': '3.55 days', 'Ocean Depth': '~100 km', 'Discovery': '1610' } },
        { name: 'Ganymede', color: 0xbbaa99, radius: 0.3, distance: 4.8, speed: 2.0,
          type: 'Natural Satellite', desc: 'Ganymede is the largest moon in the solar system, even bigger than Mercury. It is the only moon known to have its own magnetic field.',
          stats: { 'Diameter': '5,268 km', 'Orbital Period': '7.15 days', 'Magnetic Field': 'Yes', 'Discovery': '1610' } }
      ] },
    { name: 'Saturn', color: 0xeedd88, radius: 2.1, distance: 42,  speed: 0.034, rotationSpeed: 0.018,
      type: 'Gas Giant', desc: 'Saturn is the sixth planet from the Sun, famous for its stunning ring system made of ice and rock particles. It is the least dense planet — it would float in water.',
      stats: { 'Diameter': '116,460 km', 'Day Length': '10.7 hours', 'Year Length': '29.46 years', 'Moons': '146' },
      hasRing: true,
      satellites: [
        { name: 'Titan', color: 0xddcc77, radius: 0.35, distance: 4.0, speed: 2.5,
          type: 'Natural Satellite', desc: 'Titan is Saturn\'s largest moon and the second-largest in the solar system. It has a dense nitrogen atmosphere and surface lakes of liquid methane and ethane.',
          stats: { 'Diameter': '5,150 km', 'Atmosphere': 'Nitrogen', 'Surface Lakes': 'Methane', 'Discovery': '1655' } }
      ] },
    { name: 'Uranus', color: 0x88ccdd, radius: 1.6, distance: 54,  speed: 0.012, rotationSpeed: 0.012,
      type: 'Ice Giant', desc: 'Uranus is the seventh planet from the Sun and rotates on its side, with an axial tilt of 98°. It has a pale blue-green colour from methane in its atmosphere.',
      stats: { 'Diameter': '50,724 km', 'Day Length': '17.2 hours', 'Year Length': '84 years', 'Moons': '28' } },
    { name: 'Neptune', color: 0x4466ff, radius: 1.5, distance: 64,  speed: 0.006, rotationSpeed: 0.011,
      type: 'Ice Giant', desc: 'Neptune is the eighth and farthest known planet from the Sun. It has the strongest sustained winds of any planet, reaching 2,100 km/h.',
      stats: { 'Diameter': '49,528 km', 'Day Length': '16.1 hours', 'Year Length': '164.8 years', 'Moons': '16' },
      satellites: [
        { name: 'Triton', color: 0xbbccdd, radius: 0.2, distance: 2.8, speed: 3.0,
          type: 'Natural Satellite', desc: 'Triton is Neptune\'s largest moon and the only large moon with a retrograde orbit. It has geysers that erupt nitrogen gas, suggesting geological activity.',
          stats: { 'Diameter': '2,707 km', 'Orbital Period': '5.88 days', 'Surface Temp': '−235 °C', 'Discovery': '1846' } }
      ] }
  ];

  // Artificial satellites in Earth orbit (additional)
  var EXTRA_SATELLITES = [
    { name: 'Hubble Space Telescope', color: 0xff99ff, radius: 0.08, parentIndex: 2, distance: 1.8, speed: 15.0,
      type: 'Artificial Satellite', desc: 'The Hubble Space Telescope has been observing the universe since 1990. It has made over 1.5 million observations and fundamentally changed our understanding of cosmology.',
      stats: { 'Altitude': '~547 km', 'Mirror': '2.4 m', 'Launched': '1990', 'Observations': '1.5M+' } }
  ];

  // ── Procedural Glow Texture ─────────────────────────────
  function createGlowTexture(innerColor, size) {
    size = size || 128;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var half = size / 2;
    var gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, innerColor || 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, innerColor || 'rgba(255,255,200,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,200,100,0.2)');
    gradient.addColorStop(0.7, 'rgba(100,80,40,0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    var texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  function createPlanetGlowTexture(r, g, b, size) {
    size = size || 128;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var half = size / 2;
    var gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.6)');
    gradient.addColorStop(0.3, 'rgba(' + r + ',' + g + ',' + b + ',0.2)');
    gradient.addColorStop(0.6, 'rgba(' + r + ',' + g + ',' + b + ',0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    var texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // ── Initialise ───────────────────────────────────────────
  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.0008);

    // Camera – start far away for intro
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(120, 80, 160);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.15;

    // Raycaster for clicks
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createStarfield();
    createNebulaBackground();
    createSun();
    createPlanets();
    createExtraSatellites();
    createAsteroidBelt();
    addLighting();
    bindEvents();

    // Hide loading
    setTimeout(function () {
      var el = document.getElementById('loading');
      if (el) el.classList.add('hidden');
    }, 1200);

    animate();
  }

  // ── Starfield (multi-layer) ──────────────────────────────
  function createStarfield() {
    // Layer 1: Distant dim stars
    createStarLayer(8000, 500, 900, 0.6, 0.7);
    // Layer 2: Mid-range stars
    createStarLayer(3000, 300, 600, 1.2, 0.85);
    // Layer 3: Bright close stars
    createStarLayer(800, 200, 500, 2.0, 1.0);
  }

  function createStarLayer(count, minR, maxR, size, baseOpacity) {
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var sizes = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      var r = minR + Math.random() * (maxR - minR);
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      // Color variety: blue-white, yellow, orange-white
      var temp = Math.random();
      if (temp < 0.6) {
        // white-blue
        var brightness = 0.7 + Math.random() * 0.3;
        colors[i3] = brightness * 0.9;
        colors[i3 + 1] = brightness * 0.95;
        colors[i3 + 2] = brightness;
      } else if (temp < 0.85) {
        // warm yellow
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.8 + Math.random() * 0.15;
        colors[i3 + 2] = 0.5 + Math.random() * 0.2;
      } else {
        // cool blue
        colors[i3] = 0.5 + Math.random() * 0.2;
        colors[i3 + 1] = 0.6 + Math.random() * 0.2;
        colors[i3 + 2] = 0.9 + Math.random() * 0.1;
      }
      sizes[i] = size * (0.5 + Math.random() * 0.5);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: baseOpacity,
      sizeAttenuation: true
    });
    scene.add(new THREE.Points(geo, mat));
  }

  // ── Nebula / Cosmic Dust Background ────────────────────
  function createNebulaBackground() {
    var count = 2000;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      var r = 150 + Math.random() * 350;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      // Cluster toward the ecliptic plane
      phi = phi * 0.4 + Math.PI * 0.3;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.3;
      positions[i3 + 2] = r * Math.cos(phi);
      // Purple-blue-pink nebula colors
      var t = Math.random();
      colors[i3] = 0.15 + t * 0.25;
      colors[i3 + 1] = 0.05 + t * 0.15;
      colors[i3 + 2] = 0.3 + t * 0.3;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 4.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    nebulaParticles = new THREE.Points(geo, mat);
    scene.add(nebulaParticles);
  }

  // ── Sun (multi-layer glow) ───────────────────────────────
  function createSun() {
    var geo = new THREE.SphereGeometry(3, 64, 64);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    var sun = new THREE.Mesh(geo, mat);
    sun.userData = SUN_DATA;
    scene.add(sun);
    celestialBodies.push({ mesh: sun, data: SUN_DATA });

    var sunGlowTex = createGlowTexture('rgba(255,220,80,1)', 256);

    // Inner intense glow
    var glow1Mat = new THREE.SpriteMaterial({
      map: sunGlowTex,
      color: 0xffdd44,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    var glow1 = new THREE.Sprite(glow1Mat);
    glow1.scale.set(12, 12, 1);
    sun.add(glow1);
    sunGlowLayers.push(glow1);

    // Mid corona glow
    var glow2Mat = new THREE.SpriteMaterial({
      map: sunGlowTex,
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    var glow2 = new THREE.Sprite(glow2Mat);
    glow2.scale.set(20, 20, 1);
    sun.add(glow2);
    sunGlowLayers.push(glow2);

    // Outer soft glow
    var glow3Mat = new THREE.SpriteMaterial({
      map: sunGlowTex,
      color: 0xff6600,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    var glow3 = new THREE.Sprite(glow3Mat);
    glow3.scale.set(30, 30, 1);
    sun.add(glow3);
    sunGlowLayers.push(glow3);

    // Corona particle ring
    var coronaCount = 500;
    var coronaPositions = new Float32Array(coronaCount * 3);
    var coronaColors = new Float32Array(coronaCount * 3);
    for (var i = 0; i < coronaCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 3.2 + Math.random() * 4;
      var y = (Math.random() - 0.5) * 3;
      coronaPositions[i * 3] = Math.cos(angle) * dist;
      coronaPositions[i * 3 + 1] = y;
      coronaPositions[i * 3 + 2] = Math.sin(angle) * dist;
      coronaColors[i * 3] = 1.0;
      coronaColors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
      coronaColors[i * 3 + 2] = 0.1 + Math.random() * 0.2;
    }
    var coronaGeo = new THREE.BufferGeometry();
    coronaGeo.setAttribute('position', new THREE.BufferAttribute(coronaPositions, 3));
    coronaGeo.setAttribute('color', new THREE.BufferAttribute(coronaColors, 3));
    var coronaMat = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var corona = new THREE.Points(coronaGeo, coronaMat);
    sun.add(corona);
    sunGlowLayers.push(corona);
  }

  // ── Planets & their moons ──────────────────────────────
  function createPlanets() {
    PLANETS.forEach(function (p) {
      // Orbit group (rotates around Sun)
      var orbitGroup = new THREE.Group();
      scene.add(orbitGroup);

      // Planet mesh
      var geo = new THREE.SphereGeometry(p.radius, 48, 48);
      var mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6, metalness: 0.15 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = p.distance;
      mesh.userData = p;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      orbitGroup.add(mesh);

      // Atmosphere glow for select planets
      if (p.name === 'Earth' || p.name === 'Venus' || p.name === 'Jupiter' || p.name === 'Saturn' || p.name === 'Neptune') {
        var threeColor = new THREE.Color(p.color);
        var r = Math.round(threeColor.r * 255);
        var g = Math.round(threeColor.g * 255);
        var b = Math.round(threeColor.b * 255);
        var planetGlowTex = createPlanetGlowTexture(r, g, b, 128);
        var glowMat = new THREE.SpriteMaterial({
          map: planetGlowTex,
          color: p.color,
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        var glowSprite = new THREE.Sprite(glowMat);
        var glowScale = p.radius * 3.5;
        glowSprite.scale.set(glowScale, glowScale, 1);
        mesh.add(glowSprite);
      }

      // Orbit line with gradient effect
      var orbitGeo = new THREE.RingGeometry(p.distance - ORBIT_LINE_HALF_WIDTH, p.distance + ORBIT_LINE_HALF_WIDTH, ORBIT_SEGMENTS);
      var orbitMat = new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
      var orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
      orbitMesh.rotation.x = -Math.PI / 2;
      scene.add(orbitMesh);
      orbitLines.push(orbitMesh);

      var entry = { mesh: mesh, data: p, orbitGroup: orbitGroup, orbitAngle: Math.random() * Math.PI * 2 };
      celestialBodies.push(entry);

      // Ring for Saturn – enhanced
      if (p.hasRing) {
        var ringGeo = new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.5, 128);
        var ringMat = new THREE.MeshStandardMaterial({
          color: 0xddcc88, side: THREE.DoubleSide, transparent: true, opacity: 0.5, roughness: 0.9
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        mesh.add(ring);

        // Inner ring detail
        var innerRingGeo = new THREE.RingGeometry(p.radius * 1.15, p.radius * 1.35, 128);
        var innerRingMat = new THREE.MeshStandardMaterial({
          color: 0xbbaa66, side: THREE.DoubleSide, transparent: true, opacity: 0.3, roughness: 0.9
        });
        var innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.rotation.x = Math.PI / 2.5;
        mesh.add(innerRing);
      }

      // Moons / Satellites
      if (p.satellites) {
        p.satellites.forEach(function (s) {
          var satOrbitGroup = new THREE.Group();
          mesh.add(satOrbitGroup);

          var satGeo = new THREE.SphereGeometry(s.radius, 24, 24);
          var satMat = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.8, metalness: 0.1 });
          var satMesh = new THREE.Mesh(satGeo, satMat);
          satMesh.position.x = s.distance;
          satMesh.userData = s;
          satOrbitGroup.add(satMesh);

          celestialBodies.push({ mesh: satMesh, data: s, orbitGroup: satOrbitGroup, orbitAngle: Math.random() * Math.PI * 2, isSatellite: true, satSpeed: s.speed });
        });
      }
    });
  }

  // ── Extra satellites ────────────────────────────────────
  function createExtraSatellites() {
    EXTRA_SATELLITES.forEach(function (s) {
      // Find parent planet mesh
      var parent = celestialBodies.find(function (b) { return b.data.name === PLANETS[s.parentIndex].name; });
      if (!parent) return;

      var satOrbitGroup = new THREE.Group();
      parent.mesh.add(satOrbitGroup);

      var satGeo = new THREE.SphereGeometry(s.radius, 16, 16);
      var satMat = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.5, metalness: 0.5, emissive: s.color, emissiveIntensity: 0.3 });
      var satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.x = s.distance;
      satMesh.userData = s;
      satOrbitGroup.add(satMesh);

      celestialBodies.push({ mesh: satMesh, data: s, orbitGroup: satOrbitGroup, orbitAngle: Math.random() * Math.PI * 2, isSatellite: true, satSpeed: s.speed });
    });
  }

  // ── Lighting ─────────────────────────────────────────────
  function addLighting() {
    // Main sunlight
    var pointLight = new THREE.PointLight(0xffeedd, 2.5, 400);
    pointLight.position.set(0, 0, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // Soft ambient for visibility
    var ambient = new THREE.AmbientLight(0x1a1a3a, 0.4);
    scene.add(ambient);

    // Subtle rim light from behind (blue tint)
    var rimLight = new THREE.DirectionalLight(0x334466, 0.3);
    rimLight.position.set(-50, 30, -50);
    scene.add(rimLight);
  }

  // ── Asteroid Belt ──────────────────────────────────────
  function createAsteroidBelt() {
    var count = 1500;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 24 + Math.random() * 5; // Between Mars (20) and Jupiter (30)
      var y = (Math.random() - 0.5) * 1.5;
      positions[i * 3] = Math.cos(angle) * dist;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * dist;
      var bright = 0.3 + Math.random() * 0.3;
      colors[i * 3] = bright;
      colors[i * 3 + 1] = bright * 0.9;
      colors[i * 3 + 2] = bright * 0.8;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    var belt = new THREE.Points(geo, mat);
    scene.add(belt);
    // Slowly rotate the belt
    celestialBodies.push({ mesh: belt, data: { rotationSpeed: 0.0005 }, isAsteroidBelt: true });
  }

  // ── Shooting Stars ─────────────────────────────────────
  function spawnShootingStar() {
    var geo = new THREE.BufferGeometry();
    var length = 3 + Math.random() * 5;
    var positions = new Float32Array([0, 0, 0, length, 0, 0]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    var line = new THREE.Line(geo, mat);
    // Random position in the sky
    var r = 100 + Math.random() * 200;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.random() * Math.PI * 0.6;
    line.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      Math.abs(r * Math.cos(phi)) * 0.5 + 20,
      r * Math.sin(phi) * Math.sin(theta)
    );
    // Random direction
    var dirAngle = Math.random() * Math.PI * 2;
    line.rotation.z = dirAngle;
    line.rotation.y = Math.random() * Math.PI;
    scene.add(line);
    shootingStars.push({
      mesh: line,
      velocity: 80 + Math.random() * 120,
      life: 0,
      maxLife: 0.8 + Math.random() * 1.2,
      direction: new THREE.Vector3(
        -Math.cos(dirAngle) * 0.7,
        -0.3 - Math.random() * 0.3,
        -Math.sin(dirAngle) * 0.7
      ).normalize()
    });
  }

  // ── Events ───────────────────────────────────────────────
  function bindEvents() {
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('click', onClick);

    var slider = document.getElementById('speed-slider');
    var valueLabel = document.getElementById('speed-value');
    slider.addEventListener('input', function () {
      speedMultiplier = parseFloat(slider.value);
      valueLabel.textContent = speedMultiplier.toFixed(1) + '×';
    });

    document.getElementById('close-panel').addEventListener('click', function () {
      document.getElementById('info-panel').classList.remove('visible');
    });
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onClick(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var meshes = celestialBodies.map(function (b) { return b.mesh; });
    var intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      showInfo(intersects[0].object.userData);
    }
  }

  // ── Info Panel ───────────────────────────────────────────
  function showInfo(data) {
    document.getElementById('info-name').textContent = data.name;
    document.getElementById('info-type').textContent = data.type;
    document.getElementById('info-desc').textContent = data.desc;

    var statsContainer = document.getElementById('info-stats');
    statsContainer.innerHTML = '';
    if (data.stats) {
      var keys = Object.keys(data.stats);
      keys.forEach(function (key) {
        var div = document.createElement('div');
        div.className = 'stat';
        var label = document.createElement('div');
        label.className = 'stat-label';
        label.textContent = key;
        var value = document.createElement('div');
        value.className = 'stat-value';
        value.textContent = data.stats[key];
        div.appendChild(label);
        div.appendChild(value);
        statsContainer.appendChild(div);
      });
    }

    document.getElementById('info-panel').classList.add('visible');
  }

  // ── Camera Intro Animation ──────────────────────────────
  var introStartTime = null;
  var INTRO_DURATION = 3.0; // seconds
  var introStartPos = new THREE.Vector3(120, 80, 160);
  var introEndPos = new THREE.Vector3(30, 25, 50);

  function updateCameraIntro(elapsed) {
    if (cameraIntroComplete) return;
    if (introStartTime === null) introStartTime = elapsed;
    var t = (elapsed - introStartTime) / INTRO_DURATION;
    if (t >= 1.0) {
      t = 1.0;
      cameraIntroComplete = true;
      controls.autoRotate = false;
    }
    // Smooth ease-out cubic
    var ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(introStartPos, introEndPos, ease);
    camera.lookAt(0, 0, 0);
  }

  // ── Animation Loop ───────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();

    // Camera intro
    updateCameraIntro(elapsed);

    // Animate sun glow layers
    if (sunGlowLayers.length >= 3) {
      var pulse = Math.sin(elapsed * 1.5) * 0.05 + 1.0;
      var pulse2 = Math.sin(elapsed * 0.8 + 1.0) * 0.08 + 1.0;
      sunGlowLayers[0].scale.set(12 * pulse, 12 * pulse, 1);
      sunGlowLayers[1].scale.set(20 * pulse2, 20 * pulse2, 1);
      sunGlowLayers[2].scale.set(30 * pulse, 30 * pulse, 1);
      // Rotate corona particles
      if (sunGlowLayers[3]) sunGlowLayers[3].rotation.y += 0.002;
    }

    // Rotate nebula slowly
    if (nebulaParticles) {
      nebulaParticles.rotation.y += 0.00008;
    }

    // Shooting stars
    if (Math.random() < 0.008) spawnShootingStar();
    for (var si = shootingStars.length - 1; si >= 0; si--) {
      var star = shootingStars[si];
      star.life += delta;
      var progress = star.life / star.maxLife;
      star.mesh.position.addScaledVector(star.direction, star.velocity * delta);
      star.mesh.material.opacity = Math.max(0, 0.8 * (1 - progress));
      if (star.life >= star.maxLife) {
        scene.remove(star.mesh);
        star.mesh.geometry.dispose();
        star.mesh.material.dispose();
        shootingStars.splice(si, 1);
      }
    }

    celestialBodies.forEach(function (body) {
      // Asteroid belt rotation
      if (body.isAsteroidBelt) {
        body.mesh.rotation.y += body.data.rotationSpeed * speedMultiplier;
        return;
      }

      // Orbit around parent (planets around Sun)
      if (body.orbitGroup && body.data.speed !== undefined && !body.isSatellite) {
        body.orbitAngle += body.data.speed * 0.05 * speedMultiplier * delta;
        body.orbitGroup.rotation.y = body.orbitAngle;
      }

      // Satellite orbit
      if (body.isSatellite && body.orbitGroup) {
        body.orbitAngle += body.satSpeed * 0.1 * speedMultiplier * delta;
        body.orbitGroup.rotation.y = body.orbitAngle;
      }

      // Self-rotation
      if (body.data.rotationSpeed && !body.isAsteroidBelt) {
        body.mesh.rotation.y += body.data.rotationSpeed * speedMultiplier;
      }
    });

    controls.update();
    renderer.render(scene, camera);
  }

  // ── Start ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
