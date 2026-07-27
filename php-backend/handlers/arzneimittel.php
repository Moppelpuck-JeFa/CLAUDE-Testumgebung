<?php

function handle_arzneimittel(string $method, ?string $id, ?array $input): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $id === null) {
        $rows = $db->query('SELECT * FROM arzneimittel ORDER BY name')->fetchAll();
        json_response(cast_numeric_rows($rows, ['bestand']));
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM arzneimittel WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) error_response('Arzneimittel nicht gefunden', 404);
        json_response(cast_numeric($row, ['bestand']));
    }

    if ($method === 'POST') {
        if (empty($input['name'])) error_response('name ist erforderlich');
        $stmt = $db->prepare('
            INSERT INTO arzneimittel (name, chargennummer, einheit, bestand, verfallsdatum, bezugsquelle, einkaufsdatum, wartezeit_tage, notizen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $input['name'],
            $input['chargennummer'] ?? null,
            $input['einheit'] ?? 'ml',
            $input['bestand'] ?? 0,
            blank_to_null($input['verfallsdatum'] ?? null),
            $input['bezugsquelle'] ?? null,
            blank_to_null($input['einkaufsdatum'] ?? null),
            $input['wartezeit_tage'] ?? 0,
            $input['notizen'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM arzneimittel WHERE id = ?');
        $stmt->execute([$newId]);
        json_response(cast_numeric($stmt->fetch(), ['bestand']), 201);
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM arzneimittel WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) error_response('Arzneimittel nicht gefunden', 404);

        $stmt = $db->prepare('
            UPDATE arzneimittel SET name = ?, chargennummer = ?, einheit = ?, bestand = ?,
              verfallsdatum = ?, bezugsquelle = ?, einkaufsdatum = ?, wartezeit_tage = ?, notizen = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $input['name'] ?? $existing['name'],
            $input['chargennummer'] ?? $existing['chargennummer'],
            $input['einheit'] ?? $existing['einheit'],
            $input['bestand'] ?? $existing['bestand'],
            blank_to_null($input['verfallsdatum'] ?? $existing['verfallsdatum']),
            $input['bezugsquelle'] ?? $existing['bezugsquelle'],
            blank_to_null($input['einkaufsdatum'] ?? $existing['einkaufsdatum']),
            $input['wartezeit_tage'] ?? $existing['wartezeit_tage'],
            $input['notizen'] ?? $existing['notizen'],
            $id,
        ]);
        $stmt = $db->prepare('SELECT * FROM arzneimittel WHERE id = ?');
        $stmt->execute([$id]);
        json_response(cast_numeric($stmt->fetch(), ['bestand']));
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $db->prepare('DELETE FROM arzneimittel WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) error_response('Arzneimittel nicht gefunden', 404);
        http_response_code(204);
        exit;
    }

    error_response('Methode nicht erlaubt', 405);
}
