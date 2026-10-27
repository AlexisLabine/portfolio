/* ============================================================
   COPIER-LIEN.JS — Le bouton « Copier le lien direct » d'une fiche projet
   ============================================================
   Le lien direct d'un projet est l'adresse de sa page (projets/<nom>.html) :
   on la copie dans le presse-papiers pour la coller dans un courriel ou
   un message. Sur la page elle-même, le bouton ne menait nulle part ; il
   confirme maintenant « Lien copié ». Un seul écouteur sur le document sert
   la page projet et la fiche en modale (shadow DOM : composedPath).
   Sans JavaScript, le bouton reste un lien normal vers la page.
*/

export async function copierLien(bouton) {
  const texteInitial = bouton.dataset.texteInitial || bouton.textContent;
  bouton.dataset.texteInitial = texteInitial;
  try {
    await navigator.clipboard.writeText(bouton.href);
    bouton.textContent = "Lien copié ✓";
  } catch {
    // Pas de presse-papiers (page non sécurisée…) : on affiche l'adresse à copier à la main.
    bouton.textContent = bouton.href;
  }
  clearTimeout(bouton.minuterie);
  bouton.minuterie = setTimeout(() => (bouton.textContent = texteInitial), 2500);
}

document.addEventListener("click", (e) => {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  const bouton = e.composedPath().find((n) => n.matches && n.matches("[data-copier-lien]"));
  if (!bouton) return;
  e.preventDefault();
  copierLien(bouton);
});
