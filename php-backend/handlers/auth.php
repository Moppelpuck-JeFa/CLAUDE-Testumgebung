<?php

function auth_user_count(PDO $db): int {
    return (int) $db->query('SELECT COUNT(*) AS n FROM users')->fetch()['n'];
}

function handle_auth(string $method, ?string $action, ?array $input): void {
    $db = get_db();

    if ($method === 'POST' && $action === 'register') {
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $name = $input['name'] ?? null;
        if ($username === '' || $password === '') {
            error_response('username und password sind erforderlich');
        }
        if (strlen($password) < 8) {
            error_response('Passwort muss mindestens 8 Zeichen lang sein');
        }

        $isFirstUser = auth_user_count($db) === 0;
        if (!$isFirstUser && !current_auth_payload()) {
            error_response('Nur angemeldete Benutzer können weitere Benutzer anlegen', 401);
        }

        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            error_response('Benutzername bereits vergeben', 409);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)');
        $stmt->execute([$username, $name, $hash]);
        $userId = (int) $db->lastInsertId();

        $stmt = $db->prepare('SELECT id, username, name, erstellt_am FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        $token = jwt_sign(['sub' => (int) $user['id'], 'username' => $user['username']]);
        json_response(['user' => $user, 'token' => $token], 201);
    }

    if ($method === 'POST' && $action === 'login') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        if ($username === '' || $password === '') {
            error_response('username und password sind erforderlich');
        }

        $stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            error_response('Benutzername oder Passwort falsch', 401);
        }

        $token = jwt_sign(['sub' => (int) $user['id'], 'username' => $user['username']]);
        json_response([
            'user' => [
                'id' => (int) $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'erstellt_am' => $user['erstellt_am'],
            ],
            'token' => $token,
        ]);
    }

    if ($method === 'GET' && $action === 'me') {
        $payload = require_auth();
        $stmt = $db->prepare('SELECT id, username, name, erstellt_am FROM users WHERE id = ?');
        $stmt->execute([$payload['sub']]);
        $user = $stmt->fetch();
        if (!$user) {
            error_response('Benutzer nicht gefunden', 404);
        }
        json_response($user);
    }

    if ($method === 'GET' && $action === 'users') {
        require_auth();
        json_response($db->query('SELECT id, username, name, erstellt_am FROM users ORDER BY username')->fetchAll());
    }

    if ($method === 'GET' && $action === 'status') {
        json_response(['setupRequired' => auth_user_count($db) === 0]);
    }

    error_response('Nicht gefunden', 404);
}
