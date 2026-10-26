/* ============================================================
   FESTIVAL.JS — Bloc 5 : le Festival (Contact)
   ============================================================
   Même moteur de caméra que les Blocs 2 à 4 (js/camera.js).
   1. La foule, dessinée en SVG
   2. La couleur qui monte au scroll (bascule Ombre → Lumière)
   3. Les canons à confettis
   4. Les plans de caméra : le spectacle commence au plan 1
   5. Décrocher la ligne backstage : gros plan, puis le formulaire
   6. Le formulaire de contact
*/

const sceneFestival = document.getElementById("le-festival");
const COURRIEL_CONTACT = "labinealexis@gmail.com";

/* ------------------------------------------------------------
   PARTIE 1 — LA FOULE EN CONTRE-JOUR
   ------------------------------------------------------------
   Chaque personne = un corps (ellipse) + une tête (cercle), parfois
   un ou deux bras levés, parfois un téléphone. hasard() vient de
   js/textures.js : la foule est toujours la même d'une visite à l'autre.
*/
const NS_SVG = "http://www.w3.org/2000/svg";

function formeSvg(type, attributs, parent) {
  const forme = document.createElementNS(NS_SVG, type);
  Object.entries(attributs).forEach(([nom, valeur]) => forme.setAttribute(nom, valeur));
  parent.appendChild(forme);
  return forme;
}

function leverBras(fan, depart, main, taille) {
  formeSvg("line", { x1: depart.x, y1: depart.y, x2: main.x, y2: main.y, "stroke-width": 18 * taille }, fan);
}

function dessinerFoule(svg, rangee) {
  const nombre = Number(svg.dataset.foule);
  const espacement = 3200 / nombre;

  for (let i = 0; i < nombre; i++) {
    const h1 = hasard(i, rangee);
    const h2 = hasard(i + 50, rangee);
    const h3 = hasard(i, rangee + 9);
    const taille = 0.85 + h1 * 0.3;
    const cx = (i + 0.5) * espacement + (h2 - 0.5) * espacement * 0.5;
    const hautEpaules = 345 - 135 * taille;

    const fan = formeSvg("g", { class: "fan" }, svg);
    fan.style.setProperty("--delai", (-h3).toFixed(2) + "s"); // tout le monde ne saute pas en même temps

    formeSvg("ellipse", { cx, cy: 345, rx: 66 * taille, ry: 135 * taille }, fan);
    formeSvg("circle", { cx: cx + (h2 - 0.5) * 10, cy: hautEpaules - 20 * taille, r: 30 * taille }, fan);

    if (h2 > 0.5) {
      const cote = h1 > 0.5 ? 1 : -1;
      const epaule = { x: cx + cote * 38 * taille, y: hautEpaules + 30 };
      const main = { x: cx + cote * (40 + h3 * 45) * taille, y: 50 + h1 * 60 };
      leverBras(fan, epaule, main, taille);

      if (h3 > 0.6) {
        // Un téléphone levé, écran allumé
        formeSvg("rect", { class: "ecran", x: main.x - 9, y: main.y - 30, width: 18, height: 28, rx: 3 }, fan);
      } else if (h3 < 0.3) {
        // Les deux bras en V
        leverBras(fan, { x: cx - cote * 38 * taille, y: epaule.y }, { x: cx - cote * (60 + h1 * 30) * taille, y: main.y + 10 }, taille);
      }
    }
  }
}

sceneFestival.querySelectorAll(".foule").forEach((svg, rangee) => dessinerFoule(svg, rangee));

/* ------------------------------------------------------------
   PARTIE 2 — LA COULEUR MONTE AU SCROLL
   ------------------------------------------------------------
   --allumage passe de 0 à 1 pendant que la scène monte à l'écran :
   le CSS retire le gris (.scene__desature) au même rythme.
*/
// Mouvement réduit ou mode tactile : la couleur est là d'emblée, et le
// laissez-passer est toujours visible (pas de rail de caméra).
if (MOUVEMENT_REDUIT || MODE_TACTILE) {
  sceneFestival.style.setProperty("--allumage", 1);
  sceneFestival.classList.add("sans-rail");
} else {
  gsap.fromTo(
    sceneFestival,
    { "--allumage": 0 },
    {
      "--allumage": 1,
      ease: "none",
      scrollTrigger: { trigger: sceneFestival, start: "top bottom", end: "top top", scrub: true },
    },
  );
}

