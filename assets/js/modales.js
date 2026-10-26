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

// Quelle modale est ouverte ? (null si aucune.) Les autres fichiers posent
// la question ici plutôt que de lire une variable partagée.
export function modaleActive() {
  return modaleOuverte;
}

export function ouvrirModale(modale, quandFermee) {
  elementAvantModale = document.activeElement;
  actionALaFermeture = quandFermee || null;
  modaleOuverte = modale;
  modale.classList.add("est-ouverte");
  document.body.classList.add("modale-active"); // bloque le scroll derrière
  modale.querySelector("[data-fermer]").focus();
}

export function fermerModale() {
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

// Piège à focus : la touche Tab reste à l'intérieur de la modale ouverte.
// La fiche d'un projet vit dans un shadow DOM : on y entre pour trouver ses liens.
const FOCALISABLES = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function elementsFocalisables(modale) {
  const liste = [];
  modale.querySelectorAll("*").forEach((el) => {
    if (el.matches(FOCALISABLES) && el.offsetParent !== null) liste.push(el);
    if (el.shadowRoot) {
      el.shadowRoot.querySelectorAll(FOCALISABLES).forEach((enfant) => liste.push(enfant));
    }
  });
  return liste;
}

function elementActif() {
  let actif = document.activeElement;
  while (actif && actif.shadowRoot && actif.shadowRoot.activeElement) {
    actif = actif.shadowRoot.activeElement;
  }
  return actif;
}

// Échap ferme ; Tab boucle.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fermerModale();
  if (e.key !== "Tab" || !modaleOuverte) return;
  const liste = elementsFocalisables(modaleOuverte);
  if (liste.length === 0) return;
  const premier = liste[0];
  const dernier = liste[liste.length - 1];
  const actif = elementActif();
  if (e.shiftKey && (actif === premier || !liste.includes(actif))) {
    e.preventDefault();
    dernier.focus();
  } else if (!e.shiftKey && (actif === dernier || !liste.includes(actif))) {
    e.preventDefault();
    premier.focus();
  }
});
