<?php

function handle_standorte(string $method, ?string $id, ?array $input): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $id === null) {
        $stmt = $db->query('
            SELECT s.*, (SELECT COUNT(*) FROM voelker v WHERE v.standort_id = s.id) AS anzahl_voelker
            FROM standorte s ORDER BY s.name
        ');
        json_response($stmt->fetchAll());
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM standorte WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) error_response('Standort nicht gefunden', 404);
        json_response($row);
    }

    if ($method === 'POST') {
        if (empty($input['name'])) error_response('name ist erforderlich');
        $stmt = $db->prepare('INSERT INTO standorte (name, adresse, notizen) VALUES (?, ?, ?)');
        $stmt->execute([$input['name'], $input['adresse'] ?? null, $input['notizen'] ?? null]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM standorte WHERE id = ?');
        $stmt->execute([$newId]);
        json_response($stmt->fetch(), 201);
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM standorte WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) error_response('Standort nicht gefunden', 404);

        $stmt = $db->prepare('UPDATE standorte SET name = ?, adresse = ?, notizen = ? WHERE id = ?');
        $stmt->execute([
            $input['name'] ?? $existing['name'],
            $input['adresse'] ?? $existing['adresse'],
            $input['notizen'] ?? $existing['notizen'],
            $id,
        ]);
        $stmt = $db->prepare('SELECT * FROM standorte WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch());
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $db->prepare('DELETE FROM standorte WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) error_response('Standort nicht gefunden', 404);
        http_response_code(204);
        exit;
    }

    error_response('Methode nicht erlaubt', 405);
}
