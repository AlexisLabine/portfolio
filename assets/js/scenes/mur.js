/* ============================================================
   MUR.JS — Le mur de production (Réalisations)
   ============================================================
   1. Le fil rouge : il relie les polaroïds d'un même projet
   2. Les filtres par porte (Web, Communication, Graphisme, Coordination)
   3. Les plans de caméra (3 au plus, 02)
   4. Ouvrir un projet : gros plan, puis la fiche (fiche-projet.js)
   5. « Projet précédent / suivant » (boutons et flèches ← →)

   Le contenu des projets n'est plus ici : il vit dans projets/*.html (une
   page par projet). Chaque polaroïd est un vrai lien vers sa page ; ce
   script ajoute seulement l'examen de la caméra et la fiche en modale.
*/

import { MODE_TACTILE, MOUVEMENT_REDUIT } from "../mode.js";
import { Camera } from "../camera.js";
import { modaleActive } from "../modales.js";
import { ouvrirProjet } from "../fiche-projet.js";

const sceneMur = document.getElementById("realisations");
const cameraMur = new Camera(sceneMur);
const polaroidsMur = [...sceneMur.querySelectorAll(".polaroid")];

/* ------------------------------------------------------------
   PARTIE 1 — LE FIL ROUGE
   ------------------------------------------------------------
   Un seul fil, rouge : il relie les polaroïds d'un même projet, dans
   l'ordre où ils sont écrits dans le HTML.
*/
function positionEpingle(polaroid) {
  const style = getComputedStyle(polaroid);
  return {
    x: parseFloat(style.getPropertyValue("--bx")),
    y: parseFloat(style.getPropertyValue("--by")) - polaroid.offsetHeight / 2 + 14,
  };
}

function tracerFils() {
  const svg = sceneMur.querySelector(".fils");
  const ns = "http://www.w3.org/2000/svg";
  svg.innerHTML = "";

  const parProjet = {};
  polaroidsMur.forEach((p) => (parProjet[p.dataset.projet] = [...(parProjet[p.dataset.projet] || []), p]));

  Object.values(parProjet).forEach((polaroids) => {
    for (let i = 0; i < polaroids.length - 1; i++) {
      const a = positionEpingle(polaroids[i]);
      const b = positionEpingle(polaroids[i + 1]);
      const longueur = Math.hypot(b.x - a.x, b.y - a.y);
      // Point de contrôle : au milieu, un peu plus bas (le poids du fil).
      const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + longueur * 0.15 };
      const chemin = document.createElementNS(ns, "path");
      chemin.setAttribute("d", `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`);
      chemin.setAttribute("class", "fil");
      svg.appendChild(chemin);
    }
  });
}

// Les images doivent être chargées pour connaître la hauteur des polaroïds.
window.addEventListener("load", tracerFils);
tracerFils();

/* ------------------------------------------------------------
   PARTIE 2 — LES FILTRES PAR PORTE
   ------------------------------------------------------------
   Chaque note et chaque polaroïd porte data-portes="web communication".
   Ordinateur : ce qui ne correspond pas s'assombrit. Tactile : ça disparaît.
   Les onglets sont cachés tant que ce script n'a pas tourné.
*/
const filtres = sceneMur.querySelector(".filtres");
const onglets = filtres.querySelectorAll("[data-filtre]");
const elementsFiltrables = sceneMur.querySelectorAll(".panneau__liege [data-portes]");

function filtrerParPorte(porte) {
  onglets.forEach((onglet) => onglet.setAttribute("aria-pressed", onglet.dataset.filtre === porte));
  elementsFiltrables.forEach((element) => {
    const correspond = porte === "tous" || element.dataset.portes.split(" ").includes(porte);
    element.classList.toggle("est-attenue", !correspond);
  });
}

onglets.forEach((onglet) => onglet.addEventListener("click", () => filtrerParPorte(onglet.dataset.filtre)));
filtres.hidden = false;

