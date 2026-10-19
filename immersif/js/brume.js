/* ============================================================
   BRUME.JS — La brume de l'accueil (WebGL)
   ============================================================
   Dessine la fumée animée par-dessus les portes, qui réagit au
   curseur (effet "lampe de poche" / coup de vent).
   Expose window.brumeBurst() pour le clavier à code (porte.js).
*/

// On détecte si l'utilisateur est sur un appareil tactile (téléphone/tablette)
// ou si l'écran est petit, pour alléger l'effet sur mobile (moins de calculs).
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const isSmallScreen = window.innerWidth <= 768;
const isMobile = isTouchDevice || isSmallScreen;

// Le <canvas> "brume" et son contexte WebGL (le "pinceau" qui dessine avec le GPU).
// alpha: true permet à la brume d'être transparente par-dessus le reste de la page.
const canvas = document.getElementById("brume");
const gl =
  canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
  canvas.getContext("experimental-webgl", {
    alpha: true,
    premultipliedAlpha: false,
  });

// Filet de sécurité : si WebGL n'est pas disponible, on garde quand même une
// fonction "brumeBurst" qui ne fait rien, pour que le clavier puisse l'appeler
// sans avoir à vérifier si l'effet de brume a bien pu démarrer.
window.brumeBurst = () => {};

