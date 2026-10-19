/* ============================================================
   TEXTURES.JS — Textures "procédurales" : bois et béton
   ============================================================
   Au lieu de charger des photos, on DESSINE les textures pixel par
   pixel dans un <canvas>, avec du "bruit" : des valeurs aléatoires
   lissées (le même principe que la brume de l'accueil).
   L'image obtenue est donnée au CSS par deux variables :
     --texture-bois   (bureau)
     --texture-beton  (murs et sols)
   Tant qu'elles ne sont pas prêtes, le CSS utilise des dégradés.
*/

// Nombre "aléatoire" entre 0 et 1, toujours le même pour un (x, y) donné.
function hasard(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Bruit lissé : on mélange en douceur les valeurs des 4 coins de la case.
function bruit(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hasard(ix, iy);
  const b = hasard(ix + 1, iy);
  const c = hasard(ix, iy + 1);
  const d = hasard(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

// Plusieurs couches de bruit de plus en plus fines (comme fbm dans brume.js).
function bruitFractal(x, y, couches) {
  let valeur = 0;
  let amplitude = 0.5;
  for (let i = 0; i < couches; i++) {
    valeur += amplitude * bruit(x, y);
    x *= 2;
    y *= 2;
    amplitude *= 0.5;
  }
  return valeur;
}

function melanger(a, b, t) {
  return a + (b - a) * t;
}

// Crée une image : couleurPixel(x, y) renvoie la couleur [r, g, b] de chaque pixel.
function dessinerTexture(largeur, hauteur, couleurPixel) {
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(largeur, hauteur);

  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const [r, g, b] = couleurPixel(x, y);
      const i = (y * largeur + x) * 4; // 4 cases par pixel : rouge, vert, bleu, opacité
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// --- Bois de noyer : des planches, des cernes et des fibres ---
const HAUTEUR_PLANCHE = 128;

function pixelBois(x, y) {
  const planche = Math.floor(y / HAUTEUR_PLANCHE);
  const decalage = planche * 57.3; // chaque planche a son propre motif
  const teintePlanche = 0.85 + hasard(planche, 3) * 0.3;

  // Les cernes : des lignes qui ondulent dans le sens de la planche.
  const ondulation = bruitFractal(x * 0.004 + decalage, y * 0.03, 4);
  const cernes = (y * 0.045 + ondulation * 5) % 1;
  const ligne = Math.pow(Math.abs(Math.sin(cernes * Math.PI)), 0.4);

  // Les fibres : de fines stries très allongées.
  const fibres = bruit(x * 0.03 + decalage, y * 0.9);

  const t = (0.25 + 0.45 * ligne + 0.25 * fibres) * teintePlanche;
  const joint = y % HAUTEUR_PLANCHE < 2 ? 0.35 : 1; // la fente entre deux planches

  return [melanger(34, 96, t) * joint, melanger(22, 64, t) * joint, melanger(14, 40, t) * joint];
}

// --- Béton : des taches douces et un grain fin ---
function pixelBeton(x, y) {
  const taches = bruitFractal(x * 0.006, y * 0.006, 5);
  const grain = hasard(x, y);
  const t = 0.55 + 0.5 * (taches - 0.5) + 0.12 * (grain - 0.5);
  return [70 * t, 74 * t, 82 * t];
}

function genererTextures() {
  const racine = document.documentElement.style;
  racine.setProperty("--texture-bois", `url(${dessinerTexture(1024, 512, pixelBois)})`);
  racine.setProperty("--texture-beton", `url(${dessinerTexture(512, 512, pixelBeton)})`);
}

// Le calcul prend un petit moment : on attend que le navigateur soit libre
// (au plus 2 secondes).
if ("requestIdleCallback" in window) requestIdleCallback(genererTextures, { timeout: 2000 });
else setTimeout(genererTextures, 300);
