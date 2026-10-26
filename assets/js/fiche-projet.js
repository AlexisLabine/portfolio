/* ============================================================
   FICHE-PROJET.JS — La fiche d'un projet, en modale
   ============================================================
   Chaque projet a sa page (projets/<nom>.html). Ici, on va chercher son
   <article class="fiche"> avec fetch et on l'affiche dans la modale du mur.

   - L'article est posé dans un « shadow DOM » : projet.css (la feuille de
     style des pages projet) s'y applique sans toucher au reste du site.
   - L'adresse suit : ouvrir une fiche ajoute projets/<nom>.html à l'historique ;
     fermer, ou le bouton « précédent », revient au mur. Recharger la page
     affiche la page complète du projet.
   - Si le chargement échoue, on suit simplement le lien vers la page.
*/

import { ouvrirModale, fermerModale, modaleActive } from "./modales.js";

const modaleProjet = document.getElementById("modale-projet");
const hoteProjet = modaleProjet.querySelector("[data-projet-hote]");
const racineProjet = hoteProjet.attachShadow({ mode: "open" });
const lienPageProjet = modaleProjet.querySelector("[data-projet-page]");
const boutonCopier = modaleProjet.querySelector("[data-projet-copier]");
const etatProjet = modaleProjet.querySelector("[data-projet-etat]");

const fichesChargees = {};
let projetOuvert = null;

// La racine du site, fixée au chargement : une fois l'adresse changée par
// pushState (projets/…), les adresses relatives ne pointeraient plus au bon endroit.
const RACINE = new URL("./", window.location.href).href;

function adresseProjet(slug) {
  return new URL("projets/" + slug + ".html", RACINE).href;
}

// Va chercher l'article d'un projet et le met aux couleurs de la modale.
async function chargerFiche(slug) {
  if (!fichesChargees[slug]) {
    const reponse = await fetch(adresseProjet(slug));
    if (!reponse.ok) throw new Error("Page introuvable : " + slug);
    const page = new DOMParser().parseFromString(await reponse.text(), "text/html");
    fichesChargees[slug] = page.querySelector("article.fiche");
  }
  return fichesChargees[slug].cloneNode(true);
}

// La page projet est dans projets/ ; la modale est à la racine : on corrige les adresses.
function corrigerAdresses(article) {
  article.querySelectorAll("[src], [href], [poster]").forEach((element) => {
    ["src", "href", "poster"].forEach((attribut) => {
      const valeur = element.getAttribute(attribut);
      if (!valeur) return;
      if (valeur.startsWith("../")) element.setAttribute(attribut, new URL(valeur.slice(3), RACINE).href);
      else if (/^[a-z0-9-]+\.html/.test(valeur)) element.setAttribute(attribut, new URL("projets/" + valeur, RACINE).href);
    });
  });
}

// Dans la modale, le titre du projet est un h2 (le seul h1 du site est le nom d'Alexis).
function descendreLesTitres(article) {
  [...article.querySelectorAll("h3, h2, h1")].forEach((titre) => {
    const niveau = Number(titre.tagName[1]) + 1;
    const nouveau = document.createElement("h" + niveau);
    [...titre.attributes].forEach((a) => nouveau.setAttribute(a.name, a.value));
    nouveau.append(...titre.childNodes);
    titre.replaceWith(nouveau);
  });
}

async function afficherFiche(slug) {
  const article = await chargerFiche(slug);
  corrigerAdresses(article);
  descendreLesTitres(article);

  const feuille = document.createElement("div");
  feuille.className = "feuille feuille--modale";
  feuille.style.margin = "12px 0 0"; // la modale a déjà son propre cadre
  feuille.append(article);

  // Le corps de la page projet donne la police et la couleur : on les redonne à l'hôte.
  const hote = document.createElement("div");
  hote.style.cssText = "font-family: Inter, 'Segoe UI', sans-serif; font-size: 17px; line-height: 1.5; color: var(--encre);";
  hote.append(feuille);

  const feuilleDeStyle = document.createElement("link");
  feuilleDeStyle.rel = "stylesheet";
  feuilleDeStyle.href = new URL("assets/css/projet.css", RACINE).href;

  racineProjet.replaceChildren(feuilleDeStyle, hote);
  hoteProjet.scrollTop = 0;
  modaleProjet.querySelector(".modale__document").scrollTop = 0;

  lienPageProjet.href = adresseProjet(slug);
  etatProjet.textContent = "";
}

// Dans la modale, « Projet suivant » change de fiche au lieu de quitter le site.
racineProjet.addEventListener("click", async (e) => {
  const lien = e.target.closest("a[href*='/projets/']");
  if (!lien || e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  const slug = lien.getAttribute("href").split("/projets/")[1].replace(".html", "");
  try {
    await afficherFiche(slug);
    projetOuvert = slug;
    history.replaceState({ projet: slug }, "", adresseProjet(slug));
  } catch {
    window.location.href = lien.href;
  }
});

function pauseDesVideos() {
  racineProjet.querySelectorAll("video").forEach((video) => video.pause());
}

// quandFermee : ce que le mur doit faire à la fermeture (ramener la caméra).
export async function ouvrirProjet(slug, quandFermee) {
  try {
    await afficherFiche(slug);
  } catch {
    window.location.href = adresseProjet(slug); // pas de modale possible : la page elle-même
    return;
  }
  projetOuvert = slug;
  history.pushState({ projet: slug }, "", adresseProjet(slug));
  ouvrirModale(modaleProjet, () => {
    pauseDesVideos();
    projetOuvert = null;
    // Fermé par la modale : on retire l'entrée d'historique que l'ouverture a ajoutée.
    if (history.state && history.state.projet) history.back();
    if (quandFermee) quandFermee();
  });
}

// Bouton « précédent » du navigateur : ferme la fiche.
window.addEventListener("popstate", () => {
  if (modaleActive() === modaleProjet) fermerModale();
});

boutonCopier.addEventListener("click", async () => {
  const adresse = new URL(adresseProjet(projetOuvert), window.location.href).href;
  try {
    await navigator.clipboard.writeText(adresse);
    etatProjet.textContent = "Lien copié";
  } catch {
    etatProjet.textContent = adresse; // pas de presse-papiers : on affiche l'adresse
  }
});
