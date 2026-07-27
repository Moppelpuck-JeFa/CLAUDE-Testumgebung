<?php

function get_bearer_token(): ?string {
    $header = null;

    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = $value;
                break;
            }
        }
    }
    if (!$header) {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    }

    if ($header && preg_match('/Bearer\s+(.+)/i', $header, $m)) {
        return trim($m[1]);
    }
    return null;
}

function current_auth_payload(): ?array {
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }
    return jwt_verify($token);
}

function require_auth(): array {
    $payload = current_auth_payload();
    if (!$payload) {
        error_response('Nicht angemeldet', 401);
    }
    return $payload;
}
