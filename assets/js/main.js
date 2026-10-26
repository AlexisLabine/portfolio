/* ============================================================
   MAIN.JS — Le point d'entrée : tout part d'ici
   ============================================================
   index.html ne charge que ce fichier (type="module"). Chaque import
   ci-dessous exécute un fichier ; chaque fichier déclare lui-même ce dont
   il a besoin (mode.js, camera.js, modales.js…). Plus de variables
   partagées par accident.
   GSAP et ScrollTrigger restent des scripts classiques (assets/js/vendor/) :
   ils sont chargés avant, et donc disponibles ici.
*/

import "./brume.js";
import "./portes.js";
import "./modales.js";
import "./scenes/regie.js";
import "./scenes/materiel.js";
import "./fiche-projet.js";
import "./scenes/mur.js";
import "./scenes/scene-finale.js";
import "./navigation.js";
import "./retour.js";
