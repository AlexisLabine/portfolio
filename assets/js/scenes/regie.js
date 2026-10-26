/* ============================================================
   REGIE.JS — La régie (À propos)
   ============================================================
   1. Les plans de caméra (3), parcourus au scroll
   2. L'invite "[E]" quand la ligne backstage est cadrée
   3. Le gros plan : flou d'arrière-plan, puis la fiche s'ouvre
      (mode tactile : la fiche s'ouvre tout de suite, sans caméra)
*/

import { MODE_TACTILE, MOUVEMENT_REDUIT } from "../mode.js";
import { Camera, extrairePose } from "../camera.js";
import { ouvrirModale, modaleActive } from "../modales.js";

const sceneRegie = document.getElementById("a-propos");
const cameraRegie = new Camera(sceneRegie);

const invite = sceneRegie.querySelector(".hud__invite");
const texteInvite = sceneRegie.querySelector("[data-texte-invite]");

/* ------------------------------------------------------------
   PARTIE 1 — LES PLANS DE CAMÉRA (dans l'ordre du scroll)
   ------------------------------------------------------------
   Coordonnées du monde, en px : le dessus du bureau est à y = 150.
   La pochette (profil et parcours) est à x = -420, la cocarde au centre,
   le téléphone à x = 400.
*/
// Les poses de gros plan : une par objet du bureau, utilisées quand on clique
// dessus (voir examinerObjet). "examen" = les réglages une fois l'objet ouvert.
const POSES_OBJETS = {
  profil: {
    x: -420, y: 20, z: -40, distance: 330, rx: -12, ry: 16,
    examen: { distance: 470, rx: -6, ry: 6 },
  },
  cocarde: {
    x: 0, y: 150, z: 60, distance: 360, rx: -45, ry: 0,
    examen: { distance: 480, rx: -65 },
  },
  telephone: {
    x: 400, y: 70, z: -20, distance: 330, rx: -12, ry: -16,
    examen: { distance: 480, rx: -8, ry: -4 },
  },
};

// Les plans qu'on parcourt en défilant : 3 au plus (02, section 7).
//   1. la vue d'ensemble ; 2. le bureau, vu de haut, avec ses trois objets
//   étiquetés ; 3. la sortie : la ligne backstage, qui mène au contact.
// Chaque objet reste ouvrable à tout moment (clic, Tab, touche E sur le téléphone).
const plansRegie = [
  { nom: "Vue d'ensemble", x: 0, y: -120, z: 0, distance: -500, rx: 6, ry: 0 },
  { nom: "Le bureau", x: 0, y: 150, z: 60, distance: 420, rx: -45, ry: 0 },
  {
    nom: "La ligne backstage", objet: "telephone", invite: "Décrocher la ligne backstage",
    ...POSES_OBJETS.telephone,
  },
];

/* ------------------------------------------------------------
   PARTIE 2 — L'INVITE D'INTERACTION
   ------------------------------------------------------------ */
let planActuelRegie = plansRegie[0];

cameraRegie.creerRail(plansRegie, (plan) => {
  planActuelRegie = plan;
  invite.hidden = !plan.objet; // l'invite n'apparaît que si un objet est cadré
  texteInvite.textContent = plan.invite || "";
});

/* ------------------------------------------------------------
   PARTIE 3 — EXAMINER UN OBJET
   ------------------------------------------------------------ */
const MODALE_PAR_OBJET = {
  profil: "modale-profil",
  cocarde: "modale-cocarde",
};

function examinerObjet(nomObjet) {
  // Mode tactile : pas de gros plan, on ouvre directement la fiche.
  if (MODE_TACTILE) {
    if (nomObjet === "telephone") {
      document.getElementById("contact").scrollIntoView({ behavior: MOUVEMENT_REDUIT ? "auto" : "smooth" });
    } else {
      ouvrirModale(document.getElementById(MODALE_PAR_OBJET[nomObjet]));
    }
    return;
  }

  if (sceneRegie.classList.contains("en-examen")) return;

  const plan = POSES_OBJETS[nomObjet];
  const objet = sceneRegie.querySelector(`[data-objet="${nomObjet}"]`);

  // "en-examen" : le CSS floute le décor et décale le cadrage pour
  // laisser la place au document.
  sceneRegie.classList.add("en-examen");
  objet.classList.add("est-examine");
  cameraRegie.examiner({ ...extrairePose(plan), ...plan.examen });

  if (nomObjet === "telephone") {
    // On "décroche" : la caméra s'approche, puis direction le contact.
    gsap.delayedCall(0.9, () => {
      terminerExamen();
      document.getElementById("contact").scrollIntoView({ behavior: MOUVEMENT_REDUIT ? "auto" : "smooth" });
    });
    return;
  }

  // Le document s'ouvre pendant que la caméra termine son approche.
  gsap.delayedCall(0.5, () => {
    ouvrirModale(document.getElementById(MODALE_PAR_OBJET[nomObjet]), terminerExamen);
  });
}

function terminerExamen() {
  sceneRegie.classList.remove("en-examen");
  sceneRegie.querySelectorAll(".est-examine").forEach((objet) => objet.classList.remove("est-examine"));
  cameraRegie.revenir();
}

// Clic (ou Entrée) directement sur un objet du bureau.
sceneRegie.querySelectorAll("[data-objet]").forEach((objet) => {
  objet.addEventListener("click", (e) => {
    e.preventDefault(); // le téléphone est un lien : on joue d'abord l'animation
    examinerObjet(objet.dataset.objet);
  });
});

// Clic sur l'invite, ou touche E, pour ouvrir l'objet cadré.
invite.addEventListener("click", () => examinerObjet(planActuelRegie.objet));

document.addEventListener("keydown", (e) => {
  const dansUnChamp = e.target.closest("input, textarea");
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleActive()) return;
  if (cameraRegie.visible && planActuelRegie.objet) examinerObjet(planActuelRegie.objet);
});
