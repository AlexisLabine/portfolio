/* ============================================================
   MUR.JS — Le mur de production (Réalisations)
   ============================================================
   1. Le fil rouge : il relie les polaroïds d'un même projet
   2. Les filtres par porte (Web, Communication, Graphisme, Coordination)
   3. Les plans de caméra (3 au plus, 02)
   4. Ouvrir un projet : gros plan, puis la fiche (fiche-projet.js)

   Le contenu des projets n'est plus ici : il vit dans projets/*.html (une
   page par projet). Chaque polaroïd est un vrai lien vers sa page ; ce
   script ajoute seulement l'examen de la caméra et la fiche en modale.
*/

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
   Trois plans : la vue d'ensemble, le projet vedette, le mandat client.
*/
function surLeMur(bx, by) {
  return { x: bx - 1600, y: by - 850, z: 0 };
}

const plansMur = [
  { nom: "Vue d'ensemble", ...surLeMur(1600, 770), distance: -1750, rx: 0, ry: 0 },
  { nom: "Projet vedette — Festival de l'Âme à l'Écran", polaroid: "p-dae-equipe", ...surLeMur(400, 440), distance: -250, rx: 0, ry: 6 },
  { nom: "Mandat client — École de musique du Bas-Saguenay", polaroid: "p-ecole", ...surLeMur(1200, 1170), distance: -50, rx: 3, ry: -6 },
];

const inviteMur = sceneMur.querySelector(".hud__invite");
const texteInviteMur = sceneMur.querySelector("[data-texte-invite]");
let planActuelMur = plansMur[0];

cameraMur.creerRail(plansMur, (plan) => {
  planActuelMur = plan;
  inviteMur.hidden = !plan.polaroid;
  texteInviteMur.textContent = "Ouvrir le projet : " + (plan.nom.split(" — ")[1] || "");
});

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
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleOuverte) return;
  if (cameraMur.visible) ouvrirProjetDuPlan();
});