/* ------------------------------------------------------------
   PARTIE 3 — LES CANONS À CONFETTIS
   ------------------------------------------------------------
   Dessinés à plat par-dessus l'image (comme un effet de particules
   dans un jeu) : une rafale depuis les deux coins du bas, puis une
   petite pluie continue tant que la scène est à l'écran.
*/
const canvasConfettis = sceneFestival.querySelector(".confettis");
const ctxConfettis = canvasConfettis.getContext("2d");
const COULEURS_CONFETTIS = ["#FF2E9A", "#00E5FF", "#8B2FE0", "#F4B740", "#B3122B", "#F2EFE9"];
const confettis = [];
let confettisVisibles = false;
let confettisEnMarche = false;

// Le canvas couvre toute la scène (ordinateur) ou seulement son premier
// écran (mode tactile, où la scène est plus haute que l'écran).
function ajusterConfettis() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasConfettis.width = canvasConfettis.clientWidth * ratio;
  canvasConfettis.height = canvasConfettis.clientHeight * ratio;
  ctxConfettis.setTransform(ratio, 0, 0, ratio, 0, 0);
}

// depuis = "gauche" ou "droite" (un canon), sinon le confetti tombe du haut.
function nouveauConfetti(depuis) {
  const largeur = canvasConfettis.clientWidth;
  const hauteur = canvasConfettis.clientHeight;
  const confetti = {
    x: Math.random() * largeur,
    y: -20,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 1 + Math.random() * 1.5,
    taille: 7 + Math.random() * 8,
    angle: Math.random() * Math.PI * 2,
    rotation: (Math.random() - 0.5) * 0.25,
    phase: Math.random() * Math.PI * 2,
    couleur: COULEURS_CONFETTIS[Math.floor(Math.random() * COULEURS_CONFETTIS.length)],
  };
  if (depuis) {
    const sens = depuis === "gauche" ? 1 : -1;
    confetti.x = depuis === "gauche" ? 0 : largeur;
    confetti.y = hauteur;
    confetti.vx = sens * (4 + Math.random() * 10);
    confetti.vy = -(12 + Math.random() * 12);
  }
  return confetti;
}

function tirerConfettis() {
  for (let i = 0; i < 90; i++) {
    confettis.push(nouveauConfetti("gauche"), nouveauConfetti("droite"));
  }
  demarrerConfettis();
}

function demarrerConfettis() {
  if (confettisEnMarche || !confettisVisibles || MOUVEMENT_REDUIT) return;
  confettisEnMarche = true;
  requestAnimationFrame(imageConfettis);
}

function imageConfettis() {
  if (!confettisVisibles) {
    confettisEnMarche = false;
    return;
  }
  const largeur = canvasConfettis.clientWidth;
  const hauteur = canvasConfettis.clientHeight;
  ctxConfettis.clearRect(0, 0, largeur, hauteur);

  // La petite pluie continue
  if (sceneFestival.classList.contains("en-concert") && confettis.length < 70 && Math.random() < 0.3) {
    confettis.push(nouveauConfetti());
  }

  for (let i = confettis.length - 1; i >= 0; i--) {
    const c = confettis[i];
    c.vy = Math.min(c.vy + 0.25, 2.2); // la gravité, freinée par l'air
    c.vx *= 0.98;
    c.x += c.vx + Math.sin(c.phase) * 0.6;
    c.y += c.vy;
    c.angle += c.rotation;
    c.phase += 0.05;

    if (c.y > hauteur + 30) {
      confettis.splice(i, 1);
      continue;
    }

    // Le confetti tourne sur lui-même : on l'aplatit avec un cosinus.
    ctxConfettis.save();
    ctxConfettis.translate(c.x, c.y);
    ctxConfettis.rotate(c.angle);
    ctxConfettis.scale(1, Math.cos(c.phase * 2));
    ctxConfettis.fillStyle = c.couleur;
    ctxConfettis.fillRect(-c.taille / 2, -c.taille / 4, c.taille, c.taille / 2);
    ctxConfettis.restore();
  }

  requestAnimationFrame(imageConfettis);
}

ajusterConfettis();
window.addEventListener("resize", ajusterConfettis);

new IntersectionObserver(([entree]) => {
  confettisVisibles = entree.isIntersecting;
  if (confettisVisibles) demarrerConfettis();
}).observe(sceneFestival);

/* ------------------------------------------------------------
   PARTIE 4 — LES PLANS DE CAMÉRA
   ------------------------------------------------------------
   Le sol de la foule est à y = 400, le dessus de la scène à y = 200,
   l'écran géant au fond (z = -600), le téléphone à x = 820.
*/
const cameraFestival = new Camera(sceneFestival);
const inviteFestival = sceneFestival.querySelector(".hud__invite");
const texteInviteFestival = sceneFestival.querySelector("[data-texte-invite]");

