<?php
/**
 * api/contact.php — reçoit le formulaire de la « ligne backstage » et l'envoie par courriel.
 *
 * Reçoit : nom, courriel, message (POST, formulaire), et « site » (champ-piège).
 * Répond en JSON : {"ok": true} ou {"ok": false, "erreur": "..."}.
 *
 * Protections (voir la revue de sécurité, tâche 4.8) :
 *  - POST seulement ; la requête doit venir de ce site (en-tête Origin ou Referer) ;
 *  - champ-piège pour les robots (rempli : on répond « ok » sans rien envoyer) ;
 *  - longueurs limitées, adresse validée, retours à la ligne retirés des en-têtes
 *    (pas d'injection d'en-têtes) ;
 *  - un message par minute et par adresse IP (compteur dans un fichier temporaire) ;
 *  - aucune donnée du visiteur n'est écrite sur le disque ni dans les journaux.
 */

declare(strict_types=1);

const DESTINATAIRE = 'labinealexis@gmail.com';
const DELAI_ENTRE_MESSAGES = 60; // secondes, par adresse IP

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function repondre(int $code, bool $ok, string $erreur = ''): never
{
    http_response_code($code);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'erreur' => $erreur], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. POST seulement.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    repondre(405, false, 'Méthode non permise.');
}

// 2. La requête doit venir de ce site (Origin, sinon Referer).
$hote = $_SERVER['HTTP_HOST'] ?? '';
$origine = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origine !== '' && parse_url($origine, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $hote)) {
    repondre(403, false, 'Origine refusée.');
}

// 3. Champ-piège : un humain ne le voit pas. On fait comme si tout allait bien.
if (trim((string) ($_POST['site'] ?? '')) !== '') {
    repondre(200, true);
}

// 4. Lecture et validation. Les retours à la ligne sont interdits dans nom et courriel.
$nom = trim((string) ($_POST['nom'] ?? ''));
$courriel = trim((string) ($_POST['courriel'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($nom === '' || $courriel === '' || $message === '') {
    repondre(422, false, 'Champ requis.');
}
if (mb_strlen($nom) > 100 || mb_strlen($courriel) > 200 || mb_strlen($message) > 5000) {
    repondre(422, false, 'Texte trop long.');
}
if (preg_match('/[\r\n]/', $nom . $courriel) || !filter_var($courriel, FILTER_VALIDATE_EMAIL)) {
    repondre(422, false, 'Courriel invalide.');
}

// 5. Un message par minute et par adresse IP.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
$fichierCompteur = sys_get_temp_dir() . '/contact-' . hash('sha256', $ip) . '.txt';
if (is_file($fichierCompteur) && time() - (int) filemtime($fichierCompteur) < DELAI_ENTRE_MESSAGES) {
    repondre(429, false, 'Trop de messages.');
}

// 6. Envoi. Le courriel du visiteur n'est que dans Reply-To : « From » est une adresse du site.
$domaine = preg_replace('/[^a-z0-9.-]/i', '', preg_replace('/:\d+$/', '', $hote)) ?: 'localhost';
$sujet = '=?UTF-8?B?' . base64_encode('Message du portfolio — ' . $nom) . '?=';
$corps = "Nom : $nom\nCourriel : $courriel\n\n$message\n";
$entetes = [
    'From: Portfolio <contact@' . $domaine . '>',
    'Reply-To: ' . $courriel,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
];

if (!mail(DESTINATAIRE, $sujet, $corps, implode("\r\n", $entetes))) {
    repondre(500, false, 'Envoi impossible.');
}

touch($fichierCompteur);
repondre(200, true);
