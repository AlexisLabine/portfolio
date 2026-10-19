/* ============================================================
   PORTE.JS — Le clavier à code et l'ouverture des portes
   ============================================================
   Tant que le bon code n'est pas entré, la page est verrouillée
   (classe "verrouille" sur <body> = pas de scroll).
   Quand la porte s'ouvre, on retire ce verrou et on envoie
   l'événement "porte:ouverte" : les autres scripts (chronologie,
   salle de crise) l'écoutent pour se mettre en marche.
*/

/* ------------------------------------------------------------
   PARTIE 1 — AU CHARGEMENT : toujours commencer devant la porte
   ------------------------------------------------------------ */
// Le navigateur ne doit pas "se souvenir" de l'endroit où on était
// ni sauter vers une ancre (#competences...) : sinon on contournerait la porte.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname);
window.scrollTo(0, 0);

/* ------------------------------------------------------------
   PARTIE 2 — L'OUVERTURE DE LA PORTE
   ------------------------------------------------------------ */
// Anime l'ouverture des deux battants de porte (gauche/droite) avec GSAP,
// estompe la brume, fait apparaître la révélation, puis déverrouille la page.
function toggleDoor() {
  gsap.to("#porte-gauche", {
    xPercent: -100,
    duration: 1.4,
    ease: "power2.inOut",
  });
  gsap.to("#porte-droite", {
    xPercent: 100,
    duration: 1.4,
    ease: "power2.inOut",
    onComplete: deverrouillerPage,
  });
  gsap.to("#brume", { opacity: 0, duration: 1, delay: 0.2 });
  gsap.to("#accueil-revelation", { opacity: 1, duration: 1, delay: 0.6 });
}

// Autorise le scroll et prévient le reste du site que la porte est ouverte.
function deverrouillerPage() {
  document.body.classList.remove("verrouille");
  document.dispatchEvent(new CustomEvent("porte:ouverte"));
}

/* ------------------------------------------------------------
   PARTIE 3 — LE CODE À 3 CHIFFRES
   ------------------------------------------------------------
   Le code est caché sur porte-droite.png. (Ordinateur seulement :
   sur téléphone et tablette, voir la partie 4.)
*/
const CODE_SECRET = "582";
let codeEntre = ""; // les chiffres déjà tapés par l'utilisateur (ex: "5", "58"...)

// Les 3 cases d'affichage du code, le clavier numérique, et le message d'erreur.
const chiffresAffiches = document.querySelectorAll("#code-affichage .chiffre");
const clavier = document.getElementById("clavier-code");
const messageErreur = document.getElementById("code-erreur");

// Chaque touche numérique (0-9) ajoute son chiffre au code tapé.
document.querySelectorAll(".touche[data-chiffre]").forEach((bouton) => {
  bouton.addEventListener("click", (e) => {
    e.stopPropagation();
    // Déclenche une bouffée de fumée pile à l'endroit du clic (voir brume.js :
    // window.brumeBurst réutilise le système de sillage de la brume).
    window.brumeBurst(e.clientX, e.clientY);
    if (codeEntre.length < 3) {
      codeEntre += bouton.dataset.chiffre;
      mettreAJourAffichage();
    }
    if (codeEntre.length === 3) verifierCode();
  });
});

// Touche "effacer" : vide le code tapé.
document.getElementById("touche-effacer").addEventListener("click", (e) => {
  e.stopPropagation();
  codeEntre = "";
  mettreAJourAffichage();
});

// Touche "valider" : vérifie le code si les 3 chiffres sont bien remplis.
document.getElementById("touche-valider").addEventListener("click", (e) => {
  e.stopPropagation();
  if (codeEntre.length === 3) verifierCode();
});

/* ------------------------------------------------------------
   PARTIE 4 — TÉLÉPHONE ET TABLETTE : le bouton « Entrer »
   ------------------------------------------------------------
   En mode tactile, le CSS cache le clavier et affiche ce bouton :
   un seul geste pour ouvrir les portes.
*/
const boutonEntree = document.getElementById("bouton-entree");

boutonEntree.addEventListener("click", (e) => {
  window.brumeBurst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
  boutonEntree.disabled = true;
  boutonEntree.classList.add("est-ouvert"); // le voyant passe au vert
  gsap.to(boutonEntree, {
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
    onComplete: () => {
      boutonEntree.style.display = "none";
    },
  });
  toggleDoor();
});

// Affiche chaque chiffre tapé dans sa case correspondante.
function mettreAJourAffichage() {
  chiffresAffiches.forEach((span, i) => {
    span.textContent = codeEntre[i] || "";
  });
}

// Compare le code tapé au code secret : ouvre la porte si correct,
// sinon affiche une erreur et réinitialise le code après une courte pause.
function verifierCode() {
  if (codeEntre === CODE_SECRET) {
    messageErreur.classList.remove("visible");
    gsap.to("#clavier-code", {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        clavier.style.display = "none";
      },
    });
    toggleDoor();
  } else {
    messageErreur.classList.add("visible");
    clavier.classList.add("erreur");
    setTimeout(() => {
      clavier.classList.remove("erreur");
      codeEntre = "";
      mettreAJourAffichage();
    }, 400);
  }
}