if (gl) {
  // --- SHADERS ---
  // Le "vertex shader" positionne juste les 2 triangles qui recouvrent tout l'écran.
  // Tout le rendu visuel se passe dans le "fragment shader" (fragmentSrc), qui
  // calcule la couleur de CHAQUE pixel de l'écran, à chaque frame.
  const vertexSrc = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

  // Nombre de "couches" de bruit (fbm) empilées : plus il y en a, plus la fumée
  // a de détails, mais plus c'est lourd à calculer. On réduit sur mobile.
  const OCTAVES = isMobile ? 3 : 5;

  // Nombre de points utilisés pour dessiner le sillage (la traînée) de la souris.
  // Ils forment une ligne brisée (polyligne) qui suit le curseur.
  const TRAIL_LEN = 8;

  const fragmentSrc = `
    precision mediump float;
    // Uniforms = variables envoyées depuis le JS vers le shader à chaque frame.
    uniform vec2 uResolution; uniform vec2 uMouse; uniform vec2 uMouseVel; uniform float uTime;
    uniform float uHoleInner; uniform float uHoleOuter;
    // Position, rayon et intensité de chaque point du sillage de la souris.
    uniform vec2 uTrailPos[${TRAIL_LEN}];
    uniform float uTrailRadius[${TRAIL_LEN}];
    uniform float uTrailStrength[${TRAIL_LEN}];

    // Génère un nombre "aléatoire" (mais toujours le même pour un point p donné).
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    // Bruit "Perlin-like" : interpole entre 4 valeurs aléatoires des coins d'une
    // case pour obtenir une variation douce (au lieu de valeurs aléatoires brutes).
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i); float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0)); float d = hash(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }

    // fbm = "fractal brownian motion" : on additionne plusieurs couches de bruit
    // de plus en plus fines pour obtenir la texture organique de la fumée.
    float fbm(vec2 p) {
      float value = 0.0; float amplitude = 0.5;
      for (int i = 0; i < ${OCTAVES}; i++) { value += amplitude * noise(p); p *= 2.0; amplitude *= 0.5; }
      return value;
    }

    // Distance entre un point p et un segment [a, b] (utilisé pour dessiner
    // le sillage comme une ligne continue plutôt que des cercles séparés).
    // "t" indique où se trouve le point le plus proche sur le segment (0 = a, 1 = b).
    float segDist(vec2 p, vec2 a, vec2 b, out float t) {
      vec2 pa = p - a; vec2 ba = b - a;
      t = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
      return length(pa - ba * t);
    }

    void main() {
      // Coordonnées du pixel courant, normalisées et mises à l'échelle.
      vec2 uv = gl_FragCoord.xy / uResolution.y;
      vec2 p = uv * 3.0;
      // La brume dérive lentement dans le temps (mouvement horizontal + léger flottement).
      p.x += uTime * 0.03; p.y += sin(uTime * 0.1) * 0.1;

      // --- EFFET "COUP DE VENT" ---
      // On parcourt chaque segment du sillage de la souris pour savoir :
      // 1) à quel point ce pixel est "dissous" par le passage de la souris (dissolve)
      // 2) dans quelle direction le vent souffle à cet endroit (windVec)
      vec2 windVec = vec2(0.0);
      float dissolve = 0.0;
      for (int i = 0; i < ${TRAIL_LEN - 1}; i++) {
        float t;
        float sd = segDist(gl_FragCoord.xy, uTrailPos[i], uTrailPos[i + 1], t);
        float radius = mix(uTrailRadius[i], uTrailRadius[i + 1], t);
        float strength = mix(uTrailStrength[i], uTrailStrength[i + 1], t);
        // sf = 1 près du segment, 0 loin du segment (transition douce).
        float sf = smoothstep(radius, radius * 0.3, sd);
        dissolve = max(dissolve, sf * strength);
        // Direction du segment = direction locale du "vent".
        vec2 segDir = uTrailPos[i + 1] - uTrailPos[i];
        float segLen = length(segDir);
        segDir = segLen > 0.5 ? segDir / segLen : vec2(0.0);
        windVec += segDir * sf * strength;
      }
      // On limite l'intensité totale du vent pour éviter une déformation excessive.
      float windLen = length(windVec);
      if (windLen > 2.0) windVec = windVec / windLen * 2.0;

      // On déplace le point d'échantillonnage du bruit dans le sens du vent :
      // ça "étire" visuellement la fumée dans la direction où la souris est passée.
      p -= windVec * 0.55;

      // --- POUSSÉE AUTOUR DU CURSEUR ---
      // En plus du sillage, le pixel proche du curseur (uMouse) est repoussé
      // dans la direction opposée au curseur, avec un boost selon la vélocité
      // instantanée de la souris (uMouseVel) : ça donne l'effet "poussée".
      vec2 mouseP = (uMouse / uResolution.y) * 3.0;
      vec2 diff = p - mouseP;
      float d = length(diff);
      float pushRadius = (uHoleOuter / uResolution.y) * 3.0 * 2.2;
      float influence = smoothstep(pushRadius, 0.0, d);
      vec2 dir = d > 0.0001 ? diff / d : vec2(0.0);
      vec2 velP = (uMouseVel / uResolution.y) * 3.0;
      p -= dir * influence * 0.15;
      p -= velP * influence * 1.2;

      // Calcul du bruit final (deux fbm imbriqués = plus de complexité visuelle).
      float n = fbm(p + fbm(p + uTime * 0.05));

      // Couleur de la brume : dégradé entre un gris acier et un blanc cassé,
      // selon la valeur du bruit à cet endroit.
      vec3 colSteel = vec3(138.0,143.0,152.0)/255.0;
      vec3 colWhite = vec3(242.0,239.0,233.0)/255.0;
      vec3 fogColor = mix(colSteel, colWhite, n);

      // "density" = à quel point ce pixel est couvert de fumée (0 = rien, 1 = plein).
      float density = smoothstep(0.12, 0.62, n);

      // --- TURBULENCE / VOLUTES ---
      // Là où la souris est passée (dissolve > 0), on mélange un second bruit
      // pour "déchirer" la fumée en volutes irrégulières au lieu d'un simple
      // effacement propre et géométrique.
      float turb = fbm((p + windVec * 1.4 + vec2(9.1, 4.7)) * 2.4 + uTime * 0.2);
      float wispy = mix(1.0, clamp(turb * 1.7, 0.0, 1.15), clamp(dissolve, 0.0, 1.0));
      density *= wispy;
      // On n'efface jamais complètement (0.55 = 55% max) pour garder un peu de texture.
      density *= clamp(1.0 - dissolve * 0.55, 0.0, 1.0);

      // "hole" = zone toujours bien dégagée pile autour du curseur (petit halo net).
      float distPx = distance(gl_FragCoord.xy, uMouse);
      float hole = smoothstep(uHoleInner, uHoleOuter, distPx);

      // Transparence finale du pixel = densité de fumée × trou autour du curseur.
      float alpha = density * hole * 0.95;
      gl_FragColor = vec4(fogColor, alpha);
    }
  `;

  // Compile un shader (vertex ou fragment) et affiche les erreurs éventuelles en console.
  function compileShader(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      console.error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSrc);

  // Le "programme" WebGL = l'assemblage du vertex shader + fragment shader,
  // activé pour tous les dessins suivants.
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Un rectangle plein écran fait de 2 triangles (6 sommets), pour que le
  // fragment shader s'exécute sur chaque pixel du canvas.
  const positions = new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  // Récupération des "adresses" des uniforms dans le shader, pour pouvoir
  // leur envoyer des valeurs depuis le JS à chaque frame.
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uMouse = gl.getUniformLocation(program, "uMouse");
  const uMouseVel = gl.getUniformLocation(program, "uMouseVel");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uHoleInner = gl.getUniformLocation(program, "uHoleInner");
  const uHoleOuter = gl.getUniformLocation(program, "uHoleOuter");
  const uTrailPos = gl.getUniformLocation(program, "uTrailPos");
  const uTrailRadius = gl.getUniformLocation(program, "uTrailRadius");
  const uTrailStrength = gl.getUniformLocation(program, "uTrailStrength");

  // dpr = "device pixel ratio", pour un rendu net sur les écrans haute résolution
  // (Retina, etc). Plafonné pour ne pas surcharger le GPU, surtout sur mobile.
  const maxDPR = isMobile ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);

  // Position de la souris envoyée au shader (uMouse) : elle est "lissée"
  // (voir MOUSE_LAG plus bas) pour un mouvement plus doux que la position brute.
  let mouse = {
    x: (window.innerWidth / 2) * dpr,
    y: (window.innerHeight / 2) * dpr,
  };
  // Position brute et instantanée de la souris/du doigt (sans lissage).
  let rawMouse = { x: mouse.x, y: mouse.y };
  // Plus MOUSE_LAG est proche de 1, plus "mouse" suit "rawMouse" rapidement.
  const MOUSE_LAG = 0.2;

  // Vélocité (vitesse + direction) de la souris, utilisée pour la poussée dans le shader.
  // Elle s'accumule à chaque mouvement puis se dissipe (decay) à chaque frame.
  let mouseVel = { x: 0, y: 0 };
  const maxVel = 180 * dpr;

  // baseSize = la plus petite dimension du canvas, utilisée comme référence
  // pour que les rayons (trou, sillage) s'adaptent à la taille de l'écran.
  let baseSize = Math.min(window.innerWidth, window.innerHeight) * dpr;

  // --- HISTORIQUE DU SILLAGE ---
  // Liste des points récents par lesquels la souris est passée (hors point "tête"
  // qui est ajouté séparément dans render()). Chaque point se dissipe avec le temps.
  const trailHistory = [];
  const TRAIL_MAX_AGE = 1700; // durée de vie d'un point du sillage, en millisecondes
  const TRAIL_MIN_SPACING = () => baseSize * 0.025; // distance mini entre 2 points

  let lastSpawn = { x: rawMouse.x, y: rawMouse.y };
  let recentSpeed = 0; // vitesse récente de la souris, lissée (moyenne mobile)

  // Ajoute un nouveau point au sillage si la souris a assez bougé et va assez vite.
  function spawnTrail(x, y) {
    if (Math.hypot(x - lastSpawn.x, y - lastSpawn.y) < TRAIL_MIN_SPACING())
      return;
    if (recentSpeed < 6 * dpr) return;
    lastSpawn = { x, y };
    trailHistory.push({
      x,
      y,
      spawn: performance.now(),
      power: Math.min(recentSpeed / (35 * dpr), 1.8),
    });
    // On garde toujours au plus TRAIL_LEN - 1 points (le dernier "slot" est
    // réservé au point "tête" ajouté dans render()).
    if (trailHistory.length > TRAIL_LEN - 1) trailHistory.shift();
  }

  // Déclenche une "bouffée" de fumée à un endroit précis de l'écran (ex: quand
  // on clique sur une touche du clavier), en réutilisant le même système de
  // sillage/dissolution que celui du curseur, mais sans dépendre du mouvement.
  function brumeBurst(clientX, clientY, power = 1.6) {
    const x = clientX * dpr;
    const y = (window.innerHeight - clientY) * dpr;
    trailHistory.push({ x, y, spawn: performance.now(), power });
    if (trailHistory.length > TRAIL_LEN - 1) trailHistory.shift();
  }
  // Exposée globalement pour que le clavier à code (plus bas dans ce fichier)
  // puisse déclencher l'animation dans la fumée au clic sur un chiffre.
  window.brumeBurst = brumeBurst;

  // Appelée à chaque mouvement de souris/doigt : met à jour la position brute,
  // calcule la vélocité instantanée, et déclenche l'ajout d'un point de sillage.
  function setMouseFromClient(clientX, clientY) {
    const nx = clientX * dpr;
    // On inverse l'axe Y car WebGL a son origine en bas à gauche,
    // contrairement aux coordonnées écran (origine en haut à gauche).
    const ny = (window.innerHeight - clientY) * dpr;
    const dx = nx - rawMouse.x;
    const dy = ny - rawMouse.y;
    mouseVel.x = Math.max(-maxVel, Math.min(maxVel, mouseVel.x + dx));
    mouseVel.y = Math.max(-maxVel, Math.min(maxVel, mouseVel.y + dy));
    // Moyenne mobile pour lisser les pics de vitesse entre deux événements.
    recentSpeed = recentSpeed * 0.6 + Math.hypot(dx, dy) * 0.4;
    spawnTrail(nx, ny);
    rawMouse.x = nx;
    rawMouse.y = ny;
  }

  // Écoute la souris et le toucher sur toute la fenêtre (pas seulement sur le
  // canvas) : la brume a "pointer-events: none" en CSS pour laisser les clics
  // passer jusqu'au clavier en dessous, donc le canvas ne reçoit plus lui-même
  // d'événements — on écoute sur window pour continuer à suivre le curseur partout.
  window.addEventListener("mousemove", (e) =>
    setMouseFromClient(e.clientX, e.clientY),
  );
  window.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (t) setMouseFromClient(t.clientX, t.clientY);
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (t) setMouseFromClient(t.clientX, t.clientY);
    },
    { passive: true },
  );

  // Ajuste la taille du canvas à la fenêtre, et met à jour les rayons du "trou"
  // autour du curseur (inner = totalement transparent, outer = fin du dégradé).
  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    baseSize = Math.min(canvas.width, canvas.height);
    gl.uniform1f(uHoleInner, baseSize * 0.03);
    gl.uniform1f(uHoleOuter, baseSize * 0.16);
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  resize();

  // Active la transparence (mélange entre la brume et ce qu'il y a derrière).
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const start = performance.now();

  // Une fois les portes ouvertes, la brume a disparu : on arrête de la
  // calculer (sinon le GPU travaille pour rien, et la batterie s'use).
  let brumeActive = true;
  document.addEventListener("porte:ouverte", () => (brumeActive = false));

  // Tableaux réutilisés à chaque frame pour envoyer le sillage au shader
  // (on évite de recréer des tableaux à chaque frame pour économiser des performances).
  const trailPosArr = new Float32Array(TRAIL_LEN * 2);
  const trailRadiusArr = new Float32Array(TRAIL_LEN);
  const trailStrengthArr = new Float32Array(TRAIL_LEN);
  const maxAgeSec = TRAIL_MAX_AGE / 1000;

  // Variante douce de smoothstep, pour des transitions (fondu) encore plus fluides.
  function smootherstep(edge0, edge1, x) {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
    return t * t * (3 - 2 * t);
  }

  // Boucle de rendu principale, appelée à chaque frame (~60 fois par seconde).
  function render() {
    if (!brumeActive) return;
    const now = performance.now();
    const time = (now - start) / 1000;

    // Le curseur affiché ("mouse") rattrape progressivement la position réelle
    // ("rawMouse") au lieu de sauter instantanément : mouvement plus fluide.
    mouse.x += (rawMouse.x - mouse.x) * MOUSE_LAG;
    mouse.y += (rawMouse.y - mouse.y) * MOUSE_LAG;

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform2f(uMouseVel, mouseVel.x, mouseVel.y);
    gl.uniform1f(uTime, time);

    // On retire du sillage les points devenus trop vieux.
    while (trailHistory.length && now - trailHistory[0].spawn > TRAIL_MAX_AGE)
      trailHistory.shift();

    // Intensité du point "tête" (celui collé au curseur en temps réel) : elle
    // dépend directement de la vitesse récente de la souris (0 si immobile).
    const headStrength =
      recentSpeed > 6 * dpr ? Math.min(recentSpeed / (35 * dpr), 1.8) : 0;

    // On transforme chaque point de l'historique en objet prêt à envoyer au
    // shader : rayon qui grandit avec l'âge, force qui diminue avec l'âge (fadeOut).
    const pts = trailHistory.map((p) => {
      const age = (now - p.spawn) / 1000;
      const fadeOut = 1 - smootherstep(maxAgeSec * 0.3, maxAgeSec, age);
      return {
        x: p.x,
        y: p.y,
        radius: baseSize * (0.05 + age * 0.35),
        strength: p.power * fadeOut,
      };
    });
    // Le dernier point de la liste est toujours la position actuelle du curseur :
    // ça évite un décalage/trou entre le sillage et le curseur.
    pts.push({ x: mouse.x, y: mouse.y, radius: baseSize * 0.055, strength: headStrength });

    // S'il y a moins de points que TRAIL_LEN, on "complète" au début avec des
    // points invisibles (strength: 0) pour toujours remplir les TRAIL_LEN cases
    // attendues par le shader.
    const padCount = Math.max(0, TRAIL_LEN - pts.length);
    const first = pts[0];
    for (let i = 0; i < TRAIL_LEN; i++) {
      const pt =
        i < padCount
          ? { x: first.x, y: first.y, radius: 0, strength: 0 }
          : pts[i - padCount];
      trailPosArr[i * 2] = pt.x;
      trailPosArr[i * 2 + 1] = pt.y;
      trailRadiusArr[i] = pt.radius;
      trailStrengthArr[i] = pt.strength;
    }
    gl.uniform2fv(uTrailPos, trailPosArr);
    gl.uniform1fv(uTrailRadius, trailRadiusArr);
    gl.uniform1fv(uTrailStrength, trailStrengthArr);

    // On efface le canvas puis on redessine le rectangle plein écran
    // (le fragment shader recalcule la couleur de chaque pixel).
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // La vélocité et la vitesse récente diminuent un peu à chaque frame
    // (comme un frottement), pour que l'effet s'estompe si la souris s'arrête.
    mouseVel.x *= 0.85;
    mouseVel.y *= 0.85;
    recentSpeed *= 0.85;

    requestAnimationFrame(render);
  }
  render();
}
