/* ============================================================
   POUSSIERE.JS — La poussière qui flotte dans la lumière
   ============================================================
   Chaque <canvas class="poussiere"> dessine de petits grains qui
   montent lentement. Un grain n'est visible que s'il est DANS le
   cône de lumière (étroit en haut, large en bas).
*/

function creerPoussiere(canvas, nombre = 90) {
  const ctx = canvas.getContext("2d");
  const largeur = canvas.width;
  const hauteur = canvas.height;

  function nouveauGrain(y) {
    return {
      x: Math.random() * largeur,
      y: y,
      rayon: 0.4 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.03 + Math.random() * 0.12), // ça monte doucement
      phase: Math.random() * Math.PI * 2,
    };
  }

  const grains = [];
  for (let i = 0; i < nombre; i++) grains.push(nouveauGrain(Math.random() * hauteur));

  let actif = false;

  function image(temps) {
    if (!actif) return;
    ctx.clearRect(0, 0, largeur, hauteur);

    grains.forEach((grain, i) => {
      grain.x += grain.vx + Math.sin(temps * 0.0005 + grain.phase) * 0.08;
      grain.y += grain.vy;
      if (grain.y < 0) grains[i] = nouveauGrain(hauteur); // recommence en bas

      // Le cône de lumière : sa demi-largeur grandit avec la hauteur.
      const demiLargeur = (grain.y / hauteur) * (largeur / 2);
      const ecart = Math.abs(grain.x - largeur / 2);
      if (ecart > demiLargeur) return;

      const scintillement = 0.5 + 0.5 * Math.sin(temps * 0.002 + grain.phase);
      const opacite = scintillement * (1 - ecart / demiLargeur) * 0.8;
      ctx.fillStyle = `rgba(255, 226, 170, ${opacite})`;
      ctx.beginPath();
      ctx.arc(grain.x, grain.y, grain.rayon, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(image);
  }

  // On n'anime que lorsque la scène est à l'écran.
  new IntersectionObserver(([entree]) => {
    const etaitActif = actif;
    actif = entree.isIntersecting && !MOUVEMENT_REDUIT;
    if (actif && !etaitActif) requestAnimationFrame(image);
  }).observe(canvas.closest(".scene"));
}

// En mode tactile, les faisceaux de lumière ne sont pas affichés : pas de poussière.
if (!MODE_TACTILE) {
  document.querySelectorAll("canvas.poussiere").forEach((canvas) => creerPoussiere(canvas));
}
