/* ============================================================
   MATERIEL.JS — Le matériel : le flight case (Compétences)
   ============================================================
   1. Les plans de caméra, parcourus au scroll
   2. La fiche technique, remplie par les autocollants
*/

const sceneCompetences = document.getElementById("competences");
const cameraCompetences = new Camera(sceneCompetences);

/* ------------------------------------------------------------
   PARTIE 1 — LA FICHE TECHNIQUE
   ------------------------------------------------------------
   Le texte de chaque compétence est écrit dans le HTML (attributs
   data-*) de son autocollant : on le recopie dans la fiche.
*/
const autocollants = sceneCompetences.querySelectorAll(".autocollant");
const ficheCategorie = document.getElementById("fiche-categorie");
const ficheTitre = document.getElementById("fiche-titre");
const ficheDescription = document.getElementById("fiche-description");

function afficherCompetence(autocollantChoisi) {
  autocollants.forEach((autocollant) => {
    const estChoisi = autocollant === autocollantChoisi;
    autocollant.classList.toggle("est-selectionne", estChoisi);
    autocollant.setAttribute("aria-pressed", estChoisi);
  });

  ficheCategorie.textContent = autocollantChoisi.dataset.categorie;
  ficheTitre.textContent = autocollantChoisi.dataset.titre;
  ficheDescription.textContent = autocollantChoisi.dataset.description;
}

// Survol (souris), focus (clavier) ou clic (tactile) : même résultat.
autocollants.forEach((autocollant) => {
  autocollant.setAttribute("aria-pressed", "false");
  autocollant.addEventListener("mouseenter", () => afficherCompetence(autocollant));
  autocollant.addEventListener("focus", () => afficherCompetence(autocollant));
  autocollant.addEventListener("click", () => {
    afficherCompetence(autocollant);
    // Mode tactile : la fiche est sous le flight case. Si elle dépasse de
    // l'écran, on défile juste assez pour la lire.
    if (MODE_TACTILE) {
      document.querySelector(".fiche__selection").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
});

if (MODE_TACTILE) ficheDescription.textContent = "Touchez un autocollant sur le flight case.";

/* ------------------------------------------------------------
   PARTIE 2 — LES PLANS DE CAMÉRA
   ------------------------------------------------------------
   Le sol est à y = 320 ; le flight case va de y = -280 à 320.
   "selection" = l'autocollant affiché dans la fiche en arrivant sur le plan.
*/
const plansCompetences = [
  { nom: "Vue d'ensemble", x: 0, y: 0, z: 0, distance: -350, rx: -4, ry: 0 },
  { nom: "Le couvercle", selection: "ps", x: 50, y: -150, z: 0, distance: 280, rx: -3, ry: 10 },
  { nom: "La façade", selection: "html", x: -50, y: 140, z: 0, distance: 280, rx: -14, ry: -8 },
  { nom: "Plan de sortie", x: 0, y: 30, z: 0, distance: -150, rx: -10, ry: 0 },
];

cameraCompetences.creerRail(plansCompetences, (plan) => {
  if (plan.selection) {
    afficherCompetence(sceneCompetences.querySelector(".autocollant--" + plan.selection));
  }
});
