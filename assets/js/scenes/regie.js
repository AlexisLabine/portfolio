/* ============================================================
   SALLE-DE-CRISE.JS — Bloc 2 : la salle de crise (À propos)
   ============================================================
   1. Les plans de caméra, parcourus au scroll
   2. L'invite "[E] Examiner" quand un objet est cadré
   3. L'examen : gros plan, flou d'arrière-plan, puis la pièce s'ouvre
      (mode tactile : la pièce s'ouvre tout de suite, sans caméra)
*/

const sceneSalle = document.getElementById("salle-de-crise");
const cameraSalle = new Camera(sceneSalle);

const invite = sceneSalle.querySelector(".hud__invite");
const texteInvite = sceneSalle.querySelector("[data-texte-invite]");

/* ------------------------------------------------------------
   PARTIE 1 — LES PLANS DE CAMÉRA (dans l'ordre du scroll)
   ------------------------------------------------------------
   Coordonnées du monde, en px : le dessus du bureau est à y = 150.
   Le dossier est à x = -420, la cocarde au centre, le téléphone à x = 400.
   "examen" = les réglages du gros plan quand on clique sur l'objet.
*/
const plansSalle = [
  { nom: "Vue d'ensemble", x: 0, y: -120, z: 0, distance: -500, rx: 6, ry: 0 },
  { nom: "Le bureau", x: 0, y: 60, z: 0, distance: -120, rx: -24, ry: 0 },
  {
    nom: "Le dossier", objet: "dossier", invite: "Examiner le dossier",
    x: -420, y: 20, z: -40, distance: 330, rx: -12, ry: 16,
    examen: { distance: 470, rx: -6, ry: 6 },
  },
  {
    nom: "Le laissez-passer", objet: "cocarde", invite: "Examiner le laissez-passer",
    x: 0, y: 150, z: 60, distance: 360, rx: -45, ry: 0,
    examen: { distance: 480, rx: -65 },
  },
  {
    nom: "La ligne backstage", objet: "telephone", invite: "Décrocher la ligne backstage",
    x: 400, y: 70, z: -20, distance: 330, rx: -12, ry: -16,
    examen: { distance: 480, rx: -8, ry: -4 },
  },
];

/* ------------------------------------------------------------
   PARTIE 2 — L'INVITE D'INTERACTION
   ------------------------------------------------------------ */
let planActuelSalle = plansSalle[0];

cameraSalle.creerRail(plansSalle, (plan) => {
  planActuelSalle = plan;
  invite.hidden = !plan.objet; // l'invite n'apparaît que si un objet est cadré
  texteInvite.textContent = plan.invite || "";
});

/* ------------------------------------------------------------
   PARTIE 3 — EXAMINER UN OBJET
   ------------------------------------------------------------ */
const MODALE_PAR_OBJET = {
  dossier: "modale-dossier",
  cocarde: "modale-cocarde",
};

function examinerObjet(nomObjet) {
  // Mode tactile : pas de gros plan, on ouvre directement la pièce.
  if (MODE_TACTILE) {
    if (nomObjet === "telephone") {
      document.getElementById("le-festival").scrollIntoView({ behavior: MOUVEMENT_REDUIT ? "auto" : "smooth" });
    } else {
      ouvrirModale(document.getElementById(MODALE_PAR_OBJET[nomObjet]));
    }
    return;
  }

  if (sceneSalle.classList.contains("en-examen")) return;

  const plan = plansSalle.find((p) => p.objet === nomObjet);
  const objet = sceneSalle.querySelector(`[data-objet="${nomObjet}"]`);

  // "en-examen" : le CSS floute le décor, affiche les bandes cinéma
  // et décale le cadrage pour laisser la place au document.
  sceneSalle.classList.add("en-examen");
  objet.classList.add("est-examine");
  cameraSalle.examiner({ ...extrairePose(plan), ...plan.examen });

  if (nomObjet === "telephone") {
    // On "décroche" : la caméra s'approche, puis direction le Festival.
    gsap.delayedCall(0.9, () => {
      terminerExamen();
      document.getElementById("le-festival").scrollIntoView({ behavior: MOUVEMENT_REDUIT ? "auto" : "smooth" });
    });
    return;
  }

  // Le document s'ouvre pendant que la caméra termine son approche.
  gsap.delayedCall(0.5, () => {
    ouvrirModale(document.getElementById(MODALE_PAR_OBJET[nomObjet]), terminerExamen);
  });
}

function terminerExamen() {
  sceneSalle.classList.remove("en-examen");
  sceneSalle.querySelectorAll(".est-examine").forEach((objet) => objet.classList.remove("est-examine"));
  cameraSalle.revenir();
}

// Clic (ou Entrée) directement sur un objet du bureau.
sceneSalle.querySelectorAll("[data-objet]").forEach((objet) => {
  objet.addEventListener("click", (e) => {
    e.preventDefault(); // le téléphone est un lien : on joue d'abord l'animation
    examinerObjet(objet.dataset.objet);
  });
});

// Clic sur l'invite, ou touche E, pour examiner l'objet cadré.
invite.addEventListener("click", () => examinerObjet(planActuelSalle.objet));

document.addEventListener("keydown", (e) => {
  const dansUnChamp = e.target.closest("input, textarea");
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleOuverte) return;
  if (cameraSalle.visible && planActuelSalle.objet) examinerObjet(planActuelSalle.objet);
});
