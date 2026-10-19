/* ============================================================
   CHRONOLOGIE.JS — La Chronologie de l'Opération (navigation)
   ============================================================
   - Le défilement fluide au clic est géré par le CSS
     (html { scroll-behavior: smooth; }) : les points sont de
     simples liens d'ancrage <a href="#section">.
   - Ce script allume le point de la section où se trouve le
     visiteur, grâce à l'Intersection Observer.
*/

const pointsChronologie = document.querySelectorAll(".chronologie__point");

// Pour chaque point, on retrouve la section visée par son lien (href="#...").
const sectionsChronologie = Array.from(pointsChronologie, (point) =>
  document.querySelector(point.hash),
);

// Allume le point de la section active et éteint les autres.
// aria-current indique aussi la position aux lecteurs d'écran.
function allumerPoint(idSection) {
  pointsChronologie.forEach((point) => {
    const estActif = point.hash === "#" + idSection;
    point.classList.toggle("est-actif", estActif);
    if (estActif) point.setAttribute("aria-current", "location");
    else point.removeAttribute("aria-current");
  });
}

// rootMargin "-50% 0px -50% 0px" réduit la zone observée à une simple
// ligne horizontale au milieu de l'écran : la section qui croise cette
// ligne est celle que le visiteur est en train de regarder.
const observateurChronologie = new IntersectionObserver(
  (entrees) => {
    entrees.forEach((entree) => {
      if (entree.isIntersecting) allumerPoint(entree.target.id);
    });
  },
  { rootMargin: "-50% 0px -50% 0px" },
);

sectionsChronologie.forEach((section) => observateurChronologie.observe(section));