const plansFestival = [
  { nom: "Avant le spectacle", x: 0, y: -170, z: 0, distance: -700, rx: 3, ry: 0 },
  { nom: "L'écran géant", x: 0, y: -260, z: -600, distance: -520, rx: 0, ry: 0 },
  {
    nom: "La ligne backstage", objet: "telephone", invite: "Décrocher la ligne backstage",
    x: 820, y: 10, z: 130, distance: 180, rx: -8, ry: -16,
    examen: { y: -40, distance: 400, rx: -4, ry: -6 },
  },
  { nom: "Générique", x: 0, y: -280, z: -300, distance: -950, rx: -6, ry: 0 },
];

let planActuelFestival = plansFestival[0];

cameraFestival.creerRail(plansFestival, (plan, index) => {
  planActuelFestival = plan;
  inviteFestival.hidden = !plan.objet;
  texteInviteFestival.textContent = plan.invite || "";
  if (index >= 1) lancerSpectacle();
});

// Une seule fois : les projecteurs s'allument, l'écran se révèle, les confettis partent.
function lancerSpectacle() {
  if (sceneFestival.classList.contains("en-concert")) return;
  sceneFestival.classList.add("en-concert");
  if (!MOUVEMENT_REDUIT) tirerConfettis();
}

// Mode tactile : pas de plans de caméra. Le spectacle commence quand
// l'écran géant est bien visible.
if (MODE_TACTILE) {
  const observateurSpectacle = new IntersectionObserver(
    ([entree]) => {
      if (entree.isIntersecting) {
        lancerSpectacle();
        observateurSpectacle.disconnect();
      }
    },
    { threshold: 0.5 },
  );
  observateurSpectacle.observe(sceneFestival.querySelector(".ecran-geant"));
}

/* ------------------------------------------------------------
   PARTIE 5 — DÉCROCHER LA LIGNE BACKSTAGE
   ------------------------------------------------------------ */
const modaleContact = document.getElementById("modale-contact");
const telephoneFestival = sceneFestival.querySelector('[data-objet="telephone"]');

function decrocher() {
  // Mode tactile : pas de gros plan, la ligne s'ouvre tout de suite.
  if (MODE_TACTILE) {
    ouvrirModale(modaleContact);
    return;
  }

  if (sceneFestival.classList.contains("en-examen")) return;
  const plan = plansFestival.find((p) => p.objet === "telephone");

  sceneFestival.classList.add("en-examen");
  telephoneFestival.classList.add("est-examine");
  cameraFestival.examiner({ ...extrairePose(plan), ...plan.examen });

  // La ligne s'ouvre pendant que la caméra termine son approche.
  gsap.delayedCall(0.5, () => ouvrirModale(modaleContact, raccrocher));
}

function raccrocher() {
  sceneFestival.classList.remove("en-examen");
  telephoneFestival.classList.remove("est-examine");
  cameraFestival.revenir();
}

telephoneFestival.addEventListener("click", (e) => {
  e.preventDefault(); // le téléphone est un lien : on joue d'abord l'animation
  decrocher();
});

inviteFestival.addEventListener("click", decrocher);

// Les boutons "Décrocher" du laissez-passer et du générique
sceneFestival.querySelectorAll("[data-ouvrir-contact]").forEach((bouton) => {
  bouton.addEventListener("click", decrocher);
});

document.addEventListener("keydown", (e) => {
  const dansUnChamp = e.target.closest("input, textarea, select");
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleOuverte) return;
  if (cameraFestival.visible && planActuelFestival.objet) decrocher();
});

/* ------------------------------------------------------------
   PARTIE 6 — LE FORMULAIRE
   ------------------------------------------------------------
   Pas de serveur : on vérifie les champs, puis on ouvre le logiciel
   de courriel du visiteur avec le message déjà rédigé (mailto:).
*/
const formulaire = document.getElementById("formulaire-contact");
const statutFormulaire = document.getElementById("formulaire-statut");

function afficherStatut(texte, estErreur) {
  statutFormulaire.textContent = texte;
  statutFormulaire.classList.toggle("est-erreur", estErreur);
}

formulaire.addEventListener("submit", (e) => {
  e.preventDefault();
  formulaire.classList.add("est-verifie"); // les champs invalides passent au rose

  const premierChampInvalide = formulaire.querySelector(":invalid");
  if (premierChampInvalide) {
    afficherStatut("Il manque une pièce au dossier : vérifiez les champs en rose.", true);
    premierChampInvalide.focus();
    return;
  }

  const donnees = new FormData(formulaire);
  const sujet = `${donnees.get("objet")} — ${donnees.get("nom")}`;
  const corps = `${donnees.get("message")}\n\n${donnees.get("nom")}\n${donnees.get("courriel")}`;

  window.location.href =
    `mailto:${COURRIEL_CONTACT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;

  afficherStatut("Ligne ouverte : votre logiciel de courriel prend le relais.", false);
});
