<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/lib/jwt.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/handlers/auth.php';
require_once __DIR__ . '/handlers/standorte.php';
require_once __DIR__ . '/handlers/voelker.php';
require_once __DIR__ . '/handlers/durchsichten.php';
require_once __DIR__ . '/handlers/arzneimittel.php';
require_once __DIR__ . '/handlers/behandlungen.php';
require_once __DIR__ . '/handlers/ernten.php';
require_once __DIR__ . '/handlers/backup.php';

$method = $_SERVER['REQUEST_METHOD'];

// Bevorzugt PATH_INFO nutzen (Apples eingebauter Mechanismus für "alles nach
// dem Skriptnamen", z.B. /api/index.php/standorte/5 -> PATH_INFO=/standorte/5).
// Das braucht keine .htaccess-Rewrite-Regel und funktioniert auch auf
// Shared-Hosting-Konfigurationen, bei denen verschachtelte .htaccess-Dateien
// oder mod_rewrite-Übergaben zwischen Verzeichnissen unzuverlässig sind.
// Fallback: klassische Pfadermittlung über SCRIPT_NAME/REQUEST_URI für
// Hosting, bei dem eine .htaccess die hübschen URLs bereits sauber auf
// index.php umschreibt.
if (isset($_SERVER['PATH_INFO']) && $_SERVER['PATH_INFO'] !== '') {
    $path = '/' . trim($_SERVER['PATH_INFO'], '/');
} else {
    $basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    $requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = substr($requestPath, strlen($basePath));
    $path = '/' . trim($path, '/');
}
$segments = array_values(array_filter(explode('/', $path), fn($s) => $s !== ''));

// Manche FastCGI/PHP-FPM-Hosting-Konfigurationen liefern REQUEST_URI nach
// einem mod_rewrite-Rewrite nicht zuverlässig zurück, sodass hier statt des
// eigentlich angefragten Pfads noch "index.php" als erstes Segment übrig
// bleibt. Das defensiv abfangen, statt fälschlich "Nicht gefunden" zu melden.
if (($segments[0] ?? '') === 'index.php') {
    array_shift($segments);
}

$resource = $segments[0] ?? '';
$sub = $segments[1] ?? null;

$input = null;
if (in_array($method, ['POST', 'PUT'], true) && !str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
    $raw = file_get_contents('php://input');
    $decoded = $raw !== '' ? json_decode($raw, true) : [];
    $input = is_array($decoded) ? $decoded : [];
}

try {
    switch ($resource) {
        case '':
            json_response(['name' => 'Imkerei API (PHP)']);
            break;
        case 'health':
            json_response(['status' => 'ok']);
            break;
        case 'auth':
            handle_auth($method, $sub, $input);
            break;
        case 'standorte':
            handle_standorte($method, $sub, $input);
            break;
        case 'voelker':
            handle_voelker($method, $sub, $input);
            break;
        case 'durchsichten':
            handle_durchsichten($method, $sub, $input);
            break;
        case 'arzneimittel':
            handle_arzneimittel($method, $sub, $input);
            break;
        case 'behandlungen':
            handle_behandlungen($method, $sub, $input);
            break;
        case 'ernten':
            handle_ernten($method, $sub, $input);
            break;
        case 'backup':
            handle_backup($method, $sub);
            break;
        default:
            error_response('Nicht gefunden', 404);
    }
} catch (Throwable $e) {
    error_log('[imkerei-api] ' . $e->getMessage());
    if (!headers_sent()) {
        error_response('Interner Serverfehler', 500);
    }
}
