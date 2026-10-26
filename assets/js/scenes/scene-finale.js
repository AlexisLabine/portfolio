/* ============================================================
   SCENE-FINALE.JS — La scène (Contact)
   ============================================================
   Même moteur de caméra que les autres scènes (camera.js).
   1. La foule, dessinée en SVG
   2. La couleur qui monte au scroll (bascule Ombre → Lumière)
   3. Les plans de caméra (3 au plus) : le spectacle commence au plan 1
   4. Décrocher la ligne backstage : gros plan, puis le formulaire
   5. Le formulaire de contact
*/

import { MODE_TACTILE, MOUVEMENT_REDUIT } from "../mode.js";
import { Camera, extrairePose } from "../camera.js";
import { ouvrirModale, modaleActive } from "../modales.js";

const sceneFestival = document.getElementById("contact");
const COURRIEL_CONTACT = "labinealexis@gmail.com";

/* ------------------------------------------------------------
   PARTIE 1 — LA FOULE EN CONTRE-JOUR
   ------------------------------------------------------------
   Chaque personne = un corps (ellipse) + une tête (cercle), parfois
   un ou deux bras levés, parfois un téléphone. hasard() est définie
   juste en dessous : la foule est toujours la même d'une visite à l'autre.
*/
const NS_SVG = "http://www.w3.org/2000/svg";

// Nombre « aléatoire » entre 0 et 1, toujours le même pour un (x, y) donné.
// (Venait de textures.js, retiré en 3.3.)
function hasard(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

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
   PARTIE 3 — LES PLANS DE CAMÉRA
   ------------------------------------------------------------
   Le sol de la foule est à y = 400, le dessus de la scène à y = 200,
   l'écran géant au fond (z = -600), le téléphone à x = 820.
*/
const cameraFestival = new Camera(sceneFestival);
const inviteFestival = sceneFestival.querySelector(".hud__invite");
const texteInviteFestival = sceneFestival.querySelector("[data-texte-invite]");

const plansFestival = [
  { nom: "Avant le spectacle", x: 0, y: -170, z: 0, distance: -700, rx: 3, ry: 0 },
  {
    nom: "La ligne backstage", objet: "telephone", invite: "Décrocher le téléphone pour m’écrire",
    x: 640, y: 10, z: 130, distance: 180, rx: -8, ry: -16,
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

// Une seule fois : les projecteurs s'allument et l'écran se révèle.
function lancerSpectacle() {
  if (sceneFestival.classList.contains("en-concert")) return;
  sceneFestival.classList.add("en-concert");
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
   PARTIE 4 — DÉCROCHER LA LIGNE BACKSTAGE
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
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleActive()) return;
  if (cameraFestival.visible && planActuelFestival.objet) decrocher();
});

/* ------------------------------------------------------------
   PARTIE 5 — LE FORMULAIRE
   ------------------------------------------------------------
   Le message part vers api/contact.php (fetch). Les textes viennent de 03b.
   Si le serveur ne répond pas, on le dit et on donne l'adresse courriel.
*/
const formulaire = document.getElementById("formulaire-contact");
const statutFormulaire = document.getElementById("formulaire-statut");
const boutonEnvoi = formulaire.querySelector("[type=submit]");

const MESSAGES = {
  succes: "Merci, votre message est bien parti. Je vous réponds dès que possible.",
  echec: `Le message n'a pas pu partir. Réessayez, ou écrivez-moi directement à ${COURRIEL_CONTACT}.`,
  vide: "Ce champ est requis.",
  courriel: "Cette adresse courriel ne semble pas valide.",
};

function afficherStatut(texte, estErreur) {
  statutFormulaire.textContent = texte;
  statutFormulaire.classList.toggle("est-erreur", estErreur);
}

// Affiche (ou efface) le message d'erreur sous un champ.
function signalerChamp(champ, message) {
  const erreur = document.getElementById("erreur-" + champ.name);
  champ.setAttribute("aria-invalid", message ? "true" : "false");
  erreur.textContent = message || "";
  erreur.hidden = !message;
}

function validerFormulaire() {
  let premierInvalide = null;
  formulaire.querySelectorAll("[name=nom], [name=courriel], [name=message]").forEach((champ) => {
    const valeur = champ.value.trim();
    let message = "";
    if (!valeur) message = MESSAGES.vide;
    else if (champ.name === "courriel" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)) message = MESSAGES.courriel;
    signalerChamp(champ, message);
    if (message && !premierInvalide) premierInvalide = champ;
  });
  return premierInvalide;
}

formulaire.addEventListener("submit", async (e) => {
  e.preventDefault();
  afficherStatut("", false);

  const premierInvalide = validerFormulaire();
  if (premierInvalide) {
    premierInvalide.focus();
    return;
  }

  boutonEnvoi.disabled = true;
  try {
    const reponse = await fetch("api/contact.php", { method: "POST", body: new FormData(formulaire) });
    const resultat = await reponse.json();
    if (!reponse.ok || !resultat.ok) throw new Error("Envoi refusé");
    afficherStatut(MESSAGES.succes, false);
    formulaire.reset();
  } catch {
    afficherStatut(MESSAGES.echec, true);
  } finally {
    boutonEnvoi.disabled = false;
  }
});
