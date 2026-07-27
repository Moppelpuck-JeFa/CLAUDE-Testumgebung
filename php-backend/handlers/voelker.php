<?php

function handle_voelker(string $method, ?string $id, ?array $input): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $id === null) {
        $stmt = $db->query('
            SELECT v.*, s.name AS standort_name
            FROM voelker v LEFT JOIN standorte s ON s.id = v.standort_id
            ORDER BY v.name
        ');
        json_response($stmt->fetchAll());
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $db->prepare('
            SELECT v.*, s.name AS standort_name
            FROM voelker v LEFT JOIN standorte s ON s.id = v.standort_id
            WHERE v.id = ?
        ');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) error_response('Volk nicht gefunden', 404);
        json_response($row);
    }

    if ($method === 'POST') {
        if (empty($input['name'])) error_response('name ist erforderlich');
        $stmt = $db->prepare('
            INSERT INTO voelker (standort_id, name, beutentyp, koenigin_jahr, koenigin_rasse, koenigin_gezeichnet, status, notizen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $input['standort_id'] ?? null,
            $input['name'],
            $input['beutentyp'] ?? null,
            $input['koenigin_jahr'] ?? null,
            $input['koenigin_rasse'] ?? null,
            !empty($input['koenigin_gezeichnet']) ? 1 : 0,
            $input['status'] ?? 'aktiv',
            $input['notizen'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM voelker WHERE id = ?');
        $stmt->execute([$newId]);
        json_response($stmt->fetch(), 201);
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM voelker WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) error_response('Volk nicht gefunden', 404);

        $koeniginGezeichnet = array_key_exists('koenigin_gezeichnet', $input)
            ? (!empty($input['koenigin_gezeichnet']) ? 1 : 0)
            : $existing['koenigin_gezeichnet'];

        $stmt = $db->prepare('
            UPDATE voelker SET standort_id = ?, name = ?, beutentyp = ?, koenigin_jahr = ?,
              koenigin_rasse = ?, koenigin_gezeichnet = ?, status = ?, notizen = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $input['standort_id'] ?? $existing['standort_id'],
            $input['name'] ?? $existing['name'],
            $input['beutentyp'] ?? $existing['beutentyp'],
            $input['koenigin_jahr'] ?? $existing['koenigin_jahr'],
            $input['koenigin_rasse'] ?? $existing['koenigin_rasse'],
            $koeniginGezeichnet,
            $input['status'] ?? $existing['status'],
            $input['notizen'] ?? $existing['notizen'],
            $id,
        ]);
        $stmt = $db->prepare('SELECT * FROM voelker WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch());
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $db->prepare('DELETE FROM voelker WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) error_response('Volk nicht gefunden', 404);
        http_response_code(204);
        exit;
    }

    error_response('Methode nicht erlaubt', 405);
}
