/* ============================================================
   RETOUR.JS — Revenir où on était (bouton « précédent » du navigateur)
   ============================================================
   Les scènes sont « épinglées » par ScrollTrigger : la hauteur de la page n'est
   connue qu'une fois tout chargé. Le navigateur, lui, tente de remettre le
   défilement trop tôt, et on retombe au mauvais endroit (ex. : retour d'une
   page projet vers le mur). On le fait donc nous-mêmes :
     - en quittant la page, on note la position (sessionStorage) ;
     - au retour (bouton précédent), on la remet une fois la page prête.
*/

const CLE = "portfolio:defilement";
// L'adresse de la page à son chargement (fiche-projet.js la change ensuite avec pushState).
const PAGE = location.pathname;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// On note la position en quittant la page (ou en changeant d'onglet sur mobile).
function noterPosition() {
  try {
    sessionStorage.setItem(CLE, JSON.stringify({ adresse: PAGE, y: Math.round(window.scrollY) }));
  } catch {
    // stockage indisponible (navigation privée) : on ne remet rien, sans conséquence
  }
}
window.addEventListener("pagehide", noterPosition);

function etaitUnRetour() {
  const navigation = performance.getEntriesByType("navigation")[0];
  return navigation ? navigation.type === "back_forward" : false;
}

// Remet la position notée en quittant la page, une seule fois (on efface la note).
function remettrePosition() {
  let note = null;
  try {
    note = JSON.parse(sessionStorage.getItem(CLE));
    sessionStorage.removeItem(CLE);
  } catch {
    return;
  }
  if (!note || note.adresse !== PAGE || !note.y) return;
  // Laisse le temps à ScrollTrigger de calculer les épinglages, puis redit la
  // position : le navigateur peut sauter à l'ancre (#realisations) juste après.
  const aller = () => window.scrollTo({ top: note.y, behavior: "instant" });
  [100, 500, 1000].forEach((delai) => setTimeout(aller, delai));
}

// Retour avec rechargement de la page.
window.addEventListener("load", () => {
  if (etaitUnRetour()) remettrePosition();
});

// Retour sans rechargement (page gardée en mémoire par le navigateur).
window.addEventListener("pageshow", (e) => {
  if (e.persisted) remettrePosition();
});
window.addEventListener("popstate", remettrePosition);
