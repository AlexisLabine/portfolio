/* ============================================================
   MODE.JS — Les deux réglages de l'appareil, lus une seule fois
   ============================================================
   MODE_TACTILE : le petit script du <head> d'index.html a décidé (avant
   l'affichage) si on est sur téléphone ou iPad, et il a posé la classe
   "mode-tactile" sur <html>. Ici, on la lit simplement.
   MOUVEMENT_REDUIT : la personne a demandé « moins d'animations » dans
   son système (et n'a pas activé les animations du site) : pas de rail au scroll, pas de balancement, pas de suivi
   de souris.
*/

export const MODE_TACTILE = document.documentElement.classList.contains("mode-tactile");

// Le script du <head> pose "mouvement-reduit" si le système demande moins
// d'animations ET que la personne n'a pas choisi de les activer (animations.js).
export const MOUVEMENT_REDUIT = document.documentElement.classList.contains("mouvement-reduit");