/* ------------------------------------------------------------
   PARTIE 3 — LES PLANS DE CAMÉRA
   ------------------------------------------------------------
   Le liège mesure 3200 × 1600 et son centre est à (0, -50) dans
   le monde : un point (bx, by) du liège est donc à (bx - 1600, by - 850).
   Neuf plans : la vue d'ensemble, puis un plan par projet (une note du mur
   et les polaroïds sous elle).
*/
function surLeMur(bx, by) {
  return { x: bx - 1600, y: by - 850, z: 0 };
}

function lireBordure(element, propriete) {
  return parseFloat(getComputedStyle(element).getPropertyValue(propriete));
}

// Une étape par note du mur : son titre, sa position et le premier polaroïd en dessous.
const etapes = [...sceneMur.querySelectorAll(".panneau__liege .note")]
  .map((note) => {
    const bx = lireBordure(note, "--bx");
    const by = lireBordure(note, "--by");
    const polaroid = polaroidsMur.find((p) => {
      const px = lireBordure(p, "--bx");
      const py = lireBordure(p, "--by");
      return Math.abs(px - bx) < 450 && py > by && py < by + 500;
    });
    return { titre: note.querySelector(".note__titre").textContent, bx, by, polaroid };
  })
  .filter((etape) => etape.polaroid);

// Un plan par projet : la caméra s'arrête sur chacun (décision du 2026-10-26, journal 06).
const plansMur = [
  { nom: "Vue d'ensemble", ...surLeMur(1600, 770), distance: -1750, rx: 0, ry: 0 },
  ...etapes.map((etape) => ({
    nom: etape.titre,
    polaroid: etape.polaroid.id,
    ...surLeMur(etape.bx, etape.by + 190),
    distance: -250, rx: 0, ry: 0,
  })),
];

const inviteMur = sceneMur.querySelector(".hud__invite");
const texteInviteMur = sceneMur.querySelector("[data-texte-invite]");
let planActuelMur = plansMur[0];
let indexPlanMur = 0;
let parcoursPret = false; // vrai une fois les boutons de la partie 5 lus

const railMur = cameraMur.creerRail(plansMur, (plan, index) => {
  planActuelMur = plan;
  indexPlanMur = index;
  inviteMur.hidden = !plan.polaroid;
  texteInviteMur.textContent = "Ouvrir le projet : " + plan.nom;
  if (parcoursPret) majParcours();
}, { ecranParPlan: 1 });

/* ------------------------------------------------------------
   PARTIE 4 — OUVRIR UN PROJET
   ------------------------------------------------------------
   Ordinateur : la caméra s'approche du polaroïd, puis la fiche s'ouvre.
   Tactile : la fiche s'ouvre tout de suite, en pleine feuille.
   Clic avec Ctrl, Cmd ou la molette : le lien fait son travail normal.
*/
function examinerPolaroid(polaroid) {
  const slug = polaroid.dataset.projet;

  if (MODE_TACTILE || MOUVEMENT_REDUIT) {
    ouvrirProjet(slug);
    return;
  }
  if (sceneMur.classList.contains("en-examen")) return;

  const style = getComputedStyle(polaroid);
  const bx = parseFloat(style.getPropertyValue("--bx"));
  const by = parseFloat(style.getPropertyValue("--by"));

  sceneMur.classList.add("en-examen");
  polaroid.classList.add("est-examine");
  cameraMur.examiner({ ...surLeMur(bx, by), distance: 480, rx: 0, ry: 0 });

  gsap.delayedCall(0.5, () => ouvrirProjet(slug, terminerExamenMur));
}

function terminerExamenMur() {
  sceneMur.classList.remove("en-examen");
  sceneMur.querySelectorAll(".est-examine").forEach((p) => p.classList.remove("est-examine"));
  cameraMur.revenir();
}

polaroidsMur.forEach((polaroid) => {
  polaroid.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    examinerPolaroid(polaroid);
  });
});

// Invite "[E] Ouvrir le projet…" : examine le polaroïd principal du plan.
function ouvrirProjetDuPlan() {
  if (planActuelMur.polaroid) examinerPolaroid(document.getElementById(planActuelMur.polaroid));
}

inviteMur.addEventListener("click", ouvrirProjetDuPlan);

