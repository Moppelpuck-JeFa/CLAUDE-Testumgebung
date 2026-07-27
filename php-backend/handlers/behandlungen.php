<?php

function bh_add_days(string $dateStr, int $days): string {
    $date = new DateTime($dateStr);
    $date->modify("+{$days} days");
    return $date->format('Y-m-d');
}

function handle_behandlungen(string $method, ?string $id, ?array $input): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $id === null) {
        $volkId = $_GET['volk_id'] ?? null;
        if ($volkId) {
            $stmt = $db->prepare('
                SELECT b.*, a.name AS arzneimittel_name FROM behandlungen b
                LEFT JOIN arzneimittel a ON a.id = b.arzneimittel_id
                WHERE b.volk_id = ? ORDER BY b.datum DESC
            ');
            $stmt->execute([$volkId]);
        } else {
            $stmt = $db->query('
                SELECT b.*, a.name AS arzneimittel_name, v.name AS volk_name FROM behandlungen b
                LEFT JOIN arzneimittel a ON a.id = b.arzneimittel_id
                LEFT JOIN voelker v ON v.id = b.volk_id
                ORDER BY b.datum DESC
            ');
        }
        json_response(cast_numeric_rows($stmt->fetchAll(), ['menge_verbraucht']));
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM behandlungen WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) error_response('Behandlung nicht gefunden', 404);
        json_response(cast_numeric($row, ['menge_verbraucht']));
    }

    if ($method === 'POST') {
        if (empty($input['volk_id']) || empty($input['datum'])) {
            error_response('volk_id und datum sind erforderlich');
        }

        $newId = null;
        try {
            $db->beginTransaction();

            $wartezeitEnde = blank_to_null($input['wartezeit_ende'] ?? null);
            if (!$wartezeitEnde && !empty($input['arzneimittel_id'])) {
                $stmt = $db->prepare('SELECT * FROM arzneimittel WHERE id = ?');
                $stmt->execute([$input['arzneimittel_id']]);
                $medikament = $stmt->fetch();
                if ($medikament && (float) $medikament['wartezeit_tage'] > 0) {
                    $wartezeitEnde = bh_add_days($input['datum'], (int) $medikament['wartezeit_tage']);
                }
            }

            $stmt = $db->prepare('
                INSERT INTO behandlungen (volk_id, arzneimittel_id, datum, indikation, dosierung, anwendungsmethode, menge_verbraucht, wartezeit_ende, behandelnde_person, notizen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $input['volk_id'],
                $input['arzneimittel_id'] ?? null,
                $input['datum'],
                $input['indikation'] ?? null,
                $input['dosierung'] ?? null,
                $input['anwendungsmethode'] ?? null,
                $input['menge_verbraucht'] ?? null,
                $wartezeitEnde,
                $input['behandelnde_person'] ?? null,
                $input['notizen'] ?? null,
            ]);
            $newId = $db->lastInsertId();

            if (!empty($input['arzneimittel_id']) && !empty($input['menge_verbraucht'])) {
                $stmt = $db->prepare('UPDATE arzneimittel SET bestand = bestand - ? WHERE id = ?');
                $stmt->execute([$input['menge_verbraucht'], $input['arzneimittel_id']]);
            }

            $db->commit();
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_response('Behandlung konnte nicht gespeichert werden: ' . $e->getMessage(), 500);
        }

        $stmt = $db->prepare('SELECT * FROM behandlungen WHERE id = ?');
        $stmt->execute([$newId]);
        json_response(cast_numeric($stmt->fetch(), ['menge_verbraucht']), 201);
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM behandlungen WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) error_response('Behandlung nicht gefunden', 404);

        $stmt = $db->prepare('
            UPDATE behandlungen SET datum = ?, arzneimittel_id = ?, indikation = ?, dosierung = ?,
              anwendungsmethode = ?, menge_verbraucht = ?, wartezeit_ende = ?, behandelnde_person = ?, notizen = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $input['datum'] ?? $existing['datum'],
            $input['arzneimittel_id'] ?? $existing['arzneimittel_id'],
            $input['indikation'] ?? $existing['indikation'],
            $input['dosierung'] ?? $existing['dosierung'],
            $input['anwendungsmethode'] ?? $existing['anwendungsmethode'],
            $input['menge_verbraucht'] ?? $existing['menge_verbraucht'],
            blank_to_null($input['wartezeit_ende'] ?? $existing['wartezeit_ende']),
            $input['behandelnde_person'] ?? $existing['behandelnde_person'],
            $input['notizen'] ?? $existing['notizen'],
            $id,
        ]);
        $stmt = $db->prepare('SELECT * FROM behandlungen WHERE id = ?');
        $stmt->execute([$id]);
        json_response(cast_numeric($stmt->fetch(), ['menge_verbraucht']));
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $db->prepare('DELETE FROM behandlungen WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) error_response('Behandlung nicht gefunden', 404);
        http_response_code(204);
        exit;
    }

    error_response('Methode nicht erlaubt', 405);
}
