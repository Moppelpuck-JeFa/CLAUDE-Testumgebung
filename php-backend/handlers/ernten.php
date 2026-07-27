<?php

function handle_ernten(string $method, ?string $id, ?array $input): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $id === null) {
        $volkId = $_GET['volk_id'] ?? null;
        if ($volkId) {
            $stmt = $db->prepare('SELECT * FROM ernten WHERE volk_id = ? ORDER BY datum DESC');
            $stmt->execute([$volkId]);
        } else {
            $stmt = $db->query('
                SELECT e.*, v.name AS volk_name, s.name AS standort_name FROM ernten e
                LEFT JOIN voelker v ON v.id = e.volk_id
                LEFT JOIN standorte s ON s.id = e.standort_id
                ORDER BY e.datum DESC
            ');
        }
        json_response(cast_numeric_rows($stmt->fetchAll(), ['menge_kg']));
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM ernten WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) error_response('Ernte nicht gefunden', 404);
        json_response(cast_numeric($row, ['menge_kg']));
    }

    if ($method === 'POST') {
        if (empty($input['datum']) || !isset($input['menge_kg'])) {
            error_response('datum und menge_kg sind erforderlich');
        }
        $stmt = $db->prepare('INSERT INTO ernten (volk_id, standort_id, datum, menge_kg, sorte, notizen) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $input['volk_id'] ?? null,
            $input['standort_id'] ?? null,
            $input['datum'],
            $input['menge_kg'],
            $input['sorte'] ?? null,
            $input['notizen'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM ernten WHERE id = ?');
        $stmt->execute([$newId]);
        json_response(cast_numeric($stmt->fetch(), ['menge_kg']), 201);
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM ernten WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) error_response('Ernte nicht gefunden', 404);

        $stmt = $db->prepare('UPDATE ernten SET volk_id = ?, standort_id = ?, datum = ?, menge_kg = ?, sorte = ?, notizen = ? WHERE id = ?');
        $stmt->execute([
            $input['volk_id'] ?? $existing['volk_id'],
            $input['standort_id'] ?? $existing['standort_id'],
            $input['datum'] ?? $existing['datum'],
            $input['menge_kg'] ?? $existing['menge_kg'],
            $input['sorte'] ?? $existing['sorte'],
            $input['notizen'] ?? $existing['notizen'],
            $id,
        ]);
        $stmt = $db->prepare('SELECT * FROM ernten WHERE id = ?');
        $stmt->execute([$id]);
        json_response(cast_numeric($stmt->fetch(), ['menge_kg']));
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $db->prepare('DELETE FROM ernten WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) error_response('Ernte nicht gefunden', 404);
        http_response_code(204);
        exit;
    }

    error_response('Methode nicht erlaubt', 405);
}
