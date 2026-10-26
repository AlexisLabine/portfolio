/* ============================================================
   PORTES.JS — L'ouverture des portes (sans code, sans blocage)
   ============================================================
   L'entrée des artistes : deux portes qui s'ouvrent sur la suite.
   Rien n'est verrouillé : la page défile dès le début, et les portes
   s'ouvrent de trois façons :
     1. un clic sur le bouton « Entrer » ;
     2. le premier geste de défilement (molette, doigt, flèche bas) ;
     3. un lien direct vers une scène (/#realisations) : les portes sont
        alors déjà ouvertes, sans animation.
   Quand elles sont ouvertes, on envoie l'événement "porte:ouverte" :
   les autres scripts (brume, caméra) l'écoutent pour se mettre à jour.
*/

let portesOuvertes = false;

// Ouvre les deux battants avec GSAP, estompe la brume et fait apparaître
// ce qui se trouve derrière. Avec { instantane: true } (lien direct,
// « moins d'animations »), tout est en place tout de suite.
function ouvrirPortes({ instantane = false } = {}) {
  if (portesOuvertes) return;
  portesOuvertes = true;

  const duree = instantane || MOUVEMENT_REDUIT ? 0 : 1.4;
  const boutonEntree = document.getElementById("bouton-entree");

  gsap.to("#porte-gauche", { xPercent: -100, duration: duree, ease: "power2.inOut" });
  gsap.to("#porte-droite", {
    xPercent: 100,
    duration: duree,
    ease: "power2.inOut",
    onComplete: () => document.dispatchEvent(new CustomEvent("porte:ouverte")),
  });
  gsap.to("#brume", { opacity: 0, duration: duree ? 1 : 0, delay: duree ? 0.2 : 0 });
  gsap.to("#accueil-revelation", { opacity: 1, duration: duree ? 1 : 0, delay: duree ? 0.6 : 0 });
  gsap.to(boutonEntree, {
    opacity: 0,
    duration: duree ? 0.5 : 0,
    delay: duree ? 0.3 : 0,
    onComplete: () => {
      boutonEntree.style.display = "none";
    },
  });
  boutonEntree.disabled = true;
}

/* ------------------------------------------------------------
   1. LE BOUTON « ENTRER »
   ------------------------------------------------------------ */
const boutonEntree = document.getElementById("bouton-entree");
boutonEntree.addEventListener("click", (e) => {
  // une bouffée de brume à l'endroit du clic (voir brume.js)
  window.brumeBurst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
  ouvrirPortes();
});

/* ------------------------------------------------------------
   2. LE PREMIER GESTE DE DÉFILEMENT
   ------------------------------------------------------------
   On n'empêche jamais le défilement : on ouvre seulement les portes
   au passage, pour qu'elles soient ouvertes quand on reviendra. */
window.addEventListener("wheel", (e) => e.deltaY > 0 && ouvrirPortes(), { passive: true });
window.addEventListener("touchmove", () => ouvrirPortes(), { passive: true });
window.addEventListener("keydown", (e) => {
  const touchesDeDefilement = ["ArrowDown", "PageDown", "End", " "];
  const surUnChamp = e.target.closest("button, a, input, textarea, select");
  if (touchesDeDefilement.includes(e.key) && !surUnChamp) ouvrirPortes();
});
// Filet de sécurité : la barre de défilement, la navigation ou un lien
// d'ancrage nous ont fait quitter l'entrée sans geste détecté.
window.addEventListener("scroll", () => window.scrollY > 40 && ouvrirPortes({ instantane: true }), {
  passive: true,
});

/* ------------------------------------------------------------
   3. LIEN DIRECT VERS UNE SCÈNE (/#realisations)
   ------------------------------------------------------------
   Le navigateur saute à l'ancre avant que la caméra ait épinglé les
   scènes : une fois la page chargée, on ouvre les portes, on recalcule
   les épinglages, puis on retourne à la scène demandée. */
window.addEventListener("load", () => {
  const cible = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
  if (!cible || cible.id === "accueil") return;
  ouvrirPortes({ instantane: true });
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    cible.scrollIntoView({ behavior: "instant" });
  });
});
