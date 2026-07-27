<?php

function handle_durchsichten(string $method, ?string $id, ?array $input): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $id === null) {
        $volkId = $_GET['volk_id'] ?? null;
        if ($volkId) {
            $stmt = $db->prepare('SELECT * FROM durchsichten WHERE volk_id = ? ORDER BY datum DESC');
            $stmt->execute([$volkId]);
        } else {
            $stmt = $db->query('SELECT * FROM durchsichten ORDER BY datum DESC');
        }
        json_response($stmt->fetchAll());
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM durchsichten WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) error_response('Durchsicht nicht gefunden', 404);
        json_response($row);
    }

    if ($method === 'POST') {
        if (empty($input['volk_id']) || empty($input['datum'])) {
            error_response('volk_id und datum sind erforderlich');
        }
        $stmt = $db->prepare('
            INSERT INTO durchsichten (volk_id, datum, volksstaerke, brutnest, koenigin_gesehen, weiselzellen, futtervorrat, krankheiten, massnahmen, notizen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $input['volk_id'],
            $input['datum'],
            $input['volksstaerke'] ?? null,
            $input['brutnest'] ?? null,
            !empty($input['koenigin_gesehen']) ? 1 : 0,
            !empty($input['weiselzellen']) ? 1 : 0,
            $input['futtervorrat'] ?? null,
            $input['krankheiten'] ?? null,
            $input['massnahmen'] ?? null,
            $input['notizen'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM durchsichten WHERE id = ?');
        $stmt->execute([$newId]);
        json_response($stmt->fetch(), 201);
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $db->prepare('SELECT * FROM durchsichten WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) error_response('Durchsicht nicht gefunden', 404);

        $kg = array_key_exists('koenigin_gesehen', $input) ? (!empty($input['koenigin_gesehen']) ? 1 : 0) : $existing['koenigin_gesehen'];
        $wz = array_key_exists('weiselzellen', $input) ? (!empty($input['weiselzellen']) ? 1 : 0) : $existing['weiselzellen'];

        $stmt = $db->prepare('
            UPDATE durchsichten SET datum = ?, volksstaerke = ?, brutnest = ?, koenigin_gesehen = ?,
              weiselzellen = ?, futtervorrat = ?, krankheiten = ?, massnahmen = ?, notizen = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $input['datum'] ?? $existing['datum'],
            $input['volksstaerke'] ?? $existing['volksstaerke'],
            $input['brutnest'] ?? $existing['brutnest'],
            $kg,
            $wz,
            $input['futtervorrat'] ?? $existing['futtervorrat'],
            $input['krankheiten'] ?? $existing['krankheiten'],
            $input['massnahmen'] ?? $existing['massnahmen'],
            $input['notizen'] ?? $existing['notizen'],
            $id,
        ]);
        $stmt = $db->prepare('SELECT * FROM durchsichten WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch());
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $db->prepare('DELETE FROM durchsichten WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) error_response('Durchsicht nicht gefunden', 404);
        http_response_code(204);
        exit;
    }

    error_response('Methode nicht erlaubt', 405);
}