document.addEventListener("keydown", (e) => {
  const dansUnChamp = e.target.closest("input, textarea");
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleActive()) return;
  if (cameraMur.visible) ouvrirProjetDuPlan();
});

/* ------------------------------------------------------------
   PARTIE 5 — « PROJET PRÉCÉDENT / SUIVANT »
   ------------------------------------------------------------
   Le défilement s'arrête sur chacun des projets ; ces boutons (et les
   flèches ← →) font la même chose sans défiler à la main.
*/
const parcours = sceneMur.querySelector(".parcours");
const boutonsParcours = {
  precedent: parcours.querySelector('[data-parcours="precedent"]'),
  suivant: parcours.querySelector('[data-parcours="suivant"]'),
  ouvrir: parcours.querySelector('[data-parcours="ouvrir"]'),
  ensemble: parcours.querySelector('[data-parcours="ensemble"]'),
};
const indexParcours = parcours.querySelector("[data-parcours-index]");
const compteurParcours = parcours.querySelector("[data-parcours-compteur]");
const nomParcours = parcours.querySelector("[data-parcours-nom]");

// Les puces 1 à 8 : un clic mène directement au projet, sans passer par les autres.
const puces = etapes.map((etape, i) => {
  const item = document.createElement("li");
  const puce = document.createElement("button");
  puce.type = "button";
  puce.className = "parcours__puce";
  puce.textContent = i + 1;
  puce.title = etape.titre;
  puce.setAttribute("aria-label", `Projet ${i + 1} sur ${etapes.length} : ${etape.titre}`);
  puce.addEventListener("click", () => railMur.allerAuPlan(i + 1));
  item.append(puce);
  indexParcours.append(item);
  return puce;
});

function majParcours() {
  puces.forEach((puce, i) => {
    if (i + 1 === indexPlanMur) puce.setAttribute("aria-current", "true");
    else puce.removeAttribute("aria-current");
  });
  const surUnProjet = indexPlanMur > 0;
  compteurParcours.textContent = surUnProjet ? `${indexPlanMur}/${etapes.length}` : "";
  nomParcours.textContent = surUnProjet ? plansMur[indexPlanMur].nom : "Parcourir les projets";
  boutonsParcours.ouvrir.hidden = !surUnProjet;
  boutonsParcours.ensemble.hidden = !surUnProjet;
  boutonsParcours.precedent.disabled = !surUnProjet;
  boutonsParcours.suivant.disabled = indexPlanMur >= plansMur.length - 1;
}

parcoursPret = true;

if (etapes.length && !MODE_TACTILE && !MOUVEMENT_REDUIT) {
  parcours.hidden = false;
  majParcours();
  boutonsParcours.precedent.addEventListener("click", () => railMur.allerAuPlan(indexPlanMur - 1));
  boutonsParcours.suivant.addEventListener("click", () => railMur.allerAuPlan(indexPlanMur + 1));
  boutonsParcours.ouvrir.addEventListener("click", ouvrirProjetDuPlan);
  boutonsParcours.ensemble.addEventListener("click", () => railMur.allerAuPlan(0));

  // Au clavier, Tab passe d'un polaroïd à l'autre : la caméra suit le focus, sinon
  // le polaroïd serait hors de l'écran.
  polaroidsMur.forEach((polaroid) => {
    polaroid.addEventListener("focus", () => {
      if (!polaroid.matches(":focus-visible")) return;
      const index = etapes.findIndex((etape) => etape.polaroid.dataset.projet === polaroid.dataset.projet);
      if (index >= 0 && index + 1 !== indexPlanMur) railMur.allerAuPlan(index + 1);
    });
  });

  document.addEventListener("keydown", (e) => {
    const dansUnChamp = e.target.closest("input, textarea, select");
    if (dansUnChamp || modaleActive() || !cameraMur.visible) return;
    if (e.key === "ArrowRight") railMur.allerAuPlan(indexPlanMur + 1);
    else if (e.key === "ArrowLeft") railMur.allerAuPlan(indexPlanMur - 1);
  }, true);
}
