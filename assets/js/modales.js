/* ============================================================
   MODALES.JS — Ouvrir et fermer les fenêtres (dossier, laissez-passer)
   ============================================================
   Le CSS affiche une modale (display: flex) quand elle a la classe
   "est-ouverte". quandFermee = fonction appelée à la fermeture
   (ex. : ramener la caméra en arrière).
*/

let modaleOuverte = null;
let elementAvantModale = null; // pour rendre le focus au bon endroit en fermant
let actionALaFermeture = null;

function ouvrirModale(modale, quandFermee) {
  elementAvantModale = document.activeElement;
  actionALaFermeture = quandFermee || null;
  modaleOuverte = modale;
  modale.classList.add("est-ouverte");
  document.body.classList.add("modale-active"); // bloque le scroll derrière
  modale.querySelector("[data-fermer]").focus();
}

function fermerModale() {
  if (!modaleOuverte) return;
  modaleOuverte.classList.remove("est-ouverte");
  document.body.classList.remove("modale-active");
  modaleOuverte = null;
  if (elementAvantModale) elementAvantModale.focus({ preventScroll: true });
  if (actionALaFermeture) actionALaFermeture();
}

// Fermeture : bouton ✕, ou clic sur le fond autour du document.
document.querySelectorAll(".modale").forEach((modale) => {
  modale.addEventListener("click", (e) => {
    const clicSurLeFond = e.target === modale;
    const clicSurFermer = e.target.closest("[data-fermer]");
    if (clicSurLeFond || clicSurFermer) fermerModale();
  });
});

// Fermeture : touche Échap.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fermerModale();
});
