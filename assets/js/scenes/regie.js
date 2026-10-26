/* ============================================================
   REGIE.JS — La régie (À propos)
   ============================================================
   1. Les plans de caméra, parcourus au scroll
   2. L'invite "[E]" quand un objet est cadré
   3. Le gros plan : flou d'arrière-plan, puis la fiche s'ouvre
      (mode tactile : la fiche s'ouvre tout de suite, sans caméra)
*/

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
   "examen" = les réglages du gros plan quand on clique sur l'objet.
*/
const plansRegie = [
  { nom: "Vue d'ensemble", x: 0, y: -120, z: 0, distance: -500, rx: 6, ry: 0 },
  { nom: "Le bureau", x: 0, y: 60, z: 0, distance: -120, rx: -24, ry: 0 },
  {
    nom: "Profil et parcours", objet: "profil", invite: "Ouvrir le profil et le parcours",
    x: -420, y: 20, z: -40, distance: 330, rx: -12, ry: 16,
    examen: { distance: 470, rx: -6, ry: 6 },
  },
  {
    nom: "Intérêts et langues", objet: "cocarde", invite: "Ouvrir les intérêts et les langues",
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

  const plan = plansRegie.find((p) => p.objet === nomObjet);
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
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleOuverte) return;
  if (cameraRegie.visible && planActuelRegie.objet) examinerObjet(planActuelRegie.objet);
});
