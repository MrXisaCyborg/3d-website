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

  // ── Initialise ───────────────────────────────────────────
  function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(30, 25, 50);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 200;

    // Raycaster for clicks
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createStarfield();
    createSun();
    createPlanets();
    createExtraSatellites();
    addLighting();
    bindEvents();

    // Hide loading
    setTimeout(function () {
      var el = document.getElementById('loading');
      if (el) el.classList.add('hidden');
    }, 800);

    animate();
  }

  // ── Starfield ────────────────────────────────────────────
  function createStarfield() {
    var count = 6000;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      var r = 400 + Math.random() * 600;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      var brightness = 0.5 + Math.random() * 0.5;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness + Math.random() * 0.2;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(geo, mat));
  }

  // ── Sun ──────────────────────────────────────────────────
  function createSun() {
    var geo = new THREE.SphereGeometry(3, 48, 48);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    var sun = new THREE.Mesh(geo, mat);
    sun.userData = SUN_DATA;
    scene.add(sun);
    celestialBodies.push({ mesh: sun, data: SUN_DATA });

    // Glow sprite
    var spriteMat = new THREE.SpriteMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    var sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(14, 14, 1);
    sun.add(sprite);
  }

  // ── Planets & their moons ──────────────────────────────
  function createPlanets() {
    PLANETS.forEach(function (p) {
      // Orbit group (rotates around Sun)
      var orbitGroup = new THREE.Group();
      scene.add(orbitGroup);

      // Planet mesh
      var geo = new THREE.SphereGeometry(p.radius, 32, 32);
      var mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.7, metalness: 0.2 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = p.distance;
      mesh.userData = p;
      orbitGroup.add(mesh);

      // Orbit line
      var orbitGeo = new THREE.RingGeometry(p.distance - ORBIT_LINE_HALF_WIDTH, p.distance + ORBIT_LINE_HALF_WIDTH, ORBIT_SEGMENTS);
      var orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
      var orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
      orbitMesh.rotation.x = -Math.PI / 2;
      scene.add(orbitMesh);
      orbitLines.push(orbitMesh);

      var entry = { mesh: mesh, data: p, orbitGroup: orbitGroup, orbitAngle: Math.random() * Math.PI * 2 };
      celestialBodies.push(entry);

      // Ring for Saturn
      if (p.hasRing) {
        var ringGeo = new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.4, 64);
        var ringMat = new THREE.MeshStandardMaterial({
          color: 0xccbb88, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.9
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        mesh.add(ring);
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
      var parent = celestialBodies.find(function (b) { return b.data === PLANETS[s.parentIndex]; });
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
    var pointLight = new THREE.PointLight(0xffffff, 2.0, 300);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    var ambient = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambient);
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

  // ── Animation Loop ───────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();

    celestialBodies.forEach(function (body) {
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
      if (body.data.rotationSpeed) {
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
