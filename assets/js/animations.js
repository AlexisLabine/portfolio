/* ============================================================
   ANIMATIONS.JS — Le bandeau « Activer les animations »
   ============================================================
   Beaucoup d'ordinateurs ont « réduire les animations » activé sans que la
   personne le sache. Le site respecte ce réglage (accessibilité), mais la
   visite en caméra 3D n'existe pas sans animation. On l'explique donc une
   fois, et on laisse choisir. Le choix est gardé dans le navigateur
   (localStorage, clé "portfolio:animations" : "oui" ou "non").
*/

import { MODE_TACTILE, MOUVEMENT_REDUIT } from "./mode.js";

const avis = document.getElementById("avis-animations");

function lireChoix() {
  try {
    return localStorage.getItem("portfolio:animations");
  } catch (erreur) {
    return null;
  }
}

function ecrireChoix(valeur) {
  try {
    localStorage.setItem("portfolio:animations", valeur);
  } catch (erreur) {
    // Stockage refusé : le choix vaut pour cette visite seulement.
  }
}

// Tactile : il n'y a pas de caméra, donc rien à activer.
if (avis && MOUVEMENT_REDUIT && !MODE_TACTILE && !lireChoix()) {
  avis.hidden = false;

  avis.addEventListener("click", (evenement) => {
    const bouton = evenement.target.closest("[data-animations]");
    if (!bouton) return;
    const choix = bouton.dataset.animations;
    ecrireChoix(choix);
    if (choix === "oui") {
      // La caméra se prépare au chargement : on recharge, au même endroit.
      location.reload();
    } else {
      avis.hidden = true;
    }
  });
}
